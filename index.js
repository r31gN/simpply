import React, { useReducer, useContext } from 'react';

/**
 * Keeps local track between the effect and the name of the key
 * to which it belongs.
 */
const effectsToNameMap = new Map();

/**
 * Throws new `Error` if conditions are right.
 * Used to perform various validations.
 *
 * @param {Boolean} conditionToThrow If `true`, a new `Error` will be thrown.
 * @param {String} msg The `Error` message.
 * @returns {void}
 */
const throwError = (conditionToThrow, msg) => {
  if (conditionToThrow) {
    throw new Error(msg);
  }
};

/**
 * Returns the type of the variable lowercased.
 *
 * @param {*} variable The variable for which the type is determined.
 * @returns {*} One of {`object`, `array`, `function`, `date`, `regexp`, `symbol`, `number`, `string`, `boolean`, `null`, `undefined`}.
 */
const getVariableType = variable => {
  let toStr = Object.prototype.toString.call(variable);
  toStr = toStr.substring(1, toStr.length - 1);
  return toStr.split(' ')[1].toLowerCase();
};

/**
 * Combines all the reducers in the app under the same umbrella.
 * A reducer export must contain the following two exports:
 *
 * {
 *    initialState,
 *    effects
 * }
 *
 * `initialState` represents the default value for that slice of state.
 * `effects` represents an {Object} whose keys are action names and values are the associated effect functions.
 *
 * The effect function has the following signature: (state, payload).
 * `state` represents the current state of the value we apply the effect for.
 * `payload` represents the data passed through the system when a certain action is called.
 *
 * E.g. of a `user` reducer, which contains an action to add a new user:
 *
 * {
 *    initialState: [],
 *    effects: {
 *        // Observe the signature of the effect function.
 *        ADD_USER: (state, payload) => [...state, payload]
 *    }
 * }
 * @param {Object} reducersObj An object containing all the reducers in the app.
 * @returns {Object} An object containing the global initial state of the system and all the effects associated with it.
 */
const combineReducers = reducersObj => {
  // Verify that `reducersObj` is an {Object}.
  throwError(
    getVariableType(reducersObj) !== 'object',
    `The argument passed to the 'combineReducers' function must be an Object.`
  );

  let globalEffects = {};
  let globalInitialState = {};

  Object.keys(reducersObj).forEach(key => {
    const currentReducer = reducersObj[key];

    // Verify that `currentReducer` is an {Object}.
    throwError(
      getVariableType(currentReducer) !== 'object',
      `Expected ${key} to be an Object.`
    );

    const { effects, initialState } = currentReducer;

    // Verify that `currentReducer` has `effects` and `initialState` props.
    throwError(
      !effects || !initialState,
      `Expected ${key} to have 'effects' and 'initialState' props.`
    );

    // Verify that `effects` prop is an {Object}.
    throwError(
      getVariableType(effects) !== 'object',
      `Expected '${key}.effects' to be an Object.`
    );

    // Verify that `initialState` prop is not a {Function}, {Date}, {Regexp} or {Symbol}.
    throwError(
      getVariableType(initialState) === 'function' ||
        getVariableType(initialState) === 'date' ||
        getVariableType(initialState) === 'regexp' ||
        getVariableType(initialState) === 'symbol',
      `Expected '${key}.initialState' to be a primitive type, Object or Array.`
    );

    globalEffects = { ...globalEffects, ...currentReducer.effects };
    globalInitialState[key] = currentReducer.initialState;

    Object.keys(currentReducer.effects).forEach(effectKey =>
      effectsToNameMap.set(effectKey, key)
    );
  });

  return {
    globalEffects,
    globalInitialState
  };
};

const Ctx = React.createContext();
let dispatch = null;
let reducerFn = null;

/**
 * Creates the application store.
 *
 * @param {Object} appReducer The combination of all the reducers in the app.
 * @returns {Object} Returns the current global state and a `dispatch` method used to broadcast actions throughout the system.
 */
const createStore = appReducer => {
  // Verify that `appReducer` is an {Object}.
  throwError(
    getVariableType(appReducer) !== 'object',
    `The argument passed to the 'createStore' function must be an Object.`
  );

  const { globalEffects, globalInitialState } = appReducer;

  // Verify that `appReducer` has `globalEffects` and `globalInitialState` props.
  throwError(
    !globalEffects || !globalInitialState,
    `Expected ${appReducer} to have 'globalEffects' and 'globalInitialState' props.`
  );

  if (!reducerFn) {
    reducerFn = (state, action) => {
      // Verify that `action` is an {Object}.
      throwError(
        getVariableType(action) !== 'object',
        `Expected ${action} to be an Object.`
      );

      const { type, payload } = action;

      // Verify that `action` has `type` and `payload` props.
      throwError(
        !type || !payload,
        `Expected ${action} to have 'type' and 'payload' props.`
      );

      // Verify that `type` prop is a {String}.
      throwError(
        getVariableType(type) !== 'string',
        `Expected ${type} to be an String.`
      );

      // Verify that `payload` prop is not a {Function}, {Date}, {Regexp} or {Symbol}.
      throwError(
        getVariableType(payload) === 'function' ||
          getVariableType(payload) === 'date' ||
          getVariableType(payload) === 'regexp' ||
          getVariableType(payload) === 'symbol',
        `Expected 'payload' to be a primitive type, Object or Array.`
      );

      const fn = appReducer.globalEffects[type];
      const key = effectsToNameMap.get(type);

      return fn && typeof fn === 'function'
        ? { ...state, [key]: fn(state[key], payload) }
        : state;
    };
  }

  const [state, _dispatch] = useReducer(
    reducerFn,
    appReducer.globalInitialState
  );

  if (process.env.NODE_ENV === 'development') {
    console.log(`State: `, state);

    dispatch = action => {
      console.log(`Triggered '${action.type}'.`);
      _dispatch(action);
    };
  } else {
    dispatch = _dispatch;
  }

  return { state, dispatch };
};

/**
 * Creates the application's main `Provider` component that serves the store via Context API.
 *
 * @param {Object} appReducer The combination of all the reducers in the app.
 */
const createProvider = appReducer => ({ children }) => {
  const store = createStore(appReducer);
  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
};

/**
 * Creates a Higher Order Function (HOF) that can be later applied to a React component.
 * The result of the function applied is a wrapper component that will have the important slice of the state automatically injected as well as the `dispatch` function.
 *
 * @param {Object} mapStateToProps An object defining which slice of the global state is important to the current component.
 * @returns {Function} A HOF to apply to a React component.
 */
const connect = mapStateToProps => Component => {
  const MemoComponent = React.memo(Component);

  const EnhancedComponent = props => {
    const { state, dispatch } = useContext(Ctx);
    const slicedState = mapStateToProps(state);

    // Verify that `slicedState` is an {Object}.
    throwError(
      getVariableType(slicedState) !== 'object',
      `The result of calling 'mapStateToProps' function must be an Object.`
    );

    return <MemoComponent {...props} {...slicedState} dispatch={dispatch} />;
  };

  return EnhancedComponent;
};

export { createProvider, connect, combineReducers };

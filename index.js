import React, {
  useReducer,
  useContext,
  useRef,
  useEffect,
  useMemo
} from 'react';

/**
 * Keeps local track between the effect and the Storage Entity they belong to.
 */
const effectsToStorageEntityMap = new Map();

/**
 * Throws new `Error` if the condition evaluates to `true`.
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
 * @returns {*} One of [`object`, `array`, `function`, `date`, `regexp`, `symbol`, `number`, `string`, `boolean`, `null`, `undefined`].
 */
const getVariableType = variable => {
  let toStr = Object.prototype.toString.call(variable);
  toStr = toStr.substring(1, toStr.length - 1);
  return toStr.split(' ')[1].toLowerCase();
};

/**
 * Combines all the Storage Entities in the app under the same umbrella.
 * A Storage Entity file must contain the following two exports:
 *
 * {
 *    initialState,
 *    effects
 * }
 *
 * `initialState` represents the initial value in the global state for that Storage Entity.
 * `effects` represents an {Object} whose keys are effect names and values are the associated effect functions.
 *
 * The effect function has the following signature: (state, payload).
 * `state` represents the current value of the Storage Entity we apply the effect for.
 * `payload` represents the data passed through the system when a certain action is called.
 *
 * E.g. of a `User Storage Entity` implementation, which contains an effect to add a new user:
 *
 * {
 *    initialState: [],
 *    effects: {
 *        // Observe the signature of the effect function.
 *        ADD_USER: (state, payload) => [...state, payload]
 *    }
 * }
 * @param {Object} storageEntitiesObj An object containing all the Storage Entities in the app.
 * @returns {Object} An object containing the global initial state of the system and all the effects associated with it.
 */
const createSystemStorage = storageEntitiesObj => {
  // Verify that `storageEntitiesObj` is an {Object}.
  throwError(
    getVariableType(storageEntitiesObj) !== 'object',
    `The argument passed to the 'createSystemStorage' function must be an Object.`
  );

  let globalEffects = {};
  let globalInitialState = {};

  Object.keys(storageEntitiesObj).forEach(key => {
    const currentStorageEntity = storageEntitiesObj[key];

    // Verify that `currentStorageEntity` is an {Object}.
    throwError(
      getVariableType(currentStorageEntity) !== 'object',
      `Expected ${key} to be an Object.`
    );

    const { effects, initialState } = currentStorageEntity;

    // Verify that `currentStorageEntity` has `effects` and `initialState` props.
    throwError(
      !effects || initialState === undefined,
      `Expected ${key} to have 'effects' and 'initialState' pros.`
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

    globalEffects = { ...globalEffects, ...currentStorageEntity.effects };
    globalInitialState[key] = currentStorageEntity.initialState;

    Object.keys(currentStorageEntity.effects).forEach(effectKey =>
      effectsToStorageEntityMap.set(effectKey, key)
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
 * @param {Object} systemStorage The combination of all the Storage Entities in the app.
 * @param {Object} options A object defining the configuration for `simpply`. *
 * @returns {Object} Returns the current global state and a `dispatch` method used to broadcast actions throughout the system.
 */
const createStore = (systemStorage, options) => {
  // Verify that `systemStorage` is an {Object}.
  throwError(
    getVariableType(systemStorage) !== 'object',
    `The 'systemStorage' argument passed to the 'createStore' function must be an Object.`
  );

  // Verify that `options` is an {Object}.
  throwError(
    getVariableType(options) !== 'object',
    `The 'options' argument passed to the 'createStore' function must be an Object.`
  );

  const { globalEffects, globalInitialState } = systemStorage;

  // Verify that `systemStorage` has `globalEffects` and `globalInitialState` props.
  throwError(
    !globalEffects || !globalInitialState,
    `Expected ${systemStorage} to have 'globalEffects' and 'globalInitialState' props.`
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

      const fn = systemStorage.globalEffects[type];
      const key = effectsToStorageEntityMap.get(type);

      return fn && typeof fn === 'function'
        ? { ...state, [key]: fn(state[key], payload) }
        : state;
    };
  }

  const [state, _dispatch] = useReducer(
    reducerFn,
    systemStorage.globalInitialState
  );

  const prevState = useRef();

  useEffect(() => {
    prevState.current = state;
  });

  if (process.env.NODE_ENV === 'development') {
    if (prevState.current && options.logging) {
      console.log(`Previous state: `, prevState.current);
      console.log(`Current state: `, state);
    }

    // `dispatch` needs to be memoized to avoid re-renders.
    dispatch = useMemo(
      () => action => {
        if (options.logging) {
          console.log(`Triggered '${action.type}'.`);
        }

        _dispatch(action);
      },
      [_dispatch]
    );
  } else {
    // `_dispatch` is never returned as a new function, so there is no danger of re-rendering here.
    dispatch = _dispatch;
  }

  return { state, dispatch };
};

/**
 * Creates the application's main `Provider` component that serves the store via Context API.
 *
 * @param {Object} systemStorage The combination of all the Storage Entities in the app.
 * @param {Object} options A object defining the configuration for `simpply`.
 * @return {React.FunctionComponentElement} Returns the app's `Provider` component.
 */
const createProvider = (
  systemStorage,
  options = {
    logging: true
  }
) => ({ children }) => {
  const store = createStore(systemStorage, options);
  return React.createElement(Ctx.Provider, { value: store }, children);
};

/**
 * Creates a Higher Order Function (HOF) that can be later applied to a React component.
 * The result of applying the function is a wrapper component that will have a slice of the global state automatically injected as well as the `dispatch` function.
 *
 * @param {Function | Null} mapStateToProps A function returning an object defining which slice of the global state will be injected in the wrapper component. If `mapStateToProps` is `null`, only `dispatch` will be injected.
 * @returns {Function} A HOF to apply to a React component.
 */
const connect = mapStateToProps => Component => {
  const MemoComponent = React.memo(Component);

  const EnhancedComponent = props => {
    const { state, dispatch } = useContext(Ctx);
    let slicedState = {};

    // Verify that `mapStateToProps` is eiterh a {Function} or {Null}.
    throwError(
      getVariableType(mapStateToProps) !== 'function' &&
        getVariableType(mapStateToProps) !== 'null',
      `'mapStateToProps' must be either a Function or Null.`
    );

    if (mapStateToProps !== null) {
      slicedState = mapStateToProps(state);
    }

    // Verify that `slicedState` is an {Object}.
    throwError(
      getVariableType(slicedState) !== 'object',
      `The result of calling 'mapStateToProps' function must be an Object. 'mapStateToProps' can also be Null, in which case only 'dispatch' will be injected.`
    );

    return React.createElement(MemoComponent, {
      ...props,
      ...slicedState,
      dispatch
    });
  };

  return EnhancedComponent;
};

export { createProvider, connect, createSystemStorage };

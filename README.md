# simpply

A simple state management library for React app, built on top of the Context &amp; Hooks APIs.

### Installation

Run `npm i simpply`.

### Defining the notion of a _Storage Entity_

A `Storage Entity` in `simpply` is just an object which has two properties - `initialState` and `effects`. It defines a state for a particular system resource (or entity) and how it behaves or changes over time.

Below you have an example of a `User Storage Entity` that could be separated in a file called `user.js`:

```javascript
// This goes in `user.js`.

/**
 * We are adding a new user (defined by the `payload` construct).
 *
 * E.g. for a first time add:
 * `state` would be the `initialState` (that is `[]`).
 * `payload` would be `John Doe`.
 */
const addUser = (state, payload) => [...state, payload];

const effects = {
  ADD_USER: addUser
};

export default {
  initialState: [],
  effects
};
```

An `effect` is a function that has the following signature: `(state, payload)`. `state` represents the current value of the `Storage Entity` we apply the effect for. `payload` represents the data passed through the system when a certain action will be dispatched (more on that later).

### Why are _Storage Entities_ important

`simpply` provides an API so that all the `Storage Entities` in the system are combined into a `System Storage`. A `System Storage` is, in the context of `simpply`, just a fancy name that describes an object containing the system's state and all the effects associated with it (and that will change the state over time). The `System Storage` is used to create the final `store` (state + `dispatch`) by employing the `userReducer` hook in React.

# simpply

A simple state management library for React app, built on top of the Context &amp; Hooks APIs.

### Installation

Run `npm i simpply`.

### Defining the notion of a _Storage Entity_

A `Storage Entity` in `simpply` is just an object which has two properties - `initialState` and `effects`. It defines a state for a particular system resource (or entity) and how it behaves or changes over time.

Below you have an example of a `User Storage Entity` that could be separated in a file called `user.js`:

```
// This goes in `user.js`.

const addUser = (state, payload) => [...state, payload];

const effects = {
  ADD_USER: addUser
};

export default {
  initialState: [],
  effects
};

```

# simpply

A simple state management library for React app, built on top of the Context &amp; Hooks APIs.

### Table of contents

- [simpply](#simpply)
    - [Table of contents](#table-of-contents)
    - [Installation](#installation)
    - [Defining the notion of a _Storage Entity_](#defining-the-notion-of-a-storage-entity)
    - [Why are _Storage Entities_ important](#why-are-storage-entities-important)
    - [Documentation](#documentation)
      - [`createSystemStorage`](#createsystemstorage)
      - [`createProvider`](#createprovider)
      - [`connect`](#connect)
    - [Author](#author)
    - [License](#license)

### Installation

Run `npm i simpply`.

### Defining the notion of a _Storage Entity_

A `Storage Entity` in `simpply` is just an object which has two properties - `initialState` and `effects`. It defines a state for a particular system resource (or entity) and how it behaves or changes over time.

Below you have an example of a `User Storage Entity` that could be separated in a file called `users.js`:

```javascript
// This goes in `users.js`.

/*
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

### Documentation

#### `createSystemStorage`

```javascript
/**
 * @param {Object} storageEntitiesObj An object containing all the Storage Entities in the app.
 * @returns {Object} An object containing the global initial state of the system and all the effects associated with it.
 */
```

Combines all the `Storage Entities` in the app under the same umbrella. A `Storage Entity` file must contain the following two exports:

```javascript
{
  initialState, effects;
}
```

For details on what each property represents, check the above documentation for [`Storage Entity`](#defining-the-notion-of-a-storage-entity).

E.g. of a `User Storage Entity` implementation with an effect to add a new user, a `Puppy Storage Entity` with an effect to delete a puppy and how they are combined via `createSystemStorage`:

```javascript
// In `users.js`

export default {
  initialState: [],
  effects: {
    ADD_USER: (state, payload) => [...state, payload]
  }
}

// In `puppies.js`

export default {
  initialState: [],
  effects: {
    DELETE_PUPPY: (state, payload) => [...state, payload]
  }
}

// Then in a separate file (e.g.: `systemStorage.js`), combine the two:

import users from '/path/to/users.js';
import puppies from '/path/to/puppies.js';

export default createSystemStorage({
  users,
  puppies
});
```

This function returns an object containing the global initial state of the system and all the effects associated with it. The end result of applying `createSystemStorage` will then be used to create the application's main `Provider`.

#### `createProvider`

```javascript
/**
 * @param {Object} systemStorage The combination of all the Storage Entities in the app.
 * @return {Function} Returns the app's `Provider` component.
 */
```

Creates the application's main `Provider` component that serves the resulting store via Context API.

E.g. of using `createProvider`:

```javascript
// In index.js

import { createProvider } from 'simpply';
import systemStorage from '/path/to/systemStorage.js';

const AppProvider = createProvider(systemStorage);

ReactDOM.render(
  <AppProvider>...</AppProvider>,
  document.getElementById('root')
);
```

#### `connect`

```javascript
/**
 * @param {Object} mapStateToProps An object defining which slice of the global state will be injected in the wrapper component.
 * @returns {Function} A HOF to apply to a React component.
 */
```

Creates a Higher Order Function (HOF) that can be later applied to a React component. The result of applying the function is a wrapper component that will have a slice of the global state automatically injected as well as the `dispatch` function.

E.g. of using `connect` for a PuppiesList component:

```javascript
// In `PuppiesList.js`

import { connect } from 'simpply';

const PuppiesList = ({ puppies }) => (
  <ul>
    {puppies.map(puppy => (
      <li key={puppy.id}>{puppy.name}</li>
    ))}
  </ul>
);

const mapStateToProps = state => ({
  // This is where we define that `PuppiesList` care only about
  // the `puppies` property from the global state
  puppies: state.puppies
});

export default connect(mapStateToProps)(PuppiesList);
```

The `connect` function is similar to Redux's `connect` functionality.

### Author

**Name**: Vlad Zelinschi
**Email**: `the.reignn@gmail.com` or `vlad@krak3n.co`

### License

[MIT © Vlad Zelinschi](/LICENSE)

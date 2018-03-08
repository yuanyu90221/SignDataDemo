import {Platform} from 'react-native';
import {
  createStore,
  applyMiddleware,
  compose
} from 'redux';
import devToolsEnhancer from 'remote-redux-devtools';
import {composeWithDevTools} from 'remote-redux-devtools';
import promise from 'redux-promise';
import thunk from 'redux-thunk';
import logger from 'redux-logger';

import RootReducer from './Reducers';

// const middleware = applyMiddleware(thunk, promise, logger);

// const Store = createStore(
//   RootReducer,
//   compose(
//     middleware
//   )
// )
const Store = createStore(
  RootReducer,
  devToolsEnhancer()
)
export default Store;
// import { createStore, applyMiddleware } from 'redux';
// import { composeWithDevTools } from 'redux-devtools-extension';
// import thunk from 'redux-thunk';
// import RootReducer from './Reducers';

// const middlewares = [thunk];
// const enhancer = composeWithDevTools(
//   {
//     // Options: https://github.com/jhen0409/react-native-debugger#options
//   },
// )(applyMiddleware(...middlewares));

// export default function configureStore(initialState) {
//   const store = createStore(reducer, initialState, enhancer);
//   if (module.hot) {
//     module.hot.accept(() => {
//       store.replaceReducer(require('./Reducers').default);
//     });
//   }
//   return store;
// }
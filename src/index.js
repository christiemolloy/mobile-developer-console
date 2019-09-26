import React from 'react';
import ReactDOM from 'react-dom';
import { Provider } from 'react-redux';

import '@patternfly/react-core/dist/styles/base.css';
import '@patternfly/patternfly/components/FormControl/form-control.css';
import '@patternfly/patternfly/components/Button/button.css';
import './style/index.css';
import App from './components/App';
import configureStore from './configureStore';

const store = configureStore();

ReactDOM.render(
  <Provider store={store}>
    <App />
  </Provider>,
  document.getElementById('root')
);

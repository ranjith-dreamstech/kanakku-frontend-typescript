import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import './index.css';
import { initializeAuth } from './store/auth/authSlice';
import { store } from './store';
import { Provider } from 'react-redux';
store.dispatch(initializeAuth());

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
     <Provider store={store}>
    <BrowserRouter>
        <App />
     
    </BrowserRouter>
     </Provider>
  </React.StrictMode>
);

import React from "react";
import ReactDOM from "react-dom/client";
import { App } from "./App";
import { Provider } from "react-redux";
import { store } from "./store";
import axios from "axios";

// Add global axios interceptor for account-id and sdd-token from Redux store
axios.interceptors.request.use((config) => {
  const state = store.getState();
  const accountId = state.auth.accountId;
  const accessToken = state.auth.accessToken;
  if (accountId) {
    config.headers = config.headers || {};
    config.headers['account-id'] = accountId;
  }
  if (accessToken) {
    config.headers = config.headers || {};
    config.headers['sdd-token'] = accessToken;
  }
  return config;
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <Provider store={store}>
      <App />
    </Provider>
  </React.StrictMode>,
);

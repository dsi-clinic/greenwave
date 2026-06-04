// This file is the entry point. It tells React to render the App component
// into the <div id="root"> we put in index.html. You won't normally edit
// this file — App.jsx is where the real work happens.
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);

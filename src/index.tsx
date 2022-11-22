import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import mixpanel from 'mixpanel-browser';
import './index.css';
import App from './App';

if (process.env.REACT_APP_MIXPANEL_PROJECT_TOKEN) {
    mixpanel.init(process.env.REACT_APP_MIXPANEL_PROJECT_TOKEN, {
        debug: process.env.REACT_APP_ENV === 'development' ? true : false,
    });
}

const container = document.getElementById('root');
const root = createRoot(container!);
root.render(
    <React.StrictMode>
        <BrowserRouter>
            <App />
        </BrowserRouter>
    </React.StrictMode>,
);

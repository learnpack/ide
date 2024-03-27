import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'
import TagManager from 'react-gtm-module'

const tagManagerArgs = {
  gtmId: 'GTM-WCVQ4KJ',
  auth: 'UziHoBlMGYrHZqefka0uXg',
  env: 'env-1'
};

TagManager.initialize(tagManagerArgs);


ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)

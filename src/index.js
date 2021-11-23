import React from 'react'
import ReactDOM from 'react-dom'
import { Web3ReactProvider } from '@web3-react/core'
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'
import { App } from './App'
import { getLibrary } from './utils/'

ReactDOM.render(
  <React.StrictMode>
    <Web3ReactProvider getLibrary={getLibrary}>
      <App />
    </Web3ReactProvider>
  </React.StrictMode>,
  document.getElementById('root')
)

import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import { CookiesProvider } from 'react-cookie';
import Game from './game'

// ========================================

ReactDOM.render(
  <CookiesProvider>
    <Game />
  </CookiesProvider>,
  document.getElementById('root')
);
/**
 * @fileoverview 应用程序主入口文件
 * @module main
 * @description 初始化React应用，将App组件挂载到DOM根节点
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.tsx';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
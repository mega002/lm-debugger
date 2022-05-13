import React from 'react';
import {
  BrowserRouter, Route, Routes, 
} from "react-router-dom";

import MainPage from "./components/MainPage";
import Play from "./components/Play";
import { Helmet } from "react-helmet"; 
// antd styles
import 'antd/dist/antd.min.css';

function App(): JSX.Element {
  return (
    <>
      <Helmet>  
        <html lang="en" />  
        <title>LM-Debugger</title>
        <meta name="description" content="A Debugger Tool for Transformer-based Language Models." />
      </Helmet>  
    <BrowserRouter>
      <Routes>
        <Route path="/test" element={<Play />} />
        <Route path="/" element={<MainPage />} />
      </Routes>
    </BrowserRouter>
    </>
  );
}

export default App;

import React  from "react";
import { Route, Routes } from "react-router-dom";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Top } from "./components/_Common/Top";
import Product from "./components/_Product";
import { Vault } from "./components/_Product/Vault";
import Strategy from "./components/_MyVaults/Strategy";
import MyVaults from "./components/_MyVaults";
import Portfolio from "./components/_Portfolio";
import { Footer } from "./components/_Common/Footer";

function App(props) {

  return (
    <>
        <Top />
        <Routes>
          <Route exact path="/" element={<Product />} />
          <Route exact path={`/vault/:vault`} element={<Vault />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/my-vaults" element={<MyVaults />} />
          <Route path="/my-vaults/:vault/:strategy" element={<Strategy />} />
        </Routes>
        <Footer />
        <ToastContainer />
    </>
  );
}

export default App;


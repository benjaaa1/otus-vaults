import React  from "react";
import { Route, Routes } from "react-router-dom";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { Top } from "./components/Common/Top";
import { PageContainer } from "./components/Common/Container";
import Product from "./components/Product";
import { Vault } from "./components/Product/Vault";
import Strategy from "./components/MyVaults/Strategy";
import MyVaults from "./components/MyVaults";
import Portfolio from "./components/Portfolio";

function App(props) {

  return (
    <PageContainer>
      <Top />
      <Routes>
        <Route exact path="/" element={<Product />} />
        <Route exact path={`/vault/:vault`} element={<Vault />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/my-vaults" element={<MyVaults />} />
        <Route path="/my-vaults/:vault/:strategy" element={<Strategy />} />
      </Routes>
      <ToastContainer />
    </PageContainer>
  );
}

export default App;


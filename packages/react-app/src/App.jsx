import React  from "react";
import { Route, Switch } from "react-router-dom";

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
      <Switch>
        <Route exact path="/">
          <Product />
        </Route>
        <Route exact path={`/vault/:vault`}>
          <Vault />
        </Route>
        <Route path="/portfolio">
          <Portfolio />   
        </Route>
        <Route path="/my-vaults">
          <MyVaults />
        </Route>
        <Route path="/my-vault/:vault/:strategy">
          <Strategy />
        </Route>
      </Switch>
      <ToastContainer />
    </PageContainer>
  );
}

export default App;


import React  from "react";
import { Route, Switch } from "react-router-dom";

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import Product from "./components/Product";
import Supervisor from "./components/Supervisor";
import { Vault } from "./components/Product/Vault";
import { Top } from "./components/Common/Top";
import { PageContainer } from "./components/Common/Container";

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
          Portfolio         
        </Route>
        <Route path="/supervisors">
          <Supervisor />
        </Route>
      </Switch>
      <ToastContainer />
    </PageContainer>
  );
}

export default App;


import React from "react";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

const customTheme = extendTheme({
  fonts: {
    heading: `'IBM Plex Mono', monospace`,
    body: `'IBM Plex Sans', sans-serif`
  },
  styles: {
    global: {
      body: {
        background: "linear-gradient(180deg, #84FFC4 0%, rgba(101, 255, 144, 0.56) 100%) no-repeat", 
        minHeight: "100%"
      }
    }
  }
});

ReactDOM.render(
  <ChakraProvider theme={customTheme}>
    <BrowserRouter>
      <App  />
    </BrowserRouter>
  </ChakraProvider>,
  document.getElementById("root"),
);

import React from "react";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { ChakraProvider, extendTheme } from '@chakra-ui/react';

const customTheme = extendTheme({

  components: {
    Select: {
      sizes: {
        md: {
          field: {
            fontSize: '14px',
            borderRadius: 'none',
            color: '#333'
          },
        },
      },
    },
    Input: {
      sizes: {
        md: {
          field: {
            fontSize: '14px',
            borderRadius: 'none',
          },
        },
      },
    },
    Textarea: {
      sizes: {
        md: {
          field: {
            fontSize: '14px',
            borderRadius: 'none',
          },
        },
      },
    },
    Button: {
			baseStyle: {
				rounded: 'none'
			}
		},
  },
  initialColorMode: 'dark',
  fonts: {
    heading: `'IBM Plex Mono', monospace`,
    body: `'IBM Plex Sans', sans-serif`
  },
  styles: {
    global: {
      body: {
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

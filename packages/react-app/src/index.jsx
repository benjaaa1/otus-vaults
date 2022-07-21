import React from "react";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";
import { ChakraProvider, extendTheme } from '@chakra-ui/react';
import colors from "./designSystem/colors";

const customTheme = extendTheme({

  components: {
    Tabs: {
      baseStyle: {
        tab: {
          _selected: {
            bg: colors.background.three,
            color: colors.text.light
          }
        }
      }
    },
    Select: {
      sizes: {
        md: {
          field: {
            fontSize: '14px',
            borderRadius: 'none',
            color: '#333',
            background: '#fff'
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

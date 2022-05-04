import React from "react";
import { ThemeSwitcherProvider } from "react-css-theme-switcher";
import { BrowserRouter } from "react-router-dom";
import ReactDOM from "react-dom";
import App from "./App";
import "./index.css";

const themes = {
  dark: `${process.env.PUBLIC_URL}/dark-theme.css`,
};

ReactDOM.render(
  <ThemeSwitcherProvider themeMap={themes} defaultTheme={"dark"}>
    <BrowserRouter>
      <App  />
    </BrowserRouter>
  </ThemeSwitcherProvider>,
  document.getElementById("root"),
);

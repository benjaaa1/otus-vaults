import {
  Link as ReactRouterLink
} from "react-router-dom";
import React from "react";

const Link = ({ children, to, ...props }) => {
  return (
    <ReactRouterLink to={to} {...props}>
      {children}
    </ReactRouterLink>
  )
};

export default Link;
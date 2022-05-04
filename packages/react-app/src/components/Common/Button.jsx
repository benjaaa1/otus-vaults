import React from "react";
import styled from "styled-components";
import colors from "../../designSystem/colors";

export const Button = styled.button`
  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border-radius: 3px;

  /* Color the border and text with theme.main */
  color: ${props => colors.text};
  background: ${props => colors.background.one};
  border: 2px solid ${props => colors.background.two};
`;
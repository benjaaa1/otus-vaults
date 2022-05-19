import React from "react";
import styled from "styled-components";
import { BaseLink } from "../../designSystem";
import colors from "../../designSystem/colors";
import sizes from "../../designSystem/sizes";
import theme from "../../designSystem/theme";

export const NavigationLink = styled(BaseLink)`
  font-size: ${theme.fontSize.md}; 
  font-weight: 400;
  text-transform: uppercase;
  color: ${colors.buttons.primary};
`;
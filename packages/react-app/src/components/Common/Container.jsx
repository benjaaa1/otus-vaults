import React from "react";
import styled from "styled-components";
import { BaseBox, Container } from "../../designSystem";
import colors from "../../designSystem/colors";
import sizes from "../../designSystem/sizes";
import theme from "../../designSystem/theme";

export const NavContainer = styled(Container)`
  max-width: ${sizes.xxl}px;
  margin-top: ${theme.margin.md};
  margin-bottom: ${theme.margin.md};
  border: 2px solid ${colors.borderDark};
  border-radius: ${theme.border.radius};
  background: ${colors.background.one};
`;

export const PageContainer = styled(Container)`
  max-width: ${sizes.xxl}px;
`;

export const BaseShadowBox  = styled(BaseBox)`
  background: ${colors.background.one};
  -webkit-box-shadow: -5px -5px 0px 2px ${colors.background.two}; 
  box-shadow: -5px -5px 0px 2px ${colors.background.two};
  width: ${props => props.width};
  height: ${props => props.height};
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${colors.background.two};
  padding: ${props => props.padding};
`;
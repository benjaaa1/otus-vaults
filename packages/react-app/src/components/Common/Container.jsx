import styled from "styled-components";
import { Center, Box } from "@chakra-ui/react";
import { BaseBox, Container } from "../../designSystem";
import colors from "../../designSystem/colors";
import sizes from "../../designSystem/sizes";
import theme from "../../designSystem/theme";

export const NavContainer = styled(Container)`
  max-width: ${sizes.xxl}px;
  margin-top: ${theme.margin.md};
  margin-bottom: ${theme.margin.md};
  border: 2px solid ${colors.borderGray};
  border-radius: ${theme.border.radius};
  background: ${colors.background.one};
`;

export const PageContainer = styled(Container)`
  max-width: ${sizes.xxl}px;
  padding: 8px; 
`;

export const HeaderContainer = styled(Center)``;

export const BaseShadowBox  = styled(BaseBox)`
  background: ${colors.background.one};
  -webkit-box-shadow: -5px -5px 0px 2px ${colors.background.two}; 
  box-shadow: -5px -5px 0px 2px ${colors.background.two};
  width: ${props => props.width};
  height: ${props => props.height};
  min-width: 100%; 
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${colors.background.two};
  padding: ${props => props.padding};
`;

export const BaseVaultBox  = styled(Box)`
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${colors.background.two};
  padding: ${props => props.padding};
  background: ${colors.background.one};
`;

export const BaseDepositBox  = styled(Box)`
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${colors.background.two};
  padding: ${props => props.padding};
  background: ${colors.background.two};
`;

export const VaultStrategyBox  = styled(Box)`
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${colors.background.two};
  padding: ${props => props.padding};
  background: ${colors.background.two};
`;

export const StrategyBox  = styled(Box)`
  border-radius: ${theme.border.radius};
  border: ${theme.border.width} solid ${colors.background.two};
  padding: ${props => props.padding};
  background: ${colors.background.one};
`;
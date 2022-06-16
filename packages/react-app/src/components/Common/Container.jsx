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
  border: 1px solid ${colors.borderGray};
  background: ${colors.background.one};
  padding: 14px; 
`;

export const PageContainer = styled(Container)`
  max-width: ${sizes.xxl}px; 
`;

export const HeaderContainer = styled(Center)``;

export const BaseShadowBox  = styled(BaseBox)`
  background: ${colors.background.one};
  width: ${props => props.width};
  height: ${props => props.height};
  min-width: 100%; 
  padding: ${props => props.padding};
  margin-top: 20px; 
  border: 1px solid ${colors.borderGray};
`;

export const BaseVaultBox  = styled(Box)`
  padding: ${props => props.padding};
  background: ${colors.background.one};
`;

export const BaseDepositBox  = styled(Box)`
  padding: ${props => props.padding};
  background: ${colors.background.two};
`;

export const VaultStrategyBox  = styled(Box)`
  padding: ${props => props.padding};
  background: ${colors.background.one};
  border: 1px solid ${colors.borderGray};
`;

export const StrategyBox  = styled(Box)`
  padding: ${props => props.padding};
  background: ${colors.background.one};
  border: 1px solid ${colors.borderGray};
`;
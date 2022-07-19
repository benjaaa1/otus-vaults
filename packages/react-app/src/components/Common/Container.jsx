import styled from "styled-components";
import { Center, Box } from "@chakra-ui/react";
import { Container } from "../../designSystem";
import colors from "../../designSystem/colors";
import sizes from "../../designSystem/sizes";
import theme from "../../designSystem/theme";

export const NavContainer = styled(Container)`
  border-bottom: 1px solid ${colors.borderGray};
`;

export const FooterNavContainer = styled(Container)`
  border-top: 1px solid ${colors.borderGray};
  margin-top: 100px; 
  padding: 8px; 
`;

export const NavInternalContainer = styled(Container)`
  max-width: ${sizes.xxl}px;
  background: ${colors.background.one};
  padding: 4px; 
`;

export const PageContainer = styled(Container)`
  max-width: ${sizes.xl}px; 
`;

export const HeaderContainer = styled(Container)`
  border-bottom: 1px solid ${colors.borderGray};
  margin-bottom: ${props => props.mb || '100px'};
  margin-top: ${props => props.mt || '100px'};
  padding-bottom: ${props => props.pb || '100px'}; 
`;

export const HeaderInternalContainer = styled(Container)`
  max-width: ${sizes.xl}px;
  background: ${colors.background.one};
  padding: 4px; 
`;


export const BaseShadowBox  = styled(Box)`
  background: ${colors.background.light};
  width: ${props => props.width};
  height: ${props => props.height};
  min-width: 100%; 
  margin-top: 20px; 
  border: 1px solid ${colors.borderGray};
  cursor: default;
  border-radius: 2px;
  min-height: 458px; 
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
  border-radius: 2px;
`;

export const StrategyBox  = styled(Box)`
  padding: ${props => props.padding};
  background: ${colors.background.one};
  border: 1px solid ${colors.borderGray};
  border-radius: 2px;
`;
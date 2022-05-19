import React from "react";
import styled from "styled-components";
import { BaseButton } from "../../designSystem";
import colors from "../../designSystem/colors";
import theme from "../../designSystem/theme";

export const CTAButton = styled(BaseButton)`
  font-family: ${theme.font.sans};
  font-size: ${theme.font.size}; 
  font-weight: 700;
  border: ${theme.border.width} solid ${colors.background.two};
  border-radius: ${theme.border.radius};
  box-shadow: -3px -3px 0px 0px ${colors.background.two};
  margin: 0 auto; 
  padding: ${theme.padding.sm} ${theme.padding.lg} ${theme.padding.sm} ${theme.padding.lg};
  background: none; 
`;

export const DepositButton = styled(BaseButton)`
`;

export const WithdrawButton = styled(BaseButton)`
`;

export const ConnectButton = styled(BaseButton)`
  font-family: ${theme.font.sans};
  font-size: ${theme.font.size}; 
  font-weight: 700;
  border: ${theme.border.width} solid ${colors.background.two};
  border-radius: ${theme.border.radius};
  margin: 0 auto; 
  padding: ${theme.padding.sm} ${theme.padding.lg} ${theme.padding.sm} ${theme.padding.lg};
  background: none; 
`;

export const StrikeButton = styled(BaseButton)`
`;

export const Button = styled(BaseButton)`
`;
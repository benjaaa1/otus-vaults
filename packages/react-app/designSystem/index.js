import styled from "styled-components";
import { Button } from '@chakra-ui/react'
import { Link } from "react-router-dom";
import colors from "./colors";
import theme from "./theme";
import sizes from "./sizes";


export const BaseVaultHeaderText = styled.span`
  color: ${props => props.color };
  font-family: 'IBM Plex Mono', monospace;
  font-size: ${props => props.size };
  font-weight: 700;
  margin: 0 auto; 
  line-height: 28px; 
`;

export const BaseHeaderText = styled.span`
  color: ${props => props.color };
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: ${props => props.size };
  font-weight:  ${props => props.fontWeight || '400' };; 
  margin: 0 auto; 
  line-height: 36px; 
`;

export const BaseLink = styled(Link)`
  font-family: 'IBM Plex Mono', monospace;
  text-decoration: none;
  &:hover {
   font-weight: 700;
  }
`;

export const BaseTag = styled.span`
  background: ${props => props.bg };
  padding: ${props => props.ps};
  margin: ${props => props.ms}
  border: ${props => props.borderSize}
`;

export const BaseButton = styled(Button)`
  background: ${props => props.bg };
  padding: ${props => props.ps};
  margin: ${props => props.ms};
`;

export const Container = styled.div`
  margin-left: auto;
  margin-right: auto;
`;

export const BaseBox = styled.div`
`;
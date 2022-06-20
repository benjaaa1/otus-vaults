import styled from "styled-components";
import { Button } from '@chakra-ui/react'
import { Link } from "react-router-dom";
import colors from "./colors";
import theme from "./theme";


export const BaseHeaderText = styled.span`
  color: ${props => props.color };
  font-family: 'IBM Plex Mono', monospace;
  font-size: ${props => props.size };
  font-weight: 400; 
  text-align: center;
  margin: 0 auto; 
  padding: ${theme.padding.sm}
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
import React from "react";
import { Flex, Box } from 'reflexbox';
import styled from "styled-components";

const Container = styled.div`
  max-width: 768px;
  margin-left: auto;
  margin-right: auto;
  padding-left: 16px;
`;

export const Views = ({ children }) => {
  return (
    <Container>
      { children }
    </Container>
  )
}


import React from "react";
import styled from "styled-components";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  MenuItemOption,
  MenuGroup,
  MenuOptionGroup,
  MenuDivider,
} from '@chakra-ui/react';
import { ChevronDownIcon } from "@chakra-ui/icons";
import colors from "../../designSystem/colors";

export const Select = styled.select`
  width: 100%;
  height: 35px;
  background: white;
  color: gray;
  padding-left: 5px;
  font-size: 14px;
  border: none;
  margin-left: 10px;

  option {
    color: black;
    background: white;
    display: flex;
    white-space: pre;
    min-height: 20px;
    padding: 0px 2px 1px;
  }
`;

export const BaseMenu = ({ title, options, onClick }) => {
  console.log({ options })
  return (
    <Menu>
      <MenuButton 
        as={Button} 
        rightIcon={<ChevronDownIcon />}
        px={2}
        py={2}
        borderRadius='sm'
        bg={colors.background.one}
      >
        { title }
      </MenuButton>
      <MenuList>
        <MenuItem>Test</MenuItem>
        {
          options.map(({ name, id }) => {
            return <MenuItem onClick={() => onClick(id)}>{ name }</MenuItem>
          })
        }
      </MenuList>
    </Menu>
  )
}
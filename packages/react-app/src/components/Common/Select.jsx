import React from "react";
import styled from "styled-components";
import {
  Button,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Select as ChakraSelect
} from '@chakra-ui/react';
import { ChevronDownIcon } from "@chakra-ui/icons";
import colors from "../../designSystem/colors";
import theme from "../../designSystem/theme";

export const Select = styled(ChakraSelect)`
  border: ${theme.border.width} solid ${colors.background.two};
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
        color={colors.text.light}
      >
        { title }
      </MenuButton>
      <MenuList>
        {
          options.map(({ name, id }) => {
            return <MenuItem 
            bg={colors.background.one}
            color={colors.text.light}
            onClick={() => onClick(id)}>
              { name }
            </MenuItem>
          })
        }
      </MenuList>
    </Menu>
  )
}
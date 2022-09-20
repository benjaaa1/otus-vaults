import { Button as ChakraButton, IconButton } from '@chakra-ui/react'
import { ArrowForwardIcon, CloseIcon, PlusSquareIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import styled from "styled-components";
import { BaseButton, BaseIconButton } from "../../designSystem";
import colors from "../../designSystem/colors";
import theme from "../../designSystem/theme";

const Button = (props) => {
  return <ChakraButton {...props} borderRadius={'2px'} />
}

export const SelectStrikeButton = (props) => (<Button {...props} fontSize={'sm'} border={`1px solid ${colors.borderGray}`} fontWeight={'400'} bg={colors.background.one} color={colors.text.dark} _hover={{ background: colors.background.three, color: colors.text.dark }} />)

export const SelectStrikeStrategyButton = (props) => (<Button {...props} fontSize={'sm'} border={`1px solid ${colors.borderGray}`} fontWeight={'400'} bg={colors.background.one} color={colors.text.dark} _hover={{ background: colors.background.three, color: colors.text.dark }} />)

export const ApproveButton = (props) => (<Button {...props}  bg={colors.background.three} color={colors.text.dark} _hover={{ background: colors.background.three, color: colors.text.dark }} />)

export const DepositButton = (props) => (<Button {...props}  bg={colors.background.three} color={colors.text.dark} _hover={{ background: colors.background.three, color: colors.text.dark }} />)

export const WithdrawButton = (props) => (<Button {...props} bg={colors.background.one} color={colors.text.dark} _hover={{ background: colors.background.two, color: colors.text.light }} />)

export const VaultActionButton = (props) => (<Button w={'100%'} {...props} bg={colors.background.two} color={colors.text.light} _hover={{ background: colors.background.two_hover, color: colors.text.light }}  />)

export const ViewButton = (props) => (<Button {...props} bg={colors.background.three} color={colors.text.dark} _hover={{ background: colors.background.two, color: colors.text.light }}  />)

export const CreateButton = (props) => (<Button {...props} bg={colors.background.three} color={colors.text.dark} _hover={{ background: colors.background.two, color: colors.text.light }}  />)

export const PreviousButton = (props) => (<Button {...props} bg={colors.background.one} color={colors.text.dark} _hover={{ background: colors.background.two, color: colors.text.light }}  />)

export const NextButton = (props) => (<Button {...props} bg={colors.background.one} color={colors.text.dark} _hover={{ background: colors.background.two, color: colors.text.light }}  />)

export const CancelButton = (props) => (<Button {...props} bg={colors.background.one} _hover={{ background: "white", color: "teal.500" }} />)

export const SaveButton = (props) => (<Button {...props} bg={colors.background.two} _hover={{ background: "white", color: "teal.500" }} />)

export const VaultButton = (props) => (<Button {...props} bg={colors.background.one} color={colors.text.dark} border={`1px solid ${colors.borderDark}`} _hover={{ background: colors.background.two, color: colors.text.light }} />)

export const ConnectButton = (props) => (<Button {...props} />)

export const CTAButton = (props) => (<Button {...props} _hover={{ background: colors.background.two, color: colors.text.light }} />)

export const NextButtonIcon = ({isLoading, onClick}) => (
  <IconButton bg={colors.background.two} color={colors.text.light} icon={<ArrowForwardIcon />} isLoading={isLoading} onClick={onClick} />)

export const AddButton = (props) => (<Button {...props} bg={colors.background.two} color={colors.text.light} border={`1px solid ${colors.borderDark}`} _hover={{ background: colors.background.two, color: colors.text.light }} />)

export const RemoveButton = (props) => (
  <IconButton {...props} icon={<CloseIcon />} onClick={props.onClick} />)

export const ViewLinkButton = (props) => (
  <IconButton {...props} bg={colors.background.one} color={colors.text.dark} icon={<ExternalLinkIcon />} onClick={props.onClick} />)

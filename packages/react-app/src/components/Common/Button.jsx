import { Button, IconButton } from '@chakra-ui/react'
import { ArrowForwardIcon, MinusIcon, PlusSquareIcon, ExternalLinkIcon } from "@chakra-ui/icons";
import styled from "styled-components";
import { BaseButton, BaseIconButton } from "../../designSystem";
import colors from "../../designSystem/colors";
import theme from "../../designSystem/theme";

export const DepositButton = styled(BaseButton)`
`;

export const WithdrawButton = styled(BaseButton)`
`;

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

export const AddButton = ({onClick}) => (
<IconButton bg={colors.background.two} color={colors.text.light} icon={<PlusSquareIcon />} onClick={onClick} />)

export const RemoveButton = ({onClick}) => (
  <IconButton bg={colors.background.two} color={colors.text.light} icon={<MinusIcon />} onClick={onClick} />)

export const ViewLinkButton = ({onClick}) => (
  <IconButton bg={colors.background.one} color={colors.text.dark} icon={<ExternalLinkIcon />} onClick={onClick} />)
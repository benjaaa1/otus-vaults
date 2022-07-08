import styled from "styled-components";
import { BaseLink } from "../../designSystem";
import colors from "../../designSystem/colors";
import theme from "../../designSystem/theme";

const NavigationLinkStyle = styled(BaseLink)`
  font-size: ${theme.fontSize.md}; 
  color: ${colors.buttons.primary};
`;

export const NavigationLink = (props) => {
  return (
    <NavigationLinkStyle 
      {...props} 
      style={isActive => {
        console.log({ isActive })
      }}
    />
  )
}
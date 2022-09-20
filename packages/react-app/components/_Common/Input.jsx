import styled from "styled-components";
import colors from "../../designSystem/colors";

export const InputNumber = styled.input`
  font-size: 1em;
  margin: 1em;
  padding: 0.25em 1em;
  border-radius: 3px;

  color: ${props => colors.text};
`;

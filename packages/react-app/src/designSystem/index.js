import styled from "styled-components";
// import { Modal as BootstrapModal } from "react-bootstrap";

import Link from "../components/Common/Link";
import colors from "./colors";

export const BaseText = styled.span`
  color: ${colors.text};
  font-family: "Inter", sans-serif;
  font-size: 16px;
  color: white;
`;

export const BaseLink = styled(Link)`
  &:hover {
    text-decoration: none;
  }
`;
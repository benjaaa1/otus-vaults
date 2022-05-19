import Address from "./Address";
import React from "react";
import { ConnectButton } from "../Common/Button";

export default function Account({
  address,
  mainnetProvider,
  blockExplorer,
  web3Modal,
  loadWeb3Modal,
  logoutOfWeb3Modal,
}) {

  const modalButtons = [];
  if (web3Modal) {
    if (web3Modal.cachedProvider) {
      modalButtons.push(
        <ConnectButton
          key="logoutbutton"
          style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
          shape="round"
          size="large"
          onClick={logoutOfWeb3Modal}
        >
          logout
        </ConnectButton>,
      );
    } else {
      modalButtons.push(
        <ConnectButton
          key="loginbutton"
          style={{ verticalAlign: "top", marginLeft: 8, marginTop: 4 }}
          shape="round"
          size="large"
          /* type={minimized ? "default" : "primary"}     too many people just defaulting to MM and having a bad time */
          onClick={loadWeb3Modal}
        >
          connect
        </ConnectButton>,
      );
    }
  }

  const display = (
    <>
      {address && <Address address={address} ensProvider={mainnetProvider} blockExplorer={blockExplorer} />}
    </>
  )

  return (
    <div>
      {display} 
      {modalButtons}
    </div>
  );
}

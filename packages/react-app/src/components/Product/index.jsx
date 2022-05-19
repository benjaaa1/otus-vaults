import React, { useEffect, useState } from "react";
import { Vaults } from "./Vaults"; 
import { useContractLoader } from "eth-hooks";
import { PageContainer } from "../Common/Container";
import { BaseHeaderText, BaseText } from "../../designSystem";
import { useHistory } from "react-router-dom";
import { Box } from 'reflexbox';
import { CTAButton } from "../Common/Button";
import theme from "../../designSystem/theme";
import colors from "../../designSystem/colors";

const Product = ({ signer, contractConfig, chainId  }) => {
  console.log({ chainId });
  const history = useHistory(); 

  const [vaults, setVaults] = useState([]); 

  const contracts = useContractLoader(signer, contractConfig, chainId);

  const contract = contracts ? contracts['OtusCloneFactory'] : "";

  useEffect(async () => {
    if(contract) {
      try {
        const _vaults = await contract.getActiveVaults();  
        setVaults(_vaults);  
      } catch (error) {
        console.log({ error })
      }
    }
  }, [contract])

  return <PageContainer>
      <Box 
        sx={{
          p: 4
        }}
      >
        <BaseHeaderText color={colors.buttons.primary} size={theme.fontSize.md}>
          Join one of the many vaults or create your own and implement your own strategy. 
        </BaseHeaderText>
        <CTAButton onClick={() => history.push("/supervisors")}>
          Become a Supervisor
        </CTAButton>
      </Box>
      <Vaults vaults={vaults} />
    </PageContainer>
  
}

export default Product;

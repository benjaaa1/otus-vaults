import React from "react";
import { Button } from "../Common/Button"; 
import { useHistory } from "react-router-dom";
import { Flex, Box } from 'reflexbox';
import { BaseShadowBox } from "../Common/Container";
import { AssetTag, ProductTag } from "../Common/Tags";
import theme from "../../designSystem/theme";

export const Vaults = ({ vaults }) => {

  const history = useHistory();
  console.log({vaults1: vaults})
  return <Flex flexWrap='wrap'>
    {
      vaults.map(vault => 
        <Box width={1/3}>
          <Box px={24}>
            <BaseShadowBox padding={theme.padding.lg}>
              <Box>
                <ProductTag>

                </ProductTag>
                <AssetTag>
                  
                 </AssetTag>
              </Box>
              <Box>
                
              </Box>

              <Box>
              
              </Box>
              <Box>
                
              </Box>

              <Box>
                <Button onClick={() =>  history.push(`/vault/${vault}`)}>{vault}</Button>
              </Box>
            </BaseShadowBox>
          </Box>
        </Box>
      )
    }
  </Flex>
  
}

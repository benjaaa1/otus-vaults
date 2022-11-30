specVersion: 0.0.4
schema:
  file: ./src/schema.graphql
dataSources:
  - kind: ethereum/contract
    name: OtusController
    network: optimism-goerli
    source:
      address: '0x49fd2BE640DB2910c2fAb69bB8531Ab6E76127ff'
      abi: OtusController
      startBlock: 1
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      entities:
        - Vault
        - Strategy
      abis:
        - name: OtusController
          file: ./abis/localhost_OtusController.json
      eventHandlers:
        - event: VaultCreated(indexed address,indexed address,address,(string,string,string,string,bool,uint256,uint256),(uint8,uint104,address))
          handler: handleVaultCreated
      file: ./src/mappings/otusController.ts
templates:
  - name: OtusVault
    kind: ethereum/contract
    network: optimism-goerli
    source:
      abi: OtusVault
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      file: ./src/mappings/otusVault.ts
      entities:
        - Vault
      abis:
        - name: OtusVault
          file: ./abis/localhost_OtusVault.json
      eventHandlers:
        - event: Trade(indexed address,(bytes32,uint256,uint256,uint256,uint256,uint256,uint256,uint256)[],uint256)
          handler: handleVaultTrade
        - event: PositionReduced(uint256,uint256)
          handler: handlePositionReduced
        - event: RoundStarted(uint16,uint104)
          handler: handleRoundStart
        - event: RoundClosed(uint16,uint104)
          handler: handleRoundClosed
        - event: RoundSettled(address,uint16,uint256)
          handler: handleRoundSettled
        - event: Deposit(indexed address,uint256,uint256)
          handler: handleDeposit
        - event: InitiateWithdraw(indexed address,uint256,uint256)
          handler: handleInitiateWithdraw
        - event: Redeem(indexed address,uint256,uint256)
          handler: handleRedeem
        - event: Withdraw(indexed address,uint256,uint256)
          handler: handleWithdraw
        - event: CapSet(uint256,uint256,address)
          handler: handleWithdraw
  - name: Strategy
    kind: ethereum/contract
    network: optimism-goerli
    source:
      abi: Strategy
    mapping:
      kind: ethereum/events
      apiVersion: 0.0.6
      language: wasm/assemblyscript
      file: ./src/mappings/strategy.ts
      entities:
        - Strategy
      abis:
        - name: Strategy
          file: ./abis/localhost_Strategy.json
      eventHandlers:
        - event: HedgeClosePosition(address,uint256,uint256)
          handler: handleHedgeClosePosition
        - event: Hedge(uint8,int256,uint256,uint256)
          handler: handleHedge
        - event: StrikeStrategyUpdated(address,(int256,uint256,uint256,uint256,uint256,uint256)[])
          handler: handeStrikeStrategyUpdate
        - event: StrategyUpdated(address,(uint256,uint256,uint256,uint256,uint256,uint256,uint256,bytes32[]))
          handler: handleVaultStrategyUpdate
        - event: StrategyHedgeTypeUpdated(address,uint8)
          handler: handleHedgeTypeUpdate
        - event: HedgeStrategyUpdated(address,(int256,uint256,uint256))
          handler: handleHedgeStrategyUpdate

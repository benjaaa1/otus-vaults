> install and start your 👷‍ Hardhat chain:

```bash
cd otus
yarn install
yarn chain
```

> in a second terminal window, start your 📱 frontend:

```bash
cd otus
yarn start
```

> in a third terminal window, 🛰 deploy your contract:

```bash
cd otus
yarn deploy
```

```
yarn chain
yarn lyraDeploy
yarn deploy
yarn mockFutures
yarn registry
yarn createStrategy

services - yarn compose
subgraph - yarn create-local
subgraph - yarn deploy-local

react-app - yarn run dev
```

> Goerlie Optimism

> Lyra Test

> Kwenta Test

# Otus Builder

> Saving a strategy on chain

- asset
- strikeId
- optionType
- size
- twitter handle
- address

contract OtusBuilder {

uint internal immutable limit;

uint

struct Trade {
bytes32 asset;
uint strikeId;
uint size;
OptionType optionType;
}

mapping(address => Trade[]) public userTrades;

constructor(address )

functoin saveBuilderStrategy(Trade[] memory \_trades) external {
require()

}

}

> Saving a strategy off chain

- asset
- strieId
- optionType
- size

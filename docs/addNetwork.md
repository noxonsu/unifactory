# How to add a new network

We only need to add a new object in this file: [networks.json](https://github.com/noxonsu/unifactory/blob/main/src/networks.json). Object structure:

```json5
  // key as a chain id
  "56": {
    "name": "BSC",
    "rpc": "https://bsc-dataseed.binance.org",
    "chainId": 56,
    "explorer": "https://bscscan.com",
    // used in the connection modal for the network item border color
    "color": "#CC9B00",
    // address of the Storage contract. We use BSC contract globally, so for new networks
    // we do not need to pass this parameter.
    "storage": "0xa7472f384339D37EfE505a1A71619212495A973A",
    // aggregates results from multiple contract constant function calls
    // https://github.com/makerdao/multicall
    "multicall": "0x41263cBA59EB80dC200F3E2544eda4ed6A90E76C",
    // native currency config
    "baseCurrency": {
      "decimals": 18,
      "name": "BNB",
      "symbol": "BNB"
    },
    // ERC20 token acts as an equivalent for the native currency.
    // It allows us to trade the native currency with ERC20 token
    "wrappedToken": {
      "address": "0xbb4CdB9CBd36B01bD1cBaEBF2De08d9173bc095c",
      "name": "Wrapped BNB",
      "symbol": "WBNB"
    }
  },
```

In the end do not forget to verify `multicall` and `wrappedToken` contracts in the network explorer.

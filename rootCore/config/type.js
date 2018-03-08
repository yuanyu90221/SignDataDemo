const ENV = require('rootCore/config/environment.js');

//determine coinType
const btcType = ENV.BTC == "production" ? "00" : "01";
const ltcType = ENV.LTC == "production" ? "02" : "01";

//determine mainnet or testnet
const btcP2 = ENV.BTC == "production" ? "00" : "01";
const ltcP2= ENV.LTC == "production" ? "00" : "01";

module.exports = {
  "BTC": {
    "isSegwit":true,
    "type": btcType,
    "P2":btcP2,
    "unit": 100000000,  //satoshi
    "medianTxSize": 226,
    "calculatingOut":"2MtHHC2h3ryvsg6ie4UKpZXwdT8Cto3MYiY",
    "account": 1,
    "network": {
      "production": { // main net
        "api": "https://blockchain.info/",
        "chain": "bitcoin",
        'pubKeyHash': '00',
        'scriptHash': '05'
      },
      "dev": { // testnet
        "api": "https://testnet.blockchain.info/", //"https://api.blockcypher.com/v1/btc/test3",
        "chain": "testnet",
        'pubKeyHash': '6f',
        'scriptHash': 'c4'
      }
    }
  },
  "ETH": {
    "type": "3C",
    "unit": 1000000000000000000,  // Wei 18 zero
    "account": 1,
    "network": {
      "production": { // main net
        "api": "https://api.etherscan.io",
        "chainId": "01"
      },
      "dev": { // ropsten net
        "api": "https://ropsten.etherscan.io",
        "chainId": "03"
      }
    }
  },
  "LTC": {
    "isSegwit":true,
    "type": ltcType,
    "P2":ltcP2,
    "unit": 100000000,
    "medianTxSize": 226,
    "account": 1,
    "network": {
      "production": { // main net
        "chain": "litecoin",
        'pubKeyHash': '30', //L
        'scriptHash': '32', //M
        'urlPath':'LTC/',
        "api": "https://api.blockcypher.com/v1/ltc/main/"
      },
      "dev": {
        "chain": "testnet",//"litecoinTestnet",
        'pubKeyHash': '6f', //m or n
        'scriptHash': 'c4', //3a=Q
        'urlPath':'LTCTEST/',
        "api": "https://chain.so/api/v2/"
      }
    }
  },
  "XRP": {
    "type": "90",
    "unit": 1000000,  // 6 zero
    "account": 1
  }
}


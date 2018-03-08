const ENV = require('rootCore/config/environment.js');
const apiconfig = require('rootCore/config/api.js');
const COINTYPE = require('rootCore/config/type.js');

exports.getTransactionCount = (fromAddress) => {
  const path = `eth_getTransactionCount&address=${fromAddress}`
  return etherscanRequest(path)
}

exports.estimateGasPrice = () => {
  const path = `eth_gasPrice`
  return etherscanRequest(path)
}

exports.sendTransaction = (txHex) => {
  const path = `eth_sendRawTransaction&hex=${txHex}`
  return etherscanRequest(path)
}

exports.getExchangeRate = () => {
  const path = `ethprice`
  const module = 'stats'
  return etherscanRequest(path, module)
}

exports.getTransactionInfo = (txHash) => {
  const path = `eth_getTransactionByHash&txhash=${txHash}`
  return etherscanRequest(path)
}

exports.getAddressesBalance = (addresses) => {
  const path = `balancemulti&address=${addresses}`
  const module = 'account'
  return etherscanRequest(path, module)
}

exports.getAddressTransaction = (address) => {
  const path = `txList&address=${address}&startblock=0&endblock=99999999`
  const module = 'account'
  return etherscanRequest(path, module)
}

const etherscanRequest = (path ,module = "proxy") => {
  const network = COINTYPE.ETH.network[ENV.ETH];
  const apiKeyIndex = Math.floor(Math.random() * Math.floor(apiconfig.API_KEY.length));
  const API_KEY = apiconfig.API_KEY[apiKeyIndex];
  const url = `${network.api}/api?module=${module}&action=${path}&tag=latest&apikey=${API_KEY}`
  console.log(`ETHERSCAN : ${url}`);
  return fetch(url).then((result) => {
    const bodyText = JSON.parse(result._bodyText)
    if(!!bodyText.error) {
      throw bodyText.error.message
    }
    return bodyText.result
  })
}

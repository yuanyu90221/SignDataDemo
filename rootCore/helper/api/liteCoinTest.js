const ENV = require('rootCore/config/environment.js');
const COINTYPE = require('rootCore/config/type.js');
const Promise = require('bluebird');

exports.getAddressesBalance = async (addresses) => {
  const api = `get_address_balance/`
  const parameter = `${addresses}`
  const {data} = await request("", api, parameter)
  const addressBalance = parseFloat(data.confirmed_balance) + parseFloat(data.unconfirmed_balance)
  return {addressBalance:addressBalance.toString(10)}
}

exports.getAddressTransaction = async (address) => {
  const api = `address/`
  const parameter = `${address}`
  const {data} = await request("", api, parameter)
  return {network:data.network,address:data.address,balance:data.balance,n_tx:data.total_txs,txs:data.txs}
}


exports.getTransactionFee = () => {
  const url = `https://api.blockcypher.com/v1/ltc/main`;
  return request(url)
}

exports.getExchangeRate = () => {
  const url =  `https://api.cryptonator.com/api/ticker/ltc-usd`
  return request(url)
}

exports.getUnspent = (address) => {
  const api = `get_tx_unspent/`
  const parameter = `${address}`
  return request("", api, parameter)
}

exports.sendTransaction = (txHex) => {
  const domain =   COINTYPE.LTC.network[ENV.LTC].api;
  let network = COINTYPE.LTC.network[ENV.LTC].urlPath
  const url = `${domain}send_tx/${network}`

  return fetch(url, {
    method: 'POST',
    headers: {
      // 'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded' //'application/json' //Main net
    },
    body: `tx_hex=${txHex}`
  })
    .then((response) => {
      console.log('sendTransaction result:' + JSON.stringify(response));
      const bodyText = JSON.parse(response._bodyText)
      if (response.ok == true) {
        return bodyText.data.txid;
      } else {
        throw bodyText
      }
    })
}

const request = async (urlPath, api, parameter) => {
  parameter = parameter || null;
  const domain = COINTYPE.LTC.network[ENV.LTC].api;
  let network = COINTYPE.LTC.network[ENV.LTC].urlPath
  if (parameter == null) {
    network = ""
  }
  const url = urlPath == "" ? `${domain}${api}${network}${parameter}` : urlPath;

  try {
    console.log(`Url:${url}`)
    await Promise.delay(1000);
    return fetch(url).then((result) => {
      //status 429: too many request.
      if (result.status == 429) {
        console.log('throw result Url:' + url)
        throw result._bodyText
      }
      const bodyText = JSON.parse(result._bodyText)
      console.log('LTC result:' + JSON.stringify(bodyText))
      return bodyText
    })
  } catch (e) {
    console.log(`request錯誤:${e}`)
  }
}


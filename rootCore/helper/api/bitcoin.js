const ENV = require('rootCore/config/environment.js');
const COINTYPE = require('rootCore/config/type.js');

exports.getTransactionFee = () => {

  const url = `https://bitcoinfees.earn.com/api/v1/fees/recommended`;
  return fetch(url).then((result) => {

    const bodyText = JSON.parse(result._bodyText)
    if (!!bodyText.error) {
      throw bodyText.error.message
    }
    return bodyText
  })
}

exports.getExchangeRate = () => {
  const url = `https://blockchain.info/ticker`
  console.log(`GOGOG BTC ExchangeRate:`+url)
  return fetch(url).then((result) => {
    const bodyText = JSON.parse(result._bodyText)
    if (!!bodyText.error) {
      throw bodyText.error.message
    }
    return bodyText
  })
}

exports.getAddressesBalance = (addresses) => {
  const path = `multiaddr?active=${addresses}`
  // const path = `rawaddr/${addresses}`

  return request(path)
}

exports.getAddressTransaction = (address) => {
  const path = `multiaddr?active=${address}`
  return request(path)
}

exports.getUnspent = (address) => {
  const path = `unspent?active=${address}&confirmations=1&limit=1000`
  return request(path)
}


exports.sendTransaction = (txHex) => {
  const network = COINTYPE.BTC.network[ENV.BTC];
  const url = `${network.api}pushtx?cors=true`

  return fetch(url, {
    method: 'POST',
    headers: {
      // 'Accept': 'application/json',
      'Content-Type': 'application/x-www-form-urlencoded' //'application/json' //Main net
    },
    body: `tx=${txHex}`
  })
    .then((response) => {
      console.log('sendTransaction result:' + JSON.stringify(response));
      if (response.status == 200) {
        return response._bodyText;
      } else {
        throw response._bodyText
      }
    })
}


const request = async (path) => {
  const network = COINTYPE.BTC.network[ENV.BTC];
  const url = `${network.api}${path}`
  console.log('BTC request Url:' + url)
  return fetch(url).then((result) => {
    const bodyText = JSON.parse(result._bodyText)
    if (!!bodyText.error) {
      throw bodyText.error.message
    }
    // console.log('request result:'+JSON.stringify(bodyText))
    return bodyText
  })
}


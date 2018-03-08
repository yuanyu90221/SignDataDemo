const ENV = require('rootCore/config/environment.js');
const COINTYPE = require('rootCore/config/type.js');
const Promise = require('bluebird');
const Util = require('rootCore/helper/util/index.js')
const bitcoinjs = require('rootCore/customlib/bitcoin.min.js');

exports.sendTransaction = (txHex) => {
  const domain = COINTYPE.LTC.network[ENV.LTC].api;
  const url = `${domain}txs/push`
  const pushtx = {
    tx: txHex
  };

  console.log('發送交易:' + url)
  return fetch(url, {
    method: 'POST',
    headers: {
      // 'Accept': 'application/json',
      'Content-Type': 'application/json' //'application/x-www-form-urlencoded'
    },
    body: JSON.stringify(pushtx)
  })
    .then((response) => {
      if (response.status == 200 || 201) {
        const bodyText = JSON.parse(response._bodyText)
        return bodyText.tx.hash;
      } else {
        throw bodyText
      }
    })
}

exports.getAddressTransaction = async (address) => {
  const api = `addrs/`
  const data = await request("", api, `${address}/full`)
  return data
}

// exports.getAddressTransactionFull = async (address) => {
//   const url = `https://api.blockcypher.com/v1/ltc/main/addrs/${address}/full`
//   return request(url)
// }

exports.getTransactionFee = () => {
  const url = `https://api.blockcypher.com/v1/ltc/main`;
  return request(url)
}

exports.getExchangeRate = () => {
  const url = `https://api.cryptonator.com/api/ticker/ltc-usd`
  return request(url)
}

exports.getAddressesBalance = async (addresses) => {
  const api = `addrs/`
  const {final_balance} = await request("", api, addresses)
  const addressBalance = Util.BTC.satoshiToBtc(final_balance)
  return {addressBalance: addressBalance.toString(10)}
}

exports.getUnspent = async (address) => {
  const api = `addrs/`
  const {txrefs} = await request("", api, `${address}?unspentOnly=true`)

  const unspents = await Promise.map(txrefs, async (unspent) => {
    let {tx_hash, tx_output_n, value} = unspent
    const script_hex = bitcoinjs.address.toOutputScript(address).toString('hex');
    value = Util.BTC.satoshiToBtc(value)

    return {txid: tx_hash, output_no: tx_output_n, value, script_hex}

  })

  return {data: {txs: unspents}}
}

const request = async (urlPath, api, parameter) => {

  const domain = COINTYPE.LTC.network[ENV.LTC].api;
  const url = urlPath == "" ? `${domain}${api}${parameter}` : urlPath;

  try {
    await Promise.delay(250);
    console.log('request Url:' + url)
    return fetch(url).then((result) => {
      // console.log('LTC result :' + JSON.stringify(result._bodyInit))
      if (result.status == 429) {//status 429: too many request.
        throw result._bodyInit
      }
      const bodyText = JSON.parse(result._bodyInit)
      return bodyText
    })
  } catch (e) {
    console.log(`request錯誤:${e}`)
  }
}


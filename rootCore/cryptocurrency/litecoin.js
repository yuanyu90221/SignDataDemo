const createHash = require('bitcoinjs-lib').crypto
const rlp = require('rootCore/customlib/rlp')
const bitcoinjs = require('rootCore/customlib/bitcoin.min.js');
const COINTYPE = require('rootCore/config/type.js');
const ENV = require('rootCore/config/environment.js');
const Promise = require('bluebird');
const API = require('rootCore/helper/api/index.js')
const Util = require('rootCore/helper/util/index.js');
const coinSelect = require('rootCore/customlib/coinselect.js');
const {AsyncStorage} = require('react-native');
const COMMAND = require('rootCore/config/command.js')
const Sign = require('../helper/sign.js')
let tx;

exports.prepareSignData = async (data) => {
  try {
    const {
      txFee,
      fromAddress,
      toAddress,
      changeAddress,
      amount,
      keyId
    } = data

    const specifiedFee = parseInt(Util.BTC.btcToSatoshi(txFee))
    const outAmount = parseInt(Util.BTC.btcToSatoshi(amount))

    const chain = COINTYPE.LTC.network[ENV.LTC].chain;
    const network = bitcoinjs.networks[chain]

    const allredeemScripts = await Promise.map(fromAddress, async (obj) => {
      const {address, keyId} = obj
      const {publicKey, chainCode} = await Util.OTHER.getKeyAndChainFromHDAccount(keyId);
      const derivation = Util.OTHER.derive(publicKey, chainCode, keyId);
      const pubKey = new Buffer(derivation, 'hex');
      let pubKeyHash = bitcoinjs.crypto.hash160(pubKey);
      let redeemScript = bitcoinjs.script.witnessPubKeyHash.output.encode(pubKeyHash)
      var redeemScriptHash = bitcoinjs.crypto.hash160(redeemScript)
      let scriptPubKey;

      if (COINTYPE.LTC.isSegwit) {
        scriptPubKey = bitcoinjs.script.scriptHash.output.encode(redeemScriptHash)
      } else {
        scriptPubKey = Buffer.from('76a9143a3b1d60c56a659b6ff75a4f2813c273d419866d88ac', 'hex')//bitcoin.script.pubkeyhash.output.encode(pubKeyHash)//a9143a3b1d60c56a659b6ff75a4f2813c273d419866d87
      }

      console.log(`pubKey:${pubKey.toString('hex')}`)
      console.log(`pubKeyHash:${pubKeyHash.toString('hex')}`)
      console.log(`redeemScript:${redeemScript.toString('hex')}`)
      console.log('redeemScriptHash:' + redeemScriptHash.toString('hex'))
      console.log('scriptPubKey:' + scriptPubKey.toString('hex'))

      return {keyId, pubKey, redeemScript, scriptPubKey}
    });

    const {medium_fee_per_kb} = await API.LTC.getTransactionFee()//satoshis per kb
    const feeRate = Util.BTC.fee_per_byte(medium_fee_per_kb)

    const allUtxos = await Promise.map(fromAddress, async (a) => {
      const {address} = a;
      const unspent_outputs = await API.LTC.getUnspent(address)

      const utxos = await Promise.map(unspent_outputs.data.txs, async (unspent) => {
        const scriptIndex = allredeemScripts.findIndex((obj) => {
          return obj.scriptPubKey.toString('hex') == unspent.script_hex
        });

        let utxo
        const value = parseInt(Util.BTC.btcToSatoshi(unspent.value))
        utxo = {
          txId: unspent.txid,// tx hash is in reverse byte order.
          vout: unspent.output_no,
          value: value,
          script: unspent.script_hex,
          redeemScript: allredeemScripts[scriptIndex].redeemScript.toString('hex'),
          publicKey: allredeemScripts[scriptIndex].pubKey.toString('hex'),
          keyId: allredeemScripts[scriptIndex].keyId
        }

        return utxo
      });

      let message = [].concat(...utxos);
      return message

    }, {concurrency: 1});

    const unspent = [].concat(...allUtxos);//合併array

    let targets = [
      {
        address: toAddress,
        value: outAmount //type need to be number
      }
    ]


    let {inputs, outputs, fee} = coinSelect(unspent, targets, feeRate, specifiedFee)//feeRate.halfHourFee

    /** the accumulated fee is always returned for analysis
     .inputs and .outputs will be undefined if no solution was found*/

    if (!inputs || !outputs) return

    console.log('inputs筆數:' + inputs.length);
    console.log('outputs筆數:' + outputs.length + " ;Recipient" + JSON.stringify(outputs[0]), 'change:' + JSON.stringify(outputs[1]));

    tx = new bitcoinjs.TransactionBuilder(network)

    inputs.forEach(input => {
      tx.addInput(input.txId, input.vout)
    });
    // console.log(JSON.stringify('inputs:'+inputs));

    outputs.forEach(output => {
      /**
       * watch out, outputs may have been added that you need to provide an output address、script for
       */
      if (!output.address) {
        output.address = changeAddress
        console.log("找零地址：" + output.address);
      }
      tx.addOutput(output.address, output.value)

    });

    const message = await Promise.map(inputs, async (input, i) => {
      let signDataHex = {}

      if (COINTYPE.BTC.isSegwit) {
        signDataHex = tx.prepareSignData(i, new Buffer(input.publicKey, 'hex'), new Buffer(input.redeemScript, 'hex'), null, input.value);//for p2sh
      } else {
        signDataHex = tx.prepareSignData(i, new Buffer(input.publicKey, 'hex'), null, bitcoinjs.Transaction.SIGHASH_ANYONECANPAY); //for p2pkh
      }

      signDataHex.publicKey = input.publicKey;
      signDataHex.keyId = input.keyId

      return signDataHex
    })

    return {signData: message, txFee: Util.BTC.satoshiToBtc(fee)}

  } catch (err) {
    console.log('PREPARE_SIGN_DATA錯誤: ' + err);
    throw err;
  }

}


exports.transactionPrepare = async (readType, keyId, payloadArr) => {
  try {

    const tempMessage = await Promise.map(payloadArr, async (obj, i) => {
      const {signatureHash, txouts, publicKey, keyId} = obj;
      const payload = '0x' + signatureHash.toString('hex');
      const signData = '0x' + createHash.hash256(Buffer.from(signatureHash, 'hex')).toString('hex');
      const inputId = '0x' + Util.OTHER.fitZero(i.toString(10), 2, "0", true);
      const readtype = '0x' + (COINTYPE.LTC.isSegwit ? '02' : '00')
      const keyid = '0x' + keyId

      // console.log('isSegwit:' + COINTYPE.LTC.isSegwit)
      // console.log('inputId:' + inputId)
      // console.log('signData:' + signData)
      // console.log('readType:' + readtype)
      // console.log('keyId:' + keyid)
      // console.log('payload:' + payload)

      let d = [];

      d.push(inputId, signData, readtype, keyid, payload);
      const encodedTx = rlp.encode(d)

      const appKey = await AsyncStorage.getItem('appPrivKey')
      const {TX_PREPARE} = COMMAND
      let P2 = COINTYPE.LTC.P2
      const command = TX_PREPARE.CLA + TX_PREPARE.INS + '03' + P2;
      const signatureParams = command + encodedTx.toString('hex')
      const signature = Sign.sign(Buffer.from(signatureParams, 'hex'), appKey)
      let cmd = [];
      let P1;


      if (txouts != '') {//segwit
        console.log('走segwit')
        P1 = (COINTYPE.LTC.isSegwit ? '04' : '00');
        cmd.push({'encodedTx': txouts, P1, P2, publicKey})
      }

      P1 = "02";
      cmd.push({'encodedTx': signature.toString('hex'), P1, P2, publicKey})
      P1 = "03";
      cmd.push({'encodedTx': encodedTx.toString('hex'), P1, P2, publicKey})

      return cmd;
    });

    let message = [].concat(...tempMessage);

    message.forEach((m) => {
      console.log('指令:' + JSON.stringify(m))
    })

    return message;

  } catch (e) {
    console.log(`Error : ` + e);
    throw "Litecoin Transaction Prepare Failed:" + e;
  }
}


exports.generateRawTx = async (encryptedSignatureArray, signatureKey, rawTransaction, keyId) => {

  try {
    // [{encryptedSignature,publicKey},]=encryptedSignatureArray
    let SIGN_HASH_ALL
    if (COINTYPE.LTC.isSegwit) {
      SIGN_HASH_ALL = "01"
    } else {
      SIGN_HASH_ALL = "81"
    }

    await Promise.map(encryptedSignatureArray, (sig, i) => {
      const {encryptedSignature, publicKey} = sig
      let iv = Buffer.alloc(16);
      iv.fill(0);
      let DERsignature = Sign.aes256CbcDecrypt(iv, Buffer.from(signatureKey, 'hex'), encryptedSignature);
      // const signature = DERsignature.toString('hex') + SIGN_HASH_ALL
      /**
       * canonicalise the signature
       */
        // DERsignature = '3046022100fd16a6a5b5b1978c86eeedcde53b4f6077abc866783ea188fdf76f56dd04fb88022100ff7b65e42d2fed08423bd89bfed6cad5e0dd4264791ad00167a28dc6fde6dcbb'
      let btc_sig = Sign.parseDERsignature(DERsignature.toString('hex'));
      // let btc_sig = Sign.parseDERsignature(DERsignature);
      let canonicalSignature = Sign.getCanonicalSignature(btc_sig);
      const derCanonicalSignature = Sign.convertToDER(canonicalSignature) + SIGN_HASH_ALL
      //將signature塞到相應的input
      tx.inputSignature(i, new Buffer(publicKey, 'hex'), derCanonicalSignature);
    })
    const serialized_tx = tx.build()
    console.log(`serialized_tx : ${serialized_tx.toHex()}`);
    return serialized_tx.toHex()

  } catch (e) {
    throw "Bitcoin Generate Transaction Failed" + e;
  }
}


exports.getUnspent = async (data) => {

  const {fromAddress} = data
  const allUtxos = await Promise.map(fromAddress, async (a) => {
    let address = a;

    const unspent_outputs = await API.LTC.getUnspent(address)
    const utxosByAddr = await Promise.map(unspent_outputs.data.txs, (utxo) => {
      let {
        txid,
        output_no,
        value,
        script_hex
      } = utxo
      value = Util.BTC.btcToSatoshi(value)
      console.log('getUnspent結果：' + address + "---" + JSON.stringify(utxo))

      return {address: address, txId: txid, output_no: output_no.toString(10), value, script_hex};
    });

    let message = [].concat(...utxosByAddr);
    return message
  }, {concurrency: 2})

  const utxos = [].concat(...allUtxos);

  return utxos
}

exports.getCalculatingFee = async (data) => {
  try {
    let {utxos, amount, feeRate} = data
    const outAmount = parseInt(Util.BTC.btcToSatoshi(amount))
    const calculatingOut = COINTYPE.BTC.calculatingOut;
    let targets = [
      {
        address: calculatingOut,
        value: outAmount
      }
    ]

    const unspents = await Promise.map(utxos, async (utxo) => {
      const {txId, output_no, value, script_hex} = utxo
      return {txId, vout: parseInt(output_no), value:parseInt(value), script: script_hex}
    })

    const feePerByte = Util.BTC.btcToSatoshi(feeRate)

    let {fee} = coinSelect(unspents, targets, parseInt(feePerByte), 0)
    return fee;
  } catch (e) {
    throw "LiteCoin failed to calculate fee:" + e;
  }
}


exports.pubKeyToAddress = (addressKey) => {
  try {
    const chain = COINTYPE.LTC.network[ENV.LTC].chain;
    let address;
    const network = bitcoinjs.networks[chain]

    if (COINTYPE.BTC.isSegwit) {
      var redeemScript = bitcoinjs.script.witnessPubKeyHash.output.encode(bitcoinjs.crypto.hash160(Buffer.from(addressKey, 'hex')))//(pubKey))
      var scriptPubKey = bitcoinjs.script.scriptHash.output.encode(bitcoinjs.crypto.hash160(redeemScript))
      address = bitcoinjs.address.fromOutputScript(scriptPubKey, network)
    } else {
      // //p2pkh
      const publicKey = Buffer.from(addressKey, 'hex')
      address = bitcoinjs.ECPair.fromPublicKeyBuffer(publicKey, network).getAddress();
    }
    console.log('LTC產生地址：'+ address)

    return address;
  } catch (e) {
    throw "Litecoin public key to address failed：" + e;
  }
}


exports.getTransactionHistory = async (addresses) => {
  try {

    const allTxsHistory = await Promise.map(addresses, async (address) => {
      const transactionByAddress = await API.LTC.getAddressTransaction(address)

      const txsByAddress = await  Promise.map(transactionByAddress.txs, async (tx) => {
        const {hash, fees, received, inputs, outputs, confirmations} = tx

        let from = inputs[0].addresses[0]
        let to = outputs[0].addresses[0]
        let value = outputs[0].value.toString(10)

        //2018-01-19T04:05:53Z
        const time = Date.parse(received).toString(10)
        const iniTime = time.substring(0, time.length - 3)
        return {
          txId: hash,
          from,
          to,
          txFee: Util.BTC.satoshiToBtc(fees),
          confirmations: confirmations.toString(10),
          timeStamp: iniTime,
          value: Util.BTC.satoshiToBtc(value)
        }
      })

      // console.log('交易歷史紀錄：' + JSON.stringify(txsByAddress))
      return {address, txHistory: txsByAddress}
    }, {concurrency: 1});

    return allTxsHistory;

  } catch (e) {
    console.log("getTransactionHistory error:" + e)
    throw e
  }

}


exports.getTransactionHistoryTestNet = async (addresses) => {
  try {

    const allTxsHistory = await Promise.map(addresses, async (address) => {
      const data = await API.LTC.getAddressTransaction(address)

      const txsByAddress = await  Promise.map(data.txs, async (tx) => {
        const {txid, confirmations, time, outgoing, incoming} = tx

        let inputAmount = 0;
        let outputAmount = 0;
        let from
        let to

        if (typeof incoming != "undefined") {
          //代表有receive
          from = incoming.inputs[0].address
          to = address
          outputAmount = incoming.value;
        }

        if (typeof outgoing != "undefined") {
          //代表有send
          from = address
          to = outgoing.outputs[0].address
          outputAmount = outgoing.outputs[0].value
        }

        return {
          txId: txid,
          from,
          to,
          txFee: "0",
          confirmations: confirmations.toString(10),
          timeStamp: time.toString(10),
          value: outputAmount.toString(10),
          address
        }
      })
      const txs = [].concat(...txsByAddress);
      // return {address,txHistory}
      return txs
    }, {concurrency: 1});

    let message = [].concat(...allTxsHistory);

    const filterTxs = message.filter((elem, index, arr) => {
      return index === arr.findIndex((t) => {
        return t.txId === elem.txId;
      })
    })

    const filterAllTxsHistory = await Promise.map(addresses, (address) => {

      const txHistory = filterTxs.filter((elem) => {
        return elem.address === address
      })

      return {address, txHistory}
    });

    return filterAllTxsHistory;

  } catch (e) {
    console.log("getTransactionHistoryTestnet error:" + e)
    throw e
  }

}

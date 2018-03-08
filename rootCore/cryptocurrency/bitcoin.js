const createHash = require('bitcoinjs-lib').crypto
const rlp = require('rootCore/customlib/rlp')
const bitcoinjs = require('rootCore/customlib/bitcoin.min.js');
const API = require('rootCore/helper/api/index.js')
// const coinSelect = require('coinselect')
const coinSelect = require('rootCore/customlib/coinselect.js');
const ENV = require('rootCore/config/environment.js');
const COINTYPE = require('rootCore/config/type.js');
const Sign = require('../helper/sign.js')
const {AsyncStorage} = require('react-native');
const COMMAND = require('rootCore/config/command.js')
const Util = require('rootCore/helper/util/index.js');
const Promise = require('bluebird');
let tx;

exports.pubKeyToAddress = (addressKey) => {
  try {
    const chain = COINTYPE.BTC.network[ENV.BTC].chain;
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
    console.log('BTC產生地址：' + address)
    return address;
  } catch (e) {
    throw "Bitcoin public key to address failed：" + e;
  }
}

exports.prepareSignData = async (data) => {
  try {
    console.log('開始prepareSignData:' + JSON.stringify(data))
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

    const chain = COINTYPE.BTC.network[ENV.BTC].chain;
    const network = bitcoinjs.networks[chain]

    const allAddresses = await Promise.map(fromAddress, async (obj) => {
      return obj.address
    });
    const queryAddress = allAddresses.join("|")

    const allredeemScripts = await Promise.map(fromAddress, async (obj) => {
      const {keyId} = obj
      const {publicKey, chainCode} = await Util.OTHER.getKeyAndChainFromHDAccount(keyId);
      const derivation = Util.OTHER.derive(publicKey, chainCode, keyId);
      const pubKey = new Buffer(derivation, 'hex');
      let pubKeyHash = bitcoinjs.crypto.hash160(pubKey);
      let redeemScript = bitcoinjs.script.witnessPubKeyHash.output.encode(pubKeyHash)
      var redeemScriptHash = bitcoinjs.crypto.hash160(redeemScript)
      let scriptPubKey;

      if (COINTYPE.BTC.isSegwit) {
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
    console.log(`redeemScript array:${allredeemScripts[0].redeemScript.toString('hex')}`, allredeemScripts[0].pubKey.toString('hex'))

    const feeRate = await API.BTC.getTransactionFee()//satoshis per byte
    console.log(`開始交易 feeRate:${JSON.stringify(feeRate)}`);

    const {notice, unspent_outputs} = await API.BTC.getUnspent(queryAddress)
    if (unspent_outputs.length == 0) {
      throw  {status: 'insufficient', message: notice}
    }

    const utxoValue = await Promise.reduce(unspent_outputs, (pre, cur) => {
      return pre + cur.value
    }, 0);

    const utxoBtc = Util.BTC.satoshiToBtc(utxoValue)
    if (utxoBtc < amount) {
      throw  {status: 'insufficient', message: 'Some funds are pending confirmation and cannot be spent yet'}
    }

    const utxos = await Promise.map(unspent_outputs, async (unspent) => {

      const scriptIndex = allredeemScripts.findIndex((obj) => {
        return obj.scriptPubKey.toString('hex') == unspent.script
      });

      console.log('index:' + scriptIndex)
      let utxo

      utxo = {
        txId: unspent.tx_hash_big_endian,// tx hash is in reverse byte order.
        vout: unspent.tx_output_n,
        value: unspent.value,
        script: unspent.script,
        redeemScript: allredeemScripts[scriptIndex].redeemScript.toString('hex'),
        publicKey: allredeemScripts[scriptIndex].pubKey.toString('hex'),
        keyId: allredeemScripts[scriptIndex].keyId
      }

      return utxo
    });

    let targets = [
      {
        address: toAddress,
        value: outAmount //type need to be number
      }
    ]

    let {inputs, outputs, fee} = coinSelect(utxos, targets, feeRate.halfHourFee, specifiedFee)//feeRate.halfHourFee


    /** the accumulated fee is always returned for analysis
     .inputs and .outputs will be undefined if no solution was found*/

    if (!inputs || !outputs) return

    console.log('inputs筆數:' + inputs.length);
    console.log('outputs筆數:' + outputs.length + " ;Recipient" + JSON.stringify(outputs[0]), 'change:' + JSON.stringify(outputs[1]));

    tx = new bitcoinjs.TransactionBuilder(network)

    inputs.forEach(input => {
      console.log("這裡是input：" + input.txId, input.vout);
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

      console.log('fee:' + fee, 'signData ' + parseInt(i + 1) + "筆:" + JSON.stringify(signDataHex));

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
      const readtype = '0x' + (COINTYPE.BTC.isSegwit ? '01' : '00')
      const keyid = '0x' + keyId

      console.log('isSegwit:' + COINTYPE.BTC.isSegwit)
      console.log('inputId:' + inputId)
      console.log('signData:' + signData)
      console.log('readType:' + readtype)
      console.log('keyId:' + keyid)
      console.log('payload:' + payload)

      let d = [];

      d.push(inputId, signData, readtype, keyid, payload);
      const encodedTx = rlp.encode(d)

      console.log('RLP encodedTx:' + encodedTx.toString('hex'));
      const appKey = await AsyncStorage.getItem('appPrivKey')
      const {TX_PREPARE} = COMMAND
      let P2 = COINTYPE.BTC.P2
      const command = TX_PREPARE.CLA + TX_PREPARE.INS + '03' + P2;
      const signatureParams = command + encodedTx.toString('hex')
      const signature = Sign.sign(Buffer.from(signatureParams, 'hex'), appKey)
      let cmd = [];
      let P1;

      console.log('txOuts:' + txouts)

      if (txouts != '') {//segwit
        console.log('走segwit')
        P1 = (COINTYPE.BTC.isSegwit ? '01' : '00');
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
    throw "Bitcoin Transaction Prepare Failed:" + e;
  }
}

exports.generateRawTx = async (encryptedSignatureArray, signatureKey, rawTransaction, keyId) => {

  try {
    // [{encryptedSignature,publicKey},]=encryptedSignatureArray
    let SIGN_HASH_ALL
    if (COINTYPE.BTC.isSegwit) {
      SIGN_HASH_ALL = "01"
    } else {
      SIGN_HASH_ALL = "81"
    }

    await Promise.map(encryptedSignatureArray, (sig, i) => {
      const {encryptedSignature, publicKey} = sig
      let iv = Buffer.alloc(16);
      iv.fill(0);
      const DERsignature = Sign.aes256CbcDecrypt(iv, Buffer.from(signatureKey, 'hex'), encryptedSignature);
      // const signature = DERsignature.toString('hex') + SIGN_HASH_ALL
      /**
       * canonicalise the signature
       */
      let btc_sig = Sign.parseDERsignature(DERsignature.toString('hex'));
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
  try {
    const {fromAddress} = data
    const allAddress = fromAddress.join('|');
    const {unspent_outputs} = await API.BTC.getUnspent(allAddress)

    const utxos = await Promise.map(unspent_outputs, (utxo) => {

      return {
        address: "",
        txId: utxo.tx_hash_big_endian,
        output_no: utxo.tx_output_n.toString(10),
        value: utxo.value.toString(10),
        script_hex: ""
      }
    })

    return utxos
  } catch (e) {
    throw "BitCoin failed to get unspent:" + e;
  }
}


exports.getCalculatingFee = async (data) => {
  let {utxos, amount, feeRate, isMax} = data //const
  isMax = true
  try {
    const outAmount = parseInt(Util.BTC.btcToSatoshi(amount))
    const calculatingOut = COINTYPE.BTC.calculatingOut;
    let targets = [
      {
        address: calculatingOut,
        value: outAmount
      }
    ]

    const feePerByte = Util.BTC.btcToSatoshi(feeRate)
    let {fee} = coinSelect(utxos, targets, parseInt(feePerByte), 0,isMax)

    return fee;

  } catch (e) {
    throw "BitCoin failed to calculate fee:" + e;
  }
}


exports.getTransactionHistory = async (addresses) => {
  try {
    let allBtcTxHistory = await Promise.map(addresses, (address) => {
      return {address, txHistory: []};
    });

    const allAddress = addresses.join('|');
    const getTransactions = await API.BTC.getAddressTransaction(allAddress);
    const latest_block = getTransactions.info.latest_block.height
    const txArray = await Promise.map(getTransactions.txs, async (rawTx) => {
      let {
        hash,
        inputs,
        out,
        fee,
        time,
        block_height
      } = rawTx
      const from = inputs[0].prev_out.addr
      const to = out[0].addr

      const inputAmount = out[0].value
      const outputAmount = out[0].value
      let txFee = fee.toString(10)
      txFee = Util.BTC.satoshiToBtc(txFee)
      const timeStamp = time.toString(10)
      //API doesn't return block_height if tx is unconfirmed
      let confirmations
      if (block_height == null) {
        confirmations = "0"
      } else {
        confirmations = (latest_block - block_height + 1).toString(10)
      }
      return {
        txId: hash,
        from,
        to,
        txFee,
        confirmations,
        timeStamp,
        inputAmount: inputAmount + parseInt(txFee),
        outputAmount
      };

    });

    await Promise.map(txArray, (tx) => {
      const indexInput = addresses.indexOf(tx.from);
      if (indexInput >= 0) {
        tx.value = Util.BTC.satoshiToBtc(tx.inputAmount)
        allBtcTxHistory[indexInput].txHistory.push(tx)
      }
      const indexOut = addresses.indexOf(tx.to);
      if (indexOut >= 0) {
        tx.value = Util.BTC.satoshiToBtc(tx.outputAmount)
        allBtcTxHistory[indexOut].txHistory.push(tx)
      }
    })
    return allBtcTxHistory
  } catch (e) {
    return e
  }
}

const {AsyncStorage} = require('react-native');
const Promise = require('bluebird');
const InformNative = require('rootCore/helper/informNative.js');
const Util = require('rootCore/helper/util/index.js')
const API = require('rootCore/helper/api/index.js')
const APDU = require('rootCore/helper/apdu/index.js');
const Sign = require('rootCore/helper/sign.js')
const COINTYPE = require('rootCore/config/type.js')
const COMMAND = require('rootCore/config/command.js')
const {APDUCONFIG} = require('rootCore/config/index.js');
const {RESPONSE} = APDUCONFIG;
const {ethereumUtil, rippleUtil, bitcoinUtil, litecoinUtil} = require('rootCore/cryptocurrency');

exports.getExchangeRate = async (data) => {
  try {
    const allCoinRate = await Promise.map(data, async (coinType) => {
      let rate;
      if (coinType == COINTYPE.ETH.type) {
        const ethRate = await API.ETH.getExchangeRate();
        rate = ethRate.ethusd;
      } else if (coinType == COINTYPE.BTC.type) {
        const btcRate = await API.BTC.getExchangeRate();
        rate = btcRate.USD.last.toString(10);
      } else if (coinType == COINTYPE.XRP.type) {
        rate = await API.XRP.getExchangeRate();
      } else if (coinType == COINTYPE.LTC.type) {
        const {ticker} = await API.LTC.getExchangeRate();
        rate = ticker.price;
      }
      return {coinType, rate};
    });
    console.log(`allCoinRate : ${JSON.stringify(allCoinRate)}`);

    return {status: 'success', message: allCoinRate}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.getUnspent = async (data) => {
  try {
    const {readType, fromAddress} = data
    let utxos
    switch (readType) {
      case  COINTYPE.BTC.type:
        utxos = await bitcoinUtil.getUnspent(data)
        return {status: 'success', message: utxos}
        break;
      case  COINTYPE.LTC.type:
        utxos = await litecoinUtil.getUnspent(data)
        return {status: 'success', message: utxos}
        break;
      default:
    }
    return {status: 'success', message: utxos}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.getCalculatingFee = async (data) => {
  try {
    const readType = data.readType
    let txFee = 0
    switch (readType) {
      case  COINTYPE.BTC.type:
        const calculatingFee = await bitcoinUtil.getCalculatingFee(data)
        txFee = Util.BTC.satoshiToBtc(calculatingFee)
        return {status: 'success', message: txFee}
        break;
      case  COINTYPE.LTC.type:
        const ltcCalculatingFee = await litecoinUtil.getCalculatingFee(data)
        txFee = Util.BTC.satoshiToBtc(ltcCalculatingFee)
        return {status: 'success', message: txFee}
        break;
      default:
    }
    return {status: 'success', message: txFee}
  } catch (e) {
    return {status: 'failed', message: e}
  }

}

exports.checkTransactionFee = async (readType) => {
  try {
    let txFee;
    if (readType == COINTYPE.ETH.type) {
      const rawGas = await API.ETH.estimateGasPrice()
      let gasPrice = rawGas.replace('0x', '')
      gasPrice = fitZero(gasPrice)
      txFee = Util.ETH.calculateFee(gasPrice);
    } else if (readType == COINTYPE.XRP.type) {
      txFee = await API.XRP.getTransactionFee()
    } else if (readType == COINTYPE.BTC.type) {
      const {fastestFee, halfHourFee, hourFee} = await API.BTC.getTransactionFee()
      // const fees = Util.BTC.calculateEstimateFees(halfHourFee)
      txFee = Util.BTC.satoshiToBtc(halfHourFee)
    } else if (readType == COINTYPE.LTC.type) {
      const {medium_fee_per_kb} = await API.LTC.getTransactionFee()
      const feeRate = Util.BTC.fee_per_byte(medium_fee_per_kb)
      // const fees = Util.BTC.calculateEstimateFees(feeRate)
      console.log('checkTransactionFee medium_fee_per_kb:' + medium_fee_per_kb, "feeRate:" + feeRate)
      txFee = Util.BTC.satoshiToBtc(feeRate)
    }

    return {status: 'success', message: txFee}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.getTransactionInfo = async (readType, txHash) => {
  try {
    let result = ''
    if (readType == COINTYPE.ETH.type) {
      result = await API.ETH.getTransactionInfo(txHash)
    } else {
      result = 'Cointype not supported yet'
    }

    return {status: 'success', message: result}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.prepareSignData = async (paymentInfo) => {
  try {
    const readType = paymentInfo.readType
    // const coinType = paymentInfo.keyId.slice(0, 2);
    let message = [];
    let coinFee = '';
    if (readType == COINTYPE.ETH.type) {
      const { signData, txFee } = await ethereumUtil.prepareSignData(paymentInfo);
      coinFee = txFee;
      message.push(signData);
    } else if (readType == COINTYPE.XRP.type) {
      const { signData, txFee } = await rippleUtil.prepareSignData(paymentInfo);
      coinFee = txFee;
      message.push(signData);
    } else if (readType == COINTYPE.BTC.type) {
      const { signData, txFee } = await bitcoinUtil.prepareSignData(paymentInfo);
      coinFee = txFee;
      message = [...signData];
    } else if (readType == COINTYPE.LTC.type) {
      const { signData, txFee } = await litecoinUtil.prepareSignData(paymentInfo);
      coinFee = txFee;
      message = [...signData];
    }

    await AsyncStorage.setItem('signedData', JSON.stringify(message));
    return {status: 'success', message: coinFee}
  } catch (e) {
    if (e.status == 'insufficient') {
      return e;
    }
    return {status: 'failed', message: e}
  }
}

exports.doTransaction = async (params) => {
  try {
    const {coinType, inputsInfo} = params;
    const appId = await AsyncStorage.getItem('appId');
    await APDU.Other.sayHi(appId);

    let signData = await AsyncStorage.getItem('signedData');
    console.log(`TX PREPARE SIGN DATA : ${signData}`);
    signData = JSON.parse(signData);

    const encryptedSignature = await txPrepare(coinType, inputsInfo, signData);
    console.log(`encryptedSignature : ${encryptedSignature}`);

    await APDU.Transaction.finishPrepare()
    await InformNative.transactionPrepareComplete();

    Util.OTHER.triggerCancelAPDUTimeout(30000)
      .then(() => {
        return {status: 'canceled', message: ''};
      });

    const txDetailResponse = await APDU.Transaction.getTxDetail();
    Util.OTHER.clearCancelAPDUTimeout();
    if (txDetailResponse.status == RESPONSE.CANCELED) {
      return {status: 'canceled', message: ''};
    }
    await InformNative.transactionAuthorize();

    const signKeyResponse = await APDU.Transaction.getSignatureKey();
    const signatureKey = signKeyResponse.outputData;
    console.log(`SIGNATURE KEY : ${signatureKey}`);

    await APDU.Transaction.clearTransaction()
    await APDU.Other.closePower();

    const fullTransaction = await generateRawTx(coinType, encryptedSignature, signatureKey, signData, inputsInfo);
    console.log(`Full TRANSACTION : ${fullTransaction}`);
    let result
    switch (coinType) {
      case COINTYPE.ETH.type:
        result = await API.ETH.sendTransaction(fullTransaction)
        break;

      case COINTYPE.BTC.type:
        result = await API.BTC.sendTransaction(fullTransaction)
        break;

      case COINTYPE.XRP.type:
        result = await API.XRP.sendTransaction(fullTransaction)
        break;

      case  COINTYPE.LTC.type:
        console.log('發送資料：' + fullTransaction)
        result = await API.LTC.sendTransaction(fullTransaction)
        break;

      default:
    }
    console.log(`Send Transaction : ${result}`);

    return {status: 'success', message: result}

  } catch (e) {
    Util.OTHER.clearCancelAPDUTimeout();
    const errMsg = (typeof e != 'string') ? JSON.stringify(e) : e
    return {status: 'failed', message: errMsg}
  }
}

const txPrepare = async (coinType, inputsInfo, payloadArr) => {
  try {
    const data = [];
    let encodedTransaction = [];

    if (coinType == COINTYPE.ETH.type) {
      const output = ethereumUtil.transactionPrepare(coinType, inputsInfo, payloadArr);
      encodedTransaction.push(output);
    } else if (coinType == COINTYPE.BTC.type) {
      const output = await bitcoinUtil.transactionPrepare(coinType, inputsInfo, payloadArr);
      encodedTransaction = [...output];
    } else if (coinType == COINTYPE.XRP.type) {
      const output = await rippleUtil.transactionPrepare(coinType, inputsInfo, payloadArr);
      encodedTransaction.push(output);
    } else if (coinType == COINTYPE.LTC.type) {
      const output = await litecoinUtil.transactionPrepare(coinType, inputsInfo, payloadArr);
      encodedTransaction = [...output];
    }
    console.log(`ENCODED TRANSACTION : ${JSON.stringify(encodedTransaction)}`)
    for (const transaction of encodedTransaction) {
      const sig = await signTxPrepare(transaction);
      if (sig.encryptedSignature != '' && sig.encryptedSignature != null) {
        data.push(sig);
      }
    }

    return data;
  } catch (e) {
    throw e;
  }
}

const generateRawTx = async (coinType, encryptedSignatureArray, signatureKey, rawTransaction, inputsInfo) => {
  try {
    let serializedTransaction;
    if (coinType == COINTYPE.ETH.type) {
      serializedTransaction = await ethereumUtil.generateRawTx(encryptedSignatureArray, signatureKey, rawTransaction, inputsInfo);
    } else if (coinType == COINTYPE.BTC.type) {
      serializedTransaction = await bitcoinUtil.generateRawTx(encryptedSignatureArray, signatureKey, rawTransaction, inputsInfo);
    } else if (coinType == COINTYPE.XRP.type) {
      serializedTransaction = await rippleUtil.generateRawTx(encryptedSignatureArray, signatureKey, rawTransaction, inputsInfo);
    } else if (coinType == COINTYPE.LTC.type) {
      serializedTransaction = await litecoinUtil.generateRawTx(encryptedSignatureArray, signatureKey, rawTransaction, inputsInfo);
    }

    return serializedTransaction;
  } catch (e) {
    throw e;
  }
}

const signTxPrepare = async (data) => {
  console.log('signTxPrepare:' + JSON.stringify(data))
  const {encodedTx, P1, P2, publicKey} = data;
  let result = encodedTx.toString('hex')
  if (P1 == '00') {
    const appKey = await AsyncStorage.getItem('appPrivKey')
    const {TX_PREPARE} = COMMAND
    const command = TX_PREPARE.CLA + TX_PREPARE.INS + P1 + P2;
    const signatureParams = command + encodedTx.toString('hex')
    const signature = Sign.sign(Buffer.from(signatureParams, 'hex'), appKey)
    console.log(`Signature :${signature.toString('hex')}`);
    result = result + signature.toString('hex')
  }

  const {outputData} = await APDU.Transaction.prepTx(result, P1, P2);

  return {encryptedSignature: outputData, publicKey};
}

const fitZero = (data) => {
  let temp = data
  if ((temp.length % 2) != 0) {
    temp = `0${temp}`
  }
  return temp
}

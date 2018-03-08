const crypto = require('rootCore/customlib/crypto.js');
const codec = require('rootCore/customlib/ripplecodec.js');
const RIPEMD160 = require('ripemd160');
const Promise = require('bluebird');
const R = require('ramda');
const rlp = require('rootCore/customlib/rlp');
const API = require('rootCore/helper/api/index.js');
const Util = require('rootCore/helper/util/index.js');
const Sign = require('rootCore/helper/sign.js');
const COINTYPE = require('rootCore/config/type.js');
const ENV = require('rootCore/config/environment.js');

exports.pubKeyToAddress = (addressKey) => {
  try {
    const R_B58_DICT = 'rpshnaf39wBUDNEGHJKLM4PQRST7VWXYZ2bcdeCg65jkm8oFqi1tuvAxyz'
    const base58 = require('base-x')(R_B58_DICT)
    const sha256 = createHash('sha256');
    const toHexBuffer = toBuffer('hex');
    const addressTypePrefix = toHexBuffer('00');
    const accountId = R.compose(ripemd, sha256, toHexBuffer)(addressKey);
    const payload = bufferConcat(addressTypePrefix, accountId);
    const checksum = R.compose(R.slice(0, 4), sha256, sha256)(payload);
    const dataToEncode = bufferConcat(payload, checksum);

    return base58.encode(dataToEncode);
  } catch (e) {
    throw "Ripple public key to address failed";
  }
}

exports.prepareSignData = async (paymentInfo) => {
  try {
    const {
      amount,
      fromAddress,
      toAddress,
      keyId,
      txFee,
      destinationTag
    } = paymentInfo;

    const dropsAmount = Util.XRP.xrpToDrops(amount);
    const dropsFee = Util.XRP.xrpToDrops(txFee);
    const dropsXRP = Util.XRP.dropsToXRP(dropsFee);
    const { publicKey, chainCode } = await Util.OTHER.getKeyAndChainFromHDAccount(keyId);
    const signingPubKey = Util.OTHER.derive(publicKey, chainCode, keyId).toUpperCase();
    const lastLedgerSequence = await R.composeP(R.add(60), API.XRP.getLastLedgerSequence)();
    const { sequence } = await API.XRP.getAccountInfo(fromAddress);
    const destTag = destinationTag || 0;

    const XRPTransaction = {
      TransactionType: 'Payment', //
      Flags: 2147483648,
      Sequence: sequence,
      DestinationTag: destTag,
      LastLedgerSequence: lastLedgerSequence,
      Amount: dropsAmount,
      Fee: dropsFee,
      SigningPubKey: signingPubKey,
      Account: fromAddress,
      Destination: toAddress
    }
    const signData = codec.encodeForSigning(XRPTransaction);
    console.log(`Binary : ${signData}`);
    return { signData, txFee: dropsXRP };
  } catch (e) {
    throw "Ripple Prepare sign data failed :" + e;
  }
}

exports.transactionPrepare = async (coinType, inputsInfo, payloadArr) => {
  try {
    console.log(`payload : ${payloadArr[0]}`);
    const payload = Buffer.from(payloadArr[0], 'hex');
    const keyId = inputsInfo[0];
    const signData = '00';
    const prepData = { inputId: '00', signData, coinType, keyId, payload };
    const fields = ["inputId", "signData", "coinType", "keyId", "payload"];

    let temp = [];
    fields.forEach((key) => {
      if (key == 'payload') {
        temp.push(prepData[key])
      } else {
        const toBuf = Buffer.from(prepData[key],'hex')
        temp.push(toBuf)
      }
    });

    const encodedTx = rlp.encode(temp)
    const P1 = "00";
    const P2 = "00";
    return { encodedTx, P1, P2 };
  } catch (e) {
    throw "Ripple Transaction Prepare Failed "+ e;
  }
}

exports.generateRawTx = async (encryptedSignatureArray, signatureKey, rawTransaction, inputsInfo) => {
  try {
    let encodedRawTx = rawTransaction[0];
    let iv = Buffer.alloc(16);
    const keyId = inputsInfo[0];
    const encryptedSignature = encryptedSignatureArray[0].encryptedSignature;

    iv.fill(0);
    const DERSignature = Sign.aes256CbcDecrypt(iv, Buffer.from(signatureKey, 'hex'), encryptedSignature);
    const parsedDERSignature = Sign.parseDERsignature(DERSignature.toString('hex'));
    const canonicalSignature = Sign.getCanonicalSignature(parsedDERSignature);
    const DERCanonicalSignature = Sign.convertToDER(canonicalSignature).toUpperCase();
    console.log(`Signature : ${DERCanonicalSignature}`);

    encodedRawTx = encodedRawTx.slice(8); // Remove Hash Prefix
    const XRPTransaction = codec.decode(encodedRawTx);
    console.log(`XRPTransaction : ${JSON.stringify(XRPTransaction)}`);
    XRPTransaction['TxnSignature'] = DERCanonicalSignature;
    console.log(`After sign : ${JSON.stringify(XRPTransaction)}`);

    const fullXRPTransaction = codec.encode(XRPTransaction);
    return fullXRPTransaction;
  } catch (e) {
    throw "Ripple Generate Raw transaction Failed" + e;
  }
}

exports.getTransactionHistory = async (addresses) => {
  try {
    const lastLedgerSequence = await API.XRP.getLastLedgerSequence();
    const allXRPTxHistory = await Promise.map(addresses, async (address) => {

      const destructureTransactionHistory = addressTx => {
        const subtractLastLedger = subtract(lastLedgerSequence);

        return R.compose(
          R.zipObj(['timeStamp', 'txId', 'confirmations', 'txFee', 'from', 'to', 'value']),
          R.adjust(Util.XRP.dropsToXRP, 6),
          R.adjust(Util.XRP.dropsToXRP, 3),
          R.adjust(subtractLastLedger, 2),
          R.adjust(getTimeFromISO, 0),
          R.compose(R.concat(R.props(['date', 'hash', 'ledger_index'], addressTx))),
          R.props(['Fee', 'Account', 'Destination', 'Amount']),
          R.prop('tx')
        )(addressTx);
      };

      const accountTx = await API.XRP.getAccountTransactions('transactions', address);
      const txHistory = R.map(destructureTransactionHistory, accountTx);

      return { address, txHistory };
    }, { concurrency: 3 });

    return allXRPTxHistory;
  } catch (e) {
    throw "Ripple Transaction History Failed"
  }
}

const getTimeFromISO = ISOString => ((new Date(ISOString).getTime() / 1000).toString())
const subtract = R.curry((data1, data2) => R.compose(R.toString(), R.subtract(data1))(data2));
const createHash = R.curry((hash, data) => crypto.createHash(hash).update(data).digest());
const toBuffer = R.curry((type, data) => Buffer.from(data, type));
const bufferConcat = (data1, data2) => Buffer.concat([data1, data2]);
const ripemd = (data) => (new RIPEMD160().update(data).digest());

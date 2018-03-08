const keccak256 = require('js-sha3').keccak256;
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const BigNumber = require('bignumber.js');
const Promise = require('bluebird');
const COINTYPE = require('rootCore/config/type.js');
const Util = require('rootCore/helper/util/index.js');
const API = require('rootCore/helper/api/index.js');
const ENV = require('rootCore/config/environment.js');
const COMMAND = require('rootCore/config/command.js');
const Sign = require('rootCore/helper/sign.js');
const rlp = require('rootCore/customlib/rlp');

exports.pubKeyToAddress = (addressKey) => {
  try {
    let masterPubkey = ec.keyFromPublic(addressKey, 'hex').getPublic(false, 'hex')
    masterPubkey = masterPubkey.slice(2)
    const keyBuf = Buffer.from(masterPubkey, 'hex')
    const hashedKey = keccak256(keyBuf)
    address = hashedKey.slice(24)
    address = '0x' + address;

    return address;
  } catch (e) {
    throw "Ethereum public key to address failed";
  }
}

exports.prepareSignData = async (paymentInfo) => {
  try {
    let { toAddress, fromAddress } = paymentInfo;
    if (toAddress.slice(0, 2) == '0x') {
      toAddress = toAddress.slice(2);
    }
    if (fromAddress.slice(0, 2) != '0x') {
      fromAddress = '0x' + fromAddress;
    }

    const { chainId } = COINTYPE.ETH.network[ENV.ETH];
    const gasLimit = '520c'   // default 21000
    const gasPrice = Util.ETH.calculateGasPrice(paymentInfo.txFee);
    const rawNonce = await API.ETH.getTransactionCount(fromAddress);
    let nonce = rawNonce.replace('0x','');
    nonce = fitZero(nonce);
    console.log(`NONCE : ${nonce}`);

    const amount = new BigNumber(paymentInfo.amount);
    const etherWei = new BigNumber(COINTYPE.ETH.unit);
    const value = amount.times(etherWei).toString(16);
    let rawTx = {
      nonce, gasPrice, gasLimit, value,
      to: `${toAddress}`,
      data: `00`,
      v: chainId,
      r: `00`,
      s: `00`,
    }

    Object.keys(rawTx).forEach((key) => {rawTx[key] = fitZero(rawTx[key])})
    const txBuf = Util.ETH.assemblyTransaction(rawTx)
    const encodedTx = rlp.encode(txBuf)
    const signData = encodedTx.toString('hex')

    return { signData, txFee: paymentInfo.txFee };
  } catch (e) {
    throw "Ethereum Prepare Sign data failed";
  }
}

exports.transactionPrepare = (coinType, inputsInfo, payloadArr) => {
  try {
    const encodedPayload = Buffer.from(payloadArr[0], 'hex');
    const keyId = inputsInfo[0];
    const payload = rlp.decode(encodedPayload);
    const signData = keccak256(encodedPayload);
    const prepData = { inputId: '00', signData, coinType, keyId, payload };
    const fields = ["inputId", "signData", "coinType", "keyId", "payload"];
    let temp = [];
    console.log(`HASHEDSIGNEDDATA : ${signData}`);

    fields.forEach((key) => {
      if (key == 'payload') {
        temp.push(prepData[key])
      } else {
        const toBuf = Buffer.from(prepData[key],'hex')
        temp.push(toBuf)
      }
    })

    const encodedTx = rlp.encode(temp)
    const P1 = "00";
    const P2 = "00";
    return { encodedTx, P1, P2 };

  } catch (e) {
    throw "Ethereum Transaction Prepare Failed";
  }
}

exports.generateRawTx = async (encryptedSignatureArray, signatureKey, rawTransaction, inputsInfo) => {
  try {
    const keyId = inputsInfo[0];
    const { publicKey, chainCode } = await Util.OTHER.getKeyAndChainFromHDAccount(keyId);
    const addressPublicKey = Util.OTHER.derive(publicKey, chainCode, keyId)
    const { chainId } = COINTYPE.ETH.network[ENV.ETH];
    const encodedRawTx = Buffer.from(rawTransaction[0], 'hex');
    const encryptedSignature = encryptedSignatureArray[0].encryptedSignature;

    let iv = Buffer.alloc(16);
    iv.fill(0);
    let hashedTx = keccak256(encodedRawTx);
    hashedTx = Buffer.from(hashedTx, 'hex');
    console.log(`hashedTx : ${hashedTx.toString('hex')}`);

    const DERsignature = Sign.aes256CbcDecrypt(iv, Buffer.from(signatureKey, 'hex'), encryptedSignature);
    console.log(`Signature : ${DERsignature.toString('hex')}`);

    let eth_sig = Sign.parseDERsignature(DERsignature.toString('hex'));
    console.log(`eth_sig: ${JSON.stringify(eth_sig)}`);
    let canonicalSignature = Sign.getCanonicalSignature(eth_sig);

    console.log(`ETH_SIG : ${JSON.stringify(canonicalSignature)}`);
    const fullPublicPoint = ec.keyFromPublic(Buffer.from(addressPublicKey, 'hex'));
    const recoveryParam = ec.getKeyRecoveryParam(hashedTx, canonicalSignature, fullPublicPoint.pub);
    console.log(`recoveryParam : ${recoveryParam}`);

    const decodedRawTx = rlp.decode(encodedRawTx)
    const newRawTx = decodedRawTx.slice(0, 6)

    canonicalSignature.v = recoveryParam + 27;
    if(chainId >= 0 ) {
      canonicalSignature.v += chainId * 2 + 8
    }

    newRawTx.push(
      Buffer.from([canonicalSignature.v]),
      Buffer.from(canonicalSignature.r, 'hex'),
      Buffer.from(canonicalSignature.s, 'hex')
    )

    let serialized_tx = rlp.encode(newRawTx)
    serialized_tx = `0x${serialized_tx.toString('hex')}`

    return serialized_tx
  } catch (e) {
    throw "Ethereum Generate Transaction Failed "+e;
  }
}

exports.getTransactionHistory = async (addresses) => {
  const allEthTxHistory = await Promise.map(addresses, async (a) => {
    let address = a;
    if (address.length < 41) address = `0x${address}`;
    const txHistoryRes = await API.ETH.getAddressTransaction(address)
    const txHistory = await Promise.map(txHistoryRes, (tx) => {
      let {
        hash,
        from,
        to,
        value,
        gasPrice,
        gas,
        confirmations,
        timeStamp
      } = tx;

      const gasHex = parseInt(gas).toString(16);
      const gasPriceHex = parseInt(gasPrice).toString(16);
      const txFee = Util.ETH.calculateFee(gasPriceHex, gasHex);
      value = Util.ETH.weiToEther(value).toString();
      return { txId: hash, from, to, value, txFee, confirmations, timeStamp };
    });
    return { address, txHistory };
  }, { concurrency: 3 });

  return allEthTxHistory;
}

const fitZero = (data) => {
  let temp = data
  if ((temp.length % 2) != 0) {
    temp = `0${temp}`
  }
  return temp
}

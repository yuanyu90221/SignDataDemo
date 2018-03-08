const bitcoin = require('rootCore/customlib/bitcoin.min.js');
const base58 = require('bs58');
const Buffer = require('buffer').Buffer;
const { NativeModules, AsyncStorage } = require('react-native');
const { ReceiveModule, RNNotificationBridge } = NativeModules;
const APDU = require('rootCore/helper/apdu/index.js');
const VERSION = require('rootCore/config/version.js');
const EVENT = require('rootCore/config/event.js');
const APDUCONFIG = require('rootCore/config/apdu.js');
const { RESPONSE } = APDUCONFIG;

let cancelTimeout;

exports.derive = (accountPublicKey, chainCode, keyId) => {
  try {
    let changeIndex = keyId.slice(4, 6) || '00'
    changeIndex = parseInt(changeIndex, 16)
    let addressIndex = keyId.slice(6) || '00'
    addressIndex = parseInt(addressIndex, 16)

    const KeyPair = bitcoin.ECPair.fromPublicKeyBuffer(Buffer.from(accountPublicKey, 'hex'))
    const chainNode = new bitcoin.HDNode(KeyPair, Buffer.from(chainCode, 'hex'))
    const addressNode = chainNode
    .derive(changeIndex)
    .derive(addressIndex)

    const extended = decodeExtKey(addressNode.toBase58(), false)
    const publicKey = extended.key

    return publicKey
  } catch (e) {
    throw "Derive Key Failed";
  }
}

exports.getKeyAndChainFromHDAccount = async (keyId) => {
  try {
    let temp = keyId.length == 2 ? keyId : keyId.slice(0, 6);
    temp = exports.fitZero(temp, 10, '0', false);
    const HDAccountString = await AsyncStorage.getItem('HDAccount');
    const HDAccountObject = JSON.parse(HDAccountString);
    const totalAccount = 1;
    let publicKey;
    let chainCode;
    HDAccountObject.forEach((obj) => {
      if (obj.keyId == temp) {
        publicKey = obj.publicKey;
        chainCode = obj.chainCode;
        return
      }
    })

    return { publicKey, chainCode };
  } catch (e) {
    return e
  }
}

exports.getSupportedCoin = async () => {
  try {
    const CardSEVersion = await AsyncStorage.getItem('CardSEVersion');
    const supportedCoin = VERSION.SE_VERSION_LIST.find(v => v[CardSEVersion]);

    // If Card version maybe older than card SE Version
    if (!supportedCoin) {
      const lastVersion = VERSION.SE_VERSION_LIST[VERSION.SE_VERSION_LIST.length - 1];
      const getKey = Object.keys(lastVersion);
      return lastVersion[getKey];
    }

    return supportedCoin[CardSEVersion];
  } catch (e) {
    throw e;
  }
}

exports.triggerCancelAPDUTimeout = (milliseconds) => {
  return new Promise((resolve, reject) => {
    cancelTimeout = setTimeout( async () => {
      try {
        const result = {
          'event': EVENT.TIMEOUT_CANCEL,
          status: 'success',
          data: null
        };

        const device = await AsyncStorage.getItem('deviceType');
        if (device == 'android') {
          console.log('Android :' + result);
          ReceiveModule.receiveRN(result)
        } else if (device == 'ios') {
          console.log('ios :' + result);
          RNNotificationBridge.postNotification(result);
        }
        resolve();
      } catch (e) {
        reject(e);
      }
    }, milliseconds)
  })
}

exports.clearCancelAPDUTimeout = () => {
  clearTimeout(cancelTimeout);
}

exports.fitZero = (data, length, addedData, fromFront) => {
  let temp = data
  if (data.length > length) {
    if (!!fromFront) {
      temp = '9';
      for (let i = temp.length; i < length; i++) {
        temp += '9';
      }
    } else {
      temp = temp.slice(0, length);
    }
  }

  for (let i = data.length; i < length; i++) {
    if (!!fromFront) {
      temp = `${addedData}${temp}`;
    } else {
      temp = `${temp}${addedData}`;
    }
  }
  return temp;
}

const decodeExtKey = (deriveKey, flag) => {

  const decodeR = base58.decode(deriveKey);
  const rawDecode = decodeR.toString('hex');

  const obj = {};
  obj.version = rawDecode.slice(0,8)
  obj.depth = rawDecode.slice(8,10)
  obj.fingerprint = rawDecode.slice(10,18)
  obj.childnum = rawDecode.slice(18,26)
  obj.chaincode = rawDecode.slice(26,90)

  if(!!flag) {
    obj.key = rawDecode.slice(92,156)
  }else {
    obj.key = rawDecode.slice(90,156)
  }

  return obj;
}

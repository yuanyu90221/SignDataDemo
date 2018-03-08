const random = require('react-native-randombytes');
const { AsyncStorage } = require('react-native');
const elliptic = require('elliptic');
const ec = new elliptic.ec('secp256k1');
const COMMAND = require('rootCore/config/command.js')
const APDU = require('rootCore/helper/apdu/index.js');
const Util = require('rootCore/helper/util/index.js')
const DfuInterface = require('rootCore/Interface/Dfu');
const COINTYPE = require('rootCore/config/type.js')
const Sign = require('rootCore/helper/sign.js');
const APDUCONFIG = require('rootCore/config/apdu.js');
const Promise = require('bluebird');
const { RESPONSE } = APDUCONFIG;

exports.generateAppKey = () => {
  try {
    let privateKey = random.randomBytes(32)
    const publicKey = ec.keyFromPrivate(privateKey, 'hex').getPublic(false, 'hex')
    privateKey = privateKey.toString('hex')
    const obj = { privateKey, publicKey }

    return { status : 'success', message : obj }
  } catch (e) {
    return { status : 'failed', message : e }
  }
}

exports.registerDevice = async (password, device_name) => {
  try {
    const appPubKey = await AsyncStorage.getItem('appPubKey');
    console.log(`App public key : ${appPubKey}`);

    let nameToUTF = Buffer.from(device_name)
    if (nameToUTF.length < 30) {
      let diff = 30 - nameToUTF.length
      let temp = Buffer.allocUnsafe(diff)
      temp.fill(0)
      nameToUTF = Buffer.concat([temp, nameToUTF])
    }
    const addedPassword = Util.OTHER.fitZero(password, 8, 'F', true);

    nameToUTF = nameToUTF.toString('hex')
    const temp = addedPassword + appPubKey + nameToUTF
    const { outputData } = await APDU.Other.registerDevice(temp)

    await APDU.Other.closePower();
    await AsyncStorage.setItem('appId', outputData)

    return { status: 'success', message: '' }
  } catch (e) {
    return { status: 'failed', message: e }
  }
}

exports.getCardInfo = async () => {
  try {
    const appId = await AsyncStorage.getItem("appId");
    const cardInfo = await APDU.Other.getCardInfo();
    const SEVersionInfo = await APDU.Other.getSEVersion();
    // const { MCUVersion, MCUDate } = await DfuInterface.getMCUInfo();
    const MCUVersion = '3900';
    const MCUDate = '20171115';
    const hiResponse = await APDU.Other.sayHi(appId, true);
    await APDU.Other.closePower();

    const { outputData, status } = cardInfo;
    const databuf = Buffer.from(outputData, 'hex');
    const pairIndex = databuf.slice(0, 1).toString('hex');
    const freezeIndex = databuf.slice(1, 2).toString('hex');
    const walletIndex = databuf.slice(3, 4).toString('hex');
    const accountDigest = databuf.slice(4, 9).toString('hex');
    const displayIndex = databuf.slice(9).toString('hex');
    const SEVersion = parseInt(SEVersionInfo.outputData, 16);
    const isCardRecognized = hiResponse.status == RESPONSE.SUCCESS ? true : false;
    let pairRemainTimes = databuf.slice(2, 3).toString('hex');
    pairRemainTimes = parseInt(pairRemainTimes, 16);

    const pairStatus = pairIndex == '00' ? false : true;
    const freezeStatus = freezeIndex == '00' ? false : true;
    const walletStatus = walletIndex == '00' ? false : true;
    const showFullAddress = displayIndex == '00' ? true : false;

    const message = {
      pairStatus,
      freezeStatus,
      walletStatus,
      pairRemainTimes,
      accountDigest,
      showFullAddress,
      isCardRecognized,
      SEVersion,
      MCUVersion,
      MCUDate
    };
    console.log(`Message : ${JSON.stringify(message)}`);
    await AsyncStorage.setItem('CardSEVersion', SEVersion.toString());

    return { status: 'success', message }
  } catch (e) {
    return { status: 'failed', message: e }
  }
}

exports.resetPair = async () => {
  try {
    Util.OTHER.triggerCancelAPDUTimeout(30000)
    .then(() => {
      return { status: 'canceled', message: '' };
    });

    const reset = await APDU.Other.resetPair();
    Util.OTHER.clearCancelAPDUTimeout();

    const { status } = reset;
    if (status == RESPONSE.CANCELED) {
      return { status: 'canceled', message: '' };
    }
    await APDU.Other.closePower();

    return { status: 'success', message: '' };
  } catch (e) {
    Util.OTHER.clearCancelAPDUTimeout();
    return { status: 'failed', message: e };
  }
}

exports.getPairPassword = async () => {
  try {
    const command = "GET_PAIR_PWD";
    const signature = await exports.generalAuthorization(command);
    const getPairPassword = await APDU.Other.getPairPassword(signature)
    await APDU.Other.closePower();

    const appPrivKey = await AsyncStorage.getItem('appPrivKey');
    let password = Sign.ECIESDec(appPrivKey, getPairPassword.outputData);
    password = password.replace(/f/gi, '');

    return { status: 'success', message: password }
  } catch (e) {
    return { status: 'failed', message: e }
  }
}

exports.showFullAddress = async (isFullDetail) => {
  try {
    const command = "SHOW_FULL_ADDRESS";
    const detailFlag = !!isFullDetail ? '00' : '01';
    const signature = await exports.generalAuthorization(command, null, detailFlag);
    await APDU.Other.showFullAddress(signature, detailFlag);
    await APDU.Other.closePower();

    return { status: 'success', message: isFullDetail }
  } catch (e) {
    return { status: 'failed', message: e }
  }
}

exports.updateBalance = async (allCoinBalance) => {
  try {
    const coin = [
      //COINTYPE.BTC.type, coinType testnet 01 MCU not recognizr
      COINTYPE.BTC.type,
      COINTYPE.ETH.type,
      COINTYPE.LTC.type,
      COINTYPE.XRP.type
    ];

    // need based on order. bitcoin -> ether -> litecoin -> ripple
    const allBalances = await Promise.map(coin, async (coinType) => {
      const coinBalance = await Promise.filter(allCoinBalance, (b) => {
        return b.coinType == coinType;
      });
      if (coinBalance.length > 1) throw "Cointype more than one";

      const balance = coinBalance.length > 0 ? coinBalance[0].balance : "0.0";
      const splitBalance = balance.split('.');
      const preNum = Util.OTHER.fitZero(splitBalance[0], 8, '0', true);
      const postNum = Util.OTHER.fitZero(splitBalance[1], 8, '0', false);
      const fullBalance = preNum + postNum;
      const coinTypeAndBalance = coinType + fullBalance;

      return coinTypeAndBalance;
    });

    const concatBalance = allBalances.join('');

    const command = "UPDATE_BALANCE";
    const signature = await exports.generalAuthorization(command, concatBalance);
    const data = concatBalance + signature;
    const update = await APDU.Other.updateBalance(data);
    await APDU.Other.closePower();

    return { status: 'success', message: update.outputData }
  } catch (e) {
    return { status: 'failed', message: e }
  }
}

exports.updateKeyId = async (arrOfKeyId) => {
  try {
    const MyType = Object.keys(COINTYPE);
    let indexIdData = await Promise.map(MyType, (coin) => {
      const { type } = COINTYPE[coin];
      const k = arrOfKeyId.find((keyId) => {
        return keyId.slice(0, 2) == type;
      })
      if (!k) {
        const defaultAccAndAddress = '0000';
        return type + defaultAccAndAddress;
      }
      const lastAddressIndex = k.slice(6);
      return type + lastAddressIndex;
    });
    indexIdData = indexIdData.join('');

    const command = 'UPDATE_KEYID';
    const signature = await exports.generalAuthorization(command, indexIdData);
    const data = indexIdData + signature;
    await APDU.Other.updateKeyId(data);
    await APDU.Other.closePower();

    return { status: 'success', message: '' }
  } catch (e) {
    return { status: 'failed', message: e }
  }
}

exports.getLastKeyId = async () => {
  try {
    const lastKeyId = await APDU.Other.getLastKeyId();
    await APDU.Other.closePower();

    const allCoin = lastKeyId.outputData.match(/.{6}/g);
    if (allCoin.length > 4) throw "Format is wrong";

    const result = await Promise.map(allCoin, (c) => {
      const coinType = c.slice(0, 2);
      const addressLastIndex = c.slice(2);
      const defaultChangeIndex = '00';
      const defaultAccountIndex = '00';

      return coinType + defaultAccountIndex + defaultChangeIndex + addressLastIndex;
    });

    return { status: 'success', message: result };
  } catch (e) {
    return { status: 'failed', message: e };
  }
}

exports.changePairLockStatus = async (freezePair) => {
  try {
    const command = "CHANGE_PAIR_STATUS";
    const pairLockStatus = !!freezePair ? '01' : '00';
    const signature = await exports.generalAuthorization(command, null, pairLockStatus);

    await APDU.Other.changePairStatus(signature, pairLockStatus);
    await APDU.Other.closePower();

    return { status: 'success', message: '' }
  } catch (e) {
    return { status: 'failed', message: e }
  }
}

exports.getPairedDevices = async () => {
  try {
    const command = "GET_PAIRED_DEVICES";
    const signature = await exports.generalAuthorization(command);

    const result = await APDU.Other.getPairedDevices(signature);
    await APDU.Other.closePower();

    // 50 Bytes ->
    const allPairedDevice = result.outputData.match(/.{100}/g);
    const objResult = await Promise.map(allPairedDevice, (pairedDevices) => {
      const appId = pairedDevices.slice(0, 40);
      const utfDevicename = pairedDevices.slice(40);
      const toBuf = Buffer.from(utfDevicename, 'hex');
      const deviceName = toBuf.toString().replace(/\u0000/gi, '');

      return { appId, deviceName };
    });

    return { status: 'success', message: objResult };
  } catch (e) {
    return { status: 'failed', message: e };
  }
}

exports.removePairedDevice = async (removedAppIdArray) => {
  try {
    const command = "REMOVE_DEVICES";
    for (var i = 0; i < removedAppIdArray.length; i++) {
      const signature = await exports.generalAuthorization(command, removedAppIdArray[i]);
      const removeParams = removedAppIdArray[i] + signature;
      await APDU.Other.removePairedDevice(removeParams);
    };
    await APDU.Other.closePower();

    return { status: 'success', message: '' };
  } catch (e) {
    return { status: 'failed', message: e };
  }
}

exports.renamePairedDevice = async (newDeviceName) => {
  try {
    let nameToUTF = Buffer.from(newDeviceName)
    if (nameToUTF.length < 30) {
      let diff = 30 - nameToUTF.length
      let temp = Buffer.allocUnsafe(diff)
      temp.fill(0)
      nameToUTF = Buffer.concat([temp, nameToUTF])
    }
    nameToUTF = nameToUTF.toString('hex');

    const command = "RENAME_DEVICES";
    const signature = await exports.generalAuthorization(command, nameToUTF);
    const renameParams = nameToUTF + signature;
    await APDU.Other.renamePairedDevice(renameParams);
    await APDU.Other.closePower();

    return { status: 'success', message: '' };
  } catch (e) {
    return { status: 'failed', message: e };
  }
}

exports.getSEVersion = async () => {
  try {
    const { outputData } = await APDU.Other.getSEVersion();
    await APDU.Other.closePower();

    return { status: 'success', message: outputData };
  } catch (e) {
    return { status: 'failed', message: e };
  }
}

exports.generalAuthorization = async (commandName, data, params1, params2) => {
  try {
    const dataPackets = !!data ? data : '';
    const appId = await AsyncStorage.getItem('appId');
    const privateKey = await AsyncStorage.getItem('appPrivKey');
    console.log(`GET NONCE : ${commandName}`)
    const nonce = await APDU.Other.getNonce();

    const commandParams = COMMAND[commandName];
    const P1 = !!params1 ? params1 : commandParams.P1;
    const P2 = !!params2 ? params2 : commandParams.P2;
    const command = commandParams.CLA + commandParams.INS + P1 + P2;
    const signatureParams = command + dataPackets + nonce.outputData;
    const signature = Sign.sign(signatureParams, privateKey);
    await APDU.Other.sayHi(appId);

    return signature.toString('hex')
  } catch (e) {
    throw e
  }
}

exports.cancelAPDU = async () => {
  try {
    await APDU.Other.cancelAPDU();

    return { status: 'success', message: '' }
  } catch (e) {
    return { status: 'failed', message: e }
  }
}

exports.APDUTest = async (data) => {
  try {
    const { cla, ins, p1, p2, packets } = data;
    if (typeof packets != 'string' || packets.length % 2 != 0) throw "Packets data format isnt correct.";
    const apduTest = await APDU.Other.APDUTest(cla, ins, p1, p2, packets);
    const { outputData, status } = apduTest;

    await APDU.Other.closePower();

    return { status: 'success', message: '' }
  } catch (e) {
    return { status: 'failed', message: e }
  }
}

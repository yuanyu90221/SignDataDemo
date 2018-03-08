const { EVENT } = require('rootCore/config');
const APDUCONFIG = require('rootCore/config/apdu.js');
const COMMAND = require('rootCore/config/command.js')
const ble = require('../ble.js');
const { NativeModules, AsyncStorage } = require('react-native');
const { BleModule, RNNotificationBridge } = NativeModules;
const { RESPONSE } = APDUCONFIG;

exports.requestAPDUV2 = async (apdu, isDfu, ignoreThrow) => {
  try {
    const eventName = !!isDfu
      ? isDfu
      : "BLE_CMD";

    const req = {
      'event': eventName,
      status: 'success',
      data: {
        command: apdu.command,
        packets: apdu.data
      }
    }
      console.log(`APDU: ${JSON.stringify(req)}`);

    let res;
    const deviceType = await AsyncStorage.getItem('deviceType');

    if (deviceType == 'android') {
      res = await BleModule.receiveData(req);
    } else if (deviceType == 'ios') {
      res = await RNNotificationBridge.postNotificationWithPromise(req);
    }

    console.log(`Response Ble : ${JSON.stringify(res)}`);
    if (res.status != RESPONSE.SUCCESS && res.status != RESPONSE.CANCELED && !ignoreThrow) {
      throw res.status;
    }

    return res;
  } catch (e) {
    throw e;
  }
}

exports.requestBLE = async (commandName, data, ignoreThrow, params1, params2) => {
  const commandParams = COMMAND[commandName];
  try {
    const P1 = !!params1 ? params1 : commandParams.P1;
    const P2 = !!params2 ? params2 : commandParams.P2;

    const apdu = ble.assemblyBytes(commandParams.CLA, commandParams.INS, P1, P2, data);
    const result = await exports.requestAPDUV2(apdu, null, ignoreThrow);

    return result;
  } catch (e) {
    // throw commandParams.INS + e;
    throw commandParams.ERR + e;
  }
}

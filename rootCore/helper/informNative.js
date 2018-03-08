const EVENT = require('rootCore/config/event.js');
const { NativeModules, AsyncStorage } = require('react-native');
const { ReceiveModule, RNNotificationBridge } = NativeModules;

exports.transactionPrepareComplete = () => {
  try {
    const data = '';
    return createEventParams(EVENT.TX_PREP_COMPLETE, data);
  } catch (e) {
    throw e;
  }
}

exports.transactionAuthorize = () => {
  try {
    const data = '';
    return createEventParams(EVENT.TX_AUTHORIZE, data);
  } catch (e) {
    throw e;
  }
}

exports.progressBar = (progress) => {
  try {
    return createEventParams(EVENT.PROGRESS, progress);
  } catch (e) {
    throw e;
  }
}

const createEventParams = async (eventName, data) => {
  try {
    const params = {
      'event': eventName,
      status: 'success',
      data
    };

    const deviceType = await AsyncStorage.getItem('deviceType');
    if (deviceType == 'android') {
      ReceiveModule.receiveRN(params);
    } else if (deviceType == 'ios') {
      RNNotificationBridge.postNotification(params);
    }

    return;
  } catch (e) {
    throw e;
  }

};

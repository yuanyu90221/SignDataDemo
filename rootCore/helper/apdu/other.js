const COMMAND = require('rootCore/config/command.js')
const request = require('./request.js');
const ble = require('../ble.js');

exports.registerDevice = (data) => {
  const command = 'REGISTER';
  return request.requestBLE(command, data);
}

exports.resetPair = () => {
  const command = 'RESET_PAIR';
  return request.requestBLE(command);
}

exports.sayHi = (data, ignoreThrow) => {
  const command = 'SAY_HI';
  return request.requestBLE(command, data, ignoreThrow);
}

exports.getNonce = () => {
  const command = 'GET_NONCE';
  return request.requestBLE(command);
}

exports.getCardInfo = () => {
  const command = 'GET_CARD_INFO';
  return request.requestBLE(command);
}

exports.closePower = () => {
  const command = 'CLOSE_PWR';
  return request.requestBLE(command);
}

exports.updateBalance = (data) => {
  const command = 'UPDATE_BALANCE';
  return request.requestBLE(command, data);
}

exports.getPairPassword = (data) => {
  const command = 'GET_PAIR_PWD';
  return request.requestBLE(command, data);
}

exports.updateKeyId = (data) => {
  const command = 'UPDATE_KEYID';
  return request.requestBLE(command, data);
}

exports.getLastKeyId = () => {
  const command = 'GET_KEYID';
  return request.requestBLE(command);
}

exports.changePairStatus = (data, P1) => {
  const command = 'CHANGE_PAIR_STATUS';
  return request.requestBLE(command, data, null, P1);
}

exports.getPairedDevices = (data) => {
  const command = 'GET_PAIRED_DEVICES';
  return request.requestBLE(command, data);
}

exports.removePairedDevice = (data) => {
  const command = 'REMOVE_DEVICES';
  return request.requestBLE(command, data);
}

exports.renamePairedDevice = (data) => {
  const command = 'RENAME_DEVICES';
  return request.requestBLE(command, data);
}

exports.showFullAddress = (data, P1) => {
  const command = 'SHOW_FULL_ADDRESS';
  return request.requestBLE(command, data, null, P1);
}

exports.getSEVersion = () => {
  const command = 'GET_SE_VERSION';
  return request.requestBLE(command);
}

exports.cancelAPDU = () => {
  const command = 'CANCEL_APDU';
  return request.requestBLE(command);
}

exports.echo = () => {
  const command = 'ECHO';
  const packets = '99001122334455667788991122334455667788';
  return request.requestBLE(command, packets);
}

exports.APDUTest = (cla, ins, p1, p2, packets) => {
  try {
    const apdu = ble.assemblyBytes(cla, ins, p1, p2, packets)
    return request.requestAPDUV2(apdu)
  } catch (e) {
    throw e
  }
}

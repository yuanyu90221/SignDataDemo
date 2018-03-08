const COMMAND = require('rootCore/config/command.js')
const request = require('./request.js');
const ble = require('../ble.js');

exports.setSeed = (data) => {
  const command = 'SET_SEED';
  return request.requestBLE(command, data);
}

exports.authGetExtendedKey = (data) => {
  const command = 'AUTH_EXT_KEY';
  return request.requestBLE(command, data);
}

exports.getAccountExtendedKey = (P1, P2) => {
  const command = 'GET_EXT_KEY';
  return request.requestBLE(command, null, null, P1, P2);
}

exports.createWallet = (data) => {
  const command = 'CREATE_WALLET';
  return request.requestBLE(command, data);
}

exports.finishBackup = (data) => {
  const command = 'FINISH_BACKUP';
  return request.requestBLE(command, data);
}

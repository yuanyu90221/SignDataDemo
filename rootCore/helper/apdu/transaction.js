const COMMAND = require('rootCore/config/command.js')
const request = require('./request.js');
const ble = require('../ble.js');

exports.prepTx = (data, P1, P2) => {
  const command = 'TX_PREPARE';
  return request.requestBLE(command, data, null, P1, P2);
}

exports.finishPrepare = () => {
  const command = 'FINISH_PREPARE';
  return request.requestBLE(command);
}

exports.getSignatureKey = (data) => {
  const command = 'GET_TX_KEY';
  return request.requestBLE(command, data);
}

exports.clearTransaction = () => {
  const command = 'CLEAR_TX';
  return request.requestBLE(command);
}

exports.getTxDetail = () => {
  const command = 'GET_TX_DETAIL';
  return request.requestBLE(command);
}

const COMMAND = require('rootCore/config/command.js')
const request = require('./request.js');
const ble = require('../ble.js');

exports.getFWStatus = () => {
  const {CHECK_FW_STATUS} = COMMAND
  const apdu = ble.assemblyBytes(CHECK_FW_STATUS.CLA, CHECK_FW_STATUS.INS, CHECK_FW_STATUS.P1, CHECK_FW_STATUS.P2)
  return request.requestAPDUV2(apdu,"DFU_CMD").catch((e) => {
    throw e
  })
}

exports.sendFWsign = (data) => {
  const {SEND_FW_SIGN} = COMMAND
  const apdu = ble.assemblyBytes(SEND_FW_SIGN.CLA, SEND_FW_SIGN.INS, SEND_FW_SIGN.P1, SEND_FW_SIGN.P2, data)
  return request.requestAPDUV2(apdu,"DFU_CMD").catch((e) => {
    throw e
  })
}

exports.FWreset = () => {
  const {FW_RESET} = COMMAND
  const apdu = ble.assemblyBytes(FW_RESET.CLA, FW_RESET.INS, FW_RESET.P1, FW_RESET.P2)
  return request.requestAPDUV2(apdu,"DFU_CMD").catch((e) => {
    throw e
  })
}

exports.FWupdate = (P1, P2, data) => {
  const {FW_UPDATE} = COMMAND
  const apdu = ble.assemblyBytes(FW_UPDATE.CLA, FW_UPDATE.INS, P1, P2, data)
  console.log(apdu.command,apdu.data);
  return request.requestAPDUV2(apdu,"DFU_CMD").catch((e) => {
    throw e
  })
}

exports.getMCUVersion = () => {
  const { GET_MCU_VERSION } = COMMAND
  const apdu = ble.assemblyBytes(GET_MCU_VERSION.CLA, GET_MCU_VERSION.INS, GET_MCU_VERSION.P1, GET_MCU_VERSION.P2)
  return request.requestAPDUV2(apdu, "DFU_CMD")
  .catch((e) => {
    throw e
  })
}

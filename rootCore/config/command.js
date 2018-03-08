module.exports = {
  "ECHO": {
    "CLA": "80",
    "INS": "68",
    "P1": "00",
    "P2": "00",
    "ERR": "Echo Failed"
  },
  "REGISTER": {
    "CLA": "80",
    "INS": "10",
    "P1": "00",
    "P2": "00",
    "ERR": "Register Failed"
  },
  "SAY_HI": {
    "CLA": "80",
    "INS": "50",
    "P1": "00",
    "P2": "00",
    "ERR": "Device not registered"
  },
  "CHANGE_PAIR_STATUS": {
    "CLA": "80",
    "INS": "14",
    "P1": null,
    "P2": "00",
    "ERR": "Change pair status Failed"
  },
  "GET_PAIRED_DEVICES": {
    "CLA": "80",
    "INS": "18",
    "P1": "00",
    "P2": "00",
    "ERR": "Get paired devices failed"
  },
  "REMOVE_DEVICES": {
    "CLA": "80",
    "INS": "1C",
    "P1": "00",
    "P2": "00",
    "ERR": "Remove Device Failed"
  },
  "RENAME_DEVICES": {
    "CLA": "80",
    "INS": "1E",
    "P1": "00",
    "P2": "00",
    "ERR": "Rename Device Failed"
  },
  "GET_READTYPE": {
    "CLA": "80",
    "INS": "0A",
    "P1": "00",
    "P2": "00",
    "ERR": "Get Read Type Failed"
  },
  "UPDATE_READTYPE": {
    "CLA": "80",
    "INS": "0C",
    "P1": "00",
    "P2": "00",
    "ERR": "Update Read Type Failed"
  },
  "GET_NONCE": {
    "CLA": "80",
    "INS": "54",
    "P1": "00",
    "P2": "00",
    "ERR": "Get Nonce Failed"
  },
  "TX_PREPARE": {
    "CLA": "80",
    "INS": "32",
    "P1": null,
    "P2": null,
    "ERR": "Transaction Prepare Failed"
  },
  "FINISH_PREPARE": {
    "CLA": "80",
    "INS": "34",
    "P1": "00",
    "P2": "00",
    "ERR": "Finish Prepare Failed"
  },
  "GET_TX_KEY": {
    "CLA": "80",
    "INS": "3A",
    "P1": "00",
    "P2": "00",
    "ERR": "Sign Transaction Failed"
  },
  "GET_TX_DETAIL": {
    "CLA": "80",
    "INS": "36",
    "P1": "00",
    "P2": "00",
    "ERR": "Get Transaction Detail Failed"
  },
  "CLEAR_TX": {
    "CLA": "80",
    "INS": "30",
    "P1": "00",
    "P2": "00",
    "ERR": "Clear Transaction Failed"
  },
  "SET_SEED": {
    "CLA": "80",
    "INS": "2A",
    "P1": "00",
    "P2": "00",
    "ERR": "Set seed Failed"
  },
  "AUTH_EXT_KEY": {
    "CLA": "80",
    "INS": "2C",
    "P1": "00",
    "P2": "00",
    "ERR": "Authorize extended key Failed"
  },
  "GET_EXT_KEY": {
    "CLA": "80",
    "INS": "28",
    "P1": null,
    "P2": null,
    "ERR": "Get extended Key Failed"
  },
  "CREATE_WALLET": {
    "CLA": "80",
    "INS": "24",
    "P1": "00",
    "P2": "00",
    "ERR": "Create Wallet Failed"
  },
  "FINISH_BACKUP": {
    "CLA": "80",
    "INS": "2E",
    "P1": "00",
    "P2": "00",
    "ERR": "Finish Backup Failed"
  },
  "RESET_PAIR": {
    "CLA": "80",
    "INS": "56",
    "P1": "00",
    "P2": "00",
    "ERR": "Reset Pair Failed"
  },
  "GET_CARD_INFO": {
    "CLA": "80",
    "INS": "66",
    "P1": "00",
    "P2": "00",
    "ERR": "Get card info failed"
  },
  "UPDATE_BALANCE": {
    "CLA": "80",
    "INS": "60",
    "P1": "00",
    "P2": "00",
    "ERR": "Update Balance Failed"
  },
  "GET_PAIR_PWD": {
    "CLA": "80",
    "INS": "1A",
    "P1": "00",
    "P2": "00",
    "ERR": "Get pair password failed"
  },
  "UPDATE_KEYID": {
    "CLA": "80",
    "INS": "6A",
    "P1": "00",
    "P2": "00",
    "ERR": "Update Key Id Failed"
  },
  "GET_KEYID": {
    "CLA": "80",
    "INS": "6C",
    "P1": "00",
    "P2": "00",
    "ERR": "Get Key Id Failed"
  },
  "SHOW_FULL_ADDRESS": {
    "CLA": "80",
    "INS": "64",
    "P1": null,
    "P2": "00",
    "ERR": "Get Key Id Failed"
  },
  "GET_SE_VERSION": {
    "CLA": "80",
    "INS": "52",
    "P1": "00",
    "P2": "00",
    "ERR": "Get SE Version Failed"
  },
  "GET_MCU_VERSION": {
    "CLA": "FF",
    "INS": "70",
    "P1": "00",
    "P2": "00",
    "ERR": "Get MCU Version Failed"
  },
  "CLOSE_PWR": {
    "CLA": "7F",
    "INS": "80",
    "P1": "00",
    "P2": "00",
    "ERR": "Close power failed"
  },
  "CANCEL_APDU": {
    "CLA": "7F",
    "INS": "00",
    "P1": "00",
    "P2": "00",
    "ERR": "Cancel apdu failed"
  },
  "CHECK_FW_STATUS": {
    "CLA": "FF",
    "INS": "70",
    "P1": "00",
    "P2": "00",
    "ERR": ""
  },
  "SEND_FW_SIGN": {
    "CLA": "FF",
    "INS": "80",
    "P1": "00",
    "P2": "00",
    "ERR": ""
  },
  "FW_RESET": {
    "CLA": "FF",
    "INS": "6F",
    "P1": "00",
    "P2": "00",
    "ERR": ""
  },
  "FW_UPDATE": {
    "CLA": "FF",
    "INS": "6F",
    "P1": null,
    "P2": null,
    "ERR": ""
  },
  "SELECT_CARD_MANAGER": {
    "CLA": "00",
    "INS": "A4",
    "P1": "04",
    "P2": "00",
    "ERR": ""
  },
}

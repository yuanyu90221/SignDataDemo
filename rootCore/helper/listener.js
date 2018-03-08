const {NativeModules} = require('react-native');
const {
  BleModule,
  ReceiveModule,
  RNNotificationBridge
} = NativeModules
const {Transaction, WalletAddress, Other, Dfu, OTA} = require('rootCore/Interface');
const EVENT = require('rootCore/config/event.js');
const Sign = require('rootCore/helper/sign.js');

exports.addListener = (EventEmitter, device) => {

  /*
  Transaction Event
  */

  EventEmitter.addListener(EVENT.GET_EXCHANGE_RATE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder
    const {data} = actualData;
    const exchangeRate = await Transaction.getExchangeRate(data);
    const {status, message} = exchangeRate;
    const eventName = "GET_EXCHANGE_RATE";

    returnToNative(eventName, status, message, device);
  })


  EventEmitter.addListener(EVENT.GET_UTXO, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder
    const {data} = actualData
    console.log('GET_UTXO:'+JSON.stringify(data))
    const {status, message}  = await Transaction.getUnspent(data)
    const eventName = "GET_UTXO"

    returnToNative(eventName, status, message, device);
  })


  EventEmitter.addListener(EVENT.GET_CALCULATING_FEE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder
    const {data} = actualData
    const txFee = await Transaction.getCalculatingFee(data)
    const {status, message} = txFee
    const eventName = "GET_CALCULATING_FEE"

    returnToNative(eventName, status, message, device);
  })


  EventEmitter.addListener(EVENT.GET_TX_FEE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder
    const {readType} = actualData.data
    const txFee = await Transaction.checkTransactionFee(readType)
    const {status, message} = txFee
    const eventName = "GET_TX_FEE"

    returnToNative(eventName, status, message, device);
  })

  EventEmitter.addListener(EVENT.GET_TX_INFO, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder
    const {readType, txHash} = actualData.data
    const txInfo = await Transaction.getTransactionInfo(readType, txHash)
    const {status, message} = txInfo
    const eventName = "GET_TX_INFO"

    returnToNative(eventName, status, message, device);
  })

  EventEmitter.addListener(EVENT.PREPARE_SIGN_DATA, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder
    const {data} = actualData
    console.log('event PREPARE_SIGN_DATA:'+JSON.stringify(data))
    const signData = await Transaction.prepareSignData(data)
    const {status, message} = signData
    const eventName = "PREPARE_SIGN_DATA"

    returnToNative(eventName, status, message, device);
  })

  EventEmitter.addListener(EVENT.DO_TRANSACTION, async (reminder) => {
    console.log('DO_TRANSACTION')
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;
    const {data} = actualData;
    const {status, message} = await Transaction.doTransaction(data)
    const eventName = "DO_TRANSACTION"

    returnToNative(eventName, status, message, device);
  })

  ////////////////////////////////////////////////////////

  /*
  Wallet Address
  */

  EventEmitter.addListener(EVENT.GEN_MNEMONIC, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {strength} = actualData.data;
    const {status, message} = WalletAddress.generateMnemonic(strength);
    const eventName = "GEN_MNEMONIC";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.CREATE_WALLET, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {strength} = actualData.data;
    const {status, message} = await WalletAddress.createWallet(strength)
    const eventName = "CREATE_WALLET";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.FINISH_BACKUP, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {checksum} = actualData.data;
    const {status, message} = await WalletAddress.finishBackup(checksum)
    const eventName = "FINISH_BACKUP";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.RECOVER_WALLET, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {mnemonicType, mnemonic, isCreate} = actualData.data;
    const {status, message} = await WalletAddress.recoverWallet(mnemonicType, mnemonic, isCreate);
    const eventName = "RECOVER_WALLET";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.GET_TX_HISTORY, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;
    const {data} = actualData;
    const {status, message} = await WalletAddress.getTransactionHistory(data)
    const eventName = "GET_TX_HISTORY";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.NEW_ADDRESS, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {keyId} = actualData.data;
    const {status, message} = await WalletAddress.addNewAddress(keyId);
    const eventName = "NEW_ADDRESS";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.GET_BALANCE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;
    const {data} = actualData;
    const {status, message} = await WalletAddress.getBalances(data);
    const eventName = "GET_BALANCE";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.SETUP_ACCOUNT, async (reminder) => {
    const {status, message} = await WalletAddress.setupAccount();
    const eventName = "SETUP_ACCOUNT";

    returnToNative(eventName, status, message, device);
  });

  ////////////////////////////////////////////////////////

  /*
  Util
  */

  EventEmitter.addListener(EVENT.REGISTER_DEVICE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {password, deviceName} = actualData.data
    const {status, message} = await Other.registerDevice(password, deviceName)
    const eventName = "REGISTER_DEVICE";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.RESET_PAIR, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {status, message} = await Other.resetPair();
    const eventName = "RESET_PAIR";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.GET_PAIR_PWD, async (reminder) => {
    const {status, message} = await Other.getPairPassword();
    const eventName = "GET_PAIR_PWD";

    returnToNative(eventName, status, message, device);
  })

  EventEmitter.addListener(EVENT.SHOW_FULL_ADDRESS, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;
    const {showFullAddress} = actualData.data;
    const {status, message} = await Other.showFullAddress(showFullAddress);
    const eventName = "SHOW_FULL_ADDRESS";

    returnToNative(eventName, status, message, device);
  })

  EventEmitter.addListener(EVENT.UPDATE_BALANCE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;
    const {data} = actualData;
    const {status, message} = await Other.updateBalance(data)
    const eventName = "UPDATE_BALANCE";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.APDU_TEST, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {data} = actualData
    const {status, message} = await Other.APDUTest(data);
    const eventName = "APDU_TEST";

    returnToNative(eventName, status, message, device);
  });

  ////////////////////////////////////////////////////////
  /*
  Other
  */
  EventEmitter.addListener(EVENT.GET_CARD_INFO, async (reminder) => {
    const {status, message} = await Other.getCardInfo();
    const eventName = "GET_CARD_INFO";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.SYNC_KEYID, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {data} = actualData
    const {status, message} = await WalletAddress.syncAddress(data);
    const eventName = "SYNC_KEYID";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.UPDATE_KEYID, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {data} = actualData
    const {status, message} = await Other.updateKeyId(data);
    const eventName = "UPDATE_KEYID";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.GET_KEYID, async (reminder) => {
    const {status, message} = await Other.getLastKeyId();
    const eventName = "GET_KEYID";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.FREEZE_PAIR, async (reminder) => {
    const {status, message} = await Other.changePairLockStatus(true);
    const eventName = "FREEZE_PAIR";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.UNFREEZE_PAIR, async (reminder) => {
    const {status, message} = await Other.changePairLockStatus(false);
    const eventName = "UNFREEZE_PAIR";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.GET_PAIRED_DEVICES, async (reminder) => {
    const {status, message} = await Other.getPairedDevices();
    const eventName = "GET_PAIRED_DEVICES";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.REMOVE_DEVICE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;
    const {removeAppId} = actualData.data;
    const {status, message} = await Other.removePairedDevice(removeAppId);
    const eventName = "REMOVE_DEVICE";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.RENAME_DEVICES, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    const {newDeviceName} = actualData.data;
    const {status, message} = await Other.renamePairedDevice(newDeviceName);
    const eventName = "RENAME_DEVICES";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.GET_SE_VERSION, async (reminder) => {
    const {status, message} = await Other.getSEVersion();
    const eventName = "GET_SE_VERSION";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.UPDATE_READTYPE, async (reminder) => {

    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;
    const {data} = actualData;

    const signData = data.typeId + data.typeVersion + Other.toHex(data.typeScript);
    console.log("signData:" + signData);
    const signature = Sign.sign(signData, data.privKey).toString('hex');
    console.log("signature:" + signature);
    const updateReadType = await APDU.updateReadType(data, signature);
    let result = {
      'event': EVENT.UPDATE_READTYPE,
      'status': 'success',
      data: updateReadType.status
    };

    if (device == 'android') {
      const androidResult = JSON.stringify(result);
      console.log('Android :' + androidResult);
      ReceiveModule.receiveData(androidResult);
    } else if (device == 'ios') {
      RNNotificationBridge.postNotification(iosResult)
    }
  });

  EventEmitter.addListener(EVENT.CANCEL_APDU, async (reminder) => {
    const {status, message} = await Other.cancelAPDU();
    const eventName = "CANCEL_APDU";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.DFU_UPDATE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder;

    // console.log("OTA file:" + JSON.parse(reminder));
    /* Input OTA data and OTA sig */
    const {status, message} = await Dfu.deviceFWUpdate(actualData);
    const eventName = "DFU_UPDATE";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.IS_APPLET_EXIST, async (reminder) => {
    const {status, message} = await OTA.selectApplet();
    const eventName = "IS_APPLET_EXIST";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.SE_UPDATE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder
    const {data} = actualData;
    const {status, message} = await OTA.SEUpdate(data);
    const eventName = "SE_UPDATE";

    returnToNative(eventName, status, message, device);
  });

  EventEmitter.addListener(EVENT.IS_NEED_SE_UPDATE, async (reminder) => {
    let actualData = typeof reminder == 'string'
      ? JSON.parse(reminder)
      : reminder

    const {data} = actualData;
    const {status, message} = await OTA.isSEUpdate(data);
    const eventName = "IS_NEED_SE_UPDATE";

    returnToNative(eventName, status, message, device);
  });
};

const returnToNative = (eventName, status, data, device) => {
  const result = {
    status,
    data,
    'event': EVENT[eventName]
  }

  if (device == 'android') {
    console.log(`Android : ${JSON.stringify(result)}`)
    ReceiveModule.receiveRN(result)
  } else if (device == 'ios') {
    console.log(`iOS : ${JSON.stringify(result)}`)
    RNNotificationBridge.postNotification(result)
  }
}

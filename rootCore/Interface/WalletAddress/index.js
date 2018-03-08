const {AsyncStorage} = require('react-native');
const rng = require('react-native-randombytes');
const Promise = require('bluebird');
const bip39 = require('rootCore/customlib/bip39.js');
const Other = require('rootCore/Interface/Other');
const APDU = require('rootCore/helper/apdu/index.js');
const Sign = require('rootCore/helper/sign.js');
const Util = require('rootCore/helper/util/index.js');
const API = require('rootCore/helper/api/index.js');
const Coin = require('rootCore/helper/coin.js');
const InformNative = require('rootCore/helper/informNative.js');
const {ethereumUtil, rippleUtil, bitcoinUtil, litecoinUtil} = require('rootCore/cryptocurrency');
const {APDUCONFIG, COINTYPE} = require('rootCore/config/index.js');
const {RESPONSE} = APDUCONFIG;
let BTC_COIN, ETH_COIN, XRP_COIN, LTC_COIN;

exports.createWallet = async (strength) => {
  try {
    const appId = await AsyncStorage.getItem('appId')
    let strength_hex = strength.toString(16)
    if (strength_hex.length % 2 > 0) strength_hex = '0' + strength_hex

    await APDU.Other.sayHi(appId)
    await APDU.Wallet.createWallet(strength_hex)

    return {status: 'success', message: ''}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.finishBackup = async (checksum) => {
  try {
    const appPrivKey = await AsyncStorage.getItem('appPrivKey');
    let hex_checksum = checksum.toString(16)
    for (let i = hex_checksum.length; i < 8; i++) hex_checksum = '0' + hex_checksum
    await APDU.Wallet.finishBackup(hex_checksum)
    await APDU.Other.closePower();

    const allAccount = await fetchAccount(true);
    const allAddress = deriveAddress(allAccount)

    return {status: 'success', message: allAddress}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.generateMnemonic = (strength) => {
  try {
    const toBit = strength * 10.7;
    const toFloor = Math.floor(toBit)
    const mnemonic = bip39.generateMnemonic(toFloor, rng.randomBytes, null, true);

    return {status: 'success', message: mnemonic}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.recoverWallet = async (mnemonicType, mnemonic, isCreate) => {
  try {
    const SEPubKey = await AsyncStorage.getItem('SEPubKey');
    const seedHex = mnemonicConvertToSeedHex(mnemonicType, mnemonic);

    await InformNative.progressBar(14);
    const encryptedSeed = Sign.ECIESenc(SEPubKey, seedHex);

    await InformNative.progressBar(28);
    const command = "SET_SEED";
    const signature = await Other.generalAuthorization(command, encryptedSeed);

    await InformNative.progressBar(42);
    const data = encryptedSeed + signature;
    await APDU.Wallet.setSeed(data);

    await InformNative.progressBar(56);
    const allAccount = await fetchAccount(isCreate);

    await InformNative.progressBar(70);
    await APDU.Other.closePower();

    await InformNative.progressBar(85);
    let allAddress;
    if (!!isCreate) {
      allAddress = await deriveAddress(allAccount);
    } else {
      allAddress = await deriveAddressExtended(allAccount);
    }
    await InformNative.progressBar(100);

    return {status: 'success', message: allAddress}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.getBalances = async (data) => {
  try {
    const allCoinBalances = await Promise.map(data, async (obj) => {
      const {coinType, addresses} = obj;

      if (coinType == COINTYPE.ETH.type) {
        const allAddress = addresses.join(',');
        const getAddress = await API.ETH.getAddressesBalance(allAddress);
        const balances = await Promise.map(getAddress, (a) => {
          const {account, balance} = a;
          const etherBalance = Util.ETH.weiToEther(balance);
          return {address: account, balance: etherBalance};
        });
        return {coinType, balances};

      } else if (coinType == COINTYPE.BTC.type) {
        const allAddress = addresses.join('|');
        const getAddress = await API.BTC.getAddressesBalance(allAddress);
        const balances = await Promise.map(getAddress.addresses, (a) => {
          const {address, final_balance} = a;
          const btcBalance = Util.BTC.satoshiToBtc(final_balance);
          return {address: address, balance: btcBalance};
        });
        return {coinType, balances};
      } else if (coinType == COINTYPE.XRP.type) {
        const balances = await Promise.map(addresses, async (address) => {
          const balance = await API.XRP.getAddressesBalance(address);

          return { address, balance: balance.toString(10) };
        });
        return { coinType, balances };
      } else if (coinType == COINTYPE.LTC.type) {
        const balances = await Promise.map(addresses, async (a) => {
          let address = a;
          const {addressBalance} = await API.LTC.getAddressesBalance(address);
          return {address: address, balance: addressBalance};
        }, {concurrency: 2});
        return {coinType, balances};
      }
    });

    return {status: 'success', message: allCoinBalances}
  } catch (e) {
    console.log("get balance failed:"+e)
    return {status: 'failed', message: e}
  }
}

exports.syncAddress = async (AllKeyId) => {
  try {
    let newFlag = false;
    const newestKeyId = [];
    const cardKeys = await Other.getLastKeyId();
    console.log(`CardKeyId : ${JSON.stringify(cardKeys)}`);
    newCoin(1);

    await Promise.map(AllKeyId, async (appKeyId) => {
      const appCoinType = appKeyId.slice(0, 2);
      const {message} = cardKeys;

      let cardIndex = message.find((cardKey) => {
        const cardCoinType = cardKey.slice(0, 2);
        return cardCoinType.toUpperCase() == appCoinType.toUpperCase();
      });
      cardIndex = cardIndex.toUpperCase();

      const appAddressLastIndex = appKeyId.slice(6);
      const cardAddressLastIndex = cardIndex.slice(6);
      const appAddressLastIndexNum = parseInt(appAddressLastIndex, 16);
      const cardAddressLastIndexNum = parseInt(cardAddressLastIndex, 16);

      if (appAddressLastIndexNum >= cardAddressLastIndexNum) {
        if (appAddressLastIndexNum > cardAddressLastIndexNum) {
          newFlag = true;
        }

        newestKeyId.push(appKeyId);
      } else {
        const startIndex = appAddressLastIndexNum;
        const endIndex = cardAddressLastIndexNum;

        newestKeyId.push(cardIndex);

        const {publicKey, chainCode} = await Util.OTHER.getKeyAndChainFromHDAccount(cardIndex);
        const tempArr = new Array(endIndex - startIndex);
        await Promise.map(tempArr, (i, index) => {
          if (!publicKey || !chainCode) return;
          const keyId = incrementKeyId(appKeyId, index + 1);  // plus one cause index start from 0
          const addressKey = Util.OTHER.derive(publicKey, chainCode, keyId)
          const address = pubKeyToAddress(appCoinType, addressKey)

          insertAddress(keyId, address);
        });
      }
    })

    if (!!newFlag) {
      await Other.updateKeyId(newestKeyId);
    }

    const result = getCoin();

    return {status: 'success', message: result}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.addNewAddress = async (keyId) => {
  try {
    const coinType = keyId.slice(0, 2)
    const accountIndex = keyId.slice(2, 4)
    const totalAccount = 1;
    const {publicKey, chainCode} = await Util.OTHER.getKeyAndChainFromHDAccount(keyId);
    const address_key = Util.OTHER.derive(publicKey, chainCode, keyId)
    const address = pubKeyToAddress(coinType, address_key)
    let COIN_ADDRESS;

    switch (coinType) {
      case COINTYPE.BTC.type:
        COIN_ADDRESS = new Coin(COINTYPE.BTC.type, totalAccount, accountIndex);
        break;
      case COINTYPE.ETH.type:
        COIN_ADDRESS = new Coin(COINTYPE.ETH.type, totalAccount, accountIndex);
        break;
      case COINTYPE.XRP.type:
        COIN_ADDRESS = new Coin(COINTYPE.XRP.type, totalAccount, accountIndex);
        break;
      case COINTYPE.LTC.type:
        COIN_ADDRESS = new Coin(COINTYPE.LTC.type, totalAccount, accountIndex);
        break;
      default:
    }
    COIN_ADDRESS.setChainAndAddress(keyId, address)

    const result = [COIN_ADDRESS.getAccount()];
    return {status: 'success', message: result}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.getTransactionHistory = async (data) => {
  try {
    const allCoinTxHistory = await Promise.map(data, async (d) => {
      const {coinType, addresses} = d;
      if (coinType == COINTYPE.ETH.type) {
        const data = await ethereumUtil.getTransactionHistory(addresses);
        return {coinType, data};
      } else if (coinType == COINTYPE.BTC.type) {
        const data = await bitcoinUtil.getTransactionHistory(addresses);
        return {coinType, data};
      } else if (coinType == COINTYPE.XRP.type) {
        const data = await rippleUtil.getTransactionHistory(addresses);
        return {coinType, data};
      }else if (coinType == COINTYPE.LTC.type) {
        if(coinType=="01"){
          const data = await litecoinUtil.getTransactionHistoryTestNet(addresses);
          return {coinType, data};
        }else{
          const data = await litecoinUtil.getTransactionHistory(addresses);
          return {coinType, data};
        }
        // const data = await litecoinUtil.getTransactionHistory(addresses);
        return {coinType, data};
      }
    })

    return {status: 'success', message: allCoinTxHistory}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

exports.setupAccount = async () => {
  try {
    await InformNative.progressBar(30);
    const allAccount = await fetchAccount();

    await InformNative.progressBar(65);
    const allAddress = await deriveAddressExtended(allAccount);

    await InformNative.progressBar(100);
    return {status: 'success', message: allAddress}
  } catch (e) {
    return {status: 'failed', message: e}
  }
}

const fetchAccount = async (isCreate) => {
  try {
    const appPrivKey = await AsyncStorage.getItem('appPrivKey');

    const command = "AUTH_EXT_KEY";
    const signature = await Other.generalAuthorization(command);
    await APDU.Wallet.authGetExtendedKey(signature)

    const allAccount = await getAccountKey(appPrivKey, isCreate);
    await AsyncStorage.setItem('HDAccount', JSON.stringify(allAccount));

    return allAccount;
  } catch (e) {
    throw e;
  }
}

const deriveAddress = (array_of_data) => {
  try {
    const totalAccount = 1
    newCoin(totalAccount);
    array_of_data.map((obj) => {
      const {publicKey, chainCode, keyId} = obj;
      const address = deriveAndGetAddress(publicKey, chainCode, keyId);
      insertAddress(keyId, address);

      return;
    })
    const result = getCoin();

    return result
  } catch (e) {
    return e
  }
}

const deriveAddressExtended = async (array_of_data) => {
  try {
    newCoin();
    await Promise.map(array_of_data, (obj) => {
      const {publicKey, chainCode, keyId} = obj
      return checkBalance(publicKey, chainCode, keyId)
    })

    const result = getCoin();

    return result
  } catch (e) {
    return e
  }
}

const getAddresses = (ntimes, addresses, data) => {
  try {
    if (ntimes <= 0) {
      return addresses;
    }
    const { publicKey, chainCode, keyId } = data;
    const incKeyId = incrementKeyId(keyId, ntimes - 1);
    const address = deriveAndGetAddress(publicKey, chainCode, incKeyId);

    return getAddresses(--ntimes, [...addresses, { address, keyId: incKeyId }], data);
  } catch (e) {
    throw "Failed Check balance"
  }
}

const checkBalance = async (publicKey, chainCode, keyId) => {
  try {
    const coinType = keyId.slice(0, 2)
    const maxDeriveAddress = 5;
    let concurrency = coinType != COINTYPE.LTC.type ? {concurrency: 5} : {concurrency: 2};
    let flag = false;
    let deriveIndex = 5;
    let copyOfKeyId = keyId;
    let isNewSeed = true;
    let flagUsedAddress = -1;
    let availableAddress = [];

    while (!flag) {
      const data = { publicKey, chainCode, keyId: copyOfKeyId };
      const addresses = getAddresses(deriveIndex, [], data);
      addresses.reverse();

      const listAddressIsUsed = await Promise.map(addresses, async (obj, index) => {
        const {address} = obj
        let isAddressUsed = false;
        let transactionCount = 0;
        switch (coinType) {
          case COINTYPE.BTC.type:
            const btcRawTx_count = await API.BTC.getAddressTransaction(address)
            transactionCount = btcRawTx_count.addresses[0].n_tx;
            break;
          case COINTYPE.ETH.type:
            const rawTx_count = await API.ETH.getAddressTransaction(address)
            transactionCount = rawTx_count.length;
            break;
          case COINTYPE.LTC.type:
            const getTransaction= await API.LTC.getAddressTransaction(address)
            transactionCount = getTransaction.n_tx
            break;
          case COINTYPE.XRP.type:
            transactionCount = await API.XRP.getAddressesBalance(address)
            break;
          default:
            break;
        }

        if (transactionCount > 0) {
          isAddressUsed = true;
        }

        return isAddressUsed;
      }, concurrency);

      if (listAddressIsUsed.lastIndexOf(true) >= 0) {
        isNewSeed = false;
        flagUsedAddress = listAddressIsUsed.lastIndexOf(true) + 1;
      }

      // if flagUsedAddress < 1 => there no used address anymore
      if (flagUsedAddress < 0) {
        // all address havent be used yet. Only use the first index = 0
        flag = true;
        if (!!isNewSeed) availableAddress = [addresses[0]];
      } else {
        availableAddress = [...availableAddress, ...addresses.slice(0, flagUsedAddress)];
        copyOfKeyId = incrementKeyId(copyOfKeyId, deriveIndex);
        deriveIndex = maxDeriveAddress - (deriveIndex - (flagUsedAddress));
        flagUsedAddress = -1;
      }
    }

    await Promise.map(availableAddress, (a) => {
      const {keyId, address} = a;
      insertAddress(keyId, address);
    })

    return
  } catch (e) {
    throw e
  }
}

/*
  Type 01 => English word
  Type 02 => First generation card, pure number
  Type 03 => Second generation card, [number] => [english word]
*/

const mnemonicConvertToSeedHex = (type, mnemonic) => {
  try {
    let seedHex
    if (type == '01') seedHex = bip39.mnemonicToSeedHex(mnemonic)
    else if (type == '02') seedHex = bip39.mnemonicToSeedHex(mnemonic)
    else if (type == '03') seedHex = bip39.mnemonicToSeedHex(mnemonic, '', true)
    else throw 'Invalid Mnemonic Type'

    return seedHex
  } catch (e) {
    throw e
  }
}

const incrementKeyId = (keyId, plus) => {
  let copyOfKeyId = keyId
  let temp = Buffer.from(copyOfKeyId, 'hex')
  let index = temp.slice(temp.length - 1)
  index = parseInt(index.toString('hex'), 16)
  index += plus
  index = index.toString(16)
  index = fitZero(index)
  copyOfKeyId = keyId.slice(0, keyId.length - 2) + index

  return copyOfKeyId
}

const deriveAndGetAddress = (publicKey, chainCode, keyId) => {
  try {

    const coinType = keyId.slice(0, 2)
    const address_key = Util.OTHER.derive(publicKey, chainCode, keyId)

    return pubKeyToAddress(coinType, address_key);
  } catch (e) {
    throw e;
  }
}

const newCoin = (account) => {
  try {
    const bitcoinAccount = account || COINTYPE.BTC.account;
    const etherAccount = account || COINTYPE.ETH.account;
    const litecoinAccount = account || COINTYPE.XRP.account;
    const rippleAccount = account || COINTYPE.XRP.account;

    BTC_COIN = new Coin(COINTYPE.BTC.type, bitcoinAccount);
    ETH_COIN = new Coin(COINTYPE.ETH.type, etherAccount);
    XRP_COIN = new Coin(COINTYPE.XRP.type, rippleAccount);
    LTC_COIN = new Coin(COINTYPE.LTC.type, litecoinAccount);

    return;
  } catch (e) {
    throw e;
  }
}

const getCoin = () => {
  const tempArr = [
    BTC_COIN.getAccount(),
    ETH_COIN.getAccount(),
    LTC_COIN.getAccount(),
    XRP_COIN.getAccount(),
  ];

  const newArr = tempArr
    .filter((d) => {
      return d != null;
    })

  return newArr;
}

const insertAddress = (keyId, address) => {
  const coinType = keyId.slice(0, 2);
  switch (coinType) {
    case COINTYPE.BTC.type:
      BTC_COIN.setChainAndAddress(keyId, address)
      break;
    case COINTYPE.ETH.type:
      ETH_COIN.setChainAndAddress(keyId, address)
      break;
    case COINTYPE.LTC.type:
      LTC_COIN.setChainAndAddress(keyId, address)
      break;
    case COINTYPE.XRP.type:
      XRP_COIN.setChainAndAddress(keyId, address)
      break;
    default:
      break;
  }
}

/*
  test case :
  private key = 96536ebf200a725e84200db48cbf2e23b85dc0729060ea79d18cbbc32a86c480
  public key = 042bcbd679a16a496041b3ceb031af1dbce50056c6c736b0f64e86c29c15da3c9e62a455fbcbab6b9d0377af337eab8db1c414f71771610acaa98198e3619b5fa0
*/

const getAccountKey = async (appPrivKey, isCreate) => {
  let result = []
  const supportedCoin = await Util.OTHER.getSupportedCoin();

  for (let i = 0; i < supportedCoin.length; i++) {
    // Create Wallet only create one account and one chain
    // Recover Wallet for bitcoin are 5 account and two chain
    const totalAccount = !!isCreate ? 1 : COINTYPE[supportedCoin[i]].account
    for (let j = 0; j < totalAccount; j++) {
      let acc_num = j.toString(16)
      if (acc_num.length % 2 > 0) acc_num = '0' + acc_num

      const encryptedAcc_response = await APDU.Wallet.getAccountExtendedKey(COINTYPE[supportedCoin[i]].type, acc_num)
      const {outputData} = encryptedAcc_response
      const decryptedData = Sign.ECIESDec(appPrivKey, outputData)
      if (!decryptedData) throw "Decryption Failed"

      const accBuf = Buffer.from(decryptedData, 'hex')
      const publicKey = accBuf.slice(0, 33)
      const chainCode = accBuf.slice(33)
      let chainIndex = Buffer.from([0])
      chainIndex = chainIndex.toString('hex')
      const defaultAccountIndex = '0000'
      const keyId = COINTYPE[supportedCoin[i]].type + acc_num + chainIndex + defaultAccountIndex

      const obj = {
        keyId,
        publicKey: publicKey.toString('hex'),
        chainCode: chainCode.toString('hex')
      }
      result.push(obj)
    }
  }

  return result
}

const pubKeyToAddress = (coinType, addressKey) => {
  let address;

  switch (coinType) {
    case COINTYPE.ETH.type:
      address = ethereumUtil.pubKeyToAddress(addressKey);
      break;
    case COINTYPE.XRP.type:
      address = rippleUtil.pubKeyToAddress(addressKey);
      break;
    case COINTYPE.BTC.type:
      address = bitcoinUtil.pubKeyToAddress(addressKey);
      break;
    case COINTYPE.LTC.type:
      address = litecoinUtil.pubKeyToAddress(addressKey);
      break;
    default:
      break;
  }
  return address
}

const fitZero = (data) => {
  let temp = data
  if ((temp.length % 2) != 0) {
    temp = `0${temp}`
  }
  return temp
}

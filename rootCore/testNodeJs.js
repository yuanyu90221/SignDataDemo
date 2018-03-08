// const bitcoin = require('bitcoinjs-lib');
const createHash = require('bitcoinjs-lib').crypto
const rlp = require('./customlib/rlp')
const KeyEncoder = require('./customlib/keyencoder.js');
const keyencoder = new KeyEncoder('secp256k1');
const Buffer = require('buffer').Buffer
const crypto = require('./customlib/crypto.js')
const sign = crypto.createSign('sha256')
const WIF = require('wif')
const bitcoin = require('./customlib/bitcoin.min.js');
// const bitcoin = require('react-native-bitcoinjs-lib');
// const bitcoin = require('bitcoinjs-lib');
const bs58check = require('bs58check')
const Promise = require('bluebird');
const cashaddr = require('cashaddrjs');

function testBech32(){

}

function checkTransactionType(txout) {

  txout = '36NUkt6FWUi3LAWBqWRdDmdTWbt91Yvfu7'
  const outType = bitcoin.address.fromBase58Check(txout)// { hash: hash, version: version }
  const hash = out.hash
  const version = out.version
  console.log(`hash:${hash.toString('hex')}`, version)

  const toOutputScript = bitcoin.address.toOutputScript(txout)
  console.log(`toOutputScript:${toOutputScript.toString('hex')}`)


}

// function testSegitTx() {
//   const testnet = bitcoin.networks.bitcoin
//   // var keyPair = bitcoin.ECPair.fromWIF('cSiGmUBz3Hb8fLp6mHPZEZB8U5DqTy7RfEjSXZuomesvMA8pe5Ej', testnet)
//   // var pubKey = keyPair.getPublicKeyBuffer()
//   let pubKey = Buffer.from('03fac6879502c4c939cfaadc45999c7ed7366203ad523ab83ad5502c71621a85bb', 'hex')
//   var pubKeyHash = bitcoin.crypto.hash160(pubKey)
//   console.log('pubKeyHash:' + pubKeyHash.toString('hex'))
//   var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(pubKeyHash)
//   console.log('redeemScript:' + redeemScript.toString('hex'))
//   var redeemScriptHash = bitcoin.crypto.hash160(redeemScript)
//   console.log('redeemScriptHash:' + redeemScriptHash.toString('hex'))
//   var scriptPubKey = bitcoin.script.scriptHash.output.encode(redeemScriptHash)
//   console.log('scriptPubKey:' + scriptPubKey.toString('hex'))
//   var address = bitcoin.address.fromOutputScript(scriptPubKey, testnet)
//
//   //2MtHHC2h3ryvsg6ie4UKpZXwdT8Cto3MYiY
//   //2N4atc75oooYXeWyq5FwNtuu9YRKQ7gs9Z7
//   console.log('address:' + address)
//
//   console.log()
//   // var txb = new bitcoin.TransactionBuilder(testnet)
//   // txb.addInput('a0d4756ace5ab8daecf12a30b676eec1c462a592f356398b1f4b03382db5f079', 1)
//   // txb.addOutput('2N8YNoAEdpzvTbdBHB2Q8LAhGNSNokWG41d', 30000)
//   // txb.addOutput('2N4atc75oooYXeWyq5FwNtuu9YRKQ7gs9Z7', 100966648)
//   // txb.sign(0, keyPair, redeemScript, null, 100998898)
//   //
//   // var tx = txb.build()
//   //
//   // console.log('tx:'+tx.toHex())
// }

function testDsha256() {


  // hashOutputs.append("3075000000000000");
  // hashOutputs.append("1976a9147a469ef3614f7a5b2628cb955e22017039c9660588ac");
  // hashOutputs.append("d94a8e0500000000");
  // hashOutputs.append("1976a914b306df8af4b3d2d4f133f729d7857bb3942c392888ac");
  // 30750000000000001976a9147a469ef3614f7a5b2628cb955e22017039c9660588acd94a8e05000000001976a914b306df8af4b3d2d4f133f729d7857bb3942c392888ac

  const sha256 = crypto.createHash('sha256');
  const secondsha256 = crypto.createHash('sha256');

  const data = '30750000000000001976a9147a469ef3614f7a5b2628cb955e22017039c9660588acf1468e05000000001976a914b306df8af4b3d2d4f133f729d7857bb3942c392888ac'
  var hashOutputs = bitcoin.crypto.hash256(data)

  const hashone = sha256.update(Buffer.from(data, 'hex')).digest();
  const hashone2 = secondsha256.update(Buffer.from(hashone, 'hex')).digest();

  console.log(`lib hashOutputs:${hashone2.toString('hex')}`)
  console.log(`hashOutputs:${hashone2.toString('hex')}`)


}

function toOutputScript() {
  // const address = '3AYbYJmr76DXVZwi7ozVv9ats5scmkYbZr'
  // const script_hex = bitcoin.address.toOutputScript(address);
  // console.log('script:'+script_hex.toString('hex'))

  const address = "1MnYVM2uTjRazXD6DmgvaUzFM4k9VPbZqV"
  decode = bitcoin.address.toOutputScript(address)//fromBase58Check(address)
  // const result = JSON.stringify(decode)
  console.log(decode.toString('hex'))

}


function testSegitTx() {
  console.log('範例segwit')
  const testnet = bitcoin.networks.testnet
  var keyPair = bitcoin.ECPair.fromWIF('cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN87JcbXMTcA', testnet)
  var pubKey = keyPair.getPublicKeyBuffer()
  var pubKeyHash = bitcoin.crypto.hash160(pubKey)
  var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(pubKeyHash)
  var redeemScriptHash = bitcoin.crypto.hash160(redeemScript)
  var scriptPubKey = bitcoin.script.scriptHash.output.encode(redeemScriptHash)
  var address = bitcoin.address.fromOutputScript(scriptPubKey, testnet)
  var txb = new bitcoin.TransactionBuilder(testnet)
  txb.addInput('a0d4756ace5ab8daecf12a30b676eec1c462a592f356398b1f4b03382db5f079', 1)
  txb.addOutput('2N8YNoAEdpzvTbdBHB2Q8LAhGNSNokWG41d', 990000)
  txb.addOutput('2N4atc75oooYXeWyq5FwNtuu9YRKQ7gs9Z7', 100000000)
  txb.sign(0, keyPair, redeemScript, null, 100998898)
  var tx = txb.build()
  console.log('tx:' + tx.toHex())
}

function createSegwitTx() {
  // cSiGmUBz3Hb8fLp6mHPZEZB8U5DqTy7RfEjSXZuomesvMA8pe5Ej
  // var keyPair = bitcoin.ECPair.fromWIF('cRgnQe9MUu1JznntrLaoQpB476M8PURvXVQB5R2eqms5tXnzNsrr',bitcoinjs.networks.testnet)
  // var pubKey = Buffer.from('02589e439fb9ca4227032885ce8a754a292d77a0f00fcb267148c62a21a5e3b13d','hex')

  // var keyPair = bitcoin.ECPair.makeRandom({network: bitcoin.networks.testnet});
  // // var pubKey = keyPair.getPublicKeyBuffer()
  // var pubKey = new Buffer('023f2b0d3ec11ee862880f46dffccf668215046b4d6a52f74dfe4a402e8f158c79', 'hex');
  // var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubKey))//(pubKey))
  // var scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript))
  // var address = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet)
  //
  //
  // console.log(`address:${address.toString('hex')}`)
  // console.log(`scriptPubKey:${scriptPubKey.toString('hex')}`)
  // console.log(`redeemScript:${redeemScript.toString('hex')}`)
  //
  // var txb = new bitcoin.TransactionBuilder(bitcoin.networks.testnet)
  // txb.addInput('53cd88e0f67550b106fbcc070e16617fe8a8f53ed041cc04bc5619a898038497', 0)
  // txb.addOutput('mrfVLHQBPSD5WJghXxRHFSN1cURCZcXFSC', 30000)
  // txb.addOutput('2MtHHC2h3ryvsg6ie4UKpZXwdT8Cto3MYiY ', 90000)
  // // txb.sign(0, keyPair, redeemScript, null, 93242603)
  // txb.sign(0, keyPair)
  // var tx = txb.build()
  // console.log('tx:' + tx.toHex())
  console.log('測試segwit')
  const testnet = bitcoin.networks.testnet
  var keyPair = bitcoin.ECPair.fromWIF('cNEMQ96NtQixWrUbXTQ4dqJVQnDMUyuhVDmwR2muyQ14VK1pDGe4', testnet)
  var pubKey = keyPair.getPublicKeyBuffer()
  var pubKeyHash = bitcoin.crypto.hash160(pubKey)

  var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(pubKeyHash)
  var redeemScriptHash = bitcoin.crypto.hash160(redeemScript)

  var scriptPubKey = bitcoin.script.scriptHash.output.encode(redeemScriptHash)
  var address = bitcoin.address.fromOutputScript(scriptPubKey, testnet)
  console.log(`address:${address.toString('hex')}`)
  var txb = new bitcoin.TransactionBuilder(testnet)
  txb.addInput('453c432e8cbcdbdfffd7fe0f403a5f27171ea241ff401acc2fab85a512cb2233', 0)
  txb.addOutput('mhNpP4mP81ZKnkh9MMA9TQDY4YcU7Kmiyk', 30000000)
  txb.addOutput('mkprJYbYckoHPdWrwDWE5hLjefuUEz2gVn', 169867250)
  txb.sign(0, keyPair, null);
  // txb.sign(0, keyPair, redeemScript, null, 65000000)
  // txb.sign(1,keyPair,redeemScript,null,130000000)
  var tx = txb.build()
  console.log('tx:' + tx.toHex())
  // testnetUtils.faucet(address, 5e4, function (err, unspent) {
  //   if (err) return done(err)
  //
  //   var txb = new bitcoin.TransactionBuilder(testnet)
  //   txb.addInput(unspent.txId, unspent.vout)
  //   txb.addOutput(testnetUtils.RETURN_ADDRESS, 4e4)
  //   txb.sign(0, keyPair, redeemScript, null, unspent.value)
  //
  //   var tx = txb.build()
  //
  //   // build and broadcast to the Bitcoin Testnet network
  //   // testnetUtils.transactions.propagate(tx.toHex(), function (err) {
  //   //   if (err) return done(err)
  //   //
  //   //   testnetUtils.verify(address, tx.getId(), 1e4, done)
  //   // })
  // })

}

function generateTestnetAddress() {
  //testnet II
  var network = bitcoin.networks.litecoin
  let publicKey = new Buffer('03131b1a0cd193e8d96c7d39ed5d62e59811bf4416bf750d8c30ab9c85f17fb7d5', 'hex')
  var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(Buffer.from(publicKey, 'hex')))//(pubKey))
  var scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(redeemScript))
  address = bitcoin.address.fromOutputScript(scriptPubKey, network)
  console.log('正式p2sh地址:' + address)

  address = bitcoin.ECPair.fromPublicKeyBuffer(publicKey, network).getAddress();
  console.log('正式p2pkh地址:' + address)
}

function testBTCAddress() {
  // let publicKey = new Buffer('04ba2416481d6260e621d8f2b6aad3e9c51d438c1876b624303a16f2bcf8a06cd695cef87230180ceed5735e7bf6cb3f9db360f6fee50824c85f230a6bb3ca9573', 'hex')
  // let publicKey = new Buffer('03ba2416481d6260e621d8f2b6aad3e9c51d438c1876b624303a16f2bcf8a06cd6', 'hex')
  // let address = bitcoin.ECPair.fromPublicKeyBuffer(Buffer.from(publicKey, 'hex'), bitcoin.networks.bitcoin).getAddress();
  // console.log("non-segwit address:" + address)
  //
  // let witnessScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(publicKey))
  // let scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(witnessScript))
  // address = bitcoin.address.fromOutputScript(scriptPubKey)
  // console.log("segwit address:" + address)

  // testnet
  let testnet = bitcoin.networks.testnet
  let keyPair = bitcoin.ECPair.makeRandom({network: testnet})
  let pubKey = keyPair.getPublicKeyBuffer()
  let witnessScript = bitcoin.script.witnessPubKeyHash.output.encode(bitcoin.crypto.hash160(pubKey))
  let scriptPubKey = bitcoin.script.scriptHash.output.encode(bitcoin.crypto.hash160(witnessScript))
  address = bitcoin.address.fromOutputScript(scriptPubKey, bitcoin.networks.testnet)
  console.log('產生testnet segwit地址:' + address)
}

function doubleHash256() {

  const preVouts = Buffer.from('fff7f7881a8099afa6940d42d1e7f6362bec38171ea3edf433541db4e4ad969f00000000ef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a01000000', 'hex')
  let result = createHash.hash256(preVouts)
  console.log('preVouts:' + result.toString('hex'))

  const seq = Buffer.from('eeffffffffffffff', 'hex')
  let seq_result = createHash.hash256(seq)
  console.log('seq:' + seq_result.toString('hex'))

  const outputs = Buffer.from('202cb206000000001976a9148280b37df378db99f66f85c95a783a76ac7a6d5988ac9093510d000000001976a9143bde42dbee7e4dbe6a21b2d50ce2f0167faa815988ac', 'hex')
  let outputs_result = createHash.hash256(outputs)
  console.log('outputs_result:' + outputs_result.toString('hex'))

  const hashPreimage = Buffer.from('0100000096b827c8483d4e9b96712b6713a7b68d6e8003a781feba36c31143470b4efd3752b0a642eea2fb7ae638c36f6252b6750293dbe574a806984b8e4d8548339a3bef51e1b804cc89d182d279655c3aa89e815b1b309fe287d9b2b55d57b90ec68a010000001976a9141d0f172a0ecb48aee1be1f2687d2963ae33f71a188ac0046c32300000000ffffffff863ef3e1a92afbfdb97f31ad0fc7683ee943e9abcf2501590ff8f6551f47e5e51100000001000000', 'hex')
  let sigHash = createHash.hash256(hashPreimage)
  console.log('sigHash:' + sigHash.toString('hex'))

  // '0x610x9c0x330x500x250xc70xf40x010x2e0x550x6c0x2a0x580xb20x500x6e0x300xb80x510x1b0x530xad0xe90x5e0xa30x160xfd0x8c0x320x860xfe0xb9'

  const privateKey = Buffer.from('619c335025c7f4012e556c2a58b2506e30b8511b53ade95ea316fd8c3286feb9', 'hex')
  let key = WIF.encode(128, privateKey, true)
  console.log('prv:' + key)

  var keyPair = bitcoin.ECPair.fromWIF(key, bitcoin.networks.bitcoin)
  var pubKey = keyPair.getPublicKeyBuffer().toString('hex')
  var pubKeyHash = bitcoin.crypto.hash160(pubKey).toString('hex')
  console.log('pubKey:' + pubKey, 'pubKeyHash:' + pubKeyHash)

  const signature = keyPair.sign(sigHash).toScriptSignature(0x01)
  console.log('signature:' + signature.toString('hex'))

}

function createP2sh_P2wpkh_input() {
  // var keyPair = bitcoin.ECPair.fromWIF('cMahea7zqjxrtgAbB7LSGbcQUr1uX1ojuat9jZodMN87JcbXMTcA', testnet)
  // var pubKey = keyPair.getPublicKeyBuffer()

  const pubKey = new Buffer('03ad1d8e89212f0b92c74d23bb710c00662ad1470198ac48c43f7d6f93a2a26873', "hex");

  var pubKeyHash = bitcoin.crypto.hash160(pubKey)
  console.log(`pubKeyHash:${pubKeyHash.toString('hex')}`)
  var redeemScript = bitcoin.script.witnessPubKeyHash.output.encode(pubKeyHash)
  console.log(`redeemScript:${redeemScript.toString('hex')}`)
  var redeemScriptHash = bitcoin.crypto.hash160(redeemScript)

  console.log(`redeemScriptHash:${redeemScriptHash.toString('hex')}`)

}

function testWitness_p2wsh() {
  var keyPairs = [
    'tprv8jHUtUt75gK3nFRSSCQAbrHsdjGJKj7y1HmUzqDTrHyjpM7K4g5YXSdY3WobZwwdkJK1sEG5ZheUcjGFFzJuBKaNzqCvzGLgaVY7aVkYvHh',
    'tprv8k97oTF9aSAcB8vpDNUH3eqje4avFbhTLBLhXDcUZPtGjjLTbT1AuN41TfBB4awgiEzVPbMVjDReBuoABqESUFpEubBr5XiM8ji9HSjt46h'
  ].map(function (xpriv) {
    return bitcoin.HDNode.fromBase58(xpriv, testnet).keyPair;
  });

  var pubKeys = keyPairs.map(function (xpub) {
    return xpub.getPublicKeyBuffer()
  });

  var witnessScript = bitcoin.script.multisig.output.encode(2, pubKeys)
  var witnessScriptHash = bitcoin.crypto.sha256(witnessScript)

  var redeemScript = bitcoin.script.witnessScriptHash.output.encode(witnessScriptHash)
  var redeemScriptHash = bitcoin.crypto.hash160(redeemScript)
  var scriptPubKey = bitcoin.script.scriptHash.output.encode(redeemScriptHash)
  var address = bitcoin.address.fromOutputScript(scriptPubKey, testnet)

  console.log(address);

  var txb = new bitcoin.TransactionBuilder(testnet)
  txb.addInput('e58216a8ccf3e1b7c892dd6afee0d86435c28cbf25fc210c99c60a7aee9dadbc', 1)
  txb.addOutput(address, 150000)
  txb.sign(0, keyPairs[0], redeemScript, null, 200000, witnessScript)
  txb.sign(0, keyPairs[1], redeemScript, null, 200000, witnessScript)

  var tx = txb.build()
  var txid = tx.getId()
  var txhex = tx.toHex();

  console.log(`txid:${txid}`);
  console.log(`txhex:${txhex}`);

  // [nVersion]
  // 01000000
  //     [marker]
  // 00
  //     [flag]
  // 01
  //     [txins]
  // 01
  // bcad9dee7a0ac6990c21fc25bf8cc23564d8e0fe6add92c8b7e1f3cca81682e5
  // 01000000
  // 23220020e456ff0d750f366d2aaa88376dd9f3920043bb6f550c3202ca13ec588a6036dd
  // ffffffff
  //     [txouts]
  // 01
  // f049020000000000
  // 17 a9149825be0377829cf801c5f61081b52dbecbe95d0887040047304402203a0a108ca3c659f707c5c2691a2386810b1fbd314d8a65246bde62c6485c13dd022065a7277d67da276e45a2b5ec2601565b039d1ccedf1e828cf62cfb746eac6d5401473044022025de5fe30108efa15ea6355dbf3956195534d1df27172c95d7b60b47bfec4863022046890684866f1f14e4bc4981c0b55961c1e28b4c01bd34a7eff5063bb764165b0147522103d3c0c9882c564dac791af0066a0fb2bb9a6065729b1388dfd744b814696528a2210255abcf9df14070d1e010ad07a5f85944fe7fecaf539aa4efcdbce92e6e7b4adb52ae00000000
}

// const {AsyncStorage} = require('react-native');


function fromOutputScript() {
  let script = '76a914027d3f3c7c3cfa357d97fbe7d80d70f4ab1cac0d88ac'
  let addr = bitcoin.address.fromOutputScript(script)
  console.log(addr)
}

function signData(data, rawpriv) {
  try {
    data = Buffer.from(data, 'hex')
    sign.update(data)

    const privateKey = keyencoder.encodePrivate(rawpriv, 'raw', 'pem');
    const signature = sign.sign(privateKey)

    return signature
  } catch (e) {
    throw "Failed to Sign"
  }
}

function assemblySingData() {
  // const tempPayload = '010000000188fd8402286041ab66d230bd23592b75493e5be21f8694c6491440aad7117bfc000000001976a914027d3f3c7c3cfa357d97fbe7d80d70f4ab1cac0d88acffffffff0210270000000000001976a91439af5ea4dd0b3b9771945596fa3d4ed3ff76170588ac88180000000000001976a914027d3f3c7c3cfa357d97fbe7d80d70f4ab1cac0d88ac0000000081000000';
  // const payload = tempPayload;//Buffer.from(tempPayload,'hex')
  // const tmoSignData = createHash.hash256(Buffer.from(payload, 'hex')) //double sha256 payload
  // const signData = tmoSignData.toString('hex')
  // const readType = '00';
  // const keyId = '0000000005';
  // const inputId = '00';
  // // console.log('dSha256Sign1:' + dSha256Sign1.toString('hex'))
  // const prepData = {inputId: '00', signData, readType, keyId, payload};
  // const fields = ["inputId", "signData", "readType", "keyId", "payload"];
  // let temp = [];
  //
  // // const result = inputId + signData.toString('hex') + readType + keyId + payload
  // // console.log('result:' + result)
  // // const rlpSignData = rlp.encode(Buffer.from(result,'hex')) //rlp.encode(result)//
  // // console.log('rlpSignData:' + rlpSignData.toString('hex'))
  //
  //
  // fields.forEach((key) => {
  //     // if (key == 'payload') {
  //     //     console.log('1:'+key + ':' + prepData[key])
  //     //     temp.push(prepData[key])
  //     // } else {
  //     console.log(prepData[key])
  //     const toBuf = Buffer.from(prepData[key], 'hex')
  //     console.log('tuBuf:'+toBuf.toString('hex'))
  //     temp.push(toBuf)
  //     // }
  // })
  // let encodedTemp = rlp.encode(temp)
  // console.log('encodedTemp:' + encodedTemp.toString('hex'))
  //
  //


  // const {TX_PREPARE} = COMMAND
  // const command = TX_PREPARE.CLA + TX_PREPARE.INS + TX_PREPARE.P1 + TX_PREPARE.P2
  // let signature_params = command + rlpSignData.toString('hex')
  // const appKey= 'b8c4cb218f0e4d31ae51bcea2081de7dba14be711197a4efb7c73c2721c8282'
  // const appKey = await AsyncStorage.getItem('appPrivKey');
  // console.log('appKey:' + appKey.toString('hex'))
  // const signature = signData(Buffer.from(signature_params, 'hex'), appKey)
  // const result = encodedTemp.toString('hex') + signature.toString('hex')
  // console.log('result:' + result)

  const inputId = '00'
  const readtype = '01'
  const keyid = '0000000005'
  const tempPayload = '01000000a2c0d9aa66bc2a92bfdd22f6f05e3eda486f80015079a5144d732f157b5c522203bae88710f05ebf15c1c34f7ea4c1ad55ee8c5d7d6ee2b6f9ecd26cf663ca0888fd8402286041ab66d230bd23592b75493e5be21f8694c6491440aad7117bfc000000001976a914027d3f3c7c3cfa357d97fbe7d80d70f4ab1cac0d88ac1027000000000000ffffffffc4bb800fbccf3437546201d38173aaab9a9461fbf6d03cda66346280e96934260000000001000000';
  const payload = tempPayload//Buffer.from(tempPayload,'hex')
  const signdata = createHash.hash256(Buffer.from(payload, 'hex')).toString('hex');
  console.log('signData:' + signdata.toString('hex'));//0x5df6e0e2761359d30a8275058e299fcc0381534545f55cf43e41983f5d4c9456

  const d = [];

  d.push('0x' + inputId, '0x' + signdata, '0x' + readtype, '0x' + keyid, '0x' + payload);
  // console.log(d[0]);
  console.log('rlp:' + rlp.encode(d).toString('hex'));

}


function time() {
  // const asyncToPromise = func => {
  //   console.log(`asyncToPromise`);
  //   return (...args) => Promise.try(async () => await func.apply(this, args));
  // };
  //
  // const sleepAsync = async (ms) => {
  //   console.time(`sleep ${ms}ms`);
  //
  //   await Promise.delay(ms);
  //   console.timeEnd(`sleep ${ms}ms`);
  // };
  //
  // console.time('total');
  const time = [1000, 2000, 3000]
  // Promise.map(time, (ms) => asyncToPromise(sleepAsync)(ms),
  //   {concurrency: 1}
  // ).then(() => console.timeEnd('total'));


  Promise.map(time, async (ms) => {
    console.time(`sleep ${ms}ms`);
    await Promise.delay(ms);
    console.timeEnd(`sleep ${ms}ms`);
  }, {concurrency: 1})

}

// time()
// createSegwitTx()
// assemblySingData()
// testWitness_p2wsh()
// createP2sh_P2wpkh_input()
// doubleHash256()
// testBTCAddress()
// generateTestnetAddress()
// createSegwitTx();
// testDsha256();
toOutputScript()
// testSegitTx()
// checkTransactionType()
// checkTransactionType()
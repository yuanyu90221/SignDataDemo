const BigNumber = require('bignumber.js');
const { COINTYPE } = require('rootCore/config/index.js');

const gasLimit = '520c'   // default 21000

exports.assemblyTransaction = (data) => {
  try {
    let result = [];
    let self = [];

    const fields = [{
        name: 'nonce',
        length: 32,
        allowLess: true,
        default: new Buffer([])
      }, {
        name: 'gasPrice',
        length: 32,
        allowLess: true,
        default: new Buffer([])
      }, {
        name: 'gasLimit',
        alias: 'gas',
        length: 32,
        allowLess: true,
        default: new Buffer([])
      }, {
        name: 'to',
        allowZero: true,
        length: 20,
        default: new Buffer([])
      }, {
        name: 'value',
        length: 32,
        allowLess: true,
        default: new Buffer([])
      }, {
        name: 'data',
        alias: 'input',
        allowZero: true,
        default: new Buffer([])
      }, {
        name: 'v',
        allowZero: true,
        default: new Buffer([0x1c])
      }, {
        name: 'r',
        length: 32,
        default: new Buffer([])
      }, {
        name: 's',
        length: 32,
        default: new Buffer([])
      }]

    const keys = Object.keys(data);
    const values = Object.values(data);

    fields.forEach((field) => {
      let test = toBuffer(data[field.name],field)
      result.push(test)
    })
    return result;
  } catch (e) {
    throw "Transaction format is not correct";
  }
}

exports.weiToEther = (wei) => {
  const weiUnit = new BigNumber(wei);
  const unit = new BigNumber(COINTYPE.ETH.unit);
  const etherUnit = weiUnit.dividedBy(unit).toString(10);

  return etherUnit;
}

exports.etherToWei = (ether) => {
  const etherUnit = new BigNumber(ether);
  const unit = new BigNumber(COINTYPE.ETH.unit);
  const weiUnit = etherUnit.times(unit).toString(10);

  return weiUnit;
}

exports.calculateFee = (gasPrice, gas) => {
  const txGas = gas || gasLimit;
  const gasPriceBN = new BigNumber(gasPrice, 16);
  const gasLimitBN = new BigNumber(txGas, 16);
  const unitBN = new BigNumber(COINTYPE.ETH.unit);
  const txFee = gasPriceBN.times(gasLimitBN).dividedBy(unitBN).toString(10);

  return txFee;
}

exports.calculateGasPrice = (txFee) => {
  const txFeeBN = new BigNumber(txFee, 10);
  const gasLimitBN = new BigNumber(gasLimit, 16);
  const unitBN = new BigNumber(COINTYPE.ETH.unit, 10);
  const gasPrice = txFeeBN.times(unitBN).dividedBy(gasLimitBN).floor().toString(16);

  return gasPrice;
}

const toBuffer = (v,field) => {
  let temp = v;
  if(temp.slice(0,2) == '0x')
    temp = temp.slice(2);
  temp = Buffer.from(temp,'hex');

  if (temp.toString('hex') === '00' && !field.allowZero) {
    temp = Buffer.allocUnsafe(0)
  }
  return temp;
}

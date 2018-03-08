const BigNumber = require('bignumber.js');
const {COINTYPE} = require('rootCore/config/index.js');


exports.fee_per_byte = (fee_per_kb)=>{
  const fee_per_kb_Unit = new BigNumber(fee_per_kb);
  const unit = new BigNumber(1024);
  const feePerByte = fee_per_kb_Unit.dividedBy(unit);

  return parseInt(feePerByte);
}

exports.satoshiToBtc = (satoshi) => {
  const satoshiUnit = new BigNumber(satoshi);
  const unit = new BigNumber(COINTYPE.BTC.unit);
  const btcUnit = satoshiUnit.dividedBy(unit).toString(10);

  return btcUnit;
}

exports.btcToSatoshi = (btc) => {
  const btcUnit = new BigNumber(btc);
  const unit = new BigNumber(COINTYPE.BTC.unit);
  const satoshiUnit = btcUnit.times(unit).toString(10);

  return satoshiUnit;
}

/**
 * feeUnit = Satoshis (0.00000001 BTC) per byte of transaction data
 * Miners usually include transactions with the highest fee/byte first.
 * Wallets should base their fee calculations on this number, depending on how fast the user needs confirmations.
 */
exports.calculateEstimateFees = (satoshisPerByte) => {
  const satoshis = new BigNumber(satoshisPerByte)
  const txSize = new BigNumber(COINTYPE.BTC.medianTxSize);
  const estimateFees = satoshis.times(txSize).toString(10)

  return estimateFees
}

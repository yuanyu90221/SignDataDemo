const BigNumber = require('bignumber.js');
const { COINTYPE } = require('rootCore/config/index.js');

exports.xrpToDrops = (xrp) => {
  try {
    const xrpUnit = new BigNumber(xrp);
    const unit = new BigNumber(COINTYPE.XRP.unit);
    const dropsUnit = xrpUnit.times(unit).floor().toString(10);

    return dropsUnit;
  } catch (e) {
    throw "Failed convert XRP to drops";
  }
};

exports.dropsToXRP = (drops) => {
  try {
    const dropsUnit = new BigNumber(drops);
    const unit = new BigNumber(COINTYPE.XRP.unit);
    const xrpUnit = dropsUnit.dividedBy(unit).toString(10);

    return xrpUnit;
  } catch (e) {
    throw "Failed convert drops to XRP";
  }
};

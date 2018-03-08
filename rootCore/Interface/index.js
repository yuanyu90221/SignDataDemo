const trx = require('./Transaction');
const wa = require('./WalletAddress');
const other = require('./Other');
const dfu = require('./Dfu');
const ota = require('./OTA');

module.exports = {
  Transaction : trx,
  WalletAddress : wa,
  Other : other,
  Dfu : dfu,
  OTA : ota,
};

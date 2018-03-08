const ETH = require('./ether.js');
const XRP = require('./ripple.js');
const BTC = require('./bitcoin.js');
const ENV = require('rootCore/config/environment.js');
const LTC = ENV.LTC == "production" ? require("./liteCoin.js") : require("./liteCoinTest.js") ;

module.exports = {
  ETH,
  XRP,
  BTC,
  LTC
}

const R = require('ramda');
const ENV = require('rootCore/config/environment.js');

const PORT = ENV.XRP == "dev" ? 4540 : 4545;

exports.getTransactionFee = async () => {
  const path = `
    query {
      fee {
        amount
      }
    }
  `

  const fee = await R.composeP(
    getValueByKey('amount'),
    getValueByKey('fee'),
    requestV2
  )(path);

  return fee;
}

exports.getLastLedgerSequence = async () => {
  const path = `
    query {
      ledgerVersion {
        version
      }
    }
  `

  const version = await R.composeP(
    getValueByKey('version'),
    getValueByKey('ledgerVersion'),
    requestV2
  )(path);
  console.log(`Last ledger Sequence : ${version}`);

  return version;
}

exports.getAccountInfo = async (address) => {
  const path = `
    query {
      account(address: "${address}") {
        sequence,
        ownerCount,
        previousAffectingTransactionID,
        previousAffectingTransactionLedgerVersion
      }
    }
  `

  const accountInfo = await R.composeP(
    getValueByKey('account'),
    requestV2
  )(path);

  return accountInfo;
}

exports.sendTransaction = async (signedTransaction) => {
  const path = `
  mutation {
    sendTransaction(signedTransaction: "${signedTransaction}") {
      resultCode
    }
  }
  `

  return postRequest(path)
  .then((result) => {
    console.log(result.sendTransaction);
    if (!result.sendTransaction || (result.sendTransaction.resultCode != "tesSUCCESS" && result.sendTransaction.resultCode != "terQUEUED")) {
      throw "Failed to submit transaction";
    }
    return "success";
  })
}


exports.getExchangeRate = async () => {
  const path = `exchange_rates/XRP/USD+rvYAfWj5gh67oV6fW32ZzP3Aw4Eubs59B`;

  const rate = await R.composeP(
    getValueByKey('rate'),
    requestDataAPI
  )(path);

  return rate;
}

exports.getAddressesBalance = async (address) => {
  const path = `accounts/${address}/balances?currency=XRP`;

  const accum = (f, l) => parseFloat(f) + parseFloat(l.value);
  const total = data => {
    if (!data) return 0;
    return R.reduce(accum, 0, data);
  }

  const balance = await R.composeP(
    total,
    getValueByKey('balances'),
    requestDataAPI
  )(path);

  return balance;
}

// by = "transactions" or "count"
exports.getAccountTransactions = async (by, address) => {
  const path = `accounts/${address}/transactions?type=Payment&result=tesSUCCESS`;

  const transactions = await R.composeP(
    getValueByKey(by),
    requestDataAPI
  )(path);

  return transactions;
}

const requestDataAPI = (path) => {
  const url = `https://data.ripple.com/v2/${path}`;

  return fetch(url)
  .then(jsoning)
  .catch(err => err)
}

const getValueByKey = R.curry((key, obj) => obj[key]);
const jsoning = result => result.json();

const requestV2 = (queryMsg) => {
  const encodedQuery = encodeURIComponent(queryMsg);
  const url = `http://34.209.188.67:${PORT}/graphql?query=${encodedQuery}`;

  return fetch(url)
  .then(jsoning)
  .then(d => {
    console.log(`REQUESTV2 : ${JSON.stringify(d)}`);
    return d.data;
  })
  .catch(err => err);
}

const postRequest = async (query) => {
  const body = { query: query };
  const url = `http://34.209.188.67:${PORT}/graphql`;
  const options = {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(body)
  };

  const response = await fetch(url, options);
  const bodyText = JSON.parse(response._bodyText);
  if(!!bodyText.error) {
    throw bodyText.error.message
  }
  return bodyText.data
}

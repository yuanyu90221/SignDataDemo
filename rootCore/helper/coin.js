class Coin {
  constructor(type, accountSum, index) {
    this.root = {}
    this.root.coinType = type;
    this.root.account = [];
    this.isCreated = false;

    for (let i = 0; i < accountSum; i++) {
      let accountIndex = Buffer.from([i]);
      accountIndex = accountIndex.toString('hex');
      if (!!index) {
        accountIndex = index
      }
      const object = {
        index: accountIndex
      }
      this.root.account.push(object)
    }
  }

  setChainAndAddress(index, address) {
    this.isCreated = true;
    const type = index.slice(0, 2);
    const accountIndex = index.slice(2, 4);
    const chainIndex = index.slice(4, 6);
    const addressIndex = index.slice(6);

    const isAccountIndexExist = this.root.account.findIndex((obj) => {
      const { index } = obj;
      return index == accountIndex;
    })

    if (isAccountIndexExist >= 0 && !this.root.account[isAccountIndexExist].chain) {
      this.root.account[isAccountIndexExist].chain = []
    }

    const chainObj = {
      index: chainIndex,
      address: []
    }
    const addressObj = {
      index: addressIndex,
      value: address
    }

    const isChainIndexExist = this.root.account[isAccountIndexExist].chain.findIndex((obj) => {
      const { index } = obj;
      return index == chainIndex;
    })

    let chainIndexInt;
    if (isChainIndexExist < 0) {
      this.root.account[isAccountIndexExist].chain.push(chainObj)
      chainIndexInt = this.root.account[isAccountIndexExist].chain.length - 1;
    } else {
      chainIndexInt = isChainIndexExist;
    }

    this.root.account[isAccountIndexExist].chain[chainIndexInt].address.push(addressObj)

  }

  getAccount() {
    if (!this.isCreated) {
      return null;
    }
    return this.root
  }
}

module.exports = Coin;

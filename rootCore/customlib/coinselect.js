let coinselect;
(function e(t, n, r) {
  function s(o, u) {
    if (!n[o]) {
      if (!t[o]) {
        var a = typeof reqqq == "function" && reqqq;
        if (!u && a) return a(o, !0);
        if (i) return i(o, !0);
        var f = new Error("Cannot find module '" + o + "'");
        throw f.code = "MODULE_NOT_FOUND", f
      }
      var l = n[o] = {exports: {}};
      t[o][0].call(l.exports, function (e) {
        var n = t[o][1][e];
        return s(n ? n : e)
      }, l, l.exports, e, t, n, r)
    }
    return n[o].exports
  }

  var i = typeof reqqq == "function" && reqqq;
  for (var o = 0; o < r.length; o++) s(r[o]);
  return s
})({
  1: [function (reqqq, module, exports) {
    var utils = reqqq('./utils')

// add inputs until we reach or surpass the target value (or deplete)
// worst-case: O(n)
    module.exports = function accumulative(utxos, outputs, feeRate, specifiedFee,isMax) {
      // specifiedFee = specifiedFee || 0;
      if (!isFinite(utils.uintOrNaN(feeRate))) return {}
      var bytesAccum = utils.transactionBytes([], outputs)
      console.log('accumulative-bytesAccum:' + bytesAccum)
      var inAccum = 0
      var inputs = []
      var outAccum = utils.sumOrNaN(outputs)

      for (var i = 0; i < utxos.length; ++i) {
        var utxo = utxos[i]
        var utxoBytes = utils.inputBytes(utxo)
        var utxoFee = feeRate * utxoBytes
        var utxoValue = utils.uintOrNaN(utxo.value)


        // skip detrimental input
        // if (utxoFee > utxo.value) {
        //     if (i === utxos.length - 1) return {fee: feeRate * (bytesAccum + utxoBytes)}
        //     continue
        // }

        bytesAccum += utxoBytes
        inAccum += utxoValue
        inputs.push(utxo)

        var fee = feeRate * bytesAccum

        // console.log('bytesAccum:' + bytesAccum, 'inAccum:' + inAccum, 'input value:' + utxoValue, 'outAccum:' + outAccum, 'fee:' + fee, 'utxoFee:' + utxoFee)

        // go again?
        if (inAccum < outAccum + fee || isMax)  continue

        return utils.finalize(inputs, outputs, feeRate, specifiedFee)
      }
      // console.log('資料長度:' + bytesAccum);
      const result = feeRate * bytesAccum
      // console.log(`資料fee:${result}`)
      return {fee: result}
    }

  }, {"./utils": 4}], 2: [function (reqqq, module, exports) {
    var utils = reqqq('./utils')

// only add inputs if they don't bust the target value (aka, exact match)
// worst-case: O(n)
    module.exports = function blackjack(utxos, outputs, feeRate, specifiedFee, isMax) {
      specifiedFee = specifiedFee || 0;
      // console.log("isMax:"+isMax,'utxos:'+utxos.length)
      if (!isFinite(utils.uintOrNaN(feeRate))) return {}

      var bytesAccum = utils.transactionBytes([], outputs)
      // console.log('blackjack bytesAccum:' + bytesAccum, 'utxos:' + JSON.stringify(utxos))

      var inAccum = 0
      var inputs = []
      var outAccum = utils.sumOrNaN(outputs)
      var threshold = utils.dustThreshold({}, feeRate)

      for (var i = 0; i < utxos.length; ++i) {
        var input = utxos[i]
        // console.log(`input ${i}:${JSON.stringify(input)}` )
        var inputBytes = utils.inputBytes(input)
        var fee = feeRate * (bytesAccum + inputBytes)
        var inputValue = utils.uintOrNaN(input.value)

        // console.log('xxinput:' + i, 'bytesAccum:' + bytesAccum, 'inAccum:' + inAccum, 'inputValue:' + inputValue, 'outAccum:' + outAccum + ',fee:' + fee + ',threshold:' + threshold)
        // would it waste value?
        if ((inAccum + inputValue) > (outAccum + fee + threshold) && !isMax) continue

        bytesAccum += inputBytes
        inAccum += inputValue
        inputs.push(input)
        // console.log('input:' + i, 'bytesAccum:' + bytesAccum, 'inAccum:' + inAccum, 'inputValue:' + inputValue, 'outAccum:' + outAccum + ',fee:' + fee + ',threshold:' + threshold)
        // go again?
        if (inAccum < outAccum + fee || isMax) continue
        // console.log('ready to in finalize')
        return utils.finalize(inputs, outputs, feeRate, specifiedFee)
      }
      // console.log(`跑完blackjack`)
      return {fee: feeRate * bytesAccum}
    }

  }, {"./utils": 4}], 3: [function (reqqq, module, exports) {
    var accumulative = reqqq('./accumulative')
    var blackjack = reqqq('./blackjack')
    var utils = reqqq('./utils')

// order by descending value, minus the inputs approximate fee
    function utxoScore(x, feeRate) {
      return x.value - (feeRate * utils.inputBytes(x))
    }

    module.exports = function coinSelect(utxos, outputs, feeRate, specifiedFee, isMax) {
      utxos = utxos.concat().sort(function (a, b) {
        return utxoScore(b, feeRate) - utxoScore(a, feeRate)
      })
      // attempt to use the blackjack strategy first (no change output)
      var base = blackjack(utxos, outputs, feeRate, specifiedFee, isMax)
      console.log(`blackjack base:${JSON.stringify(base)}`)
      if (base.inputs) return base
      const result = accumulative(utxos, outputs, feeRate, specifiedFee,isMax)
      console.log(`accumulative result ${JSON.stringify(result)}`)

      // else, try the accumulative strategy
      return result
    }

  }, {"./accumulative": 1, "./blackjack": 2, "./utils": 4}], 4: [function (reqqq, module, exports) {
// baseline estimates, used to improve performance
    var TX_EMPTY_SIZE = 4 + 1 + 1 + 4
    var TX_INPUT_BASE = 32 + 4 + 1 + 4
    var TX_INPUT_PUBKEYHASH = 106
    var TX_OUTPUT_BASE = 8 + 1
    var TX_OUTPUT_PUBKEYHASH = 25

    function inputBytes(input) { //147
      return TX_INPUT_BASE + (input.script ? input.script.length : TX_INPUT_PUBKEYHASH)
    }

    function outputBytes(output) { //34
      return TX_OUTPUT_BASE + (output.script ? output.script.length : TX_OUTPUT_PUBKEYHASH)
    }

    function dustThreshold(output, feeRate) {
      /* ... classify the output for input estimate  */
      return inputBytes({}) * feeRate
    }

    function transactionBytes(inputs, outputs) {
      return TX_EMPTY_SIZE +
        inputs.reduce(function (a, x) {
          return a + inputBytes(x)
        }, 0) +
        outputs.reduce(function (a, x) {
          return a + outputBytes(x)
        }, 0)
    }

    function uintOrNaN(v) {
      // if (typeof v !== 'number') return NaN

      if (typeof v == 'string') {
        v = parseInt(v)
        return v
      }
      if (!isFinite(v)) return NaN
      if (Math.floor(v) !== v) return NaN
      if (v < 0) return NaN
      return v
    }

    function sumForgiving(range) {
      return range.reduce(function (a, x) {
        return a + (isFinite(x.value) ? x.value : 0)
      }, 0)
    }

    function sumOrNaN(range) {
      return range.reduce(function (a, x) {
        return a + uintOrNaN(x.value)
      }, 0)
    }

    var BLANK_OUTPUT = outputBytes({})

    function finalize(inputs, outputs, feeRate, specifiedFee) {
      console.log('finalize input:' + JSON.stringify(inputs), 'finalize output:' + JSON.stringify(outputs))
      specifiedFee = specifiedFee || 0;

      var bytesAccum = transactionBytes(inputs, outputs)
      console.log('交易資料長度:' + bytesAccum)
      let feeAfterExtraOutput = 0
      try {
        console.log('specifiedFee:' + specifiedFee)
        if (specifiedFee == 0) {
          feeAfterExtraOutput = feeRate * (bytesAccum + BLANK_OUTPUT)
        } else {
          feeAfterExtraOutput = specifiedFee
        }
      } catch (e) {
        console.log('錯誤:' + e)
      }
      // var feeAfterExtraOutput = feeRate * (bytesAccum + BLANK_OUTPUT)//加上零錢地址後的手續費
      console.log('交易金額 :input' + sumOrNaN(inputs), 'out:' + sumOrNaN(outputs), outputs[0].value, '加上零錢地址後的手續費:' + feeAfterExtraOutput)
      var remainderAfterExtraOutput = sumOrNaN(inputs) - (sumOrNaN(outputs) + feeAfterExtraOutput)
      console.log('扣掉額外手續費的餘額：' + remainderAfterExtraOutput)
      console.log('dust：' + parseInt(dustThreshold({}, feeRate)))
      // is it worth a change output?
      if (remainderAfterExtraOutput > dustThreshold({}, feeRate)) {
        //需要找零
        outputs = outputs.concat({value: remainderAfterExtraOutput})
      }

      var fee = sumOrNaN(inputs) - sumOrNaN(outputs)
      if (!isFinite(fee)) return {fee: feeRate * bytesAccum}

      return {
        inputs: inputs,
        outputs: outputs,
        fee: fee
      }
    }

    module.exports = {
      dustThreshold: dustThreshold,
      finalize: finalize,
      inputBytes: inputBytes,
      outputBytes: outputBytes,
      sumOrNaN: sumOrNaN,
      sumForgiving: sumForgiving,
      transactionBytes: transactionBytes,
      uintOrNaN: uintOrNaN
    }

  }, {}], 5: [function (reqqq, module, exports) {
    coinselect = reqqq('./coinselect');

  }, {"./coinselect": 3}]
}, {}, [5]);
module.exports = coinselect;

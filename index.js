import _ from 'lodash'
import axios from 'axios'
import colors from 'colors';

const QUOTES = ['BTC', 'LTC', 'BCH', 'BTG']

const getBaseAndAmount = () => {
  const args = process.argv.slice(2, 4);
  if (args.length === 2) {
    return {
      base: args[0],
      amount: args[1],
    }
  } else if (args.length === 1 && !isNaN(Number(args[0]))) {
    return {
      base: 'ETH',
      amount: args[0],
    }
  } else if (args.length === 1) {
    return {
      base: args[0],
      amount: 1,
    }
  } else {
    return {
      base: 'ETH',
      amount: 1,
    }
  }
}

const bit2CTicker = (quote) =>
  axios.get(`https://bit2c.co.il/Exchanges/${quote}Nis/Ticker.json`)

const shapeShiftMarket = (base, quote) =>
  axios.get(`https://shapeshift.io/marketinfo/${_.toLower(base)}_${quote}`)

const findRate = async ({ coin, base, amount }) => {
  const { data: ssMarket } = await shapeShiftMarket(_.toLower(base), _.toLower(coin))
  const { data: b2cTicker } = await bit2CTicker(_.upperCase(coin))
  const coinToNis = ((amount * ssMarket.rate) - (ssMarket.minerFee * 2)) * b2cTicker.l
  const coinToNisAvg = ((amount * ssMarket.rate) - (ssMarket.minerFee * 2)) * b2cTicker.av
  return {
    amount: amount,
    base: base.toUpperCase(),
    quote: _.toUpper(coin),
    shapeShiftRate: ssMarket.rate,
    bit2CRate: b2cTicker.l,
    bit2CLast: b2cTicker.ll,
    minerFee: ssMarket.minerFee,
    coinToNis: coinToNis.toFixed(2),
    coinToNisAvg: coinToNisAvg.toFixed(2),
  }
}

(async () => {
  const { base, amount } = getBaseAndAmount();
  const coinData = await Promise.all(QUOTES.map((coin) => findRate({ coin, base, amount })))
  const bestCoin = _.maxBy(coinData, 'coinToNis')
  console.log(`💸  Best coin is ${bestCoin.quote.cyan}. ${amount} ${base} = ${bestCoin.coinToNis.cyan} NIS 💸`)
  console.log('------------')
  _.orderBy(coinData, 'coinToNis', 'desc').forEach(({ amount, base, quote, coinToNis, coinToNisAvg, minerFee }, i) =>
    console.log(`${i + 1}. ${quote}: ${coinToNis} NIS ------ 24h Avg: ${coinToNisAvg} ------ Miner Fee: ${minerFee}`))
})()

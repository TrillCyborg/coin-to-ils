import _ from 'lodash'
import axios from 'axios'

const BASE_AMOUNT = process.argv[2] || 1
const BASE = 'ETH'
const QUOTES = ['BTC', 'LTC', 'BCH']

const bit2CTicker = (quote) =>
  axios.get(`https://bit2c.co.il/Exchanges/${quote}Nis/Ticker.json`)

const shapeShiftMarket = (quote) =>
  axios.get(`https://shapeshift.io/marketinfo/${_.toLower(BASE)}_${quote}`)

const findRate = async (coin) => {
  const { data: ssMarket } = await shapeShiftMarket(_.toLower(coin))
  const { data: b2cTicker } = await bit2CTicker(_.upperCase(coin))
  const coinToNis = ((BASE_AMOUNT * ssMarket.rate) - (ssMarket.minerFee * 2)) * b2cTicker.l
  const coinToNisAvg = ((BASE_AMOUNT * ssMarket.rate) - (ssMarket.minerFee * 2)) * b2cTicker.av
  return {
    amount: BASE_AMOUNT,
    base: BASE.toUpperCase(),
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
  const coinData = await Promise.all(QUOTES.map(findRate))
  const bestCoin = _.maxBy(coinData, 'coinToNis')
  console.log(`Best coin is ${bestCoin.quote}. ${BASE_AMOUNT} ${BASE} = ${bestCoin.coinToNis} NIS`)
  console.log('------------')
  coinData.forEach(({ amount, base, quote, coinToNis, coinToNisAvg }) =>
    console.log(`${quote}: ${coinToNis} NIS ------ 24h Avg: ${coinToNisAvg}`))
})()

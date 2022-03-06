const tulind = require("tulind");
const { generatePrimeSync } = require("crypto");
const Binance = require("node-binance-api");
const { type } = require("os");
const binance = new Binance().options({
  APIKEY: "2def7e5965e8508375df87c5d15cd10e350fdb69d1c79d9d158d2cf005e009f7",
  APISECRET: "46c2c2fab1c497f16bd223d64968c6f5dd5cff2255b633af46272ea80ffdd14c",
  test: true,
  urls: {
    base: "https://testnet.binance.vision/api/",
  },
});

let candleData = [];
let closeData = [];
let rsi;
let marketPrice;
let takeProfit;
let stopLost;
let orders;
let bought = false;
let sold = false;

async function getBalanceDetail() {
  console.info(await binance.futuresAccount());
}

async function getTradeInfo() {
  candleData = [];
  closeData = [];
  binance.candlesticks(
    "BNBUSDT",
    "5m",
    function (error, ticks) {
      let last_tick = ticks[ticks.length - 1];
      let [
        time,
        open,
        high,
        low,
        close,
        volume,
        closeTime,
        assetVolume,
        trades,
        buyBaseVolume,
        buyAssetVolume,
        ignored,
      ] = last_tick;
      for (let i = 0; i < ticks.length; i++) {
        candleData.push(ticks[i]);
      }
      console.log("BNBUSDT last close: " + close);
      getCloseData();
    },
    { limit: 15 }
  );
}

function getCloseData() {
  if (candleData.length != 0) {
    for (let i = 0; i < candleData.length; i++) {
      closeData.push(candleData[i][4]);
    }
    getRSI();
  } else {
    console.log("Something got wrong");
  }
}

function getRSI() {
  if (closeData.length != 0) {
    tulind.indicators.rsi.indicator([closeData], [14], (err, res) => {
      if (err) {
        console.log(err);
      } else {
        rsi = res;
        console.log("The RSI Index is:" + rsi);
        buyOrSell(rsi);
      }
    });
  }
}

async function buyOrSell(rsi) {
  if (bought == false && sold == false) {
    if (rsi > 75) {
      console.log("Hunting time! This time go for SHORT!");
      console.info(await binance.futuresMarketSell("BNBUSDT", 1));
      sell();
    } else if (rsi < 25) {
      console.log("Hunting time! This time go for LONG!");
      console.info(await binance.futuresMarketBuy("BNBUSDT", 1));
      buy();
    } else {
      console.log("Not yet to action, please wait paitently");
      console.log("----------------------------------------------");
    }
  } else {
    console.log("You have already deal!, wait for the result!");
    console.log("----------------------------------------------");
  }
}

async function buy() {
  let ticker = await binance.prices();
  console.info(`Price of BNB: ${ticker.BNBUSDT}`);
  marketPrice = Number(ticker.BNBUSDT);
  takeProfit = marketPrice * 1.03;
  stopLost = marketPrice * 0.985;
  console.log("This is the target order");
  console.info(await binance.futuresBuy("BNBUSDT", 1, takeProfit));
  bought = true;
}

async function sell() {
  let ticker = await binance.prices();
  console.info(`Price of BNB: ${ticker.BNBUSDT}`);
  marketPrice = Number(ticker.BNBUSDT);
  takeProfit = marketPrice * 0.97;
  stopLost = marketPrice * 1.015;
  console.log("This is the target order");
  console.info(await binance.futuresBuy("BNBUSDT", 1, takeProfit));
  sold = true;
}

async function getPosition() {
  orders = await binance.futuresOpenOrders("BNBUSDT");
  console.info(await binance.futuresOpenOrders("BNBUSDT"));
  if (orders.length == 0) {
    bought = false;
    sold = false;
    candleData = [];
    closeData = [];
  }
}

async function clearall() {
  console.info(await binance.futuresCancelAll("BNBUSDT"));
}

async function stopLostForLong() {
  let ticker = await binance.prices();
  console.info(`Price of BNB: ${ticker.BNBUSDT}`);
  let stopPrice = Number(ticker.BNBUSDT);
  if (stopPrice < stopLost) {
    console.log("FUCK!! STOPLOST");
    console.info(await binance.futureMarketSell("BNBUSDT", 1));
    (bought = false), (sold = false);
    clearall();
  }
}

async function stopLostForShort() {
  let ticker = await binance.prices();
  console.info(`Price of BNB: ${ticker.BNBUSDT}`);
  let stopPrice = Number(ticker.BNBUSDT);
  if (stopPrice > stopLost) {
    console.log("FUCK!! STOPLOST");
    console.info(await binance.futureMarketBuy("BNBUSDT", 1));
    (bought = false), (sold = false);
    clearall();
  }
}

async function working() {
  if (bought == false && sold == false) {
    getTradeInfo();
  } else if (bought == true && sold == false) {
    await getPosition();
    stopLostForLong();
  } else if (sold == true && sold == false) {
    await getPosition();
    stopLostForShort();
  } else {
    console.log("Should have error");
  }
}

async function checkOrders() {
  console.info(await binance.futuresOpenOrders("BNBUSDT"));
}

async function checkHold() {
  console.info(await binance.futuresPositionRisk({ Symbol: "BNBUSDT" }));
}

async function checkBalance() {
  console.info(await binance.futuresBalance());
}

setInterval(working, 10000);

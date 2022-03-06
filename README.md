# BNB_TradeBot
A BNB trade bot connected to Binance testnet and trade according to RSI index


Using Binance npm package and bind with testnet API_key and secret, through using the tulid package processes the candle stick data and get the RSI index. 

In this setting, when the RSI index is below 25, it will long BNB, when RSI overcome 75, it will short BNB.

After Long or Short, it will no longer have further trade until this trade is stoplost or gain.

There is no socket, through using setTimeInterval, it will get BNB candle stick data and process the data very 10 seconds.

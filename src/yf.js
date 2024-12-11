const yahooFinance = require('yahoo-finance2').default;

class yfClient {
    constructor(etfs) {
        this.etfs = etfs;
        this.symbols = Object.keys(this.etfs);
    }

    async fetchHoldings() {
        const results = [];
        try {
            for (const symbol of this.symbols) {
                const data = await yahooFinance.quote(symbol);
                const holdings = data.regularMarketPrice * this.etfs[symbol];
                results.push({
                    symbol: symbol,
                    price: data.regularMarketPrice,
                    currency: data.currency,
                    marketState: data.marketState,
                    holdings: holdings
                });
            }
        } catch (error) {
            console.error('Error fetching data:', error.message);
        }
        return results;
    }

    // Updated function to fetch intraday data using 'chart()' with debugging
    // Fetch intraday data
    async fetchIntradayData(symbol) {
        try {
            const now = Math.floor(Date.now() / 1000); // Current Unix timestamp
            const startOfDay = Math.floor(new Date().setHours(0, 0, 0, 0) / 1000); // Start of the day

            const data = await yahooFinance.chart(symbol, {
                interval: '1m',
                range: '1d',
                period1: startOfDay,
                period2: now
            });

            // Debugging: log the raw response
            // console.log(`Fetched data for ${symbol}:`, JSON.stringify(data, null, 2));

            return JSON.stringify(data, null, 2);

            if (!data.chart || !data.chart.result || data.chart.result.length === 0) {
                console.error(`No intraday data available for ${symbol}`);
                return [];
            }

            const result = data.chart.result[0];

            if (!result || !result.indicators || !result.indicators.quote || !result.indicators.quote[0].close) {
                console.error(`Invalid structure for ${symbol}`);
                return [];
            }

            // Filter out data points where 'close' is null
            const intradayData = result.indicators.quote[0].close
                .map((close, index) => ({
                    time: result.timestamp[index], // Timestamp
                    close: close // Closing price at that timestamp
                }))
                .filter(item => item.close !== null); // Only include valid close values

            if (intradayData.length === 0) {
                console.error(`No valid intraday data found for ${symbol}`);
                return [];
            }

            return intradayData;
        } catch (error) {
            console.error('Error fetching intraday data:', error.message);
            return [];
        }
    }
}



module.exports = { yfClient };

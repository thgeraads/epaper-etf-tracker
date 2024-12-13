const fetch = require('node-fetch');
const moment = require('moment-timezone');

class LsClient {
    async getETFPrice(etfs, granularity = 1) {
        let formattedData = {};
        let ids = Object.keys(etfs);

        // Fetch data for each ID
        for (const id of ids) {
            const response = await fetch(`https://www.ls-x.de/_rpc/json/instrument/chart/dataForInstrument?instrumentId=${id}`);
            const json = await response.json();

            for (let i in json.series.intraday.data) {
                const timestamp = json.series.intraday.data[i][0];
                // Parse as UTC and subtract an hour
                const closingDateTime = moment.utc(timestamp).subtract(1, 'hours').tz("Europe/Amsterdam").format("HH:mm");
                const closingPrice = json.series.intraday.data[i][1];

                if (!formattedData[closingDateTime]) {
                    formattedData[closingDateTime] = {};
                }
                formattedData[closingDateTime][id] = closingPrice;
            }
        }

        // Sort the formattedData object by keys (timestamps)
        const sortedData = Object.keys(formattedData)
            .sort() // Sort the keys lexicographically
            .reduce((acc, key) => {
                acc[key] = formattedData[key]; // Rebuild the sorted object
                return acc;
            }, {});

        // Apply granularity filtering
        const filteredData = this.applyGranularity(sortedData, granularity);

        // Interpolate missing data
        let newData = this.interpolateMissingData(filteredData, ids);

        // Calculate holdings
        newData = this.calculateHoldings(newData, etfs);
        return newData;
    }

    applyGranularity(data, granularity) {
        const filteredData = {};
        let lastIncludedTime = null;

        for (const time of Object.keys(data)) {
            if (
                !lastIncludedTime ||
                moment(time, "HH:mm").diff(moment(lastIncludedTime, "HH:mm"), "minutes") >= granularity
            ) {
                filteredData[time] = data[time];
                lastIncludedTime = time;
            }
        }

        return filteredData;
    }

    interpolateMissingData(data, ids) {
        const times = Object.keys(data).sort(); // Sort timestamps

        for (const id of ids) {
            let previousValue = null; // To hold the last known value
            let previousTime = null; // To hold the last known timestamp
            let isFirstDataPointHandled = false; // Flag to check if the first data point is handled

            for (let i = 0; i < times.length; i++) {
                const time = times[i];
                if (data[time][id] !== undefined) {
                    // Current value exists, set it as the new previous reference
                    previousValue = data[time][id];
                    previousTime = time;
                    isFirstDataPointHandled = true; // First data point has been handled
                } else if (!isFirstDataPointHandled) {
                    // Handle the first missing data point
                    for (let j = i; j < times.length; j++) {
                        if (data[times[j]][id] !== undefined) {
                            data[time][id] = data[times[j]][id]; // Copy the next valid value
                            previousValue = data[time][id]; // Update previousValue
                            previousTime = time; // Update previousTime
                            isFirstDataPointHandled = true; // Mark that the first data point is handled
                            break;
                        }
                    }
                } else if (previousValue !== null) {
                    // Previous value exists, find the next value to interpolate
                    let nextValue = null;
                    let nextTime = null;

                    for (let j = i + 1; j < times.length; j++) {
                        if (data[times[j]][id] !== undefined) {
                            nextValue = data[times[j]][id];
                            nextTime = times[j];
                            break;
                        }
                    }

                    if (nextValue !== null) {
                        // Interpolate the missing value
                        const timeDiff = moment.duration(moment(nextTime, "HH:mm").diff(moment(previousTime, "HH:mm")));
                        const step = (nextValue - previousValue) / timeDiff.asMinutes();
                        const currentDiff = moment.duration(moment(time, "HH:mm").diff(moment(previousTime, "HH:mm")));
                        const interpolatedValue = previousValue + step * currentDiff.asMinutes();
                        data[time][id] = interpolatedValue;
                    } else {
                        // No next value; carry forward the previous value
                        data[time][id] = previousValue;
                    }
                }
            }
        }

        return data;
    }


    calculateHoldings(data, etfs) {
        // Calculate the holdings for each timestamp
        const ids = Object.keys(etfs);
        const holdings = ids.map(id => etfs[id].holdings);

        for (const time of Object.keys(data)) {
            for (let i = 0; i < holdings.length; i++) {
                if (!data[time].holdings) {
                    data[time].holdings = 0;
                }
                data[time].holdings += holdings[i] * data[time][ids[i]];
            }
        }

        return data;
    }
}

module.exports = LsClient;

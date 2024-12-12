// This file is meant to be used with a 128x250 BWR display with a size of 2.13 inches.
// Other sizes may not work as expected.
// This file contains the ETF list to be used in combination with a chart-only display.

const {createCanvas} = require("canvas");

function generateChartImage(data, etfInfo, antiAliasing = true) {
    const canvasWidth = 128;
    const canvasHeight = 250;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    _colors = {};
    _marketOpen = null;

    const marketOpenColors = {
        background: "white",
        topBar: "black",
        topBarText: "white",
        graph: "blue",
        graphText: "black",
        symbolText: "black",
        lossText: "blue",
        gainText: "black",
        totalBlock: "black",
        totalText: "white",
        totalLossText: "blue",
        totalGainText: "white",
    }

    const marketClosedColors = {
        background: "black",
        topBar: "white",
        topBarText: "black",
        symbolText: "white",
        graph: "white",
        graphText: "white",
        lossText: "blue",
        gainText: "white",
        totalBlock: "black",
        totalText: "white",
        totalLossText: "white",
        totalGainText: "white",
    }


    // if after 11pm, turn the graph into a night mode type thing, indicating the market is closed
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    if (currentHour >= 23 && currentMinute >= 0) {
        _colors = marketClosedColors;
        _marketOpen = false;
    } else {
        _colors = marketOpenColors;
        _marketOpen = true
    }


    if (!antiAliasing) {
        ctx.imageSmoothingEnabled = false;
        ctx.antialias = "none";
        ctx.patternQuality = "best";
        ctx.textDrawingMode = "path";
    }


    const times = Object.keys(data);
    const holdings = times.map((time) => data[time].holdings);
    const latestTime = times[times.length - 1];

    const maxHoldings = Math.max(...holdings);
    const minHoldings = Math.min(...holdings);

    ctx.fillStyle = _colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);


    function drawEtfList(etfs, data) {
        ctx.fillStyle = _colors.symbolText;
        // ctx.antialias = "gray";
        let y = 15;
        for (const etf in etfs) {
            const latestPrice = data[latestTime]?.[etf]?.toFixed(2) ?? "N/A";

            ctx.font = "15px Arial";
            ctx.fillStyle = _colors.symbolText;
            ctx.fillText(etfInfo[etf].shortName, 5, y);
            y += 15;

            ctx.font = "14px Arial";
            ctx.fillText(`€${latestPrice}`, 5, y);
            y += 15;

            const firstPrice = data[times[0]][etf];
            const lastPrice = data[latestTime][etf];
            const change = lastPrice - firstPrice;
            const changeInHoldings = change * etfs[etf].holdings;
            const changePercentage = (change / firstPrice) * 100;

            console.log(change, changeInHoldings, changePercentage);

            let changeText = change > 0 ? `▲€${change.toFixed(2)} (${changePercentage.toFixed(2)}%)` : `▼ €${Math.abs(change).toFixed(2)} (${changePercentage.toFixed(2)}%)`;
            ctx.fillStyle = change > 0 ? _colors.gainText : _colors.lossText;
            ctx.fillText(changeText, 5, y);

            y += 15;
            changeText = changeInHoldings > 0 ? `Total: +€${changeInHoldings.toFixed(2)}` : `Total: -€${Math.abs(changeInHoldings).toFixed(2)}`;
            ctx.fillText(changeText, 5, y);

            y += 30;
        }
    }

    // draw the total block on the bottom
    function drawTotalBlock() {
        ctx.fillStyle = _colors.totalBlock;
        ctx.fillRect(0, canvasHeight - 50, canvasWidth, 50);

        const lastHoldings = holdings[holdings.length - 1];
        const firstHoldings = holdings[0];
        const totalDifference = lastHoldings - firstHoldings;
        const totalChangePercentage = ((totalDifference / firstHoldings) * 100).toFixed(2);

        const totalHoldings = lastHoldings.toFixed(2);
        const totalChangeText = totalDifference > 0
            ? `▲€${totalDifference.toFixed(2)} (${totalChangePercentage}%)`
            : `▼ €${Math.abs(totalDifference).toFixed(2)} (${totalChangePercentage}%)`;

        let y = canvasHeight - 35;
        ctx.font = "15px Arial";
        ctx.fillStyle = _colors.totalText;
        ctx.fillText(`Total: €${totalHoldings}`, 5, y);
        y += 15;

        ctx.font = "14px Arial";
        ctx.fillStyle = totalDifference > 0 ? _colors.totalGainText : _colors.totalLossText;
        ctx.fillText(totalChangeText, 5, y);

        // Calculate total profit/loss since buying in
        let totalProfit = 0;
        for (const etfId in etfInfo) {
            const etf = etfInfo[etfId];
            const currentPrice = data[latestTime][etfId]; // Current price of the ETF
            const initialInvestment = etf.boughtAt * etf.holdings;
            const currentValue = currentPrice * etf.holdings;
            totalProfit += currentValue - initialInvestment;
        }

        // Background for profit/loss text
        ctx.fillStyle = "blue";
        const profitTextY = y + 15;
        const textHeight = 15; // Height of the text
        ctx.fillRect(0, profitTextY - textHeight, canvasWidth, textHeight + 5); // Slight padding

        // Draw profit/loss text
        const profitText = totalProfit > 0
            ? `Profit: +€${totalProfit.toFixed(2)}`
            : `Loss: -€${Math.abs(totalProfit).toFixed(2)}`;

        ctx.fillStyle = _colors.totalText; // Use the total text color on red background
        ctx.fillText(profitText, 5, profitTextY);
    }




    // console.log(etfInfo);
    drawEtfList(etfInfo, data);
    drawTotalBlock();


    const imageData = ctx.getImageData(0, 0, canvasWidth, canvasHeight);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const r = imageData.data[i];
        const g = imageData.data[i + 1];
        const b = imageData.data[i + 2];

        const isWhite = r > 127 && g > 127 && b > 127;
        const isBlue = b > 127 && r < 127 && g < 127;
        const isBlack = r < 127 && g < 127 && b < 127;

        if (isWhite) {
            imageData.data[i] = 255;
            imageData.data[i + 1] = 255;
            imageData.data[i + 2] = 255;
        } else if (isBlue) {
            imageData.data[i] = 255;
            imageData.data[i + 1] = 0;
            imageData.data[i + 2] = 0;
        } else {
            imageData.data[i] = 0;
            imageData.data[i + 1] = 0;
            imageData.data[i + 2] = 0;
        }

        imageData.data[i + 3] = 255;
    }
    ctx.putImageData(imageData, 0, 0);

    // turn the image 90 degrees
    const rotatedCanvas = createCanvas(canvasHeight, canvasWidth);
    const rotatedCtx = rotatedCanvas.getContext("2d");
    rotatedCtx.translate(rotatedCanvas.width, 0);
    rotatedCtx.rotate(Math.PI / 2);
    rotatedCtx.drawImage(canvas, 0, 0);
    canvas.width = canvasHeight;
    canvas.height = canvasWidth;
    canvas.getContext("2d").drawImage(rotatedCanvas, 0, 0);


    return canvas.toBuffer("image/png");
}

module.exports = {generateChartImage};
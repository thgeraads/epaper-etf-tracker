// This file is meant to be used with a 400x300 BWR display with a size of 4.2 inches.
// Other sizes may not work as expected.
// This file contains all data on a single display.
const {createCanvas} = require("canvas");

function generateChartImage(data, etfInfo, antiAliasing = true) {
    const canvasWidth = 400;
    const canvasHeight = 300;
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


    const graphWidth = 256;
    const graphHeight = 236;
    const graphX = canvasWidth - graphWidth;
    const graphY = canvasHeight - graphHeight - 20;

    const times = Object.keys(data);
    const holdings = times.map((time) => data[time].holdings);
    const latestTime = times[times.length - 1];

    const maxHoldings = Math.max(...holdings);
    const minHoldings = Math.min(...holdings);
    const scaleX = graphWidth / (holdings.length - 1);
    const scaleY = graphHeight / (maxHoldings - minHoldings);

    ctx.fillStyle = _colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    // Draw the top bar with rounded corners
    const barHeight = 25; // Slightly less tall
    const barWidth = canvasWidth - 20; // Slightly less wide
    const barRadius = 12.5;
    const barY = 5; // Move down a few pixels
    const barX = (canvasWidth - barWidth) / 2; // Center the bar
    ctx.fillStyle = _colors.topBar;
    ctx.beginPath();
    ctx.moveTo(barX + barRadius, barY);
    ctx.lineTo(barX + barWidth - barRadius, barY);
    ctx.quadraticCurveTo(barX + barWidth, barY, barX + barWidth, barY + barRadius);
    ctx.lineTo(barX + barWidth, barY + barHeight - barRadius);
    ctx.quadraticCurveTo(barX + barWidth, barY + barHeight, barX + barWidth - barRadius, barY + barHeight);
    ctx.lineTo(barX + barRadius, barY + barHeight);
    ctx.quadraticCurveTo(barX, barY + barHeight, barX, barY + barHeight - barRadius);
    ctx.lineTo(barX, barY + barRadius);
    ctx.quadraticCurveTo(barX, barY, barX + barRadius, barY);
    ctx.closePath();
    ctx.fill();

    // Draw the time text in the top bar
    ctx.fillStyle = _colors.topBarText;
    ctx.font = antiAliasing ? "16px Arial" : "16px Monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    if (_marketOpen == true) {
        ctx.fillText("last updated at " + latestTime, (canvasWidth / 4) * 3, barY + barHeight / 2);
    }
    else{
        ctx.fillText("Market Closed", (canvasWidth / 4) * 3, barY + barHeight / 2);
    }

    ctx.fillStyle = _colors.symbolText;
    ctx.font = antiAliasing ? "14px Arial" : "14px Monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "top";
    let yOffset = 40; // Adjusted to avoid overlap with the top bar

    let totalProfit = 0;
    let totalCost = 0;

    for (const symbol of Object.keys(etfInfo)) {
        const shortName = etfInfo[symbol].shortName;
        const latestPrice = data[latestTime]?.[symbol]?.toFixed(2) ?? "N/A";
        ctx.fillStyle = _colors.symbolText;
        ctx.fillText(`${shortName}:`, 10, yOffset);
        yOffset += 15

        // calculate the price difference from the start of the day
        const startPrice = data[times[0]][symbol];
        const priceDifference = (latestPrice - startPrice).toFixed(2);
        const priceDifferencePercentage = ((priceDifference / startPrice) * 100).toFixed(2);
        const priceDifferenceColor = priceDifference > 0 ? _colors.gainText : _colors.lossText;
        // text with arrows and percentage
        // const priceDifferenceText = priceDifference > 0 ? ▲ €${priceDifference} : ▼ €${Math.abs(priceDifference)} ;
        let priceDifferenceText = priceDifference > 0 ? `▲ €${priceDifference}` :`▼ €${Math.abs(priceDifference)}` ;
        priceDifferenceText += priceDifference > 0 ?  ` (${priceDifferencePercentage}%)` :  ` (${Math.abs(priceDifferencePercentage)}%)`;
        ctx.fillStyle = priceDifferenceColor;

        ctx.fillText(`€${latestPrice}`, 10, yOffset);
        yOffset += 15;
        ctx.fillText(priceDifferenceText, 10, yOffset);
        yOffset += 30;

        // Calculate total profit for this ETF
        const boughtAt = etfInfo[symbol].boughtAt;
        const holdings = etfInfo[symbol].holdings;
        const profit = (latestPrice - boughtAt) * holdings;
        totalProfit += profit;
        totalCost += boughtAt * holdings;
    }

    ctx.strokeStyle = _colors.graph;
    ctx.lineWidth = 1;
    ctx.beginPath();
    let minPoint = null;
    let maxPoint = null;
    for (let i = 0; i < holdings.length; i++) {
        const x = graphX + scaleX * i;
        const y = graphY + graphHeight - (holdings[i] - minHoldings) * scaleY;

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);

        if (holdings[i] === maxHoldings) maxPoint = {x, y, value: maxHoldings.toFixed(2), time: times[i]};
        if (holdings[i] === minHoldings) minPoint = {x, y, value: minHoldings.toFixed(2), time: times[i]};
    }
    ctx.stroke();

    ctx.fillStyle = _colors.graphText;
    ctx.font = antiAliasing ? "12px Arial" : "12px Monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "bottom";
    if (minPoint) {
        ctx.fillText(`€${minPoint.value}`, minPoint.x, minPoint.y + 10);
    }
    ctx.textBaseline = "top";
    if (maxPoint) {
        ctx.fillText(`€${maxPoint.value}`, maxPoint.x, maxPoint.y - 10);
    }

    ctx.fillStyle = _colors.topBarText;
    ctx.font = antiAliasing ? "16px Arial" : "16px Monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`▲ €${maxPoint.value} | ▼ €${minPoint.value}`, barX + 5, barY + (barHeight / 2));

    ctx.fillStyle = _colors.graphText;
    ctx.font = antiAliasing ? "12px Arial" : "12px Monospace";
    ctx.textAlign = "center";
    ctx.textBaseline = "top";
    const labelInterval = Math.ceil(holdings.length / 6);
    for (let i = 0; i < times.length; i += labelInterval) {
        const x = graphX + scaleX * i;
        if (minPoint && Math.abs(x - minPoint.x) < 20) continue;
        ctx.fillText(times[i], x, graphY + graphHeight + 5);
    }


    // add total in the bottom left
    const total = holdings[holdings.length - 1].toFixed(2);
    ctx.fillStyle = _colors.totalBlock;
    ctx.fillRect(0, canvasHeight - 60, 120, 60);

    ctx.fillStyle = _colors.totalText;
    ctx.font = antiAliasing ? "17px Arial" : "12px Monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`Total: €${total}`, 5, canvasHeight - 50);

    ctx.font = antiAliasing ? "12px Arial" : "12px Monospace";
    // add total gains for the day
    const startTotal = holdings[0].toFixed(2);
    const totalDifference = (total - startTotal).toFixed(2);
    const totalDifferencePercentage = ((totalDifference / startTotal) * 100).toFixed(2);
    const totalDifferenceColor = totalDifference > 0 ? _colors.totalGainText : _colors.totalLossText;
    let totalDifferenceText = totalDifference > 0 ?`▲ €${totalDifference}` :`▼ €${Math.abs(totalDifference)}`;
    totalDifferenceText += totalDifference > 0 ?  ` (${totalDifferencePercentage}%)` : ` (${Math.abs(totalDifferencePercentage)}%)`;
    ctx.fillStyle = totalDifferenceColor;
    ctx.fillText(totalDifferenceText, 5, canvasHeight - 30);

    // Add total profit since buying with a separate red background
    const profitPercentage = ((totalProfit / totalCost) * 100).toFixed(2);
    const profitColor = totalProfit > 0 ? "white" : "blue"; // Text will be white regardless of profit or loss
    const profitBackgroundColor = totalProfit > 0 ? "blue" : "black"; // Green for profit, red for loss

    // Define rectangle dimensions
    const profitRectX = 0;
    const profitRectY = canvasHeight - 20;
    const profitRectWidth = 120;
    const profitRectHeight = 20;

    // Draw background rectangle
    ctx.fillStyle = profitBackgroundColor;
    ctx.fillRect(profitRectX, profitRectY, profitRectWidth, profitRectHeight);

    // Draw profit text
    ctx.fillStyle = profitColor;
    ctx.font = antiAliasing ? "14px Arial" : "12px Monospace";
    ctx.textAlign = "left";
    ctx.textBaseline = "middle";
    ctx.fillText(`▲ €${totalProfit.toFixed(2)} (${profitPercentage}%)`, profitRectX + 2, profitRectY + profitRectHeight / 2);





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

    return canvas.toBuffer("image/png");
}

module.exports = {generateChartImage};
const { createCanvas } = require("canvas");

function generateChartImage(data, antiAliasing = true) {
    const canvasWidth = 400;
    const canvasHeight = 300;
    const canvas = createCanvas(canvasWidth, canvasHeight);
    const ctx = canvas.getContext("2d");

    _marketOpen = null;

    const marketOpenColors = {
        background: "white",
        topBar: "black",
        topBarText: "white",
        graph: "blue",
        graphText: "black",
    };

    const marketClosedColors = {
        background: "black",
        topBar: "white",
        topBarText: "black",
        graph: "white",
        graphText: "white",
    };





    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    const currentMinute = currentTime.getMinutes();
    _colors = (currentHour >= 23 && currentMinute >= 0) ? marketClosedColors : marketOpenColors;

    if (!antiAliasing) {
        ctx.imageSmoothingEnabled = false;
        ctx.antialias = "none";
        ctx.patternQuality = "best";
        ctx.textDrawingMode = "path";
    }

    if (currentHour >= 23 && currentMinute >= 0) {
        _colors = marketClosedColors;
        _marketOpen = false;
    } else {
        _colors = marketOpenColors;
        _marketOpen = true
    }

    const graphWidth = canvasWidth - 20;
    const graphHeight = canvasHeight - 70;
    const graphX = 20;
    const graphY = 50;

    const times = Object.keys(data);
    const holdings = times.map((time) => data[time].holdings);
    const latestTime = times[times.length - 1];

    const maxHoldings = Math.max(...holdings);
    const minHoldings = Math.min(...holdings);
    const scaleX = graphWidth / (holdings.length - 1);
    const scaleY = graphHeight / (maxHoldings - minHoldings);

    ctx.fillStyle = _colors.background;
    ctx.fillRect(0, 0, canvasWidth, canvasHeight);

    const barHeight = 25;
    const barWidth = canvasWidth - 20;
    const barRadius = 12.5;
    const barY = 5;
    const barX = (canvasWidth - barWidth) / 2;
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

        if (holdings[i] === maxHoldings) maxPoint = { x, y, value: maxHoldings.toFixed(2), time: times[i] };
        if (holdings[i] === minHoldings) minPoint = { x, y, value: minHoldings.toFixed(2), time: times[i] };
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

module.exports = { generateChartImage };
// High-Performance Dark-Themed Canvas Financial Chart
export class FinancialChart {
  constructor(canvasElement, options = {}) {
    this.canvas = canvasElement;
    this.ctx = canvasElement.getContext('2d');
    this.options = {
      upColor: '#00c805',
      downColor: '#ef4444',
      bgGridColor: 'rgba(255, 255, 255, 0.04)',
      textSecondary: '#64748b',
      accentColor: '#d4fc50',
      ...options
    };

    this.candles = [];
    this.currentTicker = 'FOMOX';
    this.currentPrice = 0.00342;
    this.hoverPoint = null;
    this.timeframe = '5m';

    this.init();
  }

  init() {
    this.generateCandles(60, this.currentPrice);
    this.resize();
    window.addEventListener('resize', () => this.resize());

    // Mouse interactive crosshair
    this.canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
    this.canvas.addEventListener('mouseleave', () => {
      this.hoverPoint = null;
      this.render();
    });

    // Start live candle tick simulation
    this.startLiveFeed();
  }

  resize() {
    const rect = this.canvas.parentElement.getBoundingClientRect();
    const dpr = window.devicePixelRatio || 1;
    this.width = rect.width;
    const isMobile = window.innerWidth <= 640;
    this.height = isMobile ? 260 : Math.max(320, rect.height || 360);

    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;

    this.ctx.scale(dpr, dpr);
    this.render();
  }

  setToken(ticker, basePrice) {
    this.currentTicker = ticker;
    this.currentPrice = basePrice;
    this.generateCandles(60, basePrice);
    this.render();
  }

  setTimeframe(tf) {
    this.timeframe = tf;
    this.generateCandles(60, this.currentPrice);
    this.render();
  }

  generateCandles(count, basePrice) {
    this.candles = [];
    let price = basePrice * 0.88;
    const now = Date.now();
    const stepMs = 5 * 60 * 1000;

    for (let i = 0; i < count; i++) {
      const volatility = price * 0.018;
      const change = (Math.random() - 0.48) * volatility;
      const open = price;
      const close = open + change;
      const high = Math.max(open, close) + Math.random() * (volatility * 0.6);
      const low = Math.min(open, close) - Math.random() * (volatility * 0.6);
      const volume = Math.floor(Math.random() * 85000 + 15000);

      this.candles.push({
        time: now - (count - i) * stepMs,
        open,
        high,
        low,
        close,
        volume
      });

      price = close;
    }

    this.currentPrice = price;
  }

  startLiveFeed() {
    setInterval(() => {
      if (this.candles.length === 0) return;
      const last = this.candles[this.candles.length - 1];
      const delta = (Math.random() - 0.49) * (last.close * 0.0035);
      
      last.close += delta;
      last.high = Math.max(last.high, last.close);
      last.low = Math.min(last.low, last.close);
      last.volume += Math.floor(Math.random() * 500);

      this.currentPrice = last.close;

      // Dispatch price change event for the UI
      window.dispatchEvent(new CustomEvent('price-update', {
        detail: {
          ticker: this.currentTicker,
          price: this.currentPrice,
          change: ((last.close - last.open) / last.open) * 100
        }
      }));

      this.render();
    }, 1200);
  }

  handleMouseMove(e) {
    const rect = this.canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    this.hoverPoint = { x, y };
    this.render();
  }

  render() {
    if (!this.ctx || this.candles.length === 0) return;
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    ctx.clearRect(0, 0, w, h);

    // Margins
    const padTop = 30;
    const padBottom = 60;
    const padRight = 65;
    const chartHeight = h - padTop - padBottom;
    const chartWidth = w - padRight;

    // Find min and max
    let minPrice = Infinity;
    let maxPrice = -Infinity;
    let maxVolume = 0;

    for (const c of this.candles) {
      if (c.low < minPrice) minPrice = c.low;
      if (c.high > maxPrice) maxPrice = c.high;
      if (c.volume > maxVolume) maxVolume = c.volume;
    }

    // Add 5% headroom
    const priceRange = (maxPrice - minPrice) || 1;
    minPrice -= priceRange * 0.04;
    maxPrice += priceRange * 0.04;

    const getY = (p) => padTop + chartHeight - ((p - minPrice) / (maxPrice - minPrice)) * chartHeight;
    const getX = (idx) => (idx / (this.candles.length - 1)) * chartWidth;

    // Grid lines
    ctx.strokeStyle = this.options.bgGridColor;
    ctx.lineWidth = 1;
    const gridLines = 5;
    ctx.font = '10px JetBrains Mono, monospace';
    ctx.fillStyle = this.options.textSecondary;
    ctx.textAlign = 'left';

    for (let i = 0; i <= gridLines; i++) {
      const y = padTop + (chartHeight / gridLines) * i;
      const priceVal = maxPrice - ((maxPrice - minPrice) / gridLines) * i;

      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(chartWidth, y);
      ctx.stroke();

      // Price scale right label
      ctx.fillText(`$${priceVal < 0.01 ? priceVal.toFixed(6) : priceVal.toFixed(4)}`, chartWidth + 8, y + 3);
    }

    // Draw Volume Bars in bottom 25% of chart
    const volHeightMax = chartHeight * 0.22;
    const candleWidth = Math.max(3, (chartWidth / this.candles.length) * 0.65);

    this.candles.forEach((c, i) => {
      const x = getX(i);
      const isUp = c.close >= c.open;
      const volBarH = (c.volume / (maxVolume || 1)) * volHeightMax;
      const volY = padTop + chartHeight - volBarH;

      ctx.fillStyle = isUp ? 'rgba(0, 200, 5, 0.18)' : 'rgba(239, 68, 68, 0.18)';
      ctx.fillRect(x - candleWidth / 2, volY, candleWidth, volBarH);
    });

    // Draw EMA / Trend Line
    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    let ema = this.candles[0].close;
    const alpha = 2 / (14 + 1);

    this.candles.forEach((c, i) => {
      ema = c.close * alpha + ema * (1 - alpha);
      const x = getX(i);
      const y = getY(ema);
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();

    // Draw Candlesticks
    this.candles.forEach((c, i) => {
      const x = getX(i);
      const isUp = c.close >= c.open;
      const color = isUp ? this.options.upColor : this.options.downColor;

      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = 1.2;

      // Wick
      ctx.beginPath();
      ctx.moveTo(x, getY(c.high));
      ctx.lineTo(x, getY(c.low));
      ctx.stroke();

      // Body
      const bodyTop = getY(Math.max(c.open, c.close));
      const bodyBottom = getY(Math.min(c.open, c.close));
      const bodyHeight = Math.max(1.5, bodyBottom - bodyTop);

      ctx.fillRect(x - candleWidth / 2, bodyTop, candleWidth, bodyHeight);
    });

    // Current Price Pulsing Line
    const currentY = getY(this.currentPrice);
    ctx.strokeStyle = '#d4fc50';
    ctx.setLineDash([4, 4]);
    ctx.beginPath();
    ctx.moveTo(0, currentY);
    ctx.lineTo(chartWidth, currentY);
    ctx.stroke();
    ctx.setLineDash([]);

    // Current price tag on right axis
    ctx.fillStyle = '#d4fc50';
    ctx.beginPath();
    ctx.roundRect(chartWidth + 4, currentY - 10, padRight - 6, 20, 4);
    ctx.fill();
    ctx.fillStyle = '#0a0b0d';
    ctx.font = 'bold 10px JetBrains Mono, monospace';
    ctx.fillText(
      `$${this.currentPrice < 0.01 ? this.currentPrice.toFixed(6) : this.currentPrice.toFixed(4)}`,
      chartWidth + 7,
      currentY + 4
    );

    // Interactive Hover Crosshair & Tooltip
    if (this.hoverPoint && this.hoverPoint.x <= chartWidth) {
      const hoverX = this.hoverPoint.x;
      const hoverY = this.hoverPoint.y;

      // Find closest candle
      const closestIdx = Math.round((hoverX / chartWidth) * (this.candles.length - 1));
      const candle = this.candles[closestIdx];

      if (candle) {
        const snapX = getX(closestIdx);

        // Crosshair lines
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.setLineDash([2, 2]);
        ctx.beginPath();
        ctx.moveTo(snapX, padTop);
        ctx.lineTo(snapX, padTop + chartHeight);
        ctx.moveTo(0, hoverY);
        ctx.lineTo(chartWidth, hoverY);
        ctx.stroke();
        ctx.setLineDash([]);

        // Floating Info Header
        ctx.fillStyle = '#ffffff';
        ctx.font = '11px JetBrains Mono, monospace';
        const isUp = candle.close >= candle.open;
        const color = isUp ? this.options.upColor : this.options.downColor;

        const info = `O: ${candle.open.toFixed(5)}  H: ${candle.high.toFixed(5)}  L: ${candle.low.toFixed(5)}  C: ${candle.close.toFixed(5)}  Vol: ${candle.volume.toLocaleString()}`;
        ctx.fillStyle = color;
        ctx.fillText(info, 12, padTop - 10);
      }
    }
  }
}

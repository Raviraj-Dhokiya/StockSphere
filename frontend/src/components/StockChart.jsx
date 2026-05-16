import { useState, useEffect, useRef } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Filler,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import stockService from '../services/stockService';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Filler, Tooltip, Legend);

const TIMEFRAMES = [
  { label: '1D', resolution: '60', days: 1 },
  { label: '1W', resolution: 'D', days: 7 },
  { label: '1M', resolution: 'D', days: 30 },
  { label: '1Y', resolution: 'W', days: 365 },
];

const StockChart = ({ symbol }) => {
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTimeframe, setActiveTimeframe] = useState(TIMEFRAMES[2]); // 1M default

  useEffect(() => {
    const fetchCandles = async () => {
      setLoading(true);
      setError(null);
      try {
        const now = Math.floor(Date.now() / 1000);
        const from = now - activeTimeframe.days * 24 * 60 * 60;
        const data = await stockService.getCandles(symbol, activeTimeframe.resolution, from, now);
        setCandles(data.candles || []);
      } catch (err) {
        setError('Failed to load chart data');
      } finally {
        setLoading(false);
      }
    };

    if (symbol) fetchCandles();
  }, [symbol, activeTimeframe]);

  const isPositive = candles.length >= 2
    ? candles[candles.length - 1].close >= candles[0].close
    : true;

  const color = isPositive ? '#00d4aa' : '#ff4d6d';
  const colorDim = isPositive ? 'rgba(0,212,170,0.1)' : 'rgba(255,77,109,0.1)';

  const formatLabel = (timestamp) => {
    const d = new Date(timestamp * 1000);
    if (activeTimeframe.label === '1D') {
      return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    if (activeTimeframe.label === '1Y') {
      return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
    }
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const chartData = {
    labels: candles.map((c) => formatLabel(c.time)),
    datasets: [
      {
        data: candles.map((c) => c.close),
        borderColor: color,
        borderWidth: 2,
        backgroundColor: (ctx) => {
          const gradient = ctx.chart.ctx.createLinearGradient(0, 0, 0, 300);
          gradient.addColorStop(0, colorDim);
          gradient.addColorStop(1, 'rgba(0,0,0,0)');
          return gradient;
        },
        fill: true,
        tension: 0.3,
        pointRadius: 0,
        pointHoverRadius: 4,
        pointHoverBackgroundColor: color,
        pointHoverBorderColor: '#fff',
        pointHoverBorderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    animation: { duration: 600, easing: 'easeInOutQuart' },
    interaction: { intersect: false, mode: 'index' },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#1a2235',
        borderColor: '#2a3548',
        borderWidth: 1,
        titleColor: '#94a3b8',
        bodyColor: '#fff',
        titleFont: { family: 'JetBrains Mono', size: 11 },
        bodyFont: { family: 'JetBrains Mono', size: 13, weight: 'bold' },
        padding: 12,
        displayColors: false,
        callbacks: {
          label: (ctx) => `$${ctx.parsed.y.toFixed(2)}`,
        },
      },
    },
    scales: {
      x: {
        grid: { display: false },
        border: { display: false },
        ticks: {
          color: '#4b5563',
          font: { family: 'JetBrains Mono', size: 10 },
          maxTicksLimit: 8,
          maxRotation: 0,
        },
      },
      y: {
        position: 'right',
        grid: { color: '#1a2235', drawBorder: false },
        border: { display: false, dash: [4, 4] },
        ticks: {
          color: '#4b5563',
          font: { family: 'JetBrains Mono', size: 10 },
          callback: (val) => `$${val.toFixed(2)}`,
          maxTicksLimit: 6,
        },
      },
    },
  };

  return (
    <div className="card p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="font-display font-semibold text-white">Price Chart</h3>
          {candles.length >= 2 && (
            <p className={`text-xs font-mono mt-1 ${isPositive ? 'text-accent-green' : 'text-accent-red'}`}>
              {isPositive ? '▲' : '▼'} {Math.abs(((candles[candles.length-1].close - candles[0].close) / candles[0].close) * 100).toFixed(2)}% this period
            </p>
          )}
        </div>

        {/* Timeframe buttons */}
        <div className="flex gap-1 bg-dark-800 rounded-xl p-1">
          {TIMEFRAMES.map((tf) => (
            <button
              key={tf.label}
              onClick={() => setActiveTimeframe(tf)}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition-all duration-200 ${
                activeTimeframe.label === tf.label
                  ? 'bg-accent-green text-dark-900'
                  : 'text-gray-500 hover:text-gray-300'
              }`}
            >
              {tf.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chart area */}
      <div className="h-64 relative">
        {loading ? (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
            <div className="w-6 h-6 border-2 border-surface-border border-t-accent-green rounded-full animate-spin" />
            <p className="text-gray-600 text-xs font-mono">Loading chart data...</p>
          </div>
        ) : error ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-sm">{error}</p>
          </div>
        ) : candles.length === 0 ? (
          <div className="absolute inset-0 flex items-center justify-center">
            <p className="text-gray-500 text-sm">No data available for this timeframe</p>
          </div>
        ) : (
          <Line data={chartData} options={options} />
        )}
      </div>
    </div>
  );
};

export default StockChart;

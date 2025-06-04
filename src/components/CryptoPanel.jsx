import { useEffect, useRef, useState } from "react";
import Chart from "chart.js/auto";
import axios from "axios";


const baseUrl=import.meta.env.VITE_BASE_URL;

const COINS = [
  { id: "bitcoin", name: "Bitcoin (BTC)" },
  { id: "ethereum", name: "Ethereum (ETH)" },
  { id: "cardano", name: "Cardano (ADA)" },
  { id: "binancecoin", name: "Binance Coin (BNB)" },
  { id: "ripple", name: "Ripple (XRP)" },
];

const TIMEFRAMES = [
  { value: 7, label: "7 Days" },
  { value: 14, label: "14 Days" },
  { value: 30, label: "30 Days" },
];

export default function CryptoPanel() {
  const chartRef = useRef(null);
  const [crypto, setCrypto] = useState("bitcoin");
  const [timeframe, setTimeframe] = useState(7);
  const [chartInstance, setChartInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [loadingTimeout, setLoadingTimeout] = useState(null);


  const fetchCryptoData = async (coinId, days) => {
    console.log(baseUrl,"baseUrl");
    setError(null);
    setIsLoading(true);
    
    // Set a timeout to show slow loading notification after 3 seconds
    const timeout = setTimeout(() => {
      setLoadingTimeout("Server is taking longer than expected to respond...");
    }, 3000);

    try {
      const res = await axios.get(`${baseUrl}/api/crypto/?coinId=${coinId}&days=${days}`);
      clearTimeout(timeout);
      setIsLoading(false);
      setLoadingTimeout(null);
      return res.data;
    } catch (error) {
      console.error('Error fetching data:', error);
      clearTimeout(timeout);
      setIsLoading(false);
      setLoadingTimeout(null);
      setError("Failed to fetch data. Please try again later.");
      return null;
    }
  };

  const formatDate = (ts) => {
    const d = new Date(ts);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  };

  const renderChart = (data, coinName) => {
    const ctx = chartRef.current.getContext("2d");

    if (chartInstance) {
      chartInstance.destroy();
    }

    const labels = data.prices.map((p) => formatDate(p[0]));
    const priceData = data.prices.map((p) => p[1]);
    const volumeData = data.total_volumes.map((v) => v[1]);

    const gradient = ctx.createLinearGradient(0, 0, 0, 400);
    gradient.addColorStop(0, "rgba(0, 255, 200, 0.6)");
    gradient.addColorStop(1, "rgba(0, 255, 200, 0.1)");

    const newChart = new Chart(ctx, {
      type: "line",
      data: {
        labels,
        datasets: [
          {
            label: "Price (USD)",
            data: priceData,
            borderColor: "#00ffc8",
            backgroundColor: gradient,
            borderWidth: 2,
            yAxisID: "y",
            fill: true,
            tension: 0.3,
            pointRadius: 0,
            hoverRadius: 5,
          },
          {
            label: "Volume",
            data: volumeData,
            borderColor: "#ff6150",
            backgroundColor: "rgba(255, 97, 80, 0.3)",
            borderWidth: 1,
            yAxisID: "y1",
            fill: true,
            tension: 0.1,
            pointRadius: 0,
            hoverRadius: 5,
          },
        ],
      },
      options: {
        responsive: true,
        interaction: {
          mode: "index",
          intersect: false,
        },
        stacked: false,
        plugins: {
          legend: {
            labels: {
              color: "#00ffc8",
              font: { weight: "600", size: 14 },
            },
          },
          title: {
            display: true,
            text: `${coinName} Price and Volume (${labels.length} Days)`,
            color: "#00ffc8",
            font: { size: 18, weight: "700" },
            padding: { bottom: 20 },
          },
          tooltip: {
            backgroundColor: "#00ffc8",
            titleColor: "#121212",
            bodyColor: "#121212",
            cornerRadius: 6,
            usePointStyle: true,
            titleFont: { weight: "600", size: 14 },
            bodyFont: { weight: "500" },
          },
        },
        scales: {
          x: {
            ticks: {
              color: "#00ffc8",
              font: { weight: "600" },
            },
            grid: { color: "#333" },
          },
          y: {
            type: "linear",
            position: "left",
            ticks: { color: "#00ffc8", font: { weight: "600" } },
            grid: { color: "#333" },
            title: {
              display: true,
              text: "Price (USD)",
              color: "#00ffc8",
              font: { weight: "700" },
            },
          },
          y1: {
            type: "linear",
            position: "right",
            grid: { drawOnChartArea: false },
            ticks: { color: "#ff6150", font: { weight: "600" } },
            title: {
              display: true,
              text: "Volume",
              color: "#ff6150",
              font: { weight: "700" },
            },
          },
        },
      },
    });

    setChartInstance(newChart);
  };

useEffect(() => {
  fetchCryptoData();
  const interval = setInterval(() => {
    fetchCryptoData();
  }, 30000);
  return () => clearInterval(interval);
}, []);


  useEffect(() => {
    const coinName = COINS.find((c) => c.id === crypto)?.name.split(" ")[0];
    fetchCryptoData(crypto, timeframe).then((data) => {
      if (data) renderChart(data, coinName);
    });
  }, [crypto, timeframe]);

  return (
    <div className="min-h-screen bg-[#121212] text-white flex flex-col items-center p-4 font-sans">
      <h1 className="text-3xl font-semibold mb-4 text-[#00ffc8] text-center shadow-md">
        Cryptocurrency Detailed Analysis Panel
      </h1>

      {/* Loading and Error notifications */}
      {loadingTimeout && (
        <div className="w-full max-w-5xl mb-4 p-3 bg-yellow-500/20 text-yellow-300 rounded-lg">
          {loadingTimeout}
        </div>
      )}
      {error && (
        <div className="w-full max-w-5xl mb-4 p-3 bg-red-500/20 text-red-300 rounded-lg">
          {error}
        </div>
      )}

      <div className="bg-[#1e1e1e] rounded-xl p-6 w-full max-w-5xl shadow-lg flex flex-col gap-6">
        {isLoading && !loadingTimeout && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-xl">
            <div className="text-[#00ffc8]">Loading...</div>
          </div>
        )}
        <div className="flex flex-wrap justify-between gap-4">
          <div>
            <label className="font-semibold mr-2 text-[#00ffc8]">Select Cryptocurrency:</label>
            <select
              className="bg-[#222] text-white font-semibold rounded-md px-3 py-2 shadow-inner min-w-[130px] hover:bg-[#333] focus:outline-none focus:ring-2 focus:ring-[#00ffc8]"
              value={crypto}
              onChange={(e) => setCrypto(e.target.value)}
            >
              {COINS.map((coin) => (
                <option key={coin.id} value={coin.id}>
                  {coin.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="font-semibold mr-2 text-[#00ffc8]">Select Timeframe:</label>
            <select
              className="bg-[#222] text-white font-semibold rounded-md px-3 py-2 shadow-inner min-w-[130px] hover:bg-[#333] focus:outline-none focus:ring-2 focus:ring-[#00ffc8]"
              value={timeframe}
              onChange={(e) => setTimeframe(e.target.value)}
            >
              {TIMEFRAMES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        <canvas ref={chartRef} className="bg-[#111] rounded-xl shadow-md w-full max-h-[400px]" />
      </div>

      <footer className="mt-8 text-sm text-gray-500 text-center">
        Desinged By Thison Rooban J
      </footer>
    </div>
  );
}

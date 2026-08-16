// components/shared/charts/LiveCampaignChart.tsx

"use client";

import { ApexOptions } from "apexcharts";
import { useEffect, useMemo, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { CampaignHistory } from "../../../modules/account/live-campaign/live-campaign.types";

interface LiveCampaignChartProps {
  data: CampaignHistory;
}

type TabView = "hourly" | "daily";

export const LiveCampaignChart: React.FC<LiveCampaignChartProps> = ({
  data,
}) => {
  const [tab, setTab] = useState<TabView>("hourly");
  const [history, setHistory] = useState<CampaignHistory>(data);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // parent theke data update hole (polling) sync kori
  useEffect(() => {
    setHistory(data);
  }, [data]);

  // ---- Hourly (aaj, full 0-23 route, cumulative jotokhon data ase) ----
  const hourlyCategories = useMemo(
    () => history.hourlySeries.map((h) => `${h.hour}:00`),
    [history],
  );
  const hourlyCumulative = useMemo(() => {
    let running = 0;
    let seenData = false;
    return history.hourlySeries.map((h) => {
      if (h.profit === null) {
        // future hour — jodi age kono data-i dekha jayni, tahole null-i thakuk
        // (ekhono match shuru hoyni). Kintu ager kono value dekha gele
        // ei point-o null rekhe deoa hocche jate line ekhane theme jay.
        return null;
      }
      seenData = true;
      running += h.profit;
      return round2(running);
    });
  }, [history]);

  // ---- Daily (full route: start -> estimatedEndDate) ----
  const dailyCategories = useMemo(
    () => history.dailySeries.map((d) => d.date.slice(5)), // MM-DD
    [history],
  );
  const dailyCumulative = useMemo(() => {
    let running = 0;
    return history.dailySeries.map((d) => {
      if (d.profit === null) return null;
      running += d.profit;
      return round2(running);
    });
  }, [history]);

  const isHourly = tab === "hourly";
  const categories = isHourly ? hourlyCategories : dailyCategories;
  const profitData = isHourly ? hourlyCumulative : dailyCumulative;
  const budgetLine = categories.map(() => history.perDayBudget);
  const maxPickLine = categories.map(() => history.maxPick);

  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 350,
      animations: {
        enabled: true,
        easing: "linear",
        dynamicAnimation: { speed: 500 },
      },
      toolbar: { show: true },
      background: "transparent",
    },
    stroke: {
      curve: "smooth",
      width: [3, 2, 2],
    },
    // null value ashle line connect na kore theme jabe — "match jotodur hoyeche totodur"
    markers: {
      size: 0,
    },
    colors: ["#FFB74D", "#9E9E9E", "#4CAF50"], // yellow profit, gray budget, green max
    title: {
      text: `${history.title} – ${isHourly ? "Today (Hourly)" : "By Date"}`,
      align: "center",
      style: { fontSize: "16px", fontWeight: "bold", color: "#333" },
    },
    xaxis: {
      categories,
      labels: { style: { colors: "#666" } },
    },
    yaxis: {
      title: { text: "Amount (৳)", style: { color: "#666" } },
      labels: { formatter: (val) => (val ?? 0).toFixed(0) },
    },
    series: [
      { name: "Profit (Cumulative)", data: profitData },
      { name: "Daily Budget", data: budgetLine },
      { name: "Max Pick (4x)", data: maxPickLine },
    ],
    tooltip: {
      y: {
        formatter: (val) =>
          val === null || val === undefined
            ? "No data yet"
            : `৳${val.toFixed(2)}`,
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
      labels: { colors: "#333" },
    },
    grid: {
      borderColor: "#e0e0e0",
      strokeDashArray: 4,
    },
    dataLabels: { enabled: false },
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <div className="flex justify-end gap-2 mb-2">
        <button
          onClick={() => setTab("hourly")}
          className={`px-3 py-1 text-xs rounded-full ${
            tab === "hourly"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          Hourly (Today)
        </button>
        <button
          onClick={() => setTab("daily")}
          className={`px-3 py-1 text-xs rounded-full ${
            tab === "daily"
              ? "bg-blue-600 text-white"
              : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
          }`}
        >
          By Date
        </button>
      </div>

      {loadingHistory ? (
        <div className="flex justify-center items-center h-[350px] text-sm text-gray-400">
          Loading chart...
        </div>
      ) : (
        <ReactApexChart
          options={options}
          series={options.series}
          type="line"
          height={350}
        />
      )}

      <div className="mt-4 grid grid-cols-3 gap-4 text-center">
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Daily Budget
          </p>
          <p className="text-lg font-semibold text-gray-800 dark:text-white">
            ৳{history.perDayBudget}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Max Pick (4x)
          </p>
          <p className="text-lg font-semibold text-green-600">
            ৳{history.maxPick}
          </p>
        </div>
        <div>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Today's Profit (Live)
          </p>
          <p className="text-lg font-semibold text-orange-500 dark:text-orange-400">
            ৳{history.todayProfit.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
};

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

export default LiveCampaignChart;

// components/charts/AnnualCharts.tsx
"use client";

import dynamic from "next/dynamic";
import { MonthlyData } from "../../modules/reports/annual-reports/annual-reports.types";

const Chart = dynamic(() => import("react-apexcharts"), { ssr: false });

interface ChartProps {
  data: MonthlyData[];
  year: number;
}

// ১. কম্বো চার্ট – Monthly Net (Bar) + Running Cash (Line)
export const ComboChart = ({ data, year }: ChartProps) => {
  const categories = data.map((d) => d.monthName);
  const monthlyNet = data.map((d) => d.monthlyNet);
  const runningCash = data.map((d) => d.runningCash);

  const series = [
    {
      name: "মাসিক নিট",
      type: "column",
      data: monthlyNet,
    },
    {
      name: "চলতি ক্যাশ",
      type: "line",
      data: runningCash,
    },
  ];

  const options = {
    chart: {
      type: "line",
      height: 350,
      toolbar: { show: true },
      animations: { enabled: true },
    },
    stroke: {
      width: [0, 3],
      curve: "smooth",
    },
    plotOptions: {
      bar: {
        columnWidth: "50%",
        borderRadius: 4,
      },
    },
    fill: {
      opacity: [0.85, 1],
    },
    labels: categories,
    markers: {
      size: 4,
    },
    xaxis: {
      categories,
      title: { text: "মাস" },
    },
    yaxis: {
      title: { text: "টাকা (৳)" },
    },
    colors: ["#4FC3F7", "#FF7043"],
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
    tooltip: {
      y: {
        formatter: (val: number) => `৳${val.toFixed(2)}`,
      },
    },
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
        মাসিক নিট প্রফিট ও চলতি ক্যাশ - {year}
      </h3>
      <Chart options={options} series={series} type="line" height={350} />
    </div>
  );
};

// ২. বার চার্ট – Sales Net Profit
export const SalesProfitChart = ({ data, year }: ChartProps) => {
  const categories = data.map((d) => d.monthName);
  const salesProfit = data.map((d) => d.salesNetProfit);

  const options = {
    chart: {
      type: "bar",
      height: 300,
      toolbar: { show: true },
    },
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "55%",
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `৳${val.toFixed(0)}`,
      offsetY: -10,
      style: { fontSize: "10px", colors: ["#304758"] },
    },
    xaxis: {
      categories,
      title: { text: "মাস" },
    },
    yaxis: {
      title: { text: "টাকা (৳)" },
    },
    colors: ["#BA68C8"],
    legend: {
      position: "top",
    },
    tooltip: {
      y: {
        formatter: (val: number) => `৳${val.toFixed(2)}`,
      },
    },
  };

  const series = [{ name: "সেলস নেট প্রফিট", data: salesProfit }];

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
        মাসিক সেলস নেট প্রফিট - {year}
      </h3>
      <Chart options={options} series={series} type="bar" height={300} />
    </div>
  );
};

// ৩. লাইন চার্ট – Total Sales
export const SalesChart = ({ data, year }: ChartProps) => {
  const categories = data.map((d) => d.monthName);
  const totalSales = data.map((d) => d.totalSales);

  const options = {
    chart: {
      type: "line",
      height: 300,
      toolbar: { show: true },
      zoom: { enabled: true },
    },
    stroke: {
      curve: "smooth",
      width: 3,
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `৳${val.toFixed(0)}`,
      style: { fontSize: "10px", colors: ["#304758"] },
    },
    xaxis: {
      categories,
      title: { text: "মাস" },
    },
    yaxis: {
      title: { text: "টাকা (৳)" },
    },
    colors: ["#4CAF50"],
    markers: {
      size: 5,
    },
    tooltip: {
      y: {
        formatter: (val: number) => `৳${val.toFixed(2)}`,
      },
    },
  };

  const series = [{ name: "মোট বিক্রয়", data: totalSales }];

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
        মাসিক মোট বিক্রয় - {year}
      </h3>
      <Chart options={options} series={series} type="line" height={300} />
    </div>
  );
};

// ৪. পাই চার্ট – Income Sources
export const IncomePieChart = ({ data, year }: ChartProps) => {
  const totalSalesProfit = data.reduce((sum, d) => sum + d.salesNetProfit, 0);
  const totalOtherIncome = data.reduce((sum, d) => sum + d.otherIncome, 0);

  const series = [totalSalesProfit, totalOtherIncome];
  const labels = ["সেলস নেট প্রফিট", "অন্যান্য আয়"];
  const colors = ["#4FC3F7", "#81C784"];

  const options = {
    chart: {
      type: "pie",
      height: 320,
    },
    labels,
    colors,
    legend: {
      position: "bottom",
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number, opts: any) => {
        const total = series.reduce((a, b) => a + b, 0);
        const percent = total > 0 ? ((val / total) * 100).toFixed(1) : 0;
        return `${percent}%`;
      },
      style: { fontSize: "12px", colors: ["#304758"] },
    },
    tooltip: {
      y: {
        formatter: (val: number) => `৳${val.toFixed(2)}`,
      },
    },
  };

  return (
    <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl p-4 shadow-lg border border-gray-200/50 dark:border-gray-700/50">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-3">
        আয়ের উৎস - {year}
      </h3>
      <Chart options={options} series={series} type="pie" height={320} />
    </div>
  );
};

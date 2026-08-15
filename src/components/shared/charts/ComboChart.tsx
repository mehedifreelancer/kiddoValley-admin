"use client";

import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";

interface ComboChartProps {
  data: {
    month: string;
    monthlyNet: number;
    runningCash: number;
  }[];
  year: number;
}

export const ComboChart: React.FC<ComboChartProps> = ({ data, year }) => {
  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 350,
      toolbar: { show: true },
      animations: { enabled: true },
      background: "transparent",
    },
    stroke: {
      width: [0, 3],
      curve: "smooth",
    },
    colors: ["#E57373", "#4FC3F7"],
    title: {
      text: `মাসিক নিট প্রফিট ও চলতি ক্যাশ (${year})`,
      align: "center",
      style: { fontSize: "16px", fontWeight: "bold", color: "#333" },
    },
    xaxis: {
      categories: data.map((d) => d.month),
      labels: { rotate: -45 },
    },
    yaxis: [
      {
        title: { text: "নিট প্রফিট (৳)" },
        labels: { formatter: (val) => val.toFixed(0) },
      },
      {
        opposite: true,
        title: { text: "চলতি ক্যাশ (৳)" },
        labels: { formatter: (val) => val.toFixed(0) },
      },
    ],
    tooltip: {
      shared: true,
      intersect: false,
      y: {
        formatter: (val) => `৳${val.toFixed(2)}`,
      },
    },
    legend: {
      position: "top",
      horizontalAlign: "center",
    },
    grid: {
      borderColor: "#e0e0e0",
      strokeDashArray: 4,
    },
    dataLabels: {
      enabled: false,
    },
  };

  const series = [
    {
      name: "মাসিক নিট প্রফিট",
      type: "column",
      data: data.map((d) => Math.round(d.monthlyNet)),
    },
    {
      name: "চলতি ক্যাশ",
      type: "line",
      data: data.map((d) => Math.round(d.runningCash)),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <ReactApexChart
        options={options}
        series={series}
        type="line"
        height={350}
      />
    </div>
  );
};

export default ComboChart;

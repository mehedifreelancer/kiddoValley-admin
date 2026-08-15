"use client";

import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";

interface SalesChartProps {
  data: {
    month: string;
    totalSales: number;
  }[];
  year: number;
}

export const SalesChart: React.FC<SalesChartProps> = ({ data, year }) => {
  const options: ApexOptions = {
    chart: {
      type: "line",
      height: 350,
      toolbar: { show: true },
      animations: { enabled: true },
      background: "transparent",
    },
    stroke: {
      width: 3,
      curve: "smooth",
    },
    colors: ["#81C784"],
    title: {
      text: `মাসিক মোট বিক্রয় (${year})`,
      align: "center",
      style: { fontSize: "16px", fontWeight: "bold", color: "#333" },
    },
    xaxis: {
      categories: data.map((d) => d.month),
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "মোট বিক্রয় (৳)" },
      labels: { formatter: (val) => val.toFixed(0) },
    },
    tooltip: {
      y: {
        formatter: (val) => `৳${val.toFixed(2)}`,
      },
    },
    markers: {
      size: 6,
      colors: ["#81C784"],
      strokeColors: "#fff",
      strokeWidth: 2,
      hover: { size: 8 },
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
      enabled: true,
      formatter: (val) => `৳${val.toFixed(0)}`,
      offsetY: -10,
    },
  };

  const series = [
    {
      name: "মোট বিক্রয়",
      data: data.map((d) => Math.round(d.totalSales)),
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

export default SalesChart;

// modules/reports/annual-reports/components/MonthlyComparisonChart.tsx
"use client";

import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";

interface MonthlyComparisonChartProps {
  data: {
    month: string;
    totalSales: number;
    expenses: number;
    monthlyNet: number;
  }[];
  year: number;
}

export const MonthlyComparisonChart: React.FC<MonthlyComparisonChartProps> = ({
  data,
  year,
}) => {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 400,
      toolbar: { show: true },
      animations: { enabled: true },
      background: "transparent",
    },
    colors: ["#4FC3F7", "#FF8A65", "#81C784"],
    plotOptions: {
      bar: {
        horizontal: false,
        columnWidth: "55%",
        borderRadius: 4,
        borderRadiusApplication: "end",
      },
    },
    title: {
      text: `মাসিক তুলনা: বিক্রয়, খরচ ও নিট লাভ/ক্ষতি (${year})`,
      align: "center",
      style: { fontSize: "18px", fontWeight: "bold", color: "#333" },
    },
    xaxis: {
      categories: data.map((d) => d.month),
      labels: {
        rotate: -45,
        style: { fontSize: "10px" },
      },
    },
    yaxis: {
      title: { text: " (৳)" },
      labels: {
        formatter: (val) => val.toFixed(0),
      },
    },
    tooltip: {
      y: {
        formatter: (val) => `৳${val.toFixed(2)}`,
      },
      shared: true,
      intersect: false,
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
      offsetY: -5,
      style: { fontSize: "10px", colors: ["#333"] },
    },
  };

  const series = [
    {
      name: "বিক্রয় আয়",
      data: data.map((d) => Math.round(d.totalSales)),
    },
    {
      name: "মোট খরচ",
      data: data.map((d) => Math.round(d.expenses)),
    },
    {
      name: "নিট লাভ/ক্ষতি",
      data: data.map((d) => Math.round(d.monthlyNet)),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={400}
      />
    </div>
  );
};

export default MonthlyComparisonChart;

"use client";

import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";

interface SalesProfitChartProps {
  data: {
    month: string;
    salesNetProfit: number;
  }[];
  year: number;
}

export const SalesProfitChart: React.FC<SalesProfitChartProps> = ({
  data,
  year,
}) => {
  const options: ApexOptions = {
    chart: {
      type: "bar",
      height: 350,
      toolbar: { show: true },
      animations: { enabled: true },
      background: "transparent",
    },
    colors: ["#BA68C8"],
    plotOptions: {
      bar: {
        borderRadius: 4,
        horizontal: false,
        columnWidth: "60%",
      },
    },
    title: {
      text: `মাসিক সেলস নেট প্রফিট (${year})`,
      align: "center",
      style: { fontSize: "16px", fontWeight: "bold", color: "#333" },
    },
    xaxis: {
      categories: data.map((d) => d.month),
      labels: { rotate: -45 },
    },
    yaxis: {
      title: { text: "সেলস নেট প্রফিট (৳)" },
      labels: { formatter: (val) => val.toFixed(0) },
    },
    tooltip: {
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
      enabled: true,
      formatter: (val) => `৳${val.toFixed(0)}`,
      offsetY: -10,
    },
  };

  const series = [
    {
      name: "সেলস নেট প্রফিট",
      data: data.map((d) => Math.round(d.salesNetProfit)),
    },
  ];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <ReactApexChart
        options={options}
        series={series}
        type="bar"
        height={350}
      />
    </div>
  );
};

export default SalesProfitChart;

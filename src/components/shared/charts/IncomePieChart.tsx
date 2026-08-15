// modules/reports/annual-reports/components/IncomePieChart.tsx
"use client";

import { ApexOptions } from "apexcharts";
import React from "react";
import ReactApexChart from "react-apexcharts";

interface IncomePieChartProps {
  data: {
    salesNetProfit: number;
    otherIncome: number;
  };
  year: number;
}

export const IncomePieChart: React.FC<IncomePieChartProps> = ({
  data,
  year,
}) => {
  const total = data.salesNetProfit + data.otherIncome;

  if (total === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700 flex items-center justify-center h-[350px]">
        <p className="text-gray-500 dark:text-gray-400">এই বছরে কোনো আয় নেই</p>
      </div>
    );
  }

  const options: ApexOptions = {
    chart: {
      type: "pie",
      height: 350,
      animations: { enabled: true },
      background: "transparent",
    },
    colors: ["#4FC3F7", "#81C784"],
    title: {
      text: `আয়ের উৎস (${year})`,
      align: "center",
      style: { fontSize: "16px", fontWeight: "bold", color: "#333" },
    },
    labels: ["সেলস নেট প্রফিট", "অন্যান্য আয়"],
    legend: {
      position: "bottom",
      horizontalAlign: "center",
    },
    tooltip: {
      y: {
        formatter: (val) => `৳${val.toFixed(2)}`,
      },
    },
    dataLabels: {
      enabled: true,
      formatter: (val: number) => `${val.toFixed(1)}%`,
    },
    plotOptions: {
      pie: {
        expandOnClick: true,
        donut: {
          size: "60%",
          labels: {
            show: true,
            name: { show: true },
            value: { show: true, formatter: (val) => `৳${val}` },
            total: {
              show: true,
              label: "মোট আয়",
              formatter: () => `৳${total.toFixed(0)}`,
            },
          },
        },
      },
    },
  };

  const series = [data.salesNetProfit, data.otherIncome];

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border border-gray-200 dark:border-gray-700">
      <ReactApexChart
        options={options}
        series={series}
        type="pie"
        height={350}
      />
    </div>
  );
};

export default IncomePieChart;

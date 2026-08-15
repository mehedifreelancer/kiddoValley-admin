"use client";

import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { ChevronLeft, ChevronRight, Download, Printer } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import ComboChart from "../../../components/shared/charts/ComboChart";
import IncomePieChart from "../../../components/shared/charts/IncomePieChart";
import MonthlyComparisonChart from "../../../components/shared/charts/MonthlyComparisonChart";
import SalesChart from "../../../components/shared/charts/SalesChart";
import SalesProfitChart from "../../../components/shared/charts/SalesProfitChart";
import Button from "../../../components/ui/Button";
import Toolbar from "../../../components/ui/Toolbar";
import { fetchAnnualReport } from "./annual-reports.service";
import { AnnualReportData } from "./annual-reports.types";

export const AnnualReport = () => {
  const [year, setYear] = useState(new Date().getFullYear());
  const [report, setReport] = useState<AnnualReportData | null>(null);
  const [loading, setLoading] = useState(true);
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-based
  const isCurrentYear = year === now.getFullYear();

  const fetchData = async (yr: number) => {
    setLoading(true);
    try {
      const data = await fetchAnnualReport(yr);
      setReport(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(year);
  }, [year]);

  const handleYearChange = (delta: number) => {
    setYear((prev) => prev + delta);
  };

  const formatProfit = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}`;
  };

  // Prepare chart data
  const chartData =
    report?.months.map((m) => ({
      month: m.monthName,
      salesNetProfit: m.salesNetProfit,
      otherIncome: m.otherIncome,
      expenses: m.expenses,
      monthlyNet: m.monthlyNet,
      runningCash: m.runningCash,
      totalSales: m.totalSales,
    })) || [];

  const pieData = report
    ? {
        salesNetProfit: report.totals.totalSalesNetProfit,
        otherIncome: report.totals.totalOtherIncome,
      }
    : { salesNetProfit: 0, otherIncome: 0 };

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF("landscape", "pt", "a4");
    doc.setFontSize(18);
    doc.text(`Annual Report - ${year}`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Year: ${year}`, 40, 60);

    // ✅ Compute cumulative running cash for PDF, but stop accumulating
    // once we pass the current month (same fix as the on-screen table)
    let pdfCumulative = 0;
    const pdfRows = report.months.map((m, idx) => {
      const hasOccurred =
        year < now.getFullYear() || (isCurrentYear && idx <= currentMonth);

      if (hasOccurred) {
        pdfCumulative += m.monthlyNet;
      }

      return [
        m.monthName,
        m.totalSales.toFixed(2),
        m.salesNetProfit.toFixed(2),
        m.expenses.toFixed(2),
        m.monthlyNet.toFixed(2),
        hasOccurred ? pdfCumulative.toFixed(2) : "-",
      ];
    });

    autoTable(doc, {
      startY: 70,
      head: [
        [
          "Month",
          "Total Sales",
          "Sales Net Profit",
          "Expenses",
          "Monthly Net",
          "Running Cash",
        ],
      ],
      body: pdfRows,
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    doc.setFontSize(12);
    const totals = report.totals;
    // ✅ Final cash = cumulative sum only up to the current/elapsed months
    const finalCash = report.months.reduce((acc, m, idx) => {
      const hasOccurred =
        year < now.getFullYear() || (isCurrentYear && idx <= currentMonth);
      return hasOccurred ? acc + m.monthlyNet : acc;
    }, 0);
    doc.text(
      `Totals - Sales: ${totals.totalSales.toFixed(2)}, Net Profit: ${totals.totalSalesNetProfit.toFixed(2)}, Expenses: ${totals.totalExpenses.toFixed(2)}, Final Cash: ${finalCash.toFixed(2)}`,
      40,
      finalY,
    );

    doc.save(`annual-report-${year}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!report) return null;

  // ✅ চলতি ক্যাশ ফ্রন্টএন্ডেই ক্যালকুলেট করি (ব্যাকএন্ডের ভুল ডেটা ওভাররাইড)
  // শুধু "ঘটে যাওয়া" (past বা current) মাসগুলোর জন্য cumulative sum হবে,
  // ভবিষ্যতের মাসগুলোতে monthlyNet এখনো 0 বলে সেগুলোকে যোগ করা হবে না —
  // এটাই ছিল আগের bug: সব ভবিষ্যৎ মাসে same running cash দেখানো।
  let cumulative = 0;
  const monthsWithRunning = report.months.map((month, idx) => {
    const hasOccurred =
      year < now.getFullYear() || (isCurrentYear && idx <= currentMonth);

    if (hasOccurred) {
      cumulative += month.monthlyNet;
      return { ...month, computedRunningCash: cumulative, hasOccurred: true };
    }

    return {
      ...month,
      computedRunningCash: null as number | null,
      hasOccurred: false,
    };
  });

  // ✅ সর্বমোট চলতি ক্যাশ = শেষ "ঘটে যাওয়া" মাসের computedRunningCash
  const occurredMonths = monthsWithRunning.filter((m) => m.hasOccurred);
  const finalCash =
    occurredMonths.length > 0
      ? (occurredMonths[occurredMonths.length - 1]
          .computedRunningCash as number)
      : 0;

  return (
    <div>
      <Toolbar title={`Annual Report - ${year}`}>
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleYearChange(-1)}
            className="flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            {year - 1}
          </Button>
          <span className="text-lg font-bold text-indigo-600 dark:text-indigo-400">
            {year}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => handleYearChange(1)}
            className="flex items-center gap-1"
          >
            {year + 1}
            <ChevronRight className="w-4 h-4" />
          </Button>
          <div className="flex gap-2 no-print">
            <Button
              variant="primary"
              size="sm"
              onClick={downloadPDF}
              className="flex items-center gap-1"
            >
              <Download className="w-4 h-4" /> PDF
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => window.print()}
              className="flex items-center gap-1"
            >
              <Printer className="w-4 h-4" /> Print
            </Button>
          </div>
        </div>
      </Toolbar>

      {/* ✅ টেবিল – প্রথমে দেখাবে (Category UI স্টাইলে) */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mt-4 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-xl shadow-lg border border-gray-200/50 dark:border-gray-700/50 overflow-hidden"
      >
        <div className="table-container">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 dark:bg-gray-700/30 text-gray-700 dark:text-gray-300">
              <tr>
                <th className="column-header px-4 py-2 font-semibold">মাস</th>
                <th className="column-header px-4 py-2 font-semibold text-right">
                  মোট বিক্রয়
                </th>
                <th className="column-header px-4 py-2 font-semibold text-right text-green-600 dark:text-green-400">
                  সেলস নেট প্রফিট
                </th>
                <th className="column-header px-4 py-2 font-semibold text-right text-red-600 dark:text-red-400">
                  মোট খরচ
                </th>
                <th className="column-header px-4 py-2 font-semibold text-right">
                  মাসিক লাভ
                </th>
                <th className="column-header px-4 py-2 font-semibold text-right">
                  চলতি ক্যাশ
                </th>
              </tr>
            </thead>
            <tbody>
              {monthsWithRunning.map((month, idx) => {
                const isCurrentMonth = idx === currentMonth && isCurrentYear;
                return (
                  <tr
                    key={idx}
                    className={`table-row border-b border-gray-200 dark:border-gray-700 transition-all ${
                      isCurrentMonth
                        ? "bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 shadow-inner"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    }`}
                  >
                    <td className="column-body px-4 py-3 font-medium">
                      {month.monthName}
                      {isCurrentMonth && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          বর্তমান
                        </span>
                      )}
                    </td>
                    <td className="column-body px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      ৳{month.totalSales.toFixed(2)}
                    </td>
                    <td className="column-body px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                      ৳{month.salesNetProfit.toFixed(2)}
                    </td>
                    <td className="column-body px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                      ৳{month.expenses.toFixed(2)}
                    </td>
                    <td
                      className={`column-body px-4 py-3 text-right font-bold ${
                        month.monthlyNet >= 0
                          ? "text-green-600 dark:text-green-400"
                          : "text-red-600 dark:text-red-400"
                      }`}
                    >
                      {month.monthlyNet >= 0 ? "+" : ""}
                      {month.monthlyNet.toFixed(2)}
                    </td>
                    <td className="column-body px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                      {month.computedRunningCash !== null
                        ? `৳${month.computedRunningCash.toFixed(2)}`
                        : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot className="bg-gray-100 dark:bg-gray-800 font-bold border-t-2 border-gray-300 dark:border-gray-600">
              <tr>
                <td className="column-body px-4 py-3">সর্বমোট</td>
                <td className="column-body px-4 py-3 text-right text-gray-800 dark:text-white">
                  ৳{report.totals.totalSales.toFixed(2)}
                </td>
                <td className="column-body px-4 py-3 text-right text-green-600 dark:text-green-400">
                  ৳{report.totals.totalSalesNetProfit.toFixed(2)}
                </td>
                <td className="column-body px-4 py-3 text-right text-red-600 dark:text-red-400">
                  ৳{report.totals.totalExpenses.toFixed(2)}
                </td>
                <td className="column-body px-4 py-3 text-right">
                  {report.totals.totalMonthlyNet >= 0 ? "+" : ""}
                  {report.totals.totalMonthlyNet.toFixed(2)}
                </td>
                <td className="column-body px-4 py-3 text-right text-gray-800 dark:text-white">
                  ৳{finalCash.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* 🆕 চার্ট – টেবিলের নিচে */}
      <div className="mt-6 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ComboChart data={chartData} year={year} />
          <SalesProfitChart data={chartData} year={year} />
          <SalesChart data={chartData} year={year} />
          <IncomePieChart data={pieData} year={year} />
        </div>

        <div className="mt-4">
          <MonthlyComparisonChart data={chartData} year={year} />
        </div>
      </div>
    </div>
  );
};

export default AnnualReport;

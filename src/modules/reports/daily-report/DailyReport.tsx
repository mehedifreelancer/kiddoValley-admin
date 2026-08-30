// modules/reports/daily-report/DailyReport.tsx
"use client";

import { motion } from "framer-motion";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Download, Info, Printer, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import ComboChart from "../../../components/shared/charts/ComboChart";
import IncomePieChart from "../../../components/shared/charts/IncomePieChart";
import MonthlyComparisonChart from "../../../components/shared/charts/MonthlyComparisonChart";
import SalesChart from "../../../components/shared/charts/SalesChart";
import SalesProfitChart from "../../../components/shared/charts/SalesProfitChart";
import Button from "../../../components/ui/Button";
import Modal from "../../../components/ui/Modal";
import Toolbar from "../../../components/ui/Toolbar";
import { fetchDailyReport } from "./daily-report.service";
import { DailyReportData, ExpenseDetail } from "./daily-report.types";

export const DailyReport = () => {
  const today = new Date();
  const [startDate, setStartDate] = useState(
    new Date(today.getFullYear(), today.getMonth(), 1)
      .toISOString()
      .split("T")[0],
  );
  const [endDate, setEndDate] = useState(
    new Date(today.getFullYear(), today.getMonth() + 1, 0)
      .toISOString()
      .split("T")[0],
  );
  const [report, setReport] = useState<DailyReportData | null>(null);
  const [loading, setLoading] = useState(true);

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [expenseDetails, setExpenseDetails] = useState<ExpenseDetail[]>([]);
  const [modalTitle, setModalTitle] = useState("");

  const fetchData = async (start: string, end: string) => {
    setLoading(true);
    try {
      const data = await fetchDailyReport(start, end);
      setReport(data);
    } catch (error: any) {
      toast.error(error.message || "Failed to load report");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(startDate, endDate);
  }, []);

  const handleApply = () => {
    if (startDate && endDate) {
      if (startDate > endDate) {
        toast.error("Start date must be before end date");
        return;
      }
      fetchData(startDate, endDate);
    }
  };

  const openExpenseModal = (dayLabel: string, details: ExpenseDetail[]) => {
    setModalTitle(`খরচের বিস্তারিত - ${dayLabel}`);
    setExpenseDetails(details);
    setModalOpen(true);
  };

  const formatProfit = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}`;
  };

  const downloadPDF = () => {
    if (!report) return;
    const doc = new jsPDF("landscape", "pt", "a4");
    doc.setFontSize(18);
    doc.text(`Daily Report - ${report.startDate} to ${report.endDate}`, 40, 40);
    doc.setFontSize(10);
    doc.text(`Date Range: ${report.startDate} to ${report.endDate}`, 40, 60);

    const tableData = report.days.map((d) => [
      d.label,
      d.totalSales.toFixed(2),
      d.salesNetProfit.toFixed(2),
      d.expenses.toFixed(2),
      d.dailyNet.toFixed(2),
      d.runningCash.toFixed(2),
    ]);

    autoTable(doc, {
      startY: 70,
      head: [
        [
          "Date",
          "Total Sales",
          "Sales Net Profit",
          "Expenses",
          "Daily Net",
          "Running Cash",
        ],
      ],
      body: tableData,
      theme: "grid",
      headStyles: { fillColor: [99, 102, 241] },
      styles: { fontSize: 8 },
    });

    const finalY = (doc as any).lastAutoTable.finalY + 20;
    const totals = report.totals;
    doc.text(
      `Totals - Sales: ${totals.totalSales.toFixed(2)}, Net Profit: ${totals.totalSalesNetProfit.toFixed(2)}, Expenses: ${totals.totalExpenses.toFixed(2)}, Final Cash: ${totals.finalCash.toFixed(2)}`,
      40,
      finalY,
    );
    doc.save(`daily-report-${report.startDate}-to-${report.endDate}.pdf`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  if (!report) return null;

  // Prepare chart data (same shape as Annual Report)
  const chartData = report.days.map((d) => ({
    month: d.label,
    salesNetProfit: d.salesNetProfit,
    otherIncome: d.otherIncome,
    expenses: d.expenses,
    monthlyNet: d.dailyNet,
    runningCash: d.runningCash,
    totalSales: d.totalSales,
  }));

  const pieData = {
    salesNetProfit: report.totals.totalSalesNetProfit,
    otherIncome: report.totals.totalOtherIncome,
  };

  return (
    <div>
      <Toolbar title="দৈনিক রিপোর্ট">
        <div className="flex items-center gap-2 flex-wrap">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            তারিখ (থেকে):
          </label>
          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          />
          <label className="text-sm text-gray-600 dark:text-gray-300">
            হতে:
          </label>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-sm"
          />
          <Button
            variant="primary"
            size="sm"
            onClick={handleApply}
            className="flex items-center gap-1"
          >
            <RefreshCw className="w-4 h-4" /> প্রয়োগ
          </Button>
          <div className="flex gap-2 ml-auto no-print">
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
              <Printer className="w-4 h-4" /> প্রিন্ট
            </Button>
          </div>
        </div>
      </Toolbar>

      {/* ✅ Table – FIRST (Bengali headers) */}
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
                <th className="column-header px-4 py-2 font-semibold">তারিখ</th>
                <th className="column-header px-4 py-2 font-semibold text-right">
                  মোট বিক্রয়
                </th>
                <th className="column-header px-4 py-2 font-semibold text-right text-green-600">
                  সেলস নেট প্রফিট
                </th>
                <th className="column-header px-4 py-2 font-semibold text-right text-red-600">
                  মোট খরচ
                </th>
                <th className="column-header px-4 py-2 font-semibold text-right">
                  দৈনিক লাভ
                </th>
                <th className="column-header px-4 py-2 font-semibold text-right">
                  চলতি ক্যাশ
                </th>
              </tr>
            </thead>
            <tbody>
              {report.days.map((day, idx) => {
                const isToday =
                  new Date(day.date).toDateString() === today.toDateString();
                return (
                  <tr
                    key={idx}
                    className={`table-row border-b border-gray-200 dark:border-gray-700 transition-all ${
                      isToday
                        ? "bg-gradient-to-r from-indigo-50 via-purple-50 to-indigo-50 dark:from-indigo-950/40 dark:via-purple-950/30 dark:to-indigo-950/40 shadow-inner"
                        : "hover:bg-gray-50 dark:hover:bg-gray-700/30"
                    }`}
                  >
                    <td className="column-body px-4 py-3 font-medium">
                      {day.label}
                      {isToday && (
                        <span className="ml-2 inline-flex items-center gap-1 text-xs font-bold text-indigo-600 dark:text-indigo-300 bg-indigo-100 dark:bg-indigo-900/50 px-2 py-0.5 rounded-full">
                          <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />
                          আজ
                        </span>
                      )}
                    </td>
                    <td className="column-body px-4 py-3 text-right text-gray-700 dark:text-gray-300">
                      ৳{day.totalSales.toFixed(2)}
                    </td>
                    <td className="column-body px-4 py-3 text-right font-semibold text-green-600 dark:text-green-400">
                      ৳{day.salesNetProfit.toFixed(2)}
                    </td>
                    <td className="column-body px-4 py-3 text-right font-semibold text-red-600 dark:text-red-400">
                      <div className="flex items-center justify-end gap-2">
                        ৳{day.expenses.toFixed(2)}
                        {day.expenseDetails &&
                          day.expenseDetails.length > 0 && (
                            <button
                              onClick={() =>
                                openExpenseModal(day.label, day.expenseDetails)
                              }
                              className="p-1 text-blue-500 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
                              title="খরচের বিবরণ দেখুন"
                            >
                              <Info className="w-4 h-4" />
                            </button>
                          )}
                      </div>
                    </td>
                    <td
                      className={`column-body px-4 py-3 text-right font-bold ${
                        day.dailyNet >= 0 ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {day.dailyNet >= 0 ? "+" : ""}
                      {day.dailyNet.toFixed(2)}
                    </td>
                    <td className="column-body px-4 py-3 text-right font-medium text-gray-700 dark:text-gray-300">
                      ৳{day.runningCash.toFixed(2)}
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
                <td className="column-body px-4 py-3 text-right text-green-600">
                  ৳{report.totals.totalSalesNetProfit.toFixed(2)}
                </td>
                <td className="column-body px-4 py-3 text-right text-red-600">
                  ৳{report.totals.totalExpenses.toFixed(2)}
                </td>
                <td className="column-body px-4 py-3 text-right">
                  {report.totals.totalDailyNet >= 0 ? "+" : ""}
                  {report.totals.totalDailyNet.toFixed(2)}
                </td>
                <td className="column-body px-4 py-3 text-right text-gray-800 dark:text-white">
                  ৳{report.totals.finalCash.toFixed(2)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </motion.div>

      {/* Expense Details Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={modalTitle}
        size="md"
      >
        <div className="max-h-96 overflow-y-auto p-1">
          {expenseDetails.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400">
              এই দিনে কোনো খরচ নেই
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-700/30">
                <tr>
                  <th className="text-left px-3 py-2 font-semibold">বিভাগ</th>
                  <th className="text-right px-3 py-2 font-semibold">পরিমাণ</th>
                  <th className="text-left px-3 py-2 font-semibold">নোট</th>
                </tr>
              </thead>
              <tbody>
                {expenseDetails.map((item, idx) => (
                  <tr
                    key={idx}
                    className="border-b border-gray-100 dark:border-gray-700"
                  >
                    <td className="px-3 py-2">{item.category}</td>
                    <td className="px-3 py-2 text-right font-medium text-red-600">
                      ৳{item.amount.toFixed(2)}
                    </td>
                    <td className="px-3 py-2 text-gray-500 dark:text-gray-400">
                      {item.note || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <div className="mt-4 text-right text-sm font-semibold">
            মোট খরচ: ৳
            {expenseDetails.reduce((sum, e) => sum + e.amount, 0).toFixed(2)}
          </div>
        </div>
      </Modal>

      {/* ✅ Charts – SECOND (with rotated labels) */}
      <div className="mt-6 no-print">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <ComboChart
            data={chartData}
            year={new Date().getFullYear()}
            rotateLabels={true}
          />
          <SalesProfitChart
            data={chartData}
            year={new Date().getFullYear()}
            rotateLabels={true}
          />
          <SalesChart
            data={chartData}
            year={new Date().getFullYear()}
            rotateLabels={true}
          />
          <IncomePieChart data={pieData} year={new Date().getFullYear()} />
        </div>
        <div className="mt-4">
          <MonthlyComparisonChart
            data={chartData}
            year={new Date().getFullYear()}
          />
        </div>
      </div>
    </div>
  );
};

export default DailyReport;

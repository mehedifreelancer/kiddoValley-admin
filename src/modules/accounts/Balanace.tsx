"use client";

import { motion } from "framer-motion";
import {
  ArrowDownCircle,
  ArrowUpCircle,
  Banknote,
  Boxes,
  Edit,
  Package,
  Plus,
  RefreshCw,
  Trash2,
  TrendingDown,
  TrendingUp,
  Trophy,
  Wallet,
} from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import {
  createTransaction,
  deleteTransaction,
  getBalanceSummary,
  getCategories,
  getTransactions,
  updateTransaction,
} from "./balance.service";
import {
  BalanceSummary,
  Transaction,
  TransactionCategory,
} from "./balance.types";

export const Balance = () => {
  // Balance Summary
  const [summary, setSummary] = useState<BalanceSummary | null>(null);
  const [loadingSummary, setLoadingSummary] = useState(true);

  // Transactions list
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [first, setFirst] = useState(0);
  const [rows, setRows] = useState(10);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);

  // Modal states
  const [modalFor, setModalFor] = useState<"create" | "edit" | "delete" | null>(
    null,
  );
  const [selectedTransaction, setSelectedTransaction] =
    useState<Transaction | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  // Categories for dropdown
  const [categories, setCategories] = useState<TransactionCategory[]>([]);

  // Form state (with default today's date)
  const [formCategoryId, setFormCategoryId] = useState<number | "">("");
  const [formAmount, setFormAmount] = useState<number>(0);
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [formNote, setFormNote] = useState("");

  // Fetch Balance Summary
  const fetchSummary = async () => {
    try {
      setLoadingSummary(true);
      const data = await getBalanceSummary();
      setSummary(data);
    } catch (error) {
      toast.error("Failed to load balance summary");
    } finally {
      setLoadingSummary(false);
    }
  };

  // Fetch transactions
  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const res = await getTransactions(page, rows, { search: searchTerm });
      setTransactions(res.data);
      setTotalRecords(res.pagination.total);
    } catch (error) {
      toast.error("Failed to load transactions");
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories for dropdown
  const fetchCategories = async () => {
    try {
      const res = await getCategories(1, 100);
      setCategories(res.data);
    } catch (error) {
      console.error("Failed to load categories");
    }
  };

  useEffect(() => {
    fetchSummary();
    fetchCategories();
  }, []);

  useEffect(() => {
    fetchTransactions();
  }, [page, rows, searchTerm]);

  const onPageChange = (event: any) => {
    setFirst(event.first);
    setRows(event.rows);
    setPage(event.first / event.rows + 1);
  };

  // Modal handlers
  const openCreateModal = () => {
    setModalFor("create");
    setSelectedTransaction(null);
    setFormError("");
    setFormCategoryId("");
    setFormAmount(0);
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormNote("");
  };

  const openEditModal = (transaction: Transaction) => {
    setModalFor("edit");
    setSelectedTransaction(transaction);
    setFormError("");
    setFormCategoryId(transaction.categoryId);
    setFormAmount(transaction.amount);
    setFormDate(new Date(transaction.date).toISOString().split("T")[0]);
    setFormNote(transaction.note || "");
  };

  const openDeleteModal = (transaction: Transaction) => {
    setModalFor("delete");
    setSelectedTransaction(transaction);
  };

  const closeModal = () => {
    setModalFor(null);
    setSelectedTransaction(null);
    setFormError("");
  };

  // Submit handler for create/edit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!formCategoryId || formAmount <= 0) {
      setFormError("Please select category and enter valid amount");
      return;
    }

    setSubmitting(true);
    try {
      if (modalFor === "create") {
        await createTransaction({
          categoryId: Number(formCategoryId),
          amount: formAmount,
          note: formNote,
          date: formDate,
        });
        toast.success("Transaction created");
      } else if (modalFor === "edit" && selectedTransaction) {
        await updateTransaction(selectedTransaction.id, {
          categoryId: Number(formCategoryId),
          amount: formAmount,
          note: formNote,
          date: formDate,
        });
        toast.success("Transaction updated");
      }
      closeModal();
      fetchTransactions();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to save");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedTransaction) return;
    setSubmitting(true);
    try {
      await deleteTransaction(selectedTransaction.id);
      toast.success("Transaction deleted");
      closeModal();
      fetchTransactions();
      fetchSummary();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to delete");
    } finally {
      setSubmitting(false);
    }
  };

  // Compute totals from displayed transactions for the summary row
  const totalIncome = transactions
    .filter((t) => t.category.type === "in")
    .reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions
    .filter((t) => t.category.type === "out")
    .reduce((sum, t) => sum + t.amount, 0);
  const netTotal = totalIncome - totalExpense;

  // ====== Hero cards: মূলধন, ক্যাশ, মোট সম্পদ, নিট লাভ ======
  const renderHeroCards = () => {
    if (loadingSummary) {
      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="h-32 rounded-md bg-gray-200/60 dark:bg-gray-700/50 animate-pulse"
            />
          ))}
        </div>
      );
    }
    if (!summary) return null;

    const heroCards = [
      {
        title: "মোট সম্পদ (Total Assets)",
        subtitle: "ক্যাশ + স্টক + অ্যাসেট",
        value: summary.totalAssets,
        icon: Wallet,
        gradient: "from-blue-500 to-blue-600",
        bg: "bg-blue-50 dark:bg-blue-900/20",
        ring: "ring-blue-500/10",
        blur: "bg-blue-500/10",
      },
      {
        title: "মূলধন (Capital)",
        subtitle: "স্টক + অ্যাসেট মূল্য",
        value: summary.totalCapital,
        icon: Boxes,
        gradient: "from-indigo-500 to-indigo-600",
        bg: "bg-indigo-50 dark:bg-indigo-900/20",
        ring: "ring-indigo-500/10",
        blur: "bg-indigo-500/10",
      },
      {
        title: "ক্যাশ ব্যালেন্স (Cash)",
        subtitle: "হাতে নগদ টাকা",
        value: summary.cashBalance,
        icon: Banknote,
        gradient:
          summary.cashBalance >= 0
            ? "from-cyan-500 to-cyan-600"
            : "from-red-500 to-red-600",
        bg:
          summary.cashBalance >= 0
            ? "bg-cyan-50 dark:bg-cyan-900/20"
            : "bg-red-50 dark:bg-red-900/20",
        ring: "ring-cyan-500/10",
        blur: "bg-cyan-500/10",
      },

      {
        title: "নিট লাভ (Net Profit)",
        subtitle: "রেভিনিউ - COGS - খরচ",
        value: summary.netProfit,
        icon: Trophy,
        gradient:
          summary.netProfit >= 0
            ? "from-green-500 to-green-600"
            : "from-red-500 to-red-600",
        bg:
          summary.netProfit >= 0
            ? "bg-green-50 dark:bg-green-900/20"
            : "bg-red-50 dark:bg-red-900/20",
        ring: summary.netProfit >= 0 ? "ring-green-500/10" : "ring-red-500/10",
        blur: summary.netProfit >= 0 ? "bg-green-500/10" : "bg-red-500/10",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-3">
        {heroCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.08 }}
            className={`relative overflow-hidden rounded-md ${card.bg} border border-white/40 dark:border-gray-700/40 shadow-md  backdrop-blur-sm p-5 ring-1 ${card.ring} transition-all hover:shadow-xl hover:scale-[1.02]`}
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {card.title}
                </p>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-0.5">
                  {card.subtitle}
                </p>
                <p className="text-2xl font-bold text-gray-800 dark:text-white mt-2">
                  ৳{card.value.toFixed(2)}
                </p>
              </div>
              <div
                className={`p-3 rounded-xl bg-gradient-to-br ${card.gradient} text-white shadow-lg shrink-0`}
              >
                <card.icon size={20} />
              </div>
            </div>
            <div
              className={`absolute -right-8 -top-8 w-32 h-32 rounded-md  ${card.blur} blur-2xl pointer-events-none`}
            />
          </motion.div>
        ))}
      </div>
    );
  };

  // ====== Breakdown cards: রেভিনিউ, COGS, খরচ ======
  const renderBreakdownCards = () => {
    if (loadingSummary || !summary) return null;

    const breakdownCards = [
      {
        title: "মোট আয় (Revenue)",
        value: summary.totalRevenue,
        icon: TrendingUp,
        gradient: "from-blue-400 to-blue-500",
        bg: "bg-blue-50/60 dark:bg-blue-900/10",
      },
      {
        title: "পণ্যের মূল্য (COGS)",
        value: summary.totalCOGS,
        icon: Package,
        gradient: "from-purple-400 to-purple-500",
        bg: "bg-purple-50/60 dark:bg-purple-900/10",
      },
      {
        title: "পরিচালন খরচ (Expense)",
        value: summary.totalExpense,
        icon: TrendingDown,
        gradient: "from-red-400 to-red-500",
        bg: "bg-red-50/60 dark:bg-red-900/10",
      },
    ];

    return (
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
        {breakdownCards.map((card, index) => (
          <motion.div
            key={card.title}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 + index * 0.06 }}
            className={`flex items-center justify-between rounded-md ${card.bg} border border-gray-200/50 dark:border-gray-700/40 p-3.5 shadow-md`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`p-2 rounded-md bg-gradient-to-br ${card.gradient} text-white shadow-md`}
              >
                <card.icon size={16} />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">
                {card.title}
              </span>
            </div>
            <span className="text-sm font-semibold text-gray-800 dark:text-white">
              ৳{card.value.toFixed(2)}
            </span>
          </motion.div>
        ))}
      </div>
    );
  };

  // Transaction table columns
  const dateBody = (row: Transaction) => (
    <span className="text-sm text-gray-500 dark:text-gray-400">
      {new Date(row.date).toLocaleDateString()}
    </span>
  );

  const categoryBody = (row: Transaction) => (
    <span
      className={`px-2 py-1 rounded-sm text-xs font-medium ${
        row.category.type === "in"
          ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
          : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300"
      }`}
    >
      {row.category.name}
    </span>
  );

  const amountBody = (row: Transaction) => (
    <div className="flex items-center justify-end gap-1">
      {row.category.type === "in" ? (
        <ArrowUpCircle className="w-4 h-4 text-green-500" />
      ) : (
        <ArrowDownCircle className="w-4 h-4 text-red-500" />
      )}
      <span
        className={`font-semibold ${
          row.category.type === "in"
            ? "text-green-600 dark:text-green-400"
            : "text-red-600 dark:text-red-400"
        }`}
      >
        ৳{row.amount.toFixed(2)}
      </span>
    </div>
  );

  const noteBody = (row: Transaction) => (
    <span className="text-sm text-gray-500 dark:text-gray-400 truncate max-w-[150px] inline-block">
      {row.note || "—"}
    </span>
  );

  const actionsBody = (row: Transaction) => (
    <div className="flex gap-2">
      <button
        onClick={() => openEditModal(row)}
        className="p-1 cursor-pointer text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded transition-colors"
        title="Edit"
      >
        <Edit className="w-4 h-4" />
      </button>
      <button
        onClick={() => openDeleteModal(row)}
        className="p-1 cursor-pointer text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded transition-colors"
        title="Delete"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );

  // Summary row (Income, Expense, Net) – based on displayed transactions
  const renderSummary = () => {
    if (transactions.length === 0) return null;
    return (
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm rounded-sm p-3 border border-gray-200/50 dark:border-gray-700/50">
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total Income
          </span>
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            ৳{totalIncome.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-1 border-l border-r border-gray-200 dark:border-gray-700">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            Total Expense
          </span>
          <span className="text-sm font-semibold text-red-600 dark:text-red-400">
            ৳{totalExpense.toFixed(2)}
          </span>
        </div>
        <div className="flex items-center justify-between px-3 py-1">
          <span className="text-sm text-gray-600 dark:text-gray-400">Net</span>
          <span
            className={`text-sm font-bold ${
              netTotal >= 0
                ? "text-green-600 dark:text-green-400"
                : "text-red-600 dark:text-red-400"
            }`}
          >
            {netTotal >= 0 ? "+" : ""}৳{netTotal.toFixed(2)}
          </span>
        </div>
      </div>
    );
  };

  if (loading && transactions.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500" />
      </div>
    );
  }

  return (
    <div>
      {/* Dashboard Cards */}
      <div className="mb-2">{renderHeroCards()}</div>
      <div className="mb-4">{renderBreakdownCards()}</div>

      {/* Summary Row (Income, Expense, Net) - based on displayed transactions */}
      {renderSummary()}

      {/* Toolbar */}
      <Toolbar title="Transactions">
        <div className="flex gap-2">
          <DataTableSearch
            value={searchTerm}
            onChange={setSearchTerm}
            placeholder="Search transactions..."
            className="w-[220px]"
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchTransactions();
              fetchSummary();
            }}
            className="flex items-center gap-1.5"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </Button>
          <Button
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 text-xs"
          >
            <Plus className="w-4 h-4" />
            Add Transaction
          </Button>
        </div>
      </Toolbar>

      {/* DataTable */}
      <div className="table-container">
        <DataTable
          value={transactions}
          paginator
          lazy
          first={first}
          rows={rows}
          totalRecords={totalRecords}
          onPage={onPageChange}
          loading={loading}
          emptyMessage="No transactions found"
          stripedRows
          rowClassName={() =>
            "table-row hover:bg-gray-50 dark:hover:bg-gray-700/30"
          }
          className="p-0"
        >
          <Column
            field="id"
            header="ID"
            sortable
            headerClassName="column-header px-4 py-2"
            bodyClassName="column-body px-4 py-3"
            style={{ width: "80px" }}
          />
          <Column
            body={dateBody}
            header="Date"
            sortable
            headerClassName="column-header px-4 py-2"
            bodyClassName="column-body px-4 py-3"
            style={{ width: "150px" }}
          />
          <Column
            field="category.name"
            header="Category"
            sortable
            body={categoryBody}
            headerClassName="column-header px-4 py-2"
            bodyClassName="column-body px-4 py-3"
          />
          <Column
            body={amountBody}
            header="Amount"
            sortable
            headerClassName="column-header px-4 py-2"
            bodyClassName="column-body px-4 py-3"
            style={{ textAlign: "right" }}
          />
          <Column
            body={noteBody}
            header="Note"
            headerClassName="column-header px-4 py-2"
            bodyClassName="column-body px-4 py-3"
          />
          <Column
            body={actionsBody}
            header="Actions"
            headerClassName="column-header px-4 py-2"
            bodyClassName="column-body px-4 py-3"
            style={{ width: "120px" }}
          />
        </DataTable>
      </div>

      {/* Create/Edit Modal */}
      {(modalFor === "create" || modalFor === "edit") && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title={modalFor === "create" ? "Add Transaction" : "Edit Transaction"}
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Category Select - Only border-bottom */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Category
              </label>
              <select
                name="categoryId"
                value={formCategoryId}
                onChange={(e) =>
                  setFormCategoryId(
                    e.target.value ? Number(e.target.value) : "",
                  )
                }
                className="w-full px-3 py-2 border-b border-gray-300 dark:border-gray-700 bg-transparent text-gray-700 dark:text-gray-200 focus:ring-0 focus:border-blue-500 transition"
                required
              >
                <option value="">Select a category</option>
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.type === "in" ? "Income" : "Expense"})
                  </option>
                ))}
              </select>
            </div>

            {/* Amount Input */}
            <InputField
              label="Amount"
              name="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formAmount}
              onChange={(e) => setFormAmount(parseFloat(e.target.value) || 0)}
              required
              className="w-full border-b border-gray-300 dark:border-gray-700 bg-transparent focus:border-blue-500 transition"
            />

            {/* Date Input - Default today */}
            <InputField
              label="Date"
              name="date"
              type="date"
              value={formDate}
              onChange={(e) => setFormDate(e.target.value)}
              className="w-full border-b border-gray-300 dark:border-gray-700 bg-transparent focus:border-blue-500 transition"
            />

            {/* Note Input */}
            <InputField
              label="Note (optional)"
              name="note"
              type="text"
              placeholder="Add a note..."
              value={formNote}
              onChange={(e) => setFormNote(e.target.value)}
              className="w-full border-b border-gray-300 dark:border-gray-700 bg-transparent focus:border-blue-500 transition"
            />

            {formError && (
              <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 p-2 rounded border border-red-200 dark:border-red-800">
                {formError}
              </p>
            )}

            <div className="flex justify-end gap-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                type="button"
                onClick={closeModal}
                variant="outline"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={submitting}>
                {modalFor === "create" ? "Create Transaction" : "Update"}
              </Button>
            </div>
          </form>
        </Modal>
      )}

      {/* Delete Modal */}
      {modalFor === "delete" && selectedTransaction && (
        <Modal
          isOpen={true}
          onClose={closeModal}
          title="Delete Transaction"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to delete this transaction of{" "}
              <span className="font-semibold text-red-600 dark:text-red-400">
                ৳{selectedTransaction.amount.toFixed(2)}
              </span>
              ?
            </p>
            <div className="flex justify-end gap-3 py-2 border-t border-gray-200 dark:border-gray-700">
              <Button
                onClick={closeModal}
                variant="outline"
                disabled={submitting}
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                variant="danger"
                loading={submitting}
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Balance;

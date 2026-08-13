"use client";

import {
  CheckCircle,
  DollarSign,
  Edit,
  Eye,
  Printer,
  RefreshCw,
  Trash2,
  XCircle,
} from "lucide-react";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import { Link } from "react-router-dom";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import InputField from "../../components/ui/InputField";
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import {
  cancelOrder,
  confirmOrder,
  deleteOrder,
  getOrderDetails,
  getOrders,
  OrderItem,
  processRefund,
  syncPathaoStatuses,
} from "./order.service";

// ---------- Print Helper ----------
const handlePrintReceipt = (order: OrderItem) => {
  const printWindow = window.open("", "_blank", "width=600,height=400");
  if (!printWindow) {
    toast.error("Please allow popups for printing");
    return;
  }

  const itemsHtml =
    order.soldItems
      ?.map(
        (item) => `
      <tr>
        <td>${item.productName}</td>
        <td>${item.quantity}</td>
        <td>${item.unitPrice.toFixed(2)}</td>
        <td>${item.totalPrice.toFixed(2)}</td>
      </tr>
    `,
      )
      .join("") || "";

  printWindow.document.write(`
    <html>
      <head>
        <title>Invoice #${order.invoiceNo}</title>
        <style>
          @page { size: 6in 4in; margin: 0.2in; }
          body { font-family: Arial, sans-serif; font-size: 10px; padding: 0.1in; width: 100%; box-sizing: border-box; }
          .header { display: flex; justify-content: space-between; border-bottom: 1px dashed #333; padding-bottom: 4px; }
          .header h1 { font-size: 16px; margin: 0; }
          .info { display: flex; flex-wrap: wrap; justify-content: space-between; margin: 4px 0; }
          .info p { margin: 2px 0; }
          table { width: 100%; border-collapse: collapse; margin-top: 4px; }
          th { background: #f0f0f0; text-align: left; padding: 4px; font-size: 9px; }
          td { padding: 4px; border-bottom: 1px solid #ddd; }
          .total { text-align: right; margin-top: 4px; font-size: 12px; font-weight: bold; }
          .footer { text-align: center; border-top: 1px dashed #333; padding-top: 4px; margin-top: 4px; font-size: 8px; color: #666; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>Kiddo Valley</h1>
          <div>${order.invoiceNo}</div>
        </div>
        <div class="info">
          <p><strong>${order.customerName}</strong></p>
          <p>${order.customerPhone}</p>
          <p>${order.customerAddress}</p>
          <p>Date: ${new Date(order.createdAt).toLocaleDateString()}</p>
        </div>
        <table>
          <thead><tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead>
          <tbody>${itemsHtml}</tbody>
        </table>
        <div class="total">Total: ${order.total.toFixed(2)} TK</div>
        <div class="footer">Thank you!</div>
        <script>window.onload = function() { window.print(); }<\\/script>
      </body>
    </html>
  `);
  printWindow.document.close();
};

// ---------- Main Component ----------
export const OrderList: React.FC = () => {
  const [orders, setOrders] = useState<OrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);
  const [globalFilter, setGlobalFilter] = useState("");
  const [sortField, setSortField] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [syncing, setSyncing] = useState(false);

  // Loading states for actions
  const [confirmLoading, setConfirmLoading] = useState<number | null>(null);
  const [cancelLoading, setCancelLoading] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState<number | null>(null);
  const [refundLoading, setRefundLoading] = useState<number | null>(null);

  // Modal states
  const [showConfirmModal, setShowConfirmModal] = useState<OrderItem | null>(
    null,
  );
  const [showCancelModal, setShowCancelModal] = useState<OrderItem | null>(
    null,
  );
  const [showDeleteModal, setShowDeleteModal] = useState<OrderItem | null>(
    null,
  );

  // Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

  // ---------- Refund Modal States ----------
  const [showRefundModal, setShowRefundModal] = useState<OrderItem | null>(
    null,
  );
  const [refundType, setRefundType] = useState<"partial" | "full">("partial");
  const [refundItems, setRefundItems] = useState<
    { soldItemId: number; quantity: number; amount: number }[]
  >([]);
  const [refundReason, setRefundReason] = useState("");
  const [refundImageUrl, setRefundImageUrl] = useState("");
  const [refundTransactionId, setRefundTransactionId] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  // ---------- Fetch Orders ----------
  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const result = await getOrders(
        page,
        rows,
        globalFilter,
        sortField,
        sortOrder,
      );
      setOrders(result.data);
      setTotalRecords(result.pagination.total);
    } catch (error) {
      toast.error("Failed to load orders");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, rows, globalFilter, sortField, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // ---------- Sync Pathao Statuses ----------
  const handleSync = async () => {
    const orderIds = orders.map((o) => o.id);
    if (orderIds.length === 0) {
      toast.info("No orders to sync");
      return;
    }
    setSyncing(true);
    try {
      const result = await syncPathaoStatuses(orderIds);
      toast.success(
        `Synced ${result.data.filter((r: any) => r.success).length} orders`,
      );
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Sync failed");
    } finally {
      setSyncing(false);
    }
  };

  // ---------- Pagination & Sorting ----------
  const onPageChange = (event: any) => {
    setPage(event.page + 1);
    setRows(event.rows);
  };

  const onSort = (event: any) => {
    setSortField(event.sortField);
    setSortOrder(event.sortOrder === 1 ? "asc" : "desc");
  };

  const onSearch = (value: string) => {
    setGlobalFilter(value);
    setPage(1);
  };

  // ---------- Actions (with Modal) ----------
  const handleConfirm = async (order: OrderItem) => {
    setConfirmLoading(order.id);
    try {
      await confirmOrder(order.id);
      toast.success("Order confirmed and Pathao booked!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Confirm failed");
    } finally {
      setConfirmLoading(null);
      setShowConfirmModal(null);
    }
  };

  const handleCancel = async (order: OrderItem) => {
    setCancelLoading(order.id);
    try {
      await cancelOrder(order.id);
      toast.success("Order cancelled!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cancel failed");
    } finally {
      setCancelLoading(null);
      setShowCancelModal(null);
    }
  };

  const handleDelete = async (order: OrderItem) => {
    setDeleteLoading(order.id);
    try {
      await deleteOrder(order.id);
      toast.success("Order deleted permanently!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
    } finally {
      setDeleteLoading(null);
      setShowDeleteModal(null);
    }
  };

  const handleDetails = async (id: number) => {
    setLoadingDetails(true);
    try {
      const result = await getOrderDetails(id);
      setSelectedOrder(result.data);
      setShowDetailsModal(true);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to load details");
    } finally {
      setLoadingDetails(false);
    }
  };

  const handleReprint = (order: OrderItem) => {
    handlePrintReceipt(order);
  };

  // ---------- Refund Functions ----------
  const openRefundModal = (order: OrderItem, type: "partial" | "full") => {
    setShowRefundModal(order);
    setRefundType(type);
    setRefundReason("");
    setRefundImageUrl("");
    setRefundTransactionId("");
    setRefundSubmitting(false);

    if (type === "partial") {
      // Initialize refund items with default 0
      setRefundItems(
        (order.soldItems || []).map((item: any) => ({
          soldItemId: item.id,
          quantity: 0,
          amount: 0,
        })),
      );
    } else {
      setRefundItems([]);
    }
  };

  const handleRefundItemChange = (index: number, field: string, value: any) => {
    const updated = [...refundItems];
    updated[index] = { ...updated[index], [field]: value };
    setRefundItems(updated);
  };

  const handleRefundSubmit = async () => {
    if (!showRefundModal) return;
    if (!refundReason) {
      toast.error("Please provide a reason");
      return;
    }

    const payload: any = {
      type: refundType,
      reason: refundReason,
      imageUrl: refundImageUrl || null,
      transactionId: refundTransactionId || null,
    };

    if (refundType === "partial") {
      const selected = refundItems.filter(
        (i) => i.quantity > 0 && i.amount > 0,
      );
      if (selected.length === 0) {
        toast.error(
          "Please select at least one item and enter quantity & amount",
        );
        return;
      }
      payload.items = selected;
    }

    setRefundSubmitting(true);
    setRefundLoading(showRefundModal.id);
    try {
      await processRefund(showRefundModal.id, payload);
      toast.success(
        refundType === "partial"
          ? "Partial refund processed successfully"
          : "Full refund processed successfully",
      );
      setShowRefundModal(null);
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Refund failed");
    } finally {
      setRefundSubmitting(false);
      setRefundLoading(null);
    }
  };

  // ---------- Column Templates ----------
  const invoiceBody = (row: OrderItem) => (
    <Link
      to={`/order-edit/${row.id}`}
      className="font-mono text-sm font-medium text-blue-600 hover:underline"
    >
      {row.invoiceNo}
    </Link>
  );

  const customerBody = (row: OrderItem) => (
    <div>
      <div className="font-medium">{row.customerName}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">
        {row.customerPhone}
      </div>
    </div>
  );

  const addressBody = (row: OrderItem) => (
    <span className="text-sm">{row.customerAddress}</span>
  );

  const totalBody = (row: OrderItem) => (
    <span className="font-semibold text-green-600 dark:text-green-400">
      {row.total.toFixed(2)} TK
    </span>
  );

  const statusBody = (row: OrderItem) => {
    const map: Record<string, string> = {
      new: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      confirmed:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
    };
    const color = map[row.orderStatus] || "bg-gray-100 text-gray-800";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {row.orderStatus}
      </span>
    );
  };

  const refundStatusBody = (row: OrderItem) => {
    if (row.refundStatus === "full") {
      return (
        <span className="px-2 py-1 bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300 rounded-full text-xs font-medium">
          Full Refunded
        </span>
      );
    }
    if (row.refundStatus === "partial") {
      return (
        <span className="px-2 py-1 bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300 rounded-full text-xs font-medium">
          Partial ({row.totalRefunded?.toFixed(2) || 0} TK)
        </span>
      );
    }
    return <span className="text-gray-400">—</span>;
  };

  const suspiciousBody = (row: OrderItem) => {
    if (!row.isSuspicious) return null;
    return (
      <span className="px-2 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300 rounded-full text-xs font-medium">
        ⚠️ Suspicious
      </span>
    );
  };

  const websiteOrderBody = (row: OrderItem) => {
    if (!row.isWebsiteOrder) return null;
    return (
      <span className="px-2 py-1 bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300 rounded-full text-xs font-medium">
        Website
      </span>
    );
  };

  const deliveryStatusBody = (row: OrderItem) => (
    <span className="text-xs">{row.deliveryStatus || "—"}</span>
  );

  const consignmentBody = (row: OrderItem) => (
    <span className="font-mono text-xs">{row.pathaoConsignmentId || "—"}</span>
  );

  const dateBody = (row: OrderItem) => (
    <span className="text-sm">
      {new Date(row.createdAt).toLocaleDateString()}
    </span>
  );

  // ========== UPDATED ACTIONS COLUMN (Refund + Hide Cancel for confirmed) ==========
  const actionsBody = (row: OrderItem) => {
    const { id, orderStatus, refundStatus } = row;
    const isFullyRefunded = refundStatus === "full";
    const isCancelled = orderStatus === "cancelled";
    const isNew = orderStatus === "new";
    const isConfirmed =
      orderStatus === "confirmed" ||
      orderStatus === "packed" ||
      orderStatus === "delivered";

    // ---------- CANCELLED ----------
    if (isCancelled) {
      return (
        <div className="flex gap-2 items-center flex-wrap">
          <Button
            size="xs"
            variant="danger"
            onClick={() => setShowDeleteModal(row)}
            loading={deleteLoading === id}
            icon={<Trash2 size={14} />}
            iconPosition="left"
          >
            Delete
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleDetails(id)}
            icon={<Eye size={14} />}
            iconPosition="left"
          >
            Details
          </Button>
        </div>
      );
    }

    // ---------- NEW ----------
    if (isNew) {
      return (
        <div className="flex gap-2 items-center flex-wrap">
          <Button
            size="xs"
            variant="success"
            onClick={() => setShowConfirmModal(row)}
            loading={confirmLoading === id}
            icon={<CheckCircle size={14} />}
            iconPosition="left"
          >
            Confirm
          </Button>
          <Link to={`/order-edit/${id}`}>
            <Button
              size="xs"
              variant="outline"
              icon={<Edit size={14} />}
              iconPosition="left"
            >
              Edit
            </Button>
          </Link>
          <Button
            size="xs"
            variant="danger"
            onClick={() => setShowCancelModal(row)}
            loading={cancelLoading === id}
            icon={<XCircle size={14} />}
            iconPosition="left"
          >
            Cancel
          </Button>
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleDetails(id)}
            icon={<Eye size={14} />}
            iconPosition="left"
          >
            Details
          </Button>
        </div>
      );
    }

    // ---------- CONFIRMED / PACKED / DELIVERED ----------
    if (isConfirmed) {
      return (
        <div className="flex gap-2 items-center flex-wrap">
          {/* Reprint – for confirmed only */}
          {orderStatus === "confirmed" && (
            <Button
              size="xs"
              variant="outline"
              onClick={() => handleReprint(row)}
              icon={<Printer size={14} />}
              iconPosition="left"
            >
              Reprint
            </Button>
          )}

          {/* Refund buttons (if not fully refunded) */}
          {!isFullyRefunded && (
            <>
              <Button
                size="xs"
                variant="outline"
                onClick={() => openRefundModal(row, "partial")}
                loading={refundLoading === id}
                icon={<DollarSign size={14} />}
                iconPosition="left"
              >
                Partial
              </Button>
              <Button
                size="xs"
                variant="outline"
                onClick={() => openRefundModal(row, "full")}
                loading={refundLoading === id}
                icon={<DollarSign size={14} />}
                iconPosition="left"
              >
                Full
              </Button>
            </>
          )}

          {/* ❌ Cancel button is HIDDEN for confirmed orders */}
          <Button
            size="xs"
            variant="outline"
            onClick={() => handleDetails(id)}
            icon={<Eye size={14} />}
            iconPosition="left"
          >
            Details
          </Button>
        </div>
      );
    }

    // Fallback (should not happen)
    return null;
  };

  // ---------- Render ----------
  return (
    <div>
      <Toolbar title="Order List">
        <div className="flex gap-2 items-center">
          <DataTableSearch
            value={globalFilter}
            onChange={onSearch}
            placeholder="Search by invoice, name, phone, consignment..."
            className="w-[280px]"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={handleSync}
            disabled={syncing || orders.length === 0}
            loading={syncing}
            icon={<RefreshCw size={14} />}
            iconPosition="left"
          >
            Sync
          </Button>
        </div>
      </Toolbar>

      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div className="table-container">
          <DataTable
            value={orders}
            lazy
            paginator
            rows={rows}
            totalRecords={totalRecords}
            first={(page - 1) * rows}
            onPage={onPageChange}
            onSort={onSort}
            sortField={sortField}
            sortOrder={sortOrder === "asc" ? 1 : -1}
            loading={loading}
            emptyMessage="No orders found"
            rowClassName={() => "table-row"}
          >
            <Column
              field="invoiceNo"
              header="Invoice"
              sortable
              body={invoiceBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="customerName"
              header="Customer"
              sortable
              body={customerBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="customerAddress"
              header="Address"
              body={addressBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="total"
              header="Total"
              sortable
              body={totalBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="orderStatus"
              header="Status"
              sortable
              body={statusBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Refund"
              body={refundStatusBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Suspicious"
              body={suspiciousBody}
              headerClassName="column-header"
              bodyClassName="column-body"
              style={{ width: "100px" }}
            />
            <Column
              header="Source"
              body={websiteOrderBody}
              headerClassName="column-header"
              bodyClassName="column-body"
              style={{ width: "80px" }}
            />
            <Column
              field="deliveryStatus"
              header="Delivery"
              body={deliveryStatusBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="pathaoConsignmentId"
              header="Consignment"
              body={consignmentBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="createdAt"
              header="Date"
              sortable
              body={dateBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              header="Actions"
              body={actionsBody}
              style={{ width: "380px" }}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
          </DataTable>
        </div>
      </div>

      {/* ===== Confirm Modal ===== */}
      <Modal
        isOpen={!!showConfirmModal}
        onClose={() => setShowConfirmModal(null)}
        title="Confirm & Book Order"
        size="sm"
      >
        {showConfirmModal && (
          <div className="p-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to confirm and book order{" "}
              <span className="font-semibold">
                {showConfirmModal.invoiceNo}
              </span>
              ?
            </p>
            <p className="text-sm text-amber-600 dark:text-amber-400 mt-2">
              ⚠️ This will create a Pathao courier order. This action cannot be
              undone.
            </p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowConfirmModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="success"
                onClick={() => handleConfirm(showConfirmModal)}
                loading={confirmLoading === showConfirmModal.id}
                icon={<CheckCircle size={16} />}
                iconPosition="left"
              >
                Confirm & Book
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Cancel Modal ===== */}
      <Modal
        isOpen={!!showCancelModal}
        onClose={() => setShowCancelModal(null)}
        title="Cancel Order"
        size="sm"
      >
        {showCancelModal && (
          <div className="p-4">
            <p className="text-gray-700 dark:text-gray-300">
              Are you sure you want to cancel order{" "}
              <span className="font-semibold">{showCancelModal.invoiceNo}</span>
              ?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              ⚠️ This will restore stock and cancel Pathao courier (if exists).
            </p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowCancelModal(null)}
              >
                No, Keep It
              </Button>
              <Button
                variant="danger"
                onClick={() => handleCancel(showCancelModal)}
                loading={cancelLoading === showCancelModal.id}
                icon={<XCircle size={16} />}
                iconPosition="left"
              >
                Yes, Cancel
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Delete Modal ===== */}
      <Modal
        isOpen={!!showDeleteModal}
        onClose={() => setShowDeleteModal(null)}
        title="Delete Order Permanently"
        size="sm"
      >
        {showDeleteModal && (
          <div className="p-4">
            <p className="text-gray-700 dark:text-gray-300">
              Permanently delete cancelled order{" "}
              <span className="font-semibold">{showDeleteModal.invoiceNo}</span>
              ?
            </p>
            <p className="text-sm text-red-600 dark:text-red-400 mt-2">
              ⚠️ This action cannot be undone. All order data will be removed.
            </p>
            <div className="flex justify-end gap-3 mt-6 pt-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                onClick={() => handleDelete(showDeleteModal)}
                loading={deleteLoading === showDeleteModal.id}
                icon={<Trash2 size={16} />}
                iconPosition="left"
              >
                Yes, Delete
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* ===== Details Modal ===== */}
      <Modal
        isOpen={showDetailsModal}
        onClose={() => {
          setShowDetailsModal(false);
          setSelectedOrder(null);
        }}
        title={`Order Details - ${selectedOrder?.invoiceNo || ""}`}
        size="xl"
      >
        {loadingDetails ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          </div>
        ) : (
          selectedOrder && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Customer Name
                  </p>
                  <p className="font-medium">{selectedOrder.customerName}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Phone
                  </p>
                  <p className="font-medium">
                    {selectedOrder.customerPhone}
                    {selectedOrder.customerPhone2 &&
                      ` (Alt: ${selectedOrder.customerPhone2})`}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Address
                  </p>
                  <p className="font-medium">{selectedOrder.customerAddress}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Status
                  </p>
                  <p className="font-medium">{selectedOrder.orderStatus}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Refund Status
                  </p>
                  <p className="font-medium">
                    {selectedOrder.refundStatus === "full"
                      ? "✅ Fully Refunded"
                      : selectedOrder.refundStatus === "partial"
                        ? `🔄 Partial (${selectedOrder.totalRefunded?.toFixed(2)} TK)`
                        : "—"}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Consignment
                  </p>
                  <p className="font-medium font-mono text-sm">
                    {selectedOrder.pathaoConsignmentId || "—"}
                  </p>
                </div>
                {selectedOrder.isSuspicious && (
                  <div className="col-span-2">
                    <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs font-medium">
                      ⚠️ Suspicious Order
                    </span>
                  </div>
                )}
                {selectedOrder.isWebsiteOrder && (
                  <div className="col-span-2">
                    <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                      📱 Website Order
                    </span>
                  </div>
                )}
              </div>

              <div>
                <h4 className="font-semibold text-gray-800 dark:text-gray-200 mb-2">
                  Items
                </h4>
                <div className="table-container">
                  <DataTable
                    value={selectedOrder.soldItems || []}
                    size="small"
                    stripedRows
                  >
                    <Column
                      field="productName"
                      header="Product"
                      headerClassName="column-header"
                      bodyClassName="column-body"
                    />
                    <Column
                      field="variantSku"
                      header="SKU"
                      headerClassName="column-header"
                      bodyClassName="column-body"
                    />
                    <Column
                      field="quantity"
                      header="Qty"
                      headerClassName="column-header"
                      bodyClassName="column-body"
                    />
                    <Column
                      field="unitPrice"
                      header="Unit Price"
                      body={(row) => `${row.unitPrice.toFixed(2)} TK`}
                      headerClassName="column-header"
                      bodyClassName="column-body"
                    />
                    <Column
                      field="totalPrice"
                      header="Total"
                      body={(row) => `${row.totalPrice.toFixed(2)} TK`}
                      headerClassName="column-header"
                      bodyClassName="column-body"
                    />
                    <Column
                      header="Refunded"
                      body={(row: any) =>
                        row.isFullyRefunded ? (
                          <span className="text-green-600">
                            ✅ {row.refundedAmount?.toFixed(2)} TK
                          </span>
                        ) : row.refundedAmount > 0 ? (
                          <span className="text-yellow-600">
                            🔄 {row.refundedAmount?.toFixed(2)} TK
                          </span>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )
                      }
                      headerClassName="column-header"
                      bodyClassName="column-body"
                    />
                  </DataTable>
                </div>
                <div className="mt-3 text-right">
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Subtotal: {selectedOrder.subtotal?.toFixed(2) || "0.00"} TK
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-300">
                    Discount: {selectedOrder.discount?.toFixed(2) || "0.00"} TK
                  </p>
                  <p className="text-xl font-bold text-green-600 dark:text-green-400">
                    Total: {selectedOrder.total.toFixed(2)} TK
                  </p>
                  {selectedOrder.totalRefunded > 0 && (
                    <p className="text-sm text-red-600 dark:text-red-400">
                      Refunded: {selectedOrder.totalRefunded.toFixed(2)} TK
                    </p>
                  )}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDetailsModal(false);
                    setSelectedOrder(null);
                  }}
                >
                  Close
                </Button>
                <Button
                  variant="primary"
                  onClick={() => handlePrintReceipt(selectedOrder)}
                >
                  🖨️ Print Receipt
                </Button>
              </div>
            </div>
          )
        )}
      </Modal>

      {/* ===== Refund Modal ===== */}
      <Modal
        isOpen={!!showRefundModal}
        onClose={() => setShowRefundModal(null)}
        title={`${refundType === "partial" ? "Partial" : "Full"} Refund - ${showRefundModal?.invoiceNo || ""}`}
        size="lg"
      >
        {showRefundModal && (
          <div className="space-y-4">
            {/* Order summary */}
            <div className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-sm">
                <span className="font-medium">Order Total:</span>{" "}
                {showRefundModal.total.toFixed(2)} TK
              </p>
              <p className="text-sm">
                <span className="font-medium">Already Refunded:</span>{" "}
                {showRefundModal.totalRefunded?.toFixed(2) || "0.00"} TK
              </p>
              {refundType === "full" && (
                <p className="text-sm text-amber-600">
                  <span className="font-medium">Remaining:</span>{" "}
                  {(
                    showRefundModal.total - (showRefundModal.totalRefunded || 0)
                  ).toFixed(2)}{" "}
                  TK
                </p>
              )}
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium mb-1">Reason *</label>
              <select
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md dark:bg-gray-700 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select reason...</option>
                <option value="defect">Defect / Damaged</option>
                <option value="lost">Lost in transit</option>
                <option value="wrong_item">Wrong item sent</option>
                <option value="customer_request">Customer requested</option>
                <option value="other">Other</option>
              </select>
            </div>

            {/* Image URL */}
            <InputField
              label="Image URL (optional)"
              value={refundImageUrl}
              onChange={(e) => setRefundImageUrl(e.target.value)}
              placeholder="https://example.com/refund-image.jpg"
            />

            {/* Transaction ID */}
            <InputField
              label="Transaction ID (optional)"
              value={refundTransactionId}
              onChange={(e) => setRefundTransactionId(e.target.value)}
              placeholder="Bank/Payment reference ID"
            />

            {/* Partial Refund Items */}
            {refundType === "partial" && (
              <div>
                <h4 className="font-medium mb-2">
                  Select Items & Enter Refund Amount
                </h4>
                <div className="table-container max-h-60 overflow-y-auto border rounded">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-100 dark:bg-gray-700">
                      <tr>
                        <th className="px-3 py-2 text-left">Select</th>
                        <th className="px-3 py-2 text-left">Product</th>
                        <th className="px-3 py-2 text-center">Qty</th>
                        <th className="px-3 py-2 text-right">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(showRefundModal.soldItems || []).map(
                        (item: any, index) => {
                          const remaining =
                            item.totalPrice - (item.refundedAmount || 0);
                          return (
                            <tr
                              key={item.id}
                              className="border-b dark:border-gray-700"
                            >
                              <td className="px-3 py-2">
                                <input
                                  type="checkbox"
                                  checked={refundItems[index]?.quantity > 0}
                                  onChange={(e) => {
                                    const checked = e.target.checked;
                                    handleRefundItemChange(
                                      index,
                                      "quantity",
                                      checked ? item.quantity : 0,
                                    );
                                    handleRefundItemChange(
                                      index,
                                      "amount",
                                      checked ? remaining : 0,
                                    );
                                  }}
                                />
                              </td>
                              <td className="px-3 py-2">{item.productName}</td>
                              <td className="px-3 py-2 text-center">
                                <input
                                  type="number"
                                  min={0}
                                  max={item.quantity}
                                  value={refundItems[index]?.quantity || 0}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    handleRefundItemChange(
                                      index,
                                      "quantity",
                                      Math.min(val, item.quantity),
                                    );
                                  }}
                                  className="w-16 px-2 py-1 text-center border rounded dark:bg-gray-700"
                                  disabled={!refundItems[index]?.amount}
                                />
                              </td>
                              <td className="px-3 py-2 text-right">
                                <input
                                  type="number"
                                  min={0}
                                  step="0.01"
                                  max={remaining}
                                  value={refundItems[index]?.amount || 0}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    handleRefundItemChange(
                                      index,
                                      "amount",
                                      Math.min(val, remaining),
                                    );
                                  }}
                                  className="w-24 px-2 py-1 text-right border rounded dark:bg-gray-700"
                                  disabled={!refundItems[index]?.quantity}
                                />
                              </td>
                            </tr>
                          );
                        },
                      )}
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Check the items and enter quantity & amount to refund.
                </p>
              </div>
            )}

            {refundType === "full" && (
              <div className="p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-800">
                <p className="text-sm text-amber-700 dark:text-amber-300">
                  ⚠️ This will refund the entire remaining amount of this order.
                  All items will be marked as fully refunded.
                </p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t dark:border-gray-700">
              <Button
                variant="outline"
                onClick={() => setShowRefundModal(null)}
              >
                Cancel
              </Button>
              <Button
                variant={refundType === "full" ? "danger" : "primary"}
                onClick={handleRefundSubmit}
                loading={refundSubmitting}
                icon={<DollarSign size={16} />}
                iconPosition="left"
              >
                {refundType === "partial"
                  ? "Process Partial Refund"
                  : "Process Full Refund"}
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default OrderList;

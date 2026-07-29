import {
  CheckCircle,
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
import Modal from "../../components/ui/Modal";
import Toolbar from "../../components/ui/Toolbar";
import {
  cancelOrder,
  confirmOrder,
  deleteOrder,
  getOrderDetails,
  getOrders,
  syncPathaoStatuses,
} from "./order.service";

// ---------- Types ----------
interface SoldItem {
  id: number;
  productName: string;
  variantSku: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  variantAttributes?: any;
}

interface OrderItem {
  id: number;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerAddress: string;
  total: number;
  subtotal: number;
  discount: number;
  orderStatus: string; // new, confirmed, cancelled
  isWebsiteOrder: boolean;
  isSuspicious: boolean;
  paymentStatus: string;
  deliveryStatus?: string;
  pathaoInvoiceId?: string;
  pathaoConsignmentId?: string;
  pathaoLastSyncedAt?: string;
  deliveryDate?: string;
  createdAt: string;
  soldItems?: SoldItem[];
}

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

  // Details Modal
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<OrderItem | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(false);

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

  // ---------- Actions ----------
  const handleConfirm = async (id: number) => {
    try {
      await confirmOrder(id);
      toast.success("Order confirmed and Pathao booked!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Confirm failed");
    }
  };

  const handleCancel = async (id: number) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) return;
    try {
      await cancelOrder(id);
      toast.success("Order cancelled!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Cancel failed");
    }
  };

  const handleDelete = async (id: number) => {
    if (
      !window.confirm(
        "Permanently delete this cancelled order? This action cannot be undone!",
      )
    )
      return;
    try {
      await deleteOrder(id);
      toast.success("Order deleted permanently!");
      fetchOrders();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Delete failed");
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

  // ---------- Column Templates ----------
  // Invoice number as link to EditOrder page (react-router-dom Link)
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

  // ✅ Delivery Status Column
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

  // ---------- Actions Column (আইকন) ----------
  const actionsBody = (row: OrderItem) => {
    const { id, orderStatus } = row;

    if (orderStatus === "cancelled") {
      return (
        <div className="flex gap-2 items-center">
          <button
            onClick={() => handleDelete(id)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
          <button
            onClick={() => handleDetails(id)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Details"
          >
            <Eye size={16} />
          </button>
        </div>
      );
    }

    if (orderStatus === "new") {
      return (
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => handleConfirm(id)}
            className="text-green-600 hover:text-green-800 transition-colors"
            title="Confirm & Book"
          >
            <CheckCircle size={16} />
          </button>
          <Link
            to={`/order-edit/${id}`}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Edit"
          >
            <Edit size={16} />
          </Link>
          <button
            onClick={() => handleCancel(id)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Cancel"
          >
            <XCircle size={16} />
          </button>
          <button
            onClick={() => handleDetails(id)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Details"
          >
            <Eye size={16} />
          </button>
        </div>
      );
    }

    if (orderStatus === "confirmed") {
      return (
        <div className="flex gap-2 items-center flex-wrap">
          <button
            onClick={() => handleReprint(row)}
            className="text-gray-600 hover:text-gray-800 transition-colors"
            title="Reprint"
          >
            <Printer size={16} />
          </button>
          <button
            onClick={() => handleCancel(id)}
            className="text-red-600 hover:text-red-800 transition-colors"
            title="Cancel"
          >
            <XCircle size={16} />
          </button>
          <button
            onClick={() => handleDetails(id)}
            className="text-blue-600 hover:text-blue-800 transition-colors"
            title="Details"
          >
            <Eye size={16} />
          </button>
        </div>
      );
    }

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
            className="flex items-center gap-1"
          >
            <RefreshCw size={14} className={syncing ? "animate-spin" : ""} />
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
              style={{ width: "120px" }}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
          </DataTable>
        </div>
      </div>

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
    </div>
  );
};

export default OrderList;

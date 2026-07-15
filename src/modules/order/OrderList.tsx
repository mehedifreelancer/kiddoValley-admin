import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import DataTableSearch from "../../components/ui/DataTableSearch";
import Toolbar from "../../components/ui/Toolbar";
import {
  getOrders,
  packOrder,
  reprintOrder,
  syncPathaoStatuses,
} from "./order.service";

interface OrderItem {
  id: number;
  invoiceNo: string;
  customerName: string;
  customerPhone: string;
  customerPhone2?: string;
  customerAddress: string;
  total: number;
  paymentStatus: string;
  deliveryStatus?: string;
  pathaoInvoiceId?: string;
  pathaoConsignmentId?: string;
  pathaoLastSyncedAt?: string;
  createdAt: string;
}

// ---------- Helper: print receipt (placeholder) ----------
const handlePrintReceipt = (order: any) => {
  console.log("Printing receipt for order:", order.invoiceNo);
  toast.success("Printing receipt (mock)");
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

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getOrders(
        page,
        rows,
        globalFilter,
        sortField,
        sortOrder,
      );
      setOrders(response.data);
      setTotalRecords(response.pagination.total);
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

  // ---------- Batch Sync ----------
  const handleSyncAll = async () => {
    const orderIds = orders.map((o) => o.id).filter((id) => id);
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

  // ---------- Column Templates ----------
  const invoiceBody = (row: OrderItem) => (
    <span className="font-mono text-sm font-medium">{row.invoiceNo}</span>
  );
  const customerBody = (row: OrderItem) => (
    <div>
      <div className="font-medium">{row.customerName}</div>
      <div className="text-xs text-gray-500">{row.customerPhone}</div>
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
  const paymentStatusBody = (row: OrderItem) => {
    const color =
      row.paymentStatus === "paid"
        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300"
        : "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {row.paymentStatus}
      </span>
    );
  };
  const deliveryStatusBody = (row: OrderItem) => {
    const status = row.deliveryStatus || "Pending";
    const colorMap: Record<string, string> = {
      Pending:
        "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
      Assigned:
        "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      Picked:
        "bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300",
      Delivered:
        "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      Cancelled: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      "Pickup cancel":
        "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      Unknown: "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300",
    };
    const color =
      colorMap[status] ||
      "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300";
    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${color}`}>
        {status}
      </span>
    );
  };
  const consignmentBody = (row: OrderItem) => (
    <span className="font-mono text-xs">{row.pathaoConsignmentId || "—"}</span>
  );
  const dateBody = (row: OrderItem) => (
    <span className="text-sm">
      {new Date(row.createdAt).toLocaleDateString()}
    </span>
  );

  // ---------- Actions ----------
  const actionsBody = (row: OrderItem) => {
    const hasConsignment = !!row.pathaoConsignmentId;
    const isEditable =
      !hasConsignment ||
      row.deliveryStatus === "Pending" ||
      row.deliveryStatus === "Assigned";

    // Handle "Confirm & Pack" for orders without consignment
    const handlePack = async () => {
      try {
        const result = await packOrder(row.id);
        toast.success("Order packed successfully!");
        handlePrintReceipt(result.data);
        fetchOrders(); // refresh list
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Pack failed");
      }
    };

    // Handle "Reprint" for orders with consignment
    const handleReprint = async () => {
      try {
        const result = await reprintOrder(row.id);
        handlePrintReceipt(result.data);
      } catch (error: any) {
        toast.error(
          error.response?.data?.message || "Failed to fetch order for reprint",
        );
      }
    };

    // Handle Cancel (could use the existing cancel endpoint)
    const handleCancel = async () => {
      if (
        !window.confirm(
          `Are you sure you want to cancel order ${row.invoiceNo}?`,
        )
      )
        return;
      try {
        // You need to implement a cancelOrder service function – using DELETE /admin/orders/:id
        const response = await api.delete(`/admin/orders/${row.id}`);
        toast.success(response.data.message || "Order cancelled");
        fetchOrders();
      } catch (error: any) {
        toast.error(error.response?.data?.message || "Cancel failed");
      }
    };

    return (
      <div className="flex gap-2 flex-wrap">
        {!hasConsignment ? (
          <Button size="xs" variant="success" onClick={handlePack}>
            Confirm & Pack
          </Button>
        ) : (
          <Button size="xs" variant="primary" onClick={handleReprint}>
            Reprint Order
          </Button>
        )}
        <Button
          size="xs"
          variant="outline"
          disabled={!isEditable}
          onClick={() => toast.info(`Edit order ${row.invoiceNo}`)}
        >
          Edit
        </Button>
        <Button size="xs" variant="danger" onClick={handleCancel}>
          Cancel
        </Button>
      </div>
    );
  };

  // ---------- Render ----------
  return (
    <div>
      <Toolbar title="Order List">
        <div className="flex gap-2">
          <DataTableSearch
            value={globalFilter}
            onChange={onSearch}
            placeholder="Search by invoice, name, phone..."
            className="w-[280px]"
          />
          <Button
            size="sm"
            variant="primary"
            onClick={handleSyncAll}
            disabled={syncing || orders.length === 0}
          >
            {syncing ? "Syncing..." : "Sync Statuses"}
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
              field="paymentStatus"
              header="Payment"
              sortable
              body={paymentStatusBody}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="deliveryStatus"
              header="Delivery"
              sortable
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
              style={{ width: "260px" }}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
          </DataTable>
        </div>
      </div>
    </div>
  );
};

export default OrderList;

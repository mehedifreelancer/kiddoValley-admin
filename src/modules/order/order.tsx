import { ArrowUpDown, Delete, Plus, Trash2 } from "lucide-react";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import React, { useCallback, useMemo, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import Toolbar from "../../components/ui/Toolbar";
import { StockTable, StockTableColumn } from "../stock/StockTable";
import { FlatStockItem } from "../stock/stock.types";
import { createOrder } from "./order.service";
import { CreateOrderPayload, OrderItem } from "./order.types";

// ---------- Thumbnails ----------
const VariantThumbnails = ({ images }: { images: any[] }) => {
  if (!images || images.length === 0)
    return <span className="text-gray-400">—</span>;
  return (
    <div className="flex -space-x-2">
      {images.slice(0, 3).map((img, idx) => (
        <img
          key={idx}
          src={img.imgUrl}
          alt="variant"
          className="w-8 h-8 rounded-full border-2 border-white dark:border-gray-800 object-cover cursor-pointer hover:opacity-80 transition-opacity"
          onClick={() => window.open(img.imgUrl, "_blank")}
          title="Click to view full image"
        />
      ))}
      {images.length > 3 && (
        <span className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-xs font-medium">
          +{images.length - 3}
        </span>
      )}
    </div>
  );
};

// ---------- Helpers ----------
const formatDiscount = (sellingPrice: number, discountPercent: number) => {
  const amount = (sellingPrice * discountPercent) / 100;
  return `${discountPercent}% (${amount.toFixed(2)} TK)`;
};

const formatProfit = (sellingPrice: number, buyingPrice: number) => {
  const profit = sellingPrice - buyingPrice;
  const percent = (profit / sellingPrice) * 100;
  return `${profit.toFixed(2)} TK (${percent.toFixed(1)}%)`;
};

// ---------- Hooks (placeholders) ----------
const useWhatsAppNotification = () => {
  const sendNotification = useCallback((orderData: any) => {
    console.log("WhatsApp notification:", orderData);
    toast.success("WhatsApp notification sent (mock)");
  }, []);
  return { sendNotification };
};

const usePathao = () => {
  const createPathaoOrder = useCallback((orderData: any) => {
    console.log("Pathao order:", orderData);
    toast.info("Pathao integration (mock)");
  }, []);
  return { createPathaoOrder };
};

// ---------- Main Component ----------
export const Order: React.FC = () => {
  // Customer form
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerPhone2, setCustomerPhone2] = useState("");
  const [customerAddress, setCustomerAddress] = useState("");
  const [deliveryDate, setDeliveryDate] = useState<Date>(new Date());

  // Order items
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedVariantStocks, setSelectedVariantStocks] = useState<
    FlatStockItem[]
  >([]);

  const { sendNotification } = useWhatsAppNotification();
  const { createPathaoOrder } = usePathao();

  // All stock items (to check for multiple batches)
  const [allStockItems, setAllStockItems] = useState<FlatStockItem[]>([]);

  // Sorting state for stock table
  const [sortField, setSortField] = useState("currentQty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  const handleStockDataChange = useCallback((data: FlatStockItem[]) => {
    setAllStockItems(data);
  }, []);

  // Add item to order
  const addItemToOrder = useCallback(
    (stock: FlatStockItem) => {
      if (orderItems.some((item) => item.stockId === stock.id)) {
        toast.info("Item already in order.");
        return;
      }
      const discountPerUnit =
        (stock.sellingPrice * stock.discountPercent) / 100;
      const profitTkPerUnit = stock.sellingPrice - stock.buyingPrice;
      const profitPercent = (profitTkPerUnit / stock.sellingPrice) * 100;
      const newItem: OrderItem = {
        stockId: stock.id,
        batchNo: stock.batchNo,
        productName: stock.variant.productName,
        sku: stock.variant.sku,
        buyingPrice: stock.buyingPrice,
        sellingPrice: stock.sellingPrice,
        discountPercent: stock.discountPercent,
        quantity: 1,
        maxQuantity: stock.currentQty,
        total: stock.sellingPrice,
        discountAmount: discountPerUnit,
        finalPrice: stock.sellingPrice - discountPerUnit,
        profitTk: profitTkPerUnit,
        profitPercent,
      };
      setOrderItems((prev) => [...prev, newItem]);
    },
    [orderItems],
  );

  // Handle "Select" click – check for multiple batches
  const handleAddToOrder = useCallback(
    (stock: FlatStockItem) => {
      if (stock.currentQty <= 0) {
        toast.error("This batch is out of stock.");
        return;
      }
      const variantBatches = allStockItems.filter(
        (s) => s.variant.id === stock.variant.id && s.currentQty > 0,
      );
      if (variantBatches.length > 1) {
        setSelectedVariantStocks(variantBatches);
        setShowBatchModal(true);
      } else {
        addItemToOrder(stock);
      }
    },
    [allStockItems, addItemToOrder],
  );

  // Update quantity in order table
  const updateQuantity = useCallback((stockId: number, newQty: number) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.stockId !== stockId) return item;
        const qty = Math.min(Math.max(1, newQty), item.maxQuantity);
        const total = item.sellingPrice * qty;
        const discountAmount =
          ((item.sellingPrice * item.discountPercent) / 100) * qty;
        const finalPrice = total - discountAmount;
        const profitTk = (item.sellingPrice - item.buyingPrice) * qty;
        return {
          ...item,
          quantity: qty,
          total,
          discountAmount,
          finalPrice,
          profitTk,
        };
      }),
    );
  }, []);

  const removeItem = useCallback((stockId: number) => {
    setOrderItems((prev) => prev.filter((item) => item.stockId !== stockId));
  }, []);

  // Clear all items
  const clearAllItems = useCallback(() => {
    if (orderItems.length === 0) {
      toast.info("No items to clear.");
      return;
    }
    setOrderItems([]);
    toast.success("All items cleared.");
  }, [orderItems]);

  // Toggle sort order
  const toggleSort = useCallback(() => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  }, []);

  // Totals
  const totalItems = orderItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalDiscount = orderItems.reduce(
    (sum, i) => sum + i.discountAmount,
    0,
  );
  const totalBill = orderItems.reduce((sum, i) => sum + i.finalPrice, 0);

  // Validation
  const isCustomerFormValid = useCallback(
    () =>
      customerName.trim() !== "" &&
      customerPhone.trim() !== "" &&
      customerAddress.trim() !== "",
    [customerName, customerPhone, customerAddress],
  );

  const handleNext = useCallback(() => {
    if (!isCustomerFormValid()) {
      toast.error("Please fill in customer name, phone, and address");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    setShowConfirmModal(true);
  }, [isCustomerFormValid, orderItems]);

  const confirmOrder = useCallback(async () => {
    const payload: CreateOrderPayload = {
      customerName,
      customerPhone,
      customerPhone2,
      customerAddress,
      deliveryDate: deliveryDate.toISOString(),
      items: orderItems.map((item) => ({
        stockId: item.stockId,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
        totalPrice: item.total,
      })),
      subtotal: orderItems.reduce((sum, i) => sum + i.total, 0),
      discountTotal: totalDiscount,
      total: totalBill,
    };
    try {
      await createOrder(payload);
      toast.success("Order created successfully!");
      sendNotification(payload);
      createPathaoOrder(payload);
      // Reset form
      setOrderItems([]);
      setCustomerName("");
      setCustomerPhone("");
      setCustomerPhone2("");
      setCustomerAddress("");
      setDeliveryDate(new Date());
      setShowConfirmModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create order");
    }
  }, [
    customerName,
    customerPhone,
    customerPhone2,
    customerAddress,
    deliveryDate,
    orderItems,
    totalDiscount,
    totalBill,
    sendNotification,
    createPathaoOrder,
  ]);

  // ----- Stock table columns for Order -----
  const stockColumns: StockTableColumn[] = useMemo(
    () => [
      {
        header: "Product Name",
        body: (row) => (
          <div>
            <div className="font-medium text-gray-800 dark:text-gray-200">
              {row.variant.productName}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400">
              {row.variant.sku}
            </div>
          </div>
        ),
      },
      { field: "variant.sku", header: "SKU" },
      {
        field: "buyingPrice",
        header: "Buying Price",
        sortable: true,
        body: (row) => `${row.buyingPrice} TK`,
      },
      {
        field: "sellingPrice",
        header: "Selling Price",
        sortable: true,
        body: (row) => `${row.sellingPrice} TK`,
      },
      {
        header: "Images",
        body: (row) => <VariantThumbnails images={row.variant.images || []} />,
        style: { width: "100px" },
      },
      {
        field: "currentQty",
        header: "Quantity",
        sortable: true,
        body: (row) => (
          <span
            className={
              row.currentQty < 6
                ? "text-red-600 font-semibold"
                : "text-gray-800 dark:text-gray-200"
            }
          >
            {row.currentQty}
          </span>
        ),
      },
      {
        header: "Action",
        body: (row) => (
          <Button
            size="small"
            variant="outline"
            onClick={() => handleAddToOrder(row)}
            className="flex items-center gap-1 p-button-sm"
          >
            <Plus className="w-4 h-4" />
            Select
          </Button>
        ),
        style: { width: "110px" },
      },
    ],
    [handleAddToOrder],
  );

  const rowClassName = useCallback((row: FlatStockItem) => {
    if (row.currentQty < 6) return "bg-red-900/50! text-white table-row";
    return "table-row";
  }, []);

  // Toolbar children: Sort button for StockTable
  const toolbarChildren = (
    <Button
      size="xs"
      variant="outline"
      onClick={toggleSort}
      className="flex items-center gap-1"
    >
      <ArrowUpDown className="w-4 h-4" />
      <span>Qty {sortOrder === "asc" ? "↑" : "↓"}</span>
    </Button>
  );

  // ----- Order table column templates -----
  const orderProductBody = useCallback(
    (row: OrderItem) => (
      <div>
        <div className="font-medium text-gray-800 dark:text-gray-200">
          {row.productName}
        </div>
        <div className="text-xs text-gray-500 dark:text-gray-400">
          {row.sku}
        </div>
      </div>
    ),
    [],
  );
  const orderProfitBody = useCallback(
    (row: OrderItem) => (
      <span className="text-gray-700 dark:text-gray-300">
        {formatProfit(row.sellingPrice, row.buyingPrice)}
      </span>
    ),
    [],
  );
  const orderDiscountBody = useCallback(
    (row: OrderItem) => (
      <span className="text-gray-700 dark:text-gray-300">
        {formatDiscount(row.sellingPrice, row.discountPercent)}
      </span>
    ),
    [],
  );
  const orderQuantityBody = useCallback(
    (row: OrderItem) => (
      <InputNumber
        value={row.quantity}
        onValueChange={(e) => updateQuantity(row.stockId, e.value || 1)}
        min={1}
        max={row.maxQuantity}
        size={2}
        className="w-20"
      />
    ),
    [updateQuantity],
  );
  const orderLineTotalBody = useCallback(
    (row: OrderItem) => (
      <span className="font-semibold text-gray-800 dark:text-gray-200">
        {row.finalPrice.toFixed(2)} TK
      </span>
    ),
    [],
  );
  const orderActionsBody = useCallback(
    (row: OrderItem) => (
      <Button
        size="small"
        variant="danger"
        onClick={() => removeItem(row.stockId)}
        className="p-button-sm flex items-center gap-1"
      >
        <Trash2 className="w-4 h-4" />
      </Button>
    ),
    [removeItem],
  );

  const batchSelectBody = useCallback(
    (batch: FlatStockItem) => (
      <Button
        size="small"
        variant="primary"
        onClick={() => {
          addItemToOrder(batch);
          setShowBatchModal(false);
        }}
      >
        Select
      </Button>
    ),
    [addItemToOrder],
  );

  // ---------- Render ----------
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2 ">
      {/* Left Column – Stock Table */}
      <StockTable
        title="Stock List"
        columns={stockColumns}
        showSearch={true}
        onlyInStock={false}
        rowClassName={rowClassName}
        onDataChange={handleStockDataChange}
        sortField={sortField}
        sortOrder={sortOrder}
        wrapperClass="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 "
        onSortChange={(field, order) => {
          setSortField(field);
          setSortOrder(order);
        }}
        toolbarChildren={toolbarChildren}
      />

      {/* Right Column – Current Order */}
      <div className="flex flex-col gap-2 ">
        {/* Toolbar */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700  max-h-[550px] overflow-scroll ">
          <Toolbar title="Current Order">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {orderItems.length} item{orderItems.length !== 1 ? "s" : ""}
              </div>
              <Button
                size="xs"
                variant="danger"
                onClick={clearAllItems}
                className="flex items-center gap-1"
              >
                <Delete className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </Toolbar>

          {/* Order Items Table */}
          <div className="table-container p-1">
            <DataTable
              value={orderItems}
              emptyMessage="No items added yet"
              size="small"
              className="w-full"
            >
              <Column
                header="Product"
                body={orderProductBody}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                field="batchNo"
                header="Batch"
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Profit Margin"
                body={orderProfitBody}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Discount"
                body={orderDiscountBody}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Qty"
                body={orderQuantityBody}
                style={{ width: "100px" }}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Line Total"
                body={orderLineTotalBody}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
              <Column
                header="Actions"
                body={orderActionsBody}
                style={{ width: "80px" }}
                headerClassName="column-header"
                bodyClassName="column-body"
              />
            </DataTable>
          </div>

          {/* Footer Summary */}
          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Total Items:
              </span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">
                {totalItems}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">
                Total Discount:
              </span>
              <span className="font-semibold text-red-600">
                {totalDiscount.toFixed(2)} TK
              </span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-1">
              <span className="text-gray-800 dark:text-gray-200">
                Total Bill:
              </span>
              <span className="text-green-600 dark:text-green-400">
                {totalBill.toFixed(2)} TK
              </span>
            </div>
          </div>
        </div>

        {/* Customer Information Form */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700  ">
          <Toolbar
            title="            Customer Information
"
            className="flex justify-between "
          >
            <Button
              variant="primary"
              onClick={handleNext}
              className="flex items-center gap-2"
            >
              Next
              <span className="ml-1">→</span>
            </Button>
          </Toolbar>
          <div className="grid grid-cols-2 gap-3 p-4">
            <div>
              <InputField
                label="Name *"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <InputField
                label="Phone *"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                required
                className="w-full"
              />
            </div>
            <div>
              <InputField
                label="Secondary Phone"
                value={customerPhone2}
                onChange={(e) => setCustomerPhone2(e.target.value)}
                className="w-full"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Delivery Date
              </label>
              <Calendar
                value={deliveryDate}
                onChange={(e) => setDeliveryDate(e.value as Date)}
                className="w-full"
                showIcon
              />
            </div>
            <div className="col-span-2">
              <InputField
                label="Address *"
                value={customerAddress}
                onChange={(e) => setCustomerAddress(e.target.value)}
                required
                className="w-full"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Batch Selection Modal */}
      <Dialog
        header="Select Price Set"
        visible={showBatchModal}
        style={{ width: "650px" }}
        onHide={() => setShowBatchModal(false)}
      >
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">
          This product has multiple batches. Please select one:
        </p>
        <DataTable value={selectedVariantStocks} size="small">
          <Column
            field="batchNo"
            header="Batch"
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="sellingPrice"
            header="MRP"
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            header="Discount"
            body={(row) =>
              formatDiscount(row.sellingPrice, row.discountPercent)
            }
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            field="currentQty"
            header="Available Qty"
            headerClassName="column-header"
            bodyClassName="column-body"
          />
          <Column
            header="Action"
            body={batchSelectBody}
            style={{ width: "100px" }}
            headerClassName="column-header"
            bodyClassName="column-body"
          />
        </DataTable>
      </Dialog>

      {/* Order Confirmation Modal */}
      <Dialog
        header="Confirm Order"
        visible={showConfirmModal}
        style={{ width: "700px" }}
        onHide={() => setShowConfirmModal(false)}
        footer={
          <div>
            <Button
              variant="outline"
              onClick={() => setShowConfirmModal(false)}
            >
              Cancel
            </Button>
            <Button variant="success" onClick={confirmOrder}>
              Confirm Order
            </Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">
              Customer Details
            </h4>
            <p className="text-gray-600 dark:text-gray-300">
              Name: {customerName}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Phone: {customerPhone}
            </p>
            {customerPhone2 && (
              <p className="text-gray-600 dark:text-gray-300">
                Alt Phone: {customerPhone2}
              </p>
            )}
            <p className="text-gray-600 dark:text-gray-300">
              Address: {customerAddress}
            </p>
            <p className="text-gray-600 dark:text-gray-300">
              Delivery Date: {deliveryDate.toLocaleDateString()}
            </p>
          </div>
          <DataTable value={orderItems} size="small">
            <Column
              field="productName"
              header="Product"
              headerClassName="column-header"
              bodyClassName="column-body"
            />
            <Column
              field="sku"
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
              field="finalPrice"
              header="Line Total"
              body={(row) => `${row.finalPrice.toFixed(2)} TK`}
              headerClassName="column-header"
              bodyClassName="column-body"
            />
          </DataTable>
          <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
            <span>Total:</span>
            <span className="text-green-600 dark:text-green-400">
              {totalBill.toFixed(2)} TK
            </span>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Order;

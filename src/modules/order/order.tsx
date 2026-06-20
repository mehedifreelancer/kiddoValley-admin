import { ArrowUpDown, Delete, Plus, Trash2 } from "lucide-react";
import { Calendar } from "primereact/calendar";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Dialog } from "primereact/dialog";
import { InputNumber } from "primereact/inputnumber";
import React, { useRef, useState } from "react";
import { toast } from "react-hot-toast";
import Button from "../../components/ui/Button";
import InputField from "../../components/ui/InputField";
import Toolbar from "../../components/ui/Toolbar";
import { StockTable, StockTableColumn } from "../stock/StockTable";
import { FlatStockItem } from "../stock/stock.types";
import { createOrder } from "./order.service";
import { CreateOrderPayload, OrderItem } from "./order.types";
import { useBarcodeScanner } from "../../hooks/useBarcodeScanner";
import { getStockList } from "../stock/stock.service";

// ---------- Thumbnails ----------
const VariantThumbnails = ({ images }: { images: any[] }) => {
  if (!images || images.length === 0) return <span className="text-gray-400">—</span>;
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

// ---------- Hooks ----------
const useWhatsAppNotification = () => {
  const sendNotification = (orderData: any) => {
    console.log("WhatsApp notification:", orderData);
    toast.success("WhatsApp notification sent (mock)");
  };
  return { sendNotification };
};
const usePathao = () => {
  const createPathaoOrder = (orderData: any) => {
    console.log("Pathao order:", orderData);
    toast.info("Pathao integration (mock)");
  };
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

  // ----- State -----
  const [orderItems, setOrderItems] = useState<OrderItem[]>([]);
  const [allStockItems, setAllStockItems] = useState<FlatStockItem[]>([]);
  const [reservedQuantities, setReservedQuantities] = useState<Record<number, number>>({});

  // Search state
  const [searchTerm, setSearchTerm] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Modals
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [selectedVariantStocks, setSelectedVariantStocks] = useState<FlatStockItem[]>([]);

  const { sendNotification } = useWhatsAppNotification();
  const { createPathaoOrder } = usePathao();

  // Sorting state
  const [sortField, setSortField] = useState("currentQty");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("asc");

  // ---------- Plain functions ----------
  const getAvailableQty = (stock: FlatStockItem) => {
    const reserved = reservedQuantities[stock.id] || 0;
    return stock.currentQty - reserved;
  };

  const updateQuantity = (stockId: number, newQty: number) => {
    setOrderItems((prev) =>
      prev.map((item) => {
        if (item.stockId !== stockId) return item;
        const stock = allStockItems.find((s) => s.id === stockId);
        if (!stock) return item;
        const reserved = reservedQuantities[stockId] || 0;
        const maxAvailable = stock.currentQty - reserved + item.quantity;
        const qty = Math.min(Math.max(1, newQty), maxAvailable);
        if (qty !== newQty && newQty > qty) {
          toast.warn(`Only ${maxAvailable} units available`);
        }
        const delta = qty - item.quantity;
        setReservedQuantities((prevRes) => ({
          ...prevRes,
          [stockId]: (prevRes[stockId] || 0) + delta,
        }));
        const total = item.sellingPrice * qty;
        const discountAmount = ((item.sellingPrice * item.discountPercent) / 100) * qty;
        const finalPrice = total - discountAmount;
        const profitTk = (item.sellingPrice - item.buyingPrice) * qty;
        return { ...item, quantity: qty, total, discountAmount, finalPrice, profitTk };
      })
    );
  };

  const addItemToOrder = (stock: FlatStockItem) => {
    const available = getAvailableQty(stock);
    if (available <= 0) {
      toast.error(`"${stock.variant.productName}" is out of stock (${available} available)`);
      return;
    }
    const discountPerUnit = (stock.sellingPrice * stock.discountPercent) / 100;
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
    setReservedQuantities((prev) => ({
      ...prev,
      [stock.id]: (prev[stock.id] || 0) + 1,
    }));
  };

  const increaseQuantity = (stockId: number) => {
    const item = orderItems.find((i) => i.stockId === stockId);
    if (!item) {
      toast.error("Item not found in order");
      return;
    }
    const stock = allStockItems.find((s) => s.id === stockId);
    if (!stock) return;
    const reserved = reservedQuantities[stockId] || 0;
    const maxAllowed = stock.currentQty - reserved + item.quantity;
    const newQty = Math.min(item.quantity + 1, maxAllowed);
    if (newQty === item.quantity) {
      toast.info(`Max quantity (${maxAllowed}) reached`);
      return;
    }
    updateQuantity(stockId, newQty);
  };

  const addOrIncrementStock = (stock: FlatStockItem) => {
    const existing = orderItems.find((item) => item.stockId === stock.id);
    if (existing) {
      increaseQuantity(stock.id);
    } else {
      addItemToOrder(stock);
    }
  };

  const removeItem = (stockId: number) => {
    const item = orderItems.find((i) => i.stockId === stockId);
    if (item) {
      setReservedQuantities((prev) => ({
        ...prev,
        [stockId]: Math.max(0, (prev[stockId] || 0) - item.quantity),
      }));
    }
    setOrderItems((prev) => prev.filter((item) => item.stockId !== stockId));
  };

  const clearAllItems = () => {
    if (orderItems.length === 0) {
      toast.info("No items to clear.");
      return;
    }
    setReservedQuantities({});
    setOrderItems([]);
    toast.success("All items cleared.");
  };

  // ---------- Handlers ----------
  const handleAddToOrder = (stock: FlatStockItem) => {
    const available = getAvailableQty(stock);
    if (available <= 0) {
      toast.error(`"${stock.variant.productName}" is out of stock (${available} available)`);
      return;
    }

    const existing = orderItems.find((item) => item.stockId === stock.id);
    if (existing) {
      increaseQuantity(stock.id);
      return;
    }

    const variantBatches = allStockItems.filter(
      (s) => s.variant.id === stock.variant.id && getAvailableQty(s) > 0
    );
    if (variantBatches.length > 1) {
      setSelectedVariantStocks(variantBatches);
      setShowBatchModal(true);
    } else {
      addItemToOrder(stock);
    }
  };

  // ---------- Barcode Scanner ----------
  useBarcodeScanner({
    inputRef: searchInputRef,
    onSearchChange: setSearchTerm,
    onBarcodeScanned: async (barcode) => {
      try {
        const response = await getStockList(1, 1000, barcode, "currentQty", "asc", false);
        const stocks = response.data;
        if (stocks.length === 0) {
          toast.error(`Barcode "${barcode}" not found`);
          return;
        }
        const stock = stocks[0];
        const available = getAvailableQty(stock);
        if (available <= 0) {
          toast.error(`"${stock.variant.productName}" is out of stock (${available} available)`);
          return;
        }
        const existing = orderItems.find((item) => item.stockId === stock.id);
        if (existing) {
          increaseQuantity(stock.id);
        } else {
          handleAddToOrder(stock);
        }
      } catch (error) {
        console.error("Barcode scan error:", error);
        toast.error("Error searching barcode");
      }
    },
    onClear: () => console.log("Input cleared"),
  });

  // ---------- Stock table handlers ----------
  const handleStockDataChange = (data: FlatStockItem[]) => {
    setAllStockItems(data);
  };

  // ---------- Totals ----------
  const totalItems = orderItems.reduce((sum, i) => sum + i.quantity, 0);
  const totalDiscount = orderItems.reduce((sum, i) => sum + i.discountAmount, 0);
  const totalBill = orderItems.reduce((sum, i) => sum + i.finalPrice, 0);

  // ---------- Validation & Confirm ----------
  const isCustomerFormValid = () =>
    customerName.trim() !== "" &&
    customerPhone.trim() !== "" &&
    customerAddress.trim() !== "";

  const handleNext = () => {
    if (!isCustomerFormValid()) {
      toast.error("Please fill in customer name, phone, and address");
      return;
    }
    if (orderItems.length === 0) {
      toast.error("Please add at least one item");
      return;
    }
    setShowConfirmModal(true);
  };

  const confirmOrder = async () => {
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
      setOrderItems([]);
      setReservedQuantities({});
      setCustomerName("");
      setCustomerPhone("");
      setCustomerPhone2("");
      setCustomerAddress("");
      setDeliveryDate(new Date());
      setShowConfirmModal(false);
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to create order");
    }
  };

  // ---------- Stock Table Columns ----------
  const stockColumns: StockTableColumn[] = [
    {
      header: "Product Name",
      body: (row) => (
        <div>
          <div className="font-medium text-gray-800 dark:text-gray-200">{row.variant.productName}</div>
          <div className="text-xs text-gray-500 dark:text-gray-400">{row.variant.sku}</div>
        </div>
      ),
    },
    { field: "variant.sku", header: "SKU" },
    { field: "buyingPrice", header: "Buying Price", sortable: true, body: (row) => `${row.buyingPrice} TK` },
    { field: "sellingPrice", header: "Selling Price", sortable: true, body: (row) => `${row.sellingPrice} TK` },
    {
      header: "Images",
      body: (row) => <VariantThumbnails images={row.variant.images || []} />,
      style: { width: "100px" },
    },
    {
      field: "currentQty",
      header: "Available Qty",
      sortable: true,
      body: (row) => {
        const available = getAvailableQty(row);
        return (
          <span className={available < 6 ? "text-red-600 font-semibold" : "text-gray-800 dark:text-gray-200"}>
            {available}
          </span>
        );
      },
    },
    {
      header: "Action",
      body: (row) => {
        const available = getAvailableQty(row);
        return (
          <Button
            size="small"
            variant="outline"
            onClick={() => handleAddToOrder(row)}
            className="flex items-center gap-1 p-button-sm"
            disabled={available <= 0}
          >
            <Plus className="w-4 h-4" />
            Select
          </Button>
        );
      },
      style: { width: "110px" },
    },
  ];

  const rowClassName = (row: FlatStockItem) => {
    const available = getAvailableQty(row);
    return available < 6 ? "bg-red-900/50! text-white table-row" : "table-row";
  };

  const toggleSort = () => {
    setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
  };

  const toolbarChildren = (
    <Button size="xs" variant="outline" onClick={toggleSort} className="flex items-center gap-1">
      <ArrowUpDown className="w-4 h-4" />
      <span>Qty {sortOrder === "asc" ? "↑" : "↓"}</span>
    </Button>
  );

  // ---------- Order Table Templates ----------
  const orderProductBody = (row: OrderItem) => (
    <div>
      <div className="font-medium text-gray-800 dark:text-gray-200">{row.productName}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{row.sku}</div>
    </div>
  );
  const orderProfitBody = (row: OrderItem) => (
    <span className="text-gray-700 dark:text-gray-300">{formatProfit(row.sellingPrice, row.buyingPrice)}</span>
  );
  const orderDiscountBody = (row: OrderItem) => (
    <span className="text-gray-700 dark:text-gray-300">{formatDiscount(row.sellingPrice, row.discountPercent)}</span>
  );
  const orderQuantityBody = (row: OrderItem) => (
    <InputNumber
      value={row.quantity}
      onValueChange={(e) => updateQuantity(row.stockId, e.value || 1)}
      min={1}
      max={row.maxQuantity}
      size={2}
      className="w-20"
    />
  );
  const orderLineTotalBody = (row: OrderItem) => (
    <span className="font-semibold text-gray-800 dark:text-gray-200">{row.finalPrice.toFixed(2)} TK</span>
  );
  const orderActionsBody = (row: OrderItem) => (
    <Button
      size="small"
      variant="danger"
      onClick={() => removeItem(row.stockId)}
      className="p-button-sm flex items-center gap-1"
    >
      <Trash2 className="w-4 h-4" />
    </Button>
  );

  const batchSelectBody = (batch: FlatStockItem) => (
    <Button
      size="small"
      variant="primary"
      onClick={() => {
        addOrIncrementStock(batch);
        setShowBatchModal(false);
      }}
    >
      Select
    </Button>
  );

  // ---------- Render ----------
  // Force StockTable to re‑mount when reservedQuantities changes
  const reservedKey = JSON.stringify(reservedQuantities);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2 p-2">
      <StockTable
        key={reservedKey} // 👈 forces re‑render when reservedQuantities changes
        title="Stock List"
        columns={stockColumns}
        showSearch={true}
        onlyInStock={false}
        rowClassName={rowClassName}
        onDataChange={handleStockDataChange}
        sortField={sortField}
        sortOrder={sortOrder}
        wrapperClass="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700"
        onSortChange={(field, order) => {
          setSortField(field);
          setSortOrder(order);
        }}
        toolbarChildren={toolbarChildren}
        searchInputRef={searchInputRef}
        searchValue={searchTerm}
        onSearchChange={setSearchTerm}
      />

      {/* Right Column – Current Order */}
      <div className="flex flex-col gap-2">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 max-h-[550px] overflow-scroll">
          <Toolbar title="Current Order">
            <div className="flex items-center justify-between w-full">
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {orderItems.length} item{orderItems.length !== 1 ? "s" : ""}
              </div>
              <Button size="xs" variant="danger" onClick={clearAllItems} className="flex items-center gap-1">
                <Delete className="w-4 h-4" />
                Clear
              </Button>
            </div>
          </Toolbar>

          <div className="table-container p-1">
            <DataTable value={orderItems} emptyMessage="No items added yet" size="small" className="w-full">
              <Column header="Product" body={orderProductBody} headerClassName="column-header" bodyClassName="column-body" />
              <Column field="batchNo" header="Batch" headerClassName="column-header" bodyClassName="column-body" />
              <Column header="Profit Margin" body={orderProfitBody} headerClassName="column-header" bodyClassName="column-body" />
              <Column header="Discount" body={orderDiscountBody} headerClassName="column-header" bodyClassName="column-body" />
              <Column header="Qty" body={orderQuantityBody} style={{ width: "100px" }} headerClassName="column-header" bodyClassName="column-body" />
              <Column header="Line Total" body={orderLineTotalBody} headerClassName="column-header" bodyClassName="column-body" />
              <Column header="Actions" body={orderActionsBody} style={{ width: "80px" }} headerClassName="column-header" bodyClassName="column-body" />
            </DataTable>
          </div>

          <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-md">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Total Items:</span>
              <span className="font-semibold text-gray-800 dark:text-gray-200">{totalItems}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-300">Total Discount:</span>
              <span className="font-semibold text-red-600">{totalDiscount.toFixed(2)} TK</span>
            </div>
            <div className="flex justify-between text-lg font-bold mt-1">
              <span className="text-gray-800 dark:text-gray-200">Total Bill:</span>
              <span className="text-green-600 dark:text-green-400">{totalBill.toFixed(2)} TK</span>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <Toolbar title="Customer Information">
            <Button variant="primary" onClick={handleNext} className="flex items-center gap-2">
              Next <span className="ml-1">→</span>
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
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Delivery Date</label>
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

      {/* Batch Modal */}
      <Dialog header="Select Price Set" visible={showBatchModal} style={{ width: "650px" }} onHide={() => setShowBatchModal(false)}>
        <p className="mb-2 text-sm text-gray-600 dark:text-gray-300">This product has multiple batches. Please select one:</p>
        <DataTable value={selectedVariantStocks} size="small">
          <Column field="batchNo" header="Batch" headerClassName="column-header" bodyClassName="column-body" />
          <Column field="sellingPrice" header="MRP" headerClassName="column-header" bodyClassName="column-body" />
          <Column header="Discount" body={(row) => formatDiscount(row.sellingPrice, row.discountPercent)} headerClassName="column-header" bodyClassName="column-body" />
          <Column field="currentQty" header="Available Qty" headerClassName="column-header" bodyClassName="column-body" />
          <Column header="Action" body={batchSelectBody} style={{ width: "100px" }} headerClassName="column-header" bodyClassName="column-body" />
        </DataTable>
      </Dialog>

      {/* Confirmation Modal */}
      <Dialog
        header="Confirm Order"
        visible={showConfirmModal}
        style={{ width: "700px" }}
        onHide={() => setShowConfirmModal(false)}
        footer={
          <div>
            <Button variant="outline" onClick={() => setShowConfirmModal(false)}>Cancel</Button>
            <Button variant="success" onClick={confirmOrder}>Confirm Order</Button>
          </div>
        }
      >
        <div className="space-y-3">
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded">
            <h4 className="font-semibold text-gray-800 dark:text-gray-200">Customer Details</h4>
            <p className="text-gray-600 dark:text-gray-300">Name: {customerName}</p>
            <p className="text-gray-600 dark:text-gray-300">Phone: {customerPhone}</p>
            {customerPhone2 && <p className="text-gray-600 dark:text-gray-300">Alt Phone: {customerPhone2}</p>}
            <p className="text-gray-600 dark:text-gray-300">Address: {customerAddress}</p>
            <p className="text-gray-600 dark:text-gray-300">Delivery Date: {deliveryDate.toLocaleDateString()}</p>
          </div>
          <DataTable value={orderItems} size="small">
            <Column field="productName" header="Product" headerClassName="column-header" bodyClassName="column-body" />
            <Column field="sku" header="SKU" headerClassName="column-header" bodyClassName="column-body" />
            <Column field="quantity" header="Qty" headerClassName="column-header" bodyClassName="column-body" />
            <Column field="finalPrice" header="Line Total" body={(row) => `${row.finalPrice.toFixed(2)} TK`} headerClassName="column-header" bodyClassName="column-body" />
          </DataTable>
          <div className="flex justify-between font-bold text-gray-800 dark:text-gray-200">
            <span>Total:</span>
            <span className="text-green-600 dark:text-green-400">{totalBill.toFixed(2)} TK</span>
          </div>
        </div>
      </Dialog>
    </div>
  );
};

export default Order;
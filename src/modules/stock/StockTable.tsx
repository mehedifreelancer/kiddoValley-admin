import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "react-hot-toast";
import DataTableSearch from "../../components/ui/DataTableSearch";
import Toolbar from "../../components/ui/Toolbar";
import { getStockList } from "./stock.service";
import { FlatStockItem } from "./stock.types";

export interface StockTableColumn {
  field?: string;
  header: string;
  body?: (row: FlatStockItem) => React.ReactNode;
  sortable?: boolean;
  style?: React.CSSProperties;
  headerClassName?: string;
  bodyClassName?: string;
  wrapperClass?: string;
}

interface StockTableProps {
  title?: string;
  columns: StockTableColumn[];
  toolbar?: React.ReactNode;
  toolbarChildren?: React.ReactNode;
  onlyInStock?: boolean;
  showSearch?: boolean;
  searchValue?: string;
  onSearchChange?: (value: string) => void;
  sortField?: string;
  sortOrder?: "asc" | "desc";
  onSortChange?: (field: string, order: "asc" | "desc") => void;
  rowClassName?: (row: FlatStockItem) => string;
  onDataChange?: (data: FlatStockItem[]) => void;
  wrapperClass?: string;
  [key: string]: any;
}

export const StockTable: React.FC<StockTableProps> = ({
  title,
  columns,
  toolbar,
  toolbarChildren,
  onlyInStock = false,
  showSearch = true,
  searchValue: externalSearch,
  onSearchChange,
  sortField: externalSortField,
  sortOrder: externalSortOrder,
  onSortChange,
  rowClassName,
  onDataChange,
  wrapperClass,
  ...rest
}) => {
  const onDataChangeRef = useRef(onDataChange);
  useEffect(() => {
    onDataChangeRef.current = onDataChange;
  }, [onDataChange]);

  const [internalSearch, setInternalSearch] = useState("");
  const [internalSortField, setInternalSortField] = useState("currentQty");
  const [internalSortOrder, setInternalSortOrder] = useState<"asc" | "desc">(
    "asc",
  );

  const [stockItems, setStockItems] = useState<FlatStockItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState(10);

  const search = externalSearch !== undefined ? externalSearch : internalSearch;
  const sortField =
    externalSortField !== undefined ? externalSortField : internalSortField;
  const sortOrder =
    externalSortOrder !== undefined ? externalSortOrder : internalSortOrder;

  const handleSearchChange = (value: string) => {
    if (onSearchChange) onSearchChange(value);
    else setInternalSearch(value);
    setPage(1);
  };

  const handleSort = (event: any) => {
    const field = event.sortField;
    const order = event.sortOrder === 1 ? "asc" : "desc";
    if (onSortChange) onSortChange(field, order);
    else {
      setInternalSortField(field);
      setInternalSortOrder(order);
    }
  };

  const fetchStock = useCallback(async () => {
    setLoading(true);
    try {
      const response = await getStockList(
        page,
        rows,
        search,
        sortField,
        sortOrder,
        onlyInStock,
      );
      setStockItems(response.data);
      setTotalRecords(response.pagination.total);
      if (onDataChangeRef.current) {
        onDataChangeRef.current(response.data);
      }
    } catch (error) {
      toast.error("Failed to load stock data");
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [page, rows, search, sortField, sortOrder, onlyInStock]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  const onPageChange = (event: any) => {
    setPage(event.page + 1);
    setRows(event.rows);
  };

  // Render toolbar: if custom toolbar provided, use it; else use default with Toolbar component
  const renderToolbar = () => {
    if (toolbar) return toolbar;
    return (
      <Toolbar title={title || "Stock List"}>
        <div className="flex gap-2">
          {showSearch && (
            <DataTableSearch
              value={search}
              onChange={handleSearchChange}
              placeholder="Search by product, SKU, barcode..."
              className="w-[280px]"
            />
          )}
          {toolbarChildren}
        </div>
      </Toolbar>
    );
  };

  return (
    <div className={wrapperClass}>
      {renderToolbar()}
      <div className="table-container ">
        <DataTable
          value={stockItems}
          lazy
          paginator
          rows={rows}
          totalRecords={totalRecords}
          first={(page - 1) * rows}
          onPage={onPageChange}
          onSort={handleSort}
          sortField={sortField}
          sortOrder={sortOrder === "asc" ? 1 : -1}
          loading={loading}
          emptyMessage="No stock batches found"
          rowClassName={rowClassName}
          {...rest}
        >
          {columns.map((col, idx) => (
            <Column
              key={idx}
              field={col.field}
              header={col.header}
              sortable={col.sortable}
              body={col.body}
              style={col.style}
              headerClassName={col.headerClassName || "column-header"}
              bodyClassName={col.bodyClassName || "column-body"}
            />
          ))}
        </DataTable>
      </div>
    </div>
  );
};

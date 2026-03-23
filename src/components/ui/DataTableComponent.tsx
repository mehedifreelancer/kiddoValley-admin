import React, { useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import DataTableSearch from './DataTableSearch';

// Dummy data
const dummyData = [
  { id: 1, name: "John Doe", email: "john@example.com", role: "Admin", status: "Active", projects: 12, revenue: 12500 },
  { id: 2, name: "Jane Smith", email: "jane@example.com", role: "User", status: "Active", projects: 8, revenue: 8900 },
  { id: 3, name: "Bob Johnson", email: "bob@example.com", role: "Editor", status: "Inactive", projects: 5, revenue: 4500 },
  { id: 4, name: "Alice Williams", email: "alice@example.com", role: "User", status: "Active", projects: 15, revenue: 15800 },
  { id: 5, name: "Charlie Brown", email: "charlie@example.com", role: "Viewer", status: "Pending", projects: 3, revenue: 2100 },
  { id: 6, name: "Diana Prince", email: "diana@example.com", role: "Admin", status: "Active", projects: 22, revenue: 25400 },
  { id: 7, name: "Ethan Hunt", email: "ethan@example.com", role: "Editor", status: "Active", projects: 9, revenue: 11200 },
];

const DataTableComponent: React.FC = () => {
  const [globalFilter, setGlobalFilter] = useState("");

  // Manual filtering function that works with all fields including numbers
  const filteredData = useMemo(() => {
    if (!globalFilter) return dummyData;
    
    const searchTerm = globalFilter.toLowerCase();
    
    return dummyData.filter(item => {
      return (
        item.name.toLowerCase().includes(searchTerm) ||
        item.email.toLowerCase().includes(searchTerm) ||
        item.role.toLowerCase().includes(searchTerm) ||
        item.status.toLowerCase().includes(searchTerm) ||
        item.projects.toString().includes(searchTerm) ||  // Convert number to string
        item.revenue.toString().includes(searchTerm)       // Convert number to string
      );
    });
  }, [globalFilter]);

  const statusBody = (rowData: any) => {
    const statusClass =
      rowData.status === "Active" ? "status-badge-active" :
        rowData.status === "Inactive" ? "status-badge-inactive" :
          "status-badge-pending";

    return (
      <span className={`status-badge ${statusClass}`}>
        {rowData.status}
      </span>
    );
  };

  const revenueBody = (rowData: any) => (
    <span className="revenue-text">
      ${rowData.revenue.toLocaleString()}
    </span>
  );

  const header = (
    <div className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">User Management</h3>
      <DataTableSearch
        value={globalFilter}
        onChange={setGlobalFilter}
        placeholder="Search..."
        className="w-72"
      />
    </div>
  );

  return (
    <div className="table-container">
      <DataTable
        value={filteredData}
        header={header}
        paginator
        rows={10}
        rowsPerPageOptions={[5, 10, 25, 50]}
        emptyMessage="No records found"
        stripedRows
        rowClassName={() => 'table-row'}
      >
        <Column
          field="name"
          header="Name"
          sortable
          headerClassName="column-header"
          bodyClassName="column-body"
        />
        <Column
          field="email"
          header="Email"
          sortable
          headerClassName="column-header"
          bodyClassName="column-body"
        />
        <Column
          field="role"
          header="Role"
          sortable
          headerClassName="column-header"
          bodyClassName="column-body"
        />
        <Column
          field="status"
          header="Status"
          sortable
          body={statusBody}
          headerClassName="column-header"
          bodyClassName="column-body"
        />
        <Column
          field="projects"
          header="Projects"
          sortable
          headerClassName="column-header"
          bodyClassName="column-body"
        />
        <Column
          field="revenue"
          header="Revenue"
          sortable
          body={revenueBody}
          headerClassName="column-header"
          bodyClassName="column-body"
        />
      </DataTable>
    </div>
  );
};

export default DataTableComponent;
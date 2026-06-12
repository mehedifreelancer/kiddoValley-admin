import React, { useState, useMemo } from 'react';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import DataTableSearch from './DataTableSearch';

// Dummy data


const DataTableComponent: React.FC = (data) => {
  const [globalFilter, setGlobalFilter] = useState("");

  // Manual filtering function that works with all fields including numbers
  const filteredData = useMemo(() => {
    if (!globalFilter) return data;
    
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
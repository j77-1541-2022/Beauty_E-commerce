import React, { useState } from 'react';
import { ChevronUp, ChevronDown } from 'lucide-react';
import { LoadingSkeleton, TableRowSkeleton } from './LoadingSkeleton';
import { EmptyState } from './EmptyState';
import './DataTable.css';

export const DataTable = ({
  columns,
  data,
  loading = false,
  sortable = true,
  onSort,
  onRowClick,
  actions,
  emptyStateProps = {},
  pagination,
}) => {
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });

  const handleSort = (key) => {
    if (!sortable) return;
    
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
    onSort?.(key, direction);
  };

  const getSortIcon = (key) => {
    if (sortConfig.key !== key) return <ChevronUp size={14} className="opacity-30" />;
    return sortConfig.direction === 'asc' 
      ? <ChevronUp size={14} /> 
      : <ChevronDown size={14} />;
  };

  if (loading) {
    return (
      <div className="data-table">
        <div className="data-table__header">
          {columns.map((col, i) => (
            <div key={i} className="data-table__th">
              <LoadingSkeleton variant="text" />
            </div>
          ))}
        </div>
        {Array.from({ length: 5 }, (_, i) => (
          <TableRowSkeleton key={i} columns={columns.length} />
        ))}
      </div>
    );
  }

  if (!data || data.length === 0) {
    return <EmptyState variant="default" {...emptyStateProps} />;
  }

  return (
    <div className="data-table-wrapper">
      <div className="data-table">
        <div className="data-table__header">
          {columns.map((column) => (
            <div 
              key={column.key} 
              className={`data-table__th ${sortable && column.sortable !== false ? 'sortable' : ''}`}
              onClick={() => column.sortable !== false && handleSort(column.key)}
              style={{ width: column.width }}
            >
              {column.title}
              {sortable && column.sortable !== false && (
                <span className="sort-icon">{getSortIcon(column.key)}</span>
              )}
            </div>
          ))}
          {actions && <div className="data-table__th">Actions</div>}
        </div>
        
        <div className="data-table__body">
          {data.map((row, index) => (
            <div 
              key={row.id || index} 
              className={`data-table__row ${onRowClick ? 'clickable' : ''}`}
              onClick={() => onRowClick?.(row)}
            >
              {columns.map((column) => (
                <div key={column.key} className="data-table__td">
                  {column.render 
                    ? column.render(row[column.key], row) 
                    : row[column.key]}
                </div>
              ))}
              {actions && (
                <div className="data-table__td data-table__actions">
                  {actions(row)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
      
      {pagination && (
        <div className="data-table__pagination">
          {pagination}
        </div>
      )}
    </div>
  );
};

export default DataTable;

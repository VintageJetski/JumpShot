import { useState } from "react";
import { ChevronDown, ChevronUp, ChevronsLeft, ChevronsRight, ChevronLeft, ChevronRight } from "lucide-react";

interface DataTableProps<T> {
  columns: {
    header: string;
    accessorKey?: string;
    id?: string;
    cell?: ({ row }: { row: { original: T } }) => React.ReactNode;
  }[];
  data: T[];
  pageSize?: number;
  defaultSortField?: string;
  defaultSortDir?: 'asc' | 'desc';
}

export function DataTable<T>({
  columns,
  data,
  pageSize = 10,
  defaultSortField,
  defaultSortDir = 'desc'
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<string | undefined>(defaultSortField);
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>(defaultSortDir);
  
  // Sort the data
  const sortedData = [...data].sort((a, b) => {
    if (!sortField) return 0;
    
    const fieldA = sortField.split('.').reduce((obj, key) => obj && (obj as any)[key], a) as any;
    const fieldB = sortField.split('.').reduce((obj, key) => obj && (obj as any)[key], b) as any;
    
    if (fieldA === undefined || fieldB === undefined) return 0;
    
    if (typeof fieldA === 'number' && typeof fieldB === 'number') {
      return sortDirection === 'asc' ? fieldA - fieldB : fieldB - fieldA;
    }
    
    const valueA = String(fieldA).toLowerCase();
    const valueB = String(fieldB).toLowerCase();
    
    return sortDirection === 'asc' 
      ? valueA.localeCompare(valueB)
      : valueB.localeCompare(valueA);
  });
  
  // Paginate the data
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const start = (currentPage - 1) * pageSize;
  const end = Math.min(start + pageSize, sortedData.length);
  const paginatedData = sortedData.slice(start, end);
  
  // Handle sort
  const handleSort = (field: string | undefined) => {
    if (!field) return;
    
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('desc');
    }
  };
  
  // Page navigation
  const goToPage = (page: number) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };
  
  return (
    <div className="w-full overflow-hidden">
      <div className="table-container overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-700">
          <thead className="bg-gray-800">
            <tr>
              {columns.map((column, idx) => (
                <th 
                  key={idx} 
                  scope="col" 
                  className={`px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider ${
                    sortField === column.accessorKey ? 'bg-gray-700' : ''
                  } ${column.accessorKey ? 'cursor-pointer' : ''}`}
                  onClick={() => column.accessorKey && handleSort(column.accessorKey)}
                >
                  {column.accessorKey ? (
                    <div className="flex items-center">
                      {column.header}
                      {sortField === column.accessorKey && (
                        sortDirection === 'asc' 
                          ? <ChevronUp className="h-4 w-4 ml-1" />
                          : <ChevronDown className="h-4 w-4 ml-1" />
                      )}
                    </div>
                  ) : (
                    column.header
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-background-light divide-y divide-gray-700">
            {paginatedData.map((row, rowIdx) => (
              <tr key={rowIdx} className="hover:bg-gray-800">
                {columns.map((column, colIdx) => (
                  <td key={colIdx} className="px-6 py-4 whitespace-nowrap">
                    {column.cell 
                      ? column.cell({ row: { original: row } })
                      : column.accessorKey 
                        ? String((row as any)[column.accessorKey])
                        : null
                    }
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {totalPages > 1 && (
        <div className="px-6 py-3 border-t border-gray-700 bg-gray-800 flex items-center justify-between">
          <div className="text-sm text-gray-400">
            Showing <span className="font-medium text-white">{start + 1}</span> to <span className="font-medium text-white">{end}</span> of <span className="font-medium text-white">{sortedData.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className={`px-3 py-1 ${currentPage === 1 ? 'bg-gray-700 text-gray-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} rounded-md text-sm`}
              onClick={() => goToPage(1)}
              disabled={currentPage === 1}
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>
            <button 
              className={`px-3 py-1 ${currentPage === 1 ? 'bg-gray-700 text-gray-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} rounded-md text-sm`}
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            
            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
              // Calculate page numbers to show
              let pageNum;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (currentPage <= 3) {
                pageNum = i + 1;
              } else if (currentPage >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = currentPage - 2 + i;
              }
              
              return (
                <button 
                  key={i}
                  className={`px-3 py-1 ${currentPage === pageNum ? 'bg-primary text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} rounded-md text-sm`}
                  onClick={() => goToPage(pageNum)}
                >
                  {pageNum}
                </button>
              );
            })}
            
            <button 
              className={`px-3 py-1 ${currentPage === totalPages ? 'bg-gray-700 text-gray-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} rounded-md text-sm`}
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </button>
            <button 
              className={`px-3 py-1 ${currentPage === totalPages ? 'bg-gray-700 text-gray-500' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'} rounded-md text-sm`}
              onClick={() => goToPage(totalPages)}
              disabled={currentPage === totalPages}
            >
              <ChevronsRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

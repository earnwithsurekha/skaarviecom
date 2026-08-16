/**
 * Export Utilities
 * Helper functions for exporting data to various formats
 */

/**
 * Export data as CSV file
 * @param {Array} data - Array of objects to export
 * @param {Array} headers - Array of header objects with {key, label} structure
 * @param {string} filename - Name of the file to download
 */
export const exportToCSV = (data, headers, filename) => {
  if (!data || data.length === 0) {
    throw new Error('No data to export');
  }

  // Create CSV header row
  const headerRow = headers.map(h => h.label).join(',');
  
  // Create CSV data rows
  const dataRows = data.map(row => {
    return headers.map(h => {
      const value = row[h.key];
      // Handle values that contain commas by wrapping in quotes
      if (typeof value === 'string' && value.includes(',')) {
        return `"${value}"`;
      }
      return value ?? '';
    }).join(',');
  });

  // Combine header and data
  const csvContent = [headerRow, ...dataRows].join('\n');

  // Create and download file
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * Export array data as CSV (simple format)
 * @param {string} csvContent - Pre-formatted CSV content
 * @param {string} filename - Name of the file to download
 */
export const exportCSVString = (csvContent, filename) => {
  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

/**
 * Export data as JSON file
 * @param {Object|Array} data - Data to export
 * @param {string} filename - Name of the file to download
 */
export const exportToJSON = (data, filename) => {
  const jsonContent = JSON.stringify(data, null, 2);
  downloadFile(jsonContent, filename, 'application/json;charset=utf-8;');
};

/**
 * Helper function to download a file
 * @param {string} content - File content
 * @param {string} filename - Name of the file
 * @param {string} mimeType - MIME type of the file
 */
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Clean up the URL object
  setTimeout(() => URL.revokeObjectURL(url), 100);
};

/**
 * Format currency value for export
 * @param {number} amount - Amount to format
 * @param {string} currency - Currency code (default: INR)
 */
export const formatCurrencyForExport = (amount, currency = 'INR') => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount || 0);
};

/**
 * Format date for export
 * @param {Date|string} date - Date to format
 */
export const formatDateForExport = (date) => {
  return new Date(date).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

/**
 * Export table data directly from DOM table element
 * @param {string} tableId - ID of the table element
 * @param {string} filename - Name of the file to download
 */
export const exportTableToCSV = (tableId, filename) => {
  const table = document.getElementById(tableId);
  if (!table) {
    throw new Error('Table not found');
  }

  const rows = Array.from(table.querySelectorAll('tr'));
  const csvContent = rows.map(row => {
    const cells = Array.from(row.querySelectorAll('th, td'));
    return cells.map(cell => {
      const text = cell.textContent.trim();
      // Handle values that contain commas
      if (text.includes(',')) {
        return `"${text}"`;
      }
      return text;
    }).join(',');
  }).join('\n');

  downloadFile(csvContent, filename, 'text/csv;charset=utf-8;');
};

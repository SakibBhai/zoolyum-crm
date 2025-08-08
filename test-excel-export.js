const XLSX = require('xlsx');

// Test Excel export functionality
function testExcelExport() {
  console.log('Testing Excel export functionality...');
  
  // Sample transaction data
  const sampleData = [
    {
      'Transaction ID': 'tx-001',
      'Date': '2025-07-31',
      'Type': 'income',
      'Category': 'Consulting',
      'Description': 'Web development project',
      'Amount': 2500.00,
      'Status': 'completed',
      'Payment Method': 'Bank Transfer',
      'Reference Number': 'REF-2025-001',
      'Notes': 'Initial payment for project',
      'Client': 'Tech Corp',
      'Project': 'Website Redesign'
    },
    {
      'Transaction ID': 'tx-002',
      'Date': '2025-07-30',
      'Type': 'expense',
      'Category': 'Office Supplies',
      'Description': 'Software licenses',
      'Amount': 150.00,
      'Status': 'completed',
      'Payment Method': 'Credit Card',
      'Reference Number': 'REF-2025-002',
      'Notes': 'Annual subscription renewal',
      'Client': 'N/A',
      'Project': 'N/A'
    }
  ];

  try {
    // Create workbook and worksheet
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(sampleData);

    // Set column widths
    const colWidths = [
      { wch: 15 }, // Transaction ID
      { wch: 12 }, // Date
      { wch: 10 }, // Type
      { wch: 15 }, // Category
      { wch: 25 }, // Description
      { wch: 12 }, // Amount
      { wch: 12 }, // Status
      { wch: 15 }, // Payment Method
      { wch: 15 }, // Reference Number
      { wch: 20 }, // Notes
      { wch: 15 }, // Client
      { wch: 20 }  // Project
    ];
    ws['!cols'] = colWidths;

    // Add worksheet to workbook
    XLSX.utils.book_append_sheet(wb, ws, 'Transactions');

    // Add summary sheet
    const summaryData = [
      { 'Metric': 'Total Income', 'Value': 2500.00 },
      { 'Metric': 'Total Expenses', 'Value': 150.00 },
      { 'Metric': 'Net Profit', 'Value': 2350.00 },
      { 'Metric': 'Total Transactions', 'Value': 2 },
      { 'Metric': 'Export Date', 'Value': new Date().toLocaleDateString() }
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    summaryWs['!cols'] = [{ wch: 20 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(wb, summaryWs, 'Summary');

    // Generate filename with current date
    const filename = `test-finance-data-${new Date().toISOString().split('T')[0]}.xlsx`;

    // Save file
    XLSX.writeFile(wb, filename);

    console.log('✅ Excel export test successful!');
    console.log(`📁 File saved as: ${filename}`);
    console.log('📊 Contains 2 sheets: Transactions and Summary');
    
    return true;
  } catch (error) {
    console.error('❌ Excel export test failed:', error.message);
    return false;
  }
}

// Run the test
testExcelExport();

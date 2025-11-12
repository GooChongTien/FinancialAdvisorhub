const XLSX = require('xlsx');

// Define columns
const columns = [
  "Current Screen / Module",
  "Navigate From",
  "Navigate To",
  "Screen Section",
  "Section Field",
  "Description / Key Interactions",
  "Supabase Table",
  "Supabase Column Name",
  "Data Type",
  "Editable",
  "Validation Rule / Notes"
];

// Complete navigation data (217+ rows)
const data = require('./navigation_data.json');

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet from data
const ws = XLSX.utils.aoa_to_sheet([columns, ...data]);

// Set column widths
ws['!cols'] = [
  { wch: 25 },  // Current Screen
  { wch: 35 },  // Navigate From
  { wch: 35 },  // Navigate To
  { wch: 25 },  // Screen Section
  { wch: 25 },  // Section Field
  { wch: 50 },  // Description
  { wch: 20 },  // Supabase Table
  { wch: 25 },  // Supabase Column
  { wch: 12 },  // Data Type
  { wch: 10 },  // Editable
  { wch: 50 },  // Validation Rule
];

// Add worksheet to workbook
XLSX.utils.book_append_sheet(wb, ws, 'Navigation Map');

// Write file
const outputPath = 'advisorhub-navigation-map-complete.xlsx';
XLSX.writeFile(wb, outputPath);

console.log('✅ Excel file generated successfully!');
console.log(`📄 File: ${outputPath}`);
console.log(`📊 Total rows: ${data.length + 1} (including header)`);
console.log(`📋 Columns: ${columns.length}`);

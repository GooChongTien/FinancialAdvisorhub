const XLSX = require('xlsx');
const fs = require('fs');

console.log('🚀 Starting Excel generation...\n');

// Read the markdown file to extract data
const markdownPath = './advisorhub-navigation-data-map-v2.md';
let mdContent = '';

try {
  mdContent = fs.readFileSync(markdownPath, 'utf8');
} catch (err) {
  console.error('❌ Error reading markdown file:', err.message);
  process.exit(1);
}

// Parse markdown table
const lines = mdContent.split('\n');
const tableStart = lines.findIndex(line => line.includes('| Current Screen / Module |'));

if (tableStart === -1) {
  console.error('❌ Could not find table in markdown');
  process.exit(1);
}

const tableLines = [];
for (let i = tableStart; i < lines.length; i++) {
  const line = lines[i].trim();
  if (line.startsWith('|') && !line.includes('---')) {
    tableLines.push(line);
  }
  if (line.startsWith('---') && tableLines.length > 0) {
    break;
  }
}

console.log(`📊 Found ${tableLines.length} table rows`);

// Convert to array format
const data = tableLines.map(line => {
  const cells = line.split('|').slice(1, -1).map(cell => cell.trim());
  return cells;
});

if (data.length === 0) {
  console.error('❌ No data extracted from table');
  process.exit(1);
}

// Create workbook
const wb = XLSX.utils.book_new();

// Create worksheet from data
const ws = XLSX.utils.aoa_to_sheet(data);

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

// Write file with NEW name to avoid locking issues
const outputPath = 'advisorhub-navigation-map.xlsx';
XLSX.writeFile(wb, outputPath);

console.log('\n✅ Excel file generated successfully!');
console.log(`📄 File: ${outputPath}`);
console.log(`📊 Total rows: ${data.length} (including header)`);
console.log(`📋 Columns: ${data[0].length}`);
console.log(`💾 File size: ${fs.statSync(outputPath).size} bytes`);
console.log(`\n💡 Tip: Close any existing Excel files before generating to avoid lock issues.`);

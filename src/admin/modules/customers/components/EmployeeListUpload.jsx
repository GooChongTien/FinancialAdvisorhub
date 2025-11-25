import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/admin/components/ui/button';
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function parseCSV(text) {
  const lines = text.trim().split('\n');
  if (lines.length === 0) return { headers: [], rows: [], skippedRows: 0 };

  const headers = lines[0].split(',').map(h => h.trim());
  let skippedRows = 0;

  const rows = lines.slice(1)
    .map(line => {
      const values = line.split(',').map(v => v.trim());
      const row = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      return row;
    })
    .filter(row => {
      // Filter out completely empty rows
      const isNotEmpty = Object.values(row).some(value => value !== '');
      if (!isNotEmpty) {
        skippedRows++;
      }
      return isNotEmpty;
    });

  return { headers, rows, skippedRows };
}

function formatFileSize(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

function validateData(headers, rows, requiredColumns = [], skippedRows = 0) {
  const errors = [];
  const warnings = [];

  // Check for required columns
  requiredColumns.forEach(col => {
    if (!headers.includes(col)) {
      errors.push(`Missing required column: ${col}`);
    }
  });

  // Add warning for skipped rows
  if (skippedRows > 0) {
    warnings.push(`${skippedRows} empty row${skippedRows > 1 ? 's' : ''} skipped`);
  }

  return { errors, warnings };
}

export function EmployeeListUpload({
  onUpload,
  onCancel,
  requiredColumns = [],
}) {
  const { t } = useTranslation();
  const [file, setFile] = useState(null);
  const [parsedData, setParsedData] = useState(null);
  const [validation, setValidation] = useState({ errors: [], warnings: [] });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  const acceptedTypes = ['.csv', 'text/csv', 'application/vnd.ms-excel'];

  const handleFileSelect = (selectedFile) => {
    // Validate file type
    const isValidType = selectedFile.name.endsWith('.csv') ||
                       selectedFile.type === 'text/csv' ||
                       selectedFile.type === 'application/vnd.ms-excel';

    if (!isValidType) {
      setValidation({
        errors: ['Invalid file type. Only CSV files are accepted.'],
        warnings: []
      });
      setFile(null);
      setParsedData(null);
      return;
    }

    setFile(selectedFile);

    // Parse the file
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target.result;
      const { headers, rows, skippedRows } = parseCSV(text);
      const validationResult = validateData(headers, rows, requiredColumns, skippedRows);

      setParsedData({ headers, rows });
      setValidation(validationResult);
    };
    reader.readAsText(selectedFile);
  };

  const handleFileInputChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileSelect(selectedFile);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      handleFileSelect(droppedFile);
    }
  };

  const handleRemoveFile = () => {
    setFile(null);
    setParsedData(null);
    setValidation({ errors: [], warnings: [] });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleUpload = () => {
    if (parsedData && validation.errors.length === 0) {
      onUpload(parsedData.rows);
    }
  };

  const isValid = parsedData && validation.errors.length === 0;
  const hasErrors = validation.errors.length > 0;

  return (
    <div className="space-y-6">
      {!file ? (
        <>
          {/* Upload Area */}
          <div
            className={cn(
              'border-2 border-dashed rounded-lg p-12 text-center transition-colors',
              isDragging
                ? 'border-primary-500 bg-primary-50'
                : 'border-slate-300 bg-slate-50 hover:border-slate-400'
            )}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className="h-12 w-12 mx-auto mb-4 text-slate-400" />
            <p className="text-lg font-medium text-slate-700 mb-2">
              {t('common.dropFileHere')}
            </p>
            <p className="text-sm text-slate-500 mb-4">
              {t('common.or')} <label
                htmlFor="file-upload"
                className="text-primary-600 hover:text-primary-700 cursor-pointer font-medium"
              >
                {t('common.chooseFile')}
              </label>
            </p>
            <p className="text-xs text-slate-400">
              Accepted formats: CSV, Excel (XLSX)
            </p>
            <input
              id="file-upload"
              ref={fileInputRef}
              type="file"
              accept={acceptedTypes.join(',')}
              onChange={handleFileInputChange}
              className="hidden"
              aria-label={t('common.chooseFile')}
            />
          </div>

          {/* Show validation errors when no file but there are errors */}
          {hasErrors && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-2">{t('common.validationErrors')}</p>
                  <ul className="space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        /* File Preview */
        <div className="space-y-4">
          {/* File Info */}
          <div className="flex items-center justify-between p-4 border border-slate-200 rounded-lg bg-white">
            <div className="flex items-center gap-3 flex-1">
              <FileText className="h-8 w-8 text-primary-600" />
              <div className="flex-1">
                <p className="font-medium text-slate-900">{file.name}</p>
                <p className="text-sm text-slate-500">{formatFileSize(file.size)}</p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRemoveFile}
              aria-label="Remove file"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Validation Messages */}
          {hasErrors && (
            <div className="p-4 border border-red-200 rounded-lg bg-red-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-red-900 mb-2">{t('common.validationErrors')}</p>
                  <ul className="space-y-1">
                    {validation.errors.map((error, index) => (
                      <li key={index} className="text-sm text-red-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {isValid && (
            <div className="p-4 border border-green-200 rounded-lg bg-green-50">
              <div className="flex items-center gap-3">
                <CheckCircle2 className="h-5 w-5 text-green-600" />
                <p className="text-sm text-green-900">
                  File is valid and ready to upload
                </p>
              </div>
            </div>
          )}

          {validation.warnings.length > 0 && (
            <div className="p-4 border border-yellow-200 rounded-lg bg-yellow-50">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-600 mt-0.5" />
                <div className="flex-1">
                  <p className="font-medium text-yellow-900 mb-2">{t('common.warnings')}</p>
                  <ul className="space-y-1">
                    {validation.warnings.map((warning, index) => (
                      <li key={index} className="text-sm text-yellow-700">
                        {warning}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Data Preview */}
          {parsedData && (
            <div className="border border-slate-200 rounded-lg overflow-hidden bg-white">
              <div className="p-4 bg-slate-50 border-b border-slate-200">
                <p className="text-sm font-medium text-slate-700">
                  {t('common.preview')}: {parsedData.rows.length} employees
                </p>
              </div>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50 border-b border-slate-200 sticky top-0">
                    <tr>
                      {parsedData.headers.map((header, index) => (
                        <th
                          key={index}
                          className="px-4 py-3 text-left font-semibold text-slate-700"
                        >
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {parsedData.rows.map((row, rowIndex) => (
                      <tr
                        key={rowIndex}
                        className="border-b border-slate-100 hover:bg-slate-50"
                      >
                        {parsedData.headers.map((header, colIndex) => (
                          <td key={colIndex} className="px-4 py-3 text-slate-900">
                            {row[header]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-3 pt-4">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
        >
          {t('common.cancel')}
        </Button>
        {file && (
          <Button
            type="button"
            onClick={handleUpload}
            disabled={!isValid}
          >
            <Upload className="h-4 w-4 mr-2" />
            {t('common.upload')}
          </Button>
        )}
      </div>
    </div>
  );
}

export default EmployeeListUpload;

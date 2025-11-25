import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmployeeListUpload } from '@/admin/modules/customers/components/EmployeeListUpload';
import '@/lib/i18n/config'; // Initialize i18n

describe('EmployeeListUpload', () => {
  let mockOnUpload;
  let mockOnCancel;

  beforeEach(() => {
    mockOnUpload = vi.fn();
    mockOnCancel = vi.fn();
  });

  describe('Initial State', () => {
    it('should render upload area when no file is selected', () => {
      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      // Should show upload UI
      expect(screen.getByText('Drop file here')).toBeInTheDocument();
    });

    it('should show accepted file types', () => {
      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      // Should indicate accepted formats
      expect(screen.getByText(/csv|excel|xlsx/i)).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('File Selection', () => {
    it('should allow file selection via file input', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const file = new File(['name,age,department\nJohn,30,IT'], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Should show file name after selection
      await waitFor(() => {
        expect(screen.getByText(/employees\.csv/i)).toBeInTheDocument();
      });
    });

    it('should reject invalid file types', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const input = screen.getByLabelText('choose file', { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Should not show file preview (file rejected)
      await waitFor(() => {
        expect(screen.queryByText('document.pdf')).not.toBeInTheDocument();
        expect(screen.getByText('Drop file here')).toBeInTheDocument();
      });
    });

    it('should show file size in preview', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const file = new File(['name,age,department\nJohn,30,IT'], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Should display file size
      await waitFor(() => {
        expect(screen.getByText(/\d+\s*(KB|MB|bytes)/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Preview', () => {
    it('should parse and display CSV preview', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const csvContent = 'name,age,department\nJohn Doe,30,IT\nJane Smith,25,HR';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Should show preview table with data
      await waitFor(() => {
        expect(screen.getByText(/john doe/i)).toBeInTheDocument();
        expect(screen.getByText(/jane smith/i)).toBeInTheDocument();
      });
    });

    it('should show column headers from CSV', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const csvContent = 'name,age,department\nJohn Doe,30,IT';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Should show column headers
      await waitFor(() => {
        expect(screen.getByText(/^name$/i)).toBeInTheDocument();
        expect(screen.getByText(/^age$/i)).toBeInTheDocument();
        expect(screen.getByText(/^department$/i)).toBeInTheDocument();
      });
    });

    it('should show row count in preview', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const csvContent = 'name,age,department\nJohn Doe,30,IT\nJane Smith,25,HR\nBob Johnson,35,Finance';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Should show total rows/employees count
      await waitFor(() => {
        expect(screen.getByText(/3.*employees|3.*rows/i)).toBeInTheDocument();
      });
    });
  });

  describe('Data Validation', () => {
    it('should validate required columns are present', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
          requiredColumns={['name', 'age']}
        />
      );

      const csvContent = 'name,department\nJohn Doe,IT';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Should show validation error for missing column
      await waitFor(() => {
        expect(screen.getByText(/missing.*required.*column.*age/i)).toBeInTheDocument();
      });
    });

    it('should detect empty rows and show warning', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const csvContent = 'name,age,department\nJohn Doe,30,IT\n,,\nJane Smith,25,HR';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Should show warning about empty rows
      await waitFor(() => {
        expect(screen.getByText(/empty.*rows?|skipped.*rows?/i)).toBeInTheDocument();
      });
    });

    it('should show validation success when data is valid', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const csvContent = 'name,age,department\nJohn Doe,30,IT\nJane Smith,25,HR';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Should show success indicator
      await waitFor(() => {
        expect(screen.getByText(/ready.*upload|valid|success/i)).toBeInTheDocument();
      });
    });
  });

  describe('File Upload', () => {
    it('should enable upload button when file is valid', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const csvContent = 'name,age,department\nJohn Doe,30,IT';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Upload button should be enabled
      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
        expect(uploadButton).toBeEnabled();
      });
    });

    it('should disable upload button when file has errors', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
          requiredColumns={['name', 'email']}
        />
      );

      const csvContent = 'name,age\nJohn Doe,30';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      // Upload button should be disabled due to validation error
      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
        expect(uploadButton).toBeDisabled();
      });
    });

    it('should call onUpload with parsed data when upload is clicked', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const csvContent = 'name,age,department\nJohn Doe,30,IT\nJane Smith,25,HR';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      await waitFor(() => {
        const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
        expect(uploadButton).toBeEnabled();
      });

      const uploadButton = screen.getByRole('button', { name: /upload|submit/i });
      await user.click(uploadButton);

      // Should call onUpload with parsed employee data
      expect(mockOnUpload).toHaveBeenCalledWith(
        expect.arrayContaining([
          expect.objectContaining({ name: 'John Doe', age: '30', department: 'IT' }),
          expect.objectContaining({ name: 'Jane Smith', age: '25', department: 'HR' })
        ])
      );
    });
  });

  describe('File Actions', () => {
    it('should allow removing selected file', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const csvContent = 'name,age,department\nJohn Doe,30,IT';
      const file = new File([csvContent], 'employees.csv', { type: 'text/csv' });
      const input = screen.getByLabelText(/choose file|upload/i, { selector: 'input[type="file"]' });

      await user.upload(input, file);

      await waitFor(() => {
        expect(screen.getByText(/employees\.csv/i)).toBeInTheDocument();
      });

      // Click remove/clear button
      const removeButton = screen.getByRole('button', { name: /remove|clear|delete/i });
      await user.click(removeButton);

      // Should return to initial upload state
      await waitFor(() => {
        expect(screen.getByText('Drop file here')).toBeInTheDocument();
        expect(screen.queryByText(/employees\.csv/i)).not.toBeInTheDocument();
      });
    });

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnUpload).not.toHaveBeenCalled();
    });
  });

  describe('Internationalization', () => {
    it('should render labels using i18n', () => {
      render(
        <EmployeeListUpload
          onUpload={mockOnUpload}
          onCancel={mockOnCancel}
        />
      );

      // Check for English labels (i18n loaded)
      const container = screen.getByRole('button', { name: /cancel/i }).closest('div');
      expect(container).toBeInTheDocument();
    });
  });
});

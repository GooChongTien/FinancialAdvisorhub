import { describe, it, expect, vi, beforeEach } from 'vitest';

// Allow extra time for the heavy form interactions when the full suite runs.
vi.setConfig({ testTimeout: 15000 });
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { KeymanDetailsForm } from '@/admin/modules/customers/components/KeymanDetailsForm';
import '@/lib/i18n/config'; // Initialize i18n

describe('KeymanDetailsForm', () => {
  let mockOnSubmit;
  let mockOnCancel;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    mockOnCancel = vi.fn();
  });

  describe('Form Fields', () => {
    it('should render all required keyman fields', () => {
      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verify all keyman-specific fields
      expect(screen.getByLabelText(/keyman name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/position.*title/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/date of birth/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/annual salary/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/coverage amount/i)).toBeInTheDocument();
    });

    it('should render optional fields', () => {
      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Optional fields
      expect(screen.getByLabelText(/role.*business/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/medical.*health/i)).toBeInTheDocument();
    });

    it('should accept text input for keyman name', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const nameField = screen.getByLabelText(/keyman name/i);
      await user.type(nameField, 'John Tan');

      expect(nameField).toHaveValue('John Tan');
    });

    it('should accept text input for position', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const positionField = screen.getByLabelText(/position.*title/i);
      await user.type(positionField, 'Chief Technology Officer');

      expect(positionField).toHaveValue('Chief Technology Officer');
    });

    it('should accept date input for date of birth', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const dobField = screen.getByLabelText(/date of birth/i);
      await user.type(dobField, '1980-05-15');

      expect(dobField).toHaveValue('1980-05-15');
    });

    it('should accept numeric input for annual salary', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const salaryField = screen.getByLabelText(/annual salary/i);
      await user.type(salaryField, '250000');

      expect(salaryField).toHaveValue(250000);
    });

    it('should accept numeric input for coverage amount', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const coverageField = screen.getByLabelText(/coverage amount/i);
      await user.type(coverageField, '5000000');

      expect(coverageField).toHaveValue(5000000);
    });
  });

  describe('Form Submission', () => {
    it('should submit keyman data correctly with all required fields', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in required fields
      await user.type(screen.getByLabelText(/keyman name/i), 'John Tan');
      await user.type(screen.getByLabelText(/position.*title/i), 'CTO');
      await user.type(screen.getByLabelText(/date of birth/i), '1980-05-15');
      await user.type(screen.getByLabelText(/annual salary/i), '250000');
      await user.type(screen.getByLabelText(/coverage amount/i), '5000000');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save|add/i });
      await user.click(submitButton);

      // Verify onSubmit was called with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            keyman_name: 'John Tan',
            position: 'CTO',
            date_of_birth: '1980-05-15',
            annual_salary: 250000,
            coverage_amount: 5000000
          })
        );
      });
    });

    it('should submit with optional fields included', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in all fields including optional
      await user.type(screen.getByLabelText(/keyman name/i), 'Jane Lim');
      await user.type(screen.getByLabelText(/position.*title/i), 'CEO');
      await user.type(screen.getByLabelText(/date of birth/i), '1975-10-20');
      await user.type(screen.getByLabelText(/annual salary/i), '500000');
      await user.type(screen.getByLabelText(/coverage amount/i), '10000000');
      await user.type(screen.getByLabelText(/role.*business/i), 'Founder and strategic decision maker');
      await user.type(screen.getByLabelText(/medical.*health/i), 'Excellent health, no pre-existing conditions');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save|add/i });
      await user.click(submitButton);

      // Verify onSubmit was called with all data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            keyman_name: 'Jane Lim',
            position: 'CEO',
            date_of_birth: '1975-10-20',
            annual_salary: 500000,
            coverage_amount: 10000000,
            role_in_business: 'Founder and strategic decision maker',
            medical_notes: 'Excellent health, no pre-existing conditions'
          })
        );
      });
    });
  });

  describe('Form Validation', () => {
    it('should require keyman name', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Try to submit without name
      const submitButton = screen.getByRole('button', { name: /save|add/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/keyman name.*required/i)).toBeInTheDocument();
      });

      // onSubmit should not be called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require position', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill name but not position
      await user.type(screen.getByLabelText(/keyman name/i), 'Test Name');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /save|add/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/position.*required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require date of birth', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill other fields but not DOB
      await user.type(screen.getByLabelText(/keyman name/i), 'Test Name');
      await user.type(screen.getByLabelText(/position.*title/i), 'Manager');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /save|add/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/date of birth.*required/i)).toBeInTheDocument();
      });
    });

    it('should validate date of birth is not in future', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill fields
      await user.type(screen.getByLabelText(/keyman name/i), 'Test Name');
      await user.type(screen.getByLabelText(/position.*title/i), 'Manager');

      // Enter future date
      const futureDate = new Date();
      futureDate.setFullYear(futureDate.getFullYear() + 1);
      const futureDateStr = futureDate.toISOString().split('T')[0];
      await user.type(screen.getByLabelText(/date of birth/i), futureDateStr);

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /save|add/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/date of birth.*cannot be.*future/i)).toBeInTheDocument();
      });
    });

    it('should require coverage amount', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill other fields but not coverage
      await user.type(screen.getByLabelText(/keyman name/i), 'Test Name');
      await user.type(screen.getByLabelText(/position.*title/i), 'Manager');
      await user.type(screen.getByLabelText(/date of birth/i), '1980-01-01');
      await user.type(screen.getByLabelText(/annual salary/i), '100000');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /save|add/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/coverage amount.*required/i)).toBeInTheDocument();
      });
    });

    it('should validate coverage amount is positive', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill fields with negative coverage
      await user.type(screen.getByLabelText(/keyman name/i), 'Test Name');
      await user.type(screen.getByLabelText(/position.*title/i), 'Manager');
      await user.type(screen.getByLabelText(/date of birth/i), '1980-01-01');
      await user.type(screen.getByLabelText(/coverage amount/i), '-100');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /save|add/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/coverage amount.*must be positive/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Actions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const cancelButton = screen.getByRole('button', { name: /cancel/i });
      await user.click(cancelButton);

      expect(mockOnCancel).toHaveBeenCalled();
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should populate form with initial data when editing', () => {
      const initialData = {
        keyman_name: 'Existing Keyman',
        position: 'CFO',
        date_of_birth: '1978-03-12',
        annual_salary: 300000,
        coverage_amount: 8000000,
        role_in_business: 'Financial strategy and planning',
        medical_notes: 'Good health'
      };

      render(
        <KeymanDetailsForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verify fields are populated
      expect(screen.getByLabelText(/keyman name/i)).toHaveValue('Existing Keyman');
      expect(screen.getByLabelText(/position.*title/i)).toHaveValue('CFO');
      expect(screen.getByLabelText(/date of birth/i)).toHaveValue('1978-03-12');
      expect(screen.getByLabelText(/annual salary/i)).toHaveValue(300000);
      expect(screen.getByLabelText(/coverage amount/i)).toHaveValue(8000000);
      expect(screen.getByLabelText(/role.*business/i)).toHaveValue('Financial strategy and planning');
      expect(screen.getByLabelText(/medical.*health/i)).toHaveValue('Good health');
    });
  });

  describe('Internationalization', () => {
    it('should render field labels using i18n', () => {
      render(
        <KeymanDetailsForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verify i18n translations are loaded (labels should be in English)
      expect(screen.getByText(/keyman name/i)).toBeInTheDocument();
      expect(screen.getByText(/position.*title/i)).toBeInTheDocument();
    });
  });
});

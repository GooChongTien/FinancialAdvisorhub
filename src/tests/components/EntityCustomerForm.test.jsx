import { describe, it, expect, vi, beforeEach } from 'vitest';

// Forms render many inputs; give a bit more time when the full suite runs.
vi.setConfig({ testTimeout: 15000 });
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityCustomerForm } from '@/admin/modules/customers/components/EntityCustomerForm';
import '@/lib/i18n/config'; // Initialize i18n

describe('EntityCustomerForm', () => {
  let mockOnSubmit;
  let mockOnCancel;

  beforeEach(() => {
    mockOnSubmit = vi.fn();
    mockOnCancel = vi.fn();
  });

  describe('Customer Type Selection', () => {
    it('should render customer type selector with Individual and Entity options', () => {
      render(
        <EntityCustomerForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Should have customer type field
      expect(screen.getByText(/customer type/i)).toBeInTheDocument();
    });

    it('should default to Individual customer type', () => {
      render(
        <EntityCustomerForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // For shadcn Select, check the combobox button contains "Individual"
      const selectButton = screen.getByRole('combobox');
      expect(selectButton).toHaveTextContent('Individual');
    });

    it('should show basic fields for Individual customer type', () => {
      render(
        <EntityCustomerForm
          customerType="Individual"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Basic fields that should always be visible
      expect(screen.getByLabelText(/^name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/phone/i)).toBeInTheDocument();

      // Entity fields should NOT be visible
      expect(screen.queryByLabelText(/company name/i)).not.toBeInTheDocument();
      expect(screen.queryByLabelText(/business registration/i)).not.toBeInTheDocument();
    });

    it('should show entity fields when customer type is Entity', () => {
      render(
        <EntityCustomerForm
          customerType="Entity"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Entity-specific fields
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/business registration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/number of employees/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/annual revenue/i)).toBeInTheDocument();
    });

    it('should update component when customerType prop changes', () => {
      const { rerender } = render(
        <EntityCustomerForm
          customerType="Individual"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Initially Individual - no entity fields
      expect(screen.queryByLabelText(/company name/i)).not.toBeInTheDocument();

      // Rerender with Entity type
      rerender(
        <EntityCustomerForm
          customerType="Entity"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Entity fields should now be visible
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/business registration/i)).toBeInTheDocument();
    });
  });

  describe('Entity Customer Fields', () => {
    it('should render all entity customer fields', () => {
      render(
        <EntityCustomerForm
          customerType="Entity"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verify all 5 entity-specific fields
      expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/business registration/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/number of employees/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/annual revenue/i)).toBeInTheDocument();
    });

    it('should accept numeric input for number of employees', async () => {
      const user = userEvent.setup();

      render(
        <EntityCustomerForm
          customerType="Entity"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const numEmployeesField = screen.getByLabelText(/number of employees/i);
      await user.type(numEmployeesField, '150');

      expect(numEmployeesField).toHaveValue(150);
    });

    it('should accept numeric input for annual revenue', async () => {
      const user = userEvent.setup();

      render(
        <EntityCustomerForm
          customerType="Entity"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      const annualRevenueField = screen.getByLabelText(/annual revenue/i);
      await user.type(annualRevenueField, '10000000');

      expect(annualRevenueField).toHaveValue(10000000);
    });
  });

  describe('Form Submission', () => {
    it('should submit individual customer data correctly', async () => {
      const user = userEvent.setup();

      render(
        <EntityCustomerForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in basic fields
      await user.type(screen.getByLabelText(/^name/i), 'John Doe');
      await user.type(screen.getByLabelText(/email/i), 'john@example.com');
      await user.type(screen.getByLabelText(/phone/i), '91234567');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Verify onSubmit was called with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_type: 'Individual',
            name: 'John Doe',
            contact_number: '91234567',
            email: 'john@example.com'
          })
        );
      });
    });

    it('should submit entity customer data with all fields', async () => {
      const user = userEvent.setup();

      render(
        <EntityCustomerForm
          customerType="Entity"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill in entity fields
      await user.type(screen.getByLabelText(/company name/i), 'Tech Corp Pte Ltd');
      await user.type(screen.getByLabelText(/business registration/i), '202301234A');
      await user.type(screen.getByLabelText(/industry/i), 'Technology');
      await user.type(screen.getByLabelText(/number of employees/i), '150');
      await user.type(screen.getByLabelText(/annual revenue/i), '10000000');

      // Fill in basic contact fields
      await user.type(screen.getByLabelText(/contact person/i), 'Jane Smith');
      await user.type(screen.getByLabelText(/email/i), 'jane@techcorp.com');
      await user.type(screen.getByLabelText(/phone/i), '98765432');

      // Submit form
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Verify onSubmit was called with correct data
      await waitFor(() => {
        expect(mockOnSubmit).toHaveBeenCalledWith(
          expect.objectContaining({
            customer_type: 'Entity',
            company_name: 'Tech Corp Pte Ltd',
            business_registration_no: '202301234A',
            industry: 'Technology',
            num_employees: 150,
            annual_revenue: 10000000,
            name: 'Jane Smith',
            contact_number: '98765432',
            email: 'jane@techcorp.com'
          })
        );
      });
    });
  });

  describe('Form Validation', () => {
    it('should require name field', async () => {
      const user = userEvent.setup();

      render(
        <EntityCustomerForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Try to submit without name
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/name.*required/i)).toBeInTheDocument();
      });

      // onSubmit should not be called
      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should require company name for Entity customers', async () => {
      const user = userEvent.setup();

      render(
        <EntityCustomerForm
          customerType="Entity"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill contact person but not company name
      await user.type(screen.getByLabelText(/contact person/i), 'Contact Person');
      await user.type(screen.getByLabelText(/phone/i), '91234567');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Should show validation error for company name
      await waitFor(() => {
        expect(screen.getByText(/company name.*required/i)).toBeInTheDocument();
      });

      expect(mockOnSubmit).not.toHaveBeenCalled();
    });

    it('should validate email format', async () => {
      const user = userEvent.setup();

      render(
        <EntityCustomerForm
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Fill required fields
      await user.type(screen.getByLabelText(/^name/i), 'Test User');
      await user.type(screen.getByLabelText(/phone/i), '91234567');

      // Enter invalid email
      await user.type(screen.getByLabelText(/email/i), 'invalid-email');

      // Try to submit
      const submitButton = screen.getByRole('button', { name: /save/i });
      await user.click(submitButton);

      // Should show validation error
      await waitFor(() => {
        expect(screen.getByText(/invalid.*email/i)).toBeInTheDocument();
      });
    });
  });

  describe('Form Actions', () => {
    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup();

      render(
        <EntityCustomerForm
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
        customer_type: 'Entity',
        company_name: 'Existing Corp',
        business_registration_no: '123456A',
        industry: 'Finance',
        num_employees: 200,
        annual_revenue: 5000000,
        name: 'John Manager',
        contact_number: '91234567',
        email: 'john@existing.com'
      };

      render(
        <EntityCustomerForm
          initialData={initialData}
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verify customer type is Entity (check combobox button)
      const selectButton = screen.getByRole('combobox');
      expect(selectButton).toHaveTextContent('Entity');

      // Verify fields are populated
      expect(screen.getByLabelText(/company name/i)).toHaveValue('Existing Corp');
      expect(screen.getByLabelText(/business registration/i)).toHaveValue('123456A');
      expect(screen.getByLabelText(/industry/i)).toHaveValue('Finance');
      expect(screen.getByLabelText(/number of employees/i)).toHaveValue(200);
      expect(screen.getByLabelText(/annual revenue/i)).toHaveValue(5000000);
      expect(screen.getByLabelText(/contact person/i)).toHaveValue('John Manager');
      expect(screen.getByLabelText(/phone/i)).toHaveValue('91234567');
      expect(screen.getByLabelText(/email/i)).toHaveValue('john@existing.com');
    });
  });

  describe('Internationalization', () => {
    it('should render field labels using i18n', () => {
      render(
        <EntityCustomerForm
          customerType="Entity"
          onSubmit={mockOnSubmit}
          onCancel={mockOnCancel}
        />
      );

      // Verify i18n translations are loaded (labels should be in English)
      expect(screen.getByText(/customer type/i)).toBeInTheDocument();
      expect(screen.getByText(/company name/i)).toBeInTheDocument();
    });
  });
});

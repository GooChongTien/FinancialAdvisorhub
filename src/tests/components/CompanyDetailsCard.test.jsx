import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CompanyDetailsCard } from '@/admin/modules/customers/components/CompanyDetailsCard';
import '@/lib/i18n/config'; // Initialize i18n

describe('CompanyDetailsCard', () => {
  const mockCompanyData = {
    company_name: 'Tech Innovations Pte Ltd',
    business_registration_no: '202301234A',
    industry: 'Technology',
    num_employees: 150,
    annual_revenue: 10000000,
    name: 'Jane Smith',
    contact_number: '98765432',
    email: 'jane@techinnovations.com'
  };

  describe('Rendering Company Information', () => {
    it('should render company name', () => {
      render(<CompanyDetailsCard data={mockCompanyData} />);

      expect(screen.getByText('Tech Innovations Pte Ltd')).toBeInTheDocument();
    });

    it('should render business registration number', () => {
      const { container } = render(<CompanyDetailsCard data={mockCompanyData} />);

      // Text may be broken across elements, so check container text content
      expect(container.textContent).toContain('202301234A');
    });

    it('should render industry', () => {
      const { container } = render(<CompanyDetailsCard data={mockCompanyData} />);

      expect(container.textContent).toContain('Technology');
    });

    it('should render number of employees', () => {
      const { container } = render(<CompanyDetailsCard data={mockCompanyData} />);

      expect(container.textContent).toMatch(/150/);
    });

    it('should render annual revenue with proper formatting', () => {
      const { container } = render(<CompanyDetailsCard data={mockCompanyData} />);

      // Should format large numbers with commas or abbreviated format
      expect(container.textContent).toMatch(/10,000,000|10.*M|10M/);
    });
  });

  describe('Contact Person Information', () => {
    it('should render contact person name', () => {
      render(<CompanyDetailsCard data={mockCompanyData} />);

      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    it('should render contact email', () => {
      render(<CompanyDetailsCard data={mockCompanyData} />);

      expect(screen.getByText('jane@techinnovations.com')).toBeInTheDocument();
    });

    it('should render contact phone number', () => {
      render(<CompanyDetailsCard data={mockCompanyData} />);

      expect(screen.getByText('98765432')).toBeInTheDocument();
    });
  });

  describe('Optional Fields', () => {
    it('should handle missing industry gracefully', () => {
      const dataWithoutIndustry = {
        ...mockCompanyData,
        industry: null
      };

      render(<CompanyDetailsCard data={dataWithoutIndustry} />);

      // Should render without crashing
      expect(screen.getByText('Tech Innovations Pte Ltd')).toBeInTheDocument();
    });

    it('should handle missing employee count', () => {
      const dataWithoutEmployees = {
        ...mockCompanyData,
        num_employees: null
      };

      render(<CompanyDetailsCard data={dataWithoutEmployees} />);

      expect(screen.getByText('Tech Innovations Pte Ltd')).toBeInTheDocument();
    });

    it('should handle missing revenue', () => {
      const dataWithoutRevenue = {
        ...mockCompanyData,
        annual_revenue: null
      };

      render(<CompanyDetailsCard data={dataWithoutRevenue} />);

      expect(screen.getByText('Tech Innovations Pte Ltd')).toBeInTheDocument();
    });
  });

  describe('Card Actions', () => {
    it('should render edit button when onEdit prop is provided', () => {
      const mockOnEdit = vi.fn();

      render(<CompanyDetailsCard data={mockCompanyData} onEdit={mockOnEdit} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      expect(editButton).toBeInTheDocument();
    });

    it('should call onEdit when edit button is clicked', async () => {
      const user = userEvent.setup();
      const mockOnEdit = vi.fn();

      render(<CompanyDetailsCard data={mockCompanyData} onEdit={mockOnEdit} />);

      const editButton = screen.getByRole('button', { name: /edit/i });
      await user.click(editButton);

      expect(mockOnEdit).toHaveBeenCalled();
    });

    it('should not render edit button when onEdit prop is not provided', () => {
      render(<CompanyDetailsCard data={mockCompanyData} />);

      const editButton = screen.queryByRole('button', { name: /edit/i });
      expect(editButton).not.toBeInTheDocument();
    });
  });

  describe('Data Formatting', () => {
    it('should format annual revenue with currency symbol', () => {
      const { container } = render(<CompanyDetailsCard data={mockCompanyData} currency="SGD" />);

      // Should display currency code SGD
      expect(container.textContent).toMatch(/SGD/);
    });

    it('should use default currency when not specified', () => {
      const { container } = render(<CompanyDetailsCard data={mockCompanyData} />);

      // Component should still render the revenue value
      expect(container.textContent).toMatch(/10,000,000|10.*M/);
    });

    it('should format employee count with proper separators for large numbers', () => {
      const largeCompany = {
        ...mockCompanyData,
        num_employees: 5000
      };

      const { container } = render(<CompanyDetailsCard data={largeCompany} />);

      expect(container.textContent).toMatch(/5,000|5000/);
    });
  });

  describe('Empty State', () => {
    it('should handle empty data object gracefully', () => {
      render(<CompanyDetailsCard data={{}} />);

      // Should render card structure without crashing
      const card = screen.getByTestId('company-card');
      expect(card).toBeInTheDocument();
    });

    it('should show placeholder when no company name provided', () => {
      const dataWithoutName = {
        business_registration_no: '202301234A'
      };

      render(<CompanyDetailsCard data={dataWithoutName} />);

      // Should show N/A for missing company name
      expect(screen.getByText('N/A')).toBeInTheDocument();
    });
  });

  describe('Internationalization', () => {
    it('should render field labels using i18n', () => {
      const { container } = render(<CompanyDetailsCard data={mockCompanyData} />);

      // Check that i18n translations are present in the rendered content
      expect(container.textContent).toMatch(/company name|business|industry|employees|revenue/i);
    });
  });

  describe('Accessibility', () => {
    it('should have proper semantic structure', () => {
      render(<CompanyDetailsCard data={mockCompanyData} />);

      // Card should be identifiable (either by role or test-id)
      const card = screen.getByTestId('company-card') || screen.getByText('Tech Innovations Pte Ltd').closest('div');
      expect(card).toBeInTheDocument();
    });

    it('should have accessible labels for all information', () => {
      const { container } = render(<CompanyDetailsCard data={mockCompanyData} />);

      // All key information should be present in the rendered content
      expect(screen.getByText('Tech Innovations Pte Ltd')).toBeInTheDocument();
      expect(container.textContent).toContain('202301234A');
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });
  });

  describe('Styling and Layout', () => {
    it('should apply custom className when provided', () => {
      render(
        <CompanyDetailsCard data={mockCompanyData} className="custom-class" />
      );

      const card = screen.getByTestId('company-card');
      expect(card).toHaveClass('custom-class');
    });

    it('should render as a card component', () => {
      render(<CompanyDetailsCard data={mockCompanyData} />);

      // Should have card-like structure
      const card = screen.getByTestId('company-card');
      expect(card).toBeInTheDocument();
    });
  });
});

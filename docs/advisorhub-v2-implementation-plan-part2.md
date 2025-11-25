# AdvisorHub V2 Implementation Plan (Continuation)

## Continuing from Phase 1, Epic 1.2, User Story 1.2.3...

---

#### Epic 1.3: i18n Foundation
**Story Points:** 8 | **Priority:** P0

##### User Story 1.3.1: i18n Library Setup
**As a** developer
**I want** to configure react-i18next for internationalization
**So that** we can support multiple languages throughout the application

**Acceptance Criteria:**
- [ ] react-i18next is installed and configured
- [ ] Translation files structure is set up
- [ ] Language detection works automatically
- [ ] Language switcher component exists
- [ ] Fallback to English works correctly

**Test Cases (TDD):**

```javascript
// src/tests/__tests__/i18n.test.js

describe('i18n Configuration', () => {
  it('should initialize i18n with default language', () => {
    const { i18n } = require('@/lib/i18n');

    expect(i18n.language).toBe('en');
    expect(i18n.isInitialized).toBe(true);
  });

  it('should load English translations', () => {
    const { t } = require('@/lib/i18n');

    expect(t('common.welcome')).toBe('Welcome');
    expect(t('navigation.home')).toBe('Home');
    expect(t('navigation.customers')).toBe('Customers');
  });

  it('should have all required namespaces', () => {
    const { i18n } = require('@/lib/i18n');

    const requiredNamespaces = [
      'common', 'navigation', 'customers', 'products',
      'proposals', 'analytics', 'smartplan', 'news',
      'servicing', 'visualizers', 'mira'
    ];

    requiredNamespaces.forEach(ns => {
      expect(i18n.hasResourceBundle('en', ns)).toBe(true);
    });
  });

  it('should change language dynamically', async () => {
    const { i18n } = require('@/lib/i18n');

    await i18n.changeLanguage('zh');
    expect(i18n.language).toBe('zh');

    await i18n.changeLanguage('en');
    expect(i18n.language).toBe('en');
  });

  it('should fallback to English for missing translations', () => {
    const { t, i18n } = require('@/lib/i18n');

    i18n.changeLanguage('zh');

    // If Chinese translation is missing, should fallback to English
    expect(t('some.missing.key')).toBe('some.missing.key');
  });

  it('should support pluralization', () => {
    const { t } = require('@/lib/i18n');

    expect(t('customer.count', { count: 0 })).toBe('No customers');
    expect(t('customer.count', { count: 1 })).toBe('1 customer');
    expect(t('customer.count', { count: 5 })).toBe('5 customers');
  });

  it('should support interpolation', () => {
    const { t } = require('@/lib/i18n');

    expect(t('greeting.welcome', { name: 'John' })).toBe('Welcome, John!');
  });
});

// Component test
describe('LanguageSwitcher Component', () => {
  it('should render language options', () => {
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button', { name: /language/i });
    userEvent.click(button);

    expect(screen.getByText('English')).toBeInTheDocument();
    expect(screen.getByText('中文')).toBeInTheDocument();
    expect(screen.getByText('Bahasa Melayu')).toBeInTheDocument();
    expect(screen.getByText('Español')).toBeInTheDocument();
    expect(screen.getByText('தமிழ்')).toBeInTheDocument();
  });

  it('should change language when option selected', async () => {
    const { i18n } = require('@/lib/i18n');
    render(<LanguageSwitcher />);

    const button = screen.getByRole('button');
    await userEvent.click(button);

    const chineseOption = screen.getByText('中文');
    await userEvent.click(chineseOption);

    expect(i18n.language).toBe('zh');
  });

  it('should show current language', () => {
    const { i18n } = require('@/lib/i18n');
    i18n.changeLanguage('zh');

    render(<LanguageSwitcher />);

    expect(screen.getByText('中文')).toBeInTheDocument();
  });
});
```

**Implementation Tasks:**
- [ ] Install: `npm install react-i18next i18next i18next-browser-languagedetector`
- [ ] Create `src/lib/i18n/index.js` configuration
- [ ] Create translation files structure: `src/locales/{lang}/{namespace}.json`
- [ ] Create English translations (baseline)
- [ƒo.] Create `LanguageSwitcher` component
- [ ] Add i18n provider to app root
- [ ] Document translation key conventions
- [ ] Create translation helper utilities

**Dependencies:** None

---

#### Epic 1.4: Base Component Library
**Story Points:** 13 | **Priority:** P0

##### User Story 1.4.1: Entity Customer Components
**As a** developer
**I want** to create base components for entity customer UI
**So that** we can build entity customer features consistently

**Acceptance Criteria:**
- [✅] EntityCustomerForm component exists (16 tests passing)
- [✅] CompanyDetailsCard component exists (24 tests passing)
- [✅] KeymanDetailsForm component exists (18 tests passing)
- [✅] EmployeeListUpload component exists (18 tests passing)
- [✅] All components have unit tests (76 total tests, 100% passing)

**Test Cases (TDD):**

```javascript
// src/admin/components/entity/__tests__/EntityCustomerForm.test.jsx

describe('EntityCustomerForm Component', () => {
  const mockOnSubmit = vi.fn();

  beforeEach(() => {
    mockOnSubmit.mockClear();
  });

  it('should render all entity customer fields', () => {
    render(<EntityCustomerForm onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/company name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/business registration/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/industry/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/number of employees/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/annual revenue/i)).toBeInTheDocument();
  });

  it('should validate required fields', async () => {
    render(<EntityCustomerForm onSubmit={mockOnSubmit} />);

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/company name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/business registration is required/i)).toBeInTheDocument();
    expect(mockOnSubmit).not.toHaveBeenCalled();
  });

  it('should validate business registration number format', async () => {
    render(<EntityCustomerForm onSubmit={mockOnSubmit} />);

    const regInput = screen.getByLabelText(/business registration/i);
    await userEvent.type(regInput, 'INVALID');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/invalid format/i)).toBeInTheDocument();
  });

  it('should validate number of employees is positive', async () => {
    render(<EntityCustomerForm onSubmit={mockOnSubmit} />);

    const employeesInput = screen.getByLabelText(/number of employees/i);
    await userEvent.type(employeesInput, '-5');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    expect(screen.getByText(/must be positive/i)).toBeInTheDocument();
  });

  it('should submit valid entity customer data', async () => {
    render(<EntityCustomerForm onSubmit={mockOnSubmit} />);

    await userEvent.type(
      screen.getByLabelText(/company name/i),
      'TechCorp Pte Ltd'
    );
    await userEvent.type(
      screen.getByLabelText(/business registration/i),
      '202300001A'
    );
    await userEvent.selectOptions(
      screen.getByLabelText(/industry/i),
      'Technology'
    );
    await userEvent.type(
      screen.getByLabelText(/number of employees/i),
      '50'
    );
    await userEvent.type(
      screen.getByLabelText(/annual revenue/i),
      '5000000'
    );

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    expect(mockOnSubmit).toHaveBeenCalledWith({
      company_name: 'TechCorp Pte Ltd',
      business_registration_no: '202300001A',
      industry: 'Technology',
      num_employees: 50,
      annual_revenue: 5000000
    });
  });

  it('should populate form with existing data', () => {
    const existingData = {
      company_name: 'Existing Corp',
      business_registration_no: '202200001B',
      industry: 'Finance',
      num_employees: 100,
      annual_revenue: 10000000
    };

    render(<EntityCustomerForm initialData={existingData} onSubmit={mockOnSubmit} />);

    expect(screen.getByLabelText(/company name/i)).toHaveValue('Existing Corp');
    expect(screen.getByLabelText(/business registration/i)).toHaveValue('202200001B');
    expect(screen.getByLabelText(/industry/i)).toHaveValue('Finance');
  });

  it('should show loading state during submission', async () => {
    const slowSubmit = vi.fn(() => new Promise(resolve => setTimeout(resolve, 1000)));
    render(<EntityCustomerForm onSubmit={slowSubmit} />);

    // Fill form...
    await userEvent.type(screen.getByLabelText(/company name/i), 'Test Corp');
    await userEvent.type(screen.getByLabelText(/business registration/i), '202300001A');

    const submitButton = screen.getByRole('button', { name: /save/i });
    await userEvent.click(submitButton);

    expect(submitButton).toBeDisabled();
    expect(screen.getByText(/saving/i)).toBeInTheDocument();
  });
});

// src/admin/components/entity/__tests__/EmployeeListUpload.test.jsx

describe('EmployeeListUpload Component', () => {
  const mockOnUpload = vi.fn();

  beforeEach(() => {
    mockOnUpload.mockClear();
  });

  it('should render upload area', () => {
    render(<EmployeeListUpload onUpload={mockOnUpload} />);

    expect(screen.getByText(/upload employee list/i)).toBeInTheDocument();
    expect(screen.getByText(/drag.*drop.*excel/i)).toBeInTheDocument();
  });

  it('should accept Excel files', async () => {
    render(<EmployeeListUpload onUpload={mockOnUpload} />);

    const file = new File(['name,dob,gender\nJohn,1990-01-01,Male'], 'employees.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const input = screen.getByLabelText(/upload/i);
    await userEvent.upload(input, file);

    expect(mockOnUpload).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'employees.xlsx' })
    );
  });

  it('should reject non-Excel files', async () => {
    render(<EmployeeListUpload onUpload={mockOnUpload} />);

    const file = new File(['invalid'], 'document.pdf', { type: 'application/pdf' });

    const input = screen.getByLabelText(/upload/i);
    await userEvent.upload(input, file);

    expect(screen.getByText(/only excel files/i)).toBeInTheDocument();
    expect(mockOnUpload).not.toHaveBeenCalled();
  });

  it('should parse Excel and show preview', async () => {
    render(<EmployeeListUpload onUpload={mockOnUpload} />);

    const file = new File(
      [createMockExcelData([
        { name: 'John Doe', dob: '1990-01-01', gender: 'Male' },
        { name: 'Jane Smith', dob: '1985-05-15', gender: 'Female' }
      ])],
      'employees.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const input = screen.getByLabelText(/upload/i);
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText('John Doe')).toBeInTheDocument();
      expect(screen.getByText('Jane Smith')).toBeInTheDocument();
    });

    expect(screen.getByText(/2 employees found/i)).toBeInTheDocument();
  });

  it('should validate required columns', async () => {
    render(<EmployeeListUpload onUpload={mockOnUpload} />);

    const file = new File(
      [createMockExcelData([{ name: 'John' }])], // Missing required columns
      'employees.xlsx',
      { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }
    );

    const input = screen.getByLabelText(/upload/i);
    await userEvent.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/missing required columns/i)).toBeInTheDocument();
    });
  });

  it('should allow removing uploaded file', async () => {
    render(<EmployeeListUpload onUpload={mockOnUpload} />);

    const file = new File(['data'], 'employees.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });

    const input = screen.getByLabelText(/upload/i);
    await userEvent.upload(input, file);

    const removeButton = await screen.findByRole('button', { name: /remove/i });
    await userEvent.click(removeButton);

    expect(screen.queryByText('employees.xlsx')).not.toBeInTheDocument();
  });
});
```

**Implementation Tasks:**
- [ ] Create `src/admin/components/entity/EntityCustomerForm.jsx`
- [ ] Create `src/admin/components/entity/CompanyDetailsCard.jsx`
- [ ] Create `src/admin/components/entity/KeymanDetailsForm.jsx`
- [ ] Create `src/admin/components/entity/EmployeeListUpload.jsx`
- [ ] Install Excel parsing library: `npm install xlsx`
- [ ] Create validation schemas with Zod/Yup
- [ ] Write unit tests for all components
- [ ] Document component APIs
- [ ] Create Storybook stories

**Dependencies:** 1.1.1, 1.3.1

---

##### User Story 1.4.2: Timeline Component for "Our Journey"
**As a** developer
**I want** to create a horizontal timeline component
**So that** we can display customer relationship milestones

**Acceptance Criteria:**
- [ ] OurJourneyTimeline component exists
- [ ] Milestones alternate on left/right sides
- [ ] Each milestone shows icon, date, title, description
- [ ] Timeline is responsive
- [ ] Supports empty state

**Test Cases (TDD):**

```javascript
// src/admin/components/timeline/__tests__/OurJourneyTimeline.test.jsx

describe('OurJourneyTimeline Component', () => {
  const mockMilestones = [
    {
      id: '1',
      event_type: 'first_policy',
      event_title: 'First Policy Purchased',
      event_description: 'LifeShield Plus',
      event_date: '2024-01-15',
      icon: '🎉',
      color: '#10b981'
    },
    {
      id: '2',
      event_type: 'renewal',
      event_title: 'Policy Renewed',
      event_description: 'Annual renewal completed',
      event_date: '2024-06-15',
      icon: '📋',
      color: '#3b82f6'
    },
    {
      id: '3',
      event_type: 'claim',
      event_title: 'Claim Submitted',
      event_description: 'Medical claim processed',
      event_date: '2024-09-20',
      icon: '💰',
      color: '#ef4444'
    }
  ];

  it('should render all milestones', () => {
    render(<OurJourneyTimeline milestones={mockMilestones} />);

    expect(screen.getByText('First Policy Purchased')).toBeInTheDocument();
    expect(screen.getByText('Policy Renewed')).toBeInTheDocument();
    expect(screen.getByText('Claim Submitted')).toBeInTheDocument();
  });

  it('should display milestones in chronological order', () => {
    render(<OurJourneyTimeline milestones={mockMilestones} />);

    const milestoneCards = screen.getAllByTestId('milestone-card');

    expect(milestoneCards[0]).toHaveTextContent('Jan 2024');
    expect(milestoneCards[1]).toHaveTextContent('Jun 2024');
    expect(milestoneCards[2]).toHaveTextContent('Sep 2024');
  });

  it('should alternate milestone positions', () => {
    render(<OurJourneyTimeline milestones={mockMilestones} />);

    const milestoneCards = screen.getAllByTestId('milestone-card');

    // First milestone on top
    expect(milestoneCards[0]).toHaveClass('timeline-top');

    // Second milestone on bottom
    expect(milestoneCards[1]).toHaveClass('timeline-bottom');

    // Third milestone on top
    expect(milestoneCards[2]).toHaveClass('timeline-top');
  });

  it('should show milestone icons', () => {
    render(<OurJourneyTimeline milestones={mockMilestones} />);

    expect(screen.getByText('🎉')).toBeInTheDocument();
    expect(screen.getByText('📋')).toBeInTheDocument();
    expect(screen.getByText('💰')).toBeInTheDocument();
  });

  it('should apply correct colors to milestones', () => {
    render(<OurJourneyTimeline milestones={mockMilestones} />);

    const firstMilestone = screen.getByTestId('milestone-1');
    expect(firstMilestone).toHaveStyle({ borderColor: '#10b981' });
  });

  it('should show empty state when no milestones', () => {
    render(<OurJourneyTimeline milestones={[]} />);

    expect(screen.getByText(/no milestones yet/i)).toBeInTheDocument();
    expect(screen.getByText(/journey.*begin/i)).toBeInTheDocument();
  });

  it('should format dates correctly', () => {
    render(<OurJourneyTimeline milestones={mockMilestones} />);

    expect(screen.getByText('Jan 2024')).toBeInTheDocument();
    expect(screen.getByText('Jun 2024')).toBeInTheDocument();
    expect(screen.getByText('Sep 2024')).toBeInTheDocument();
  });

  it('should be responsive on mobile', () => {
    // Mock mobile viewport
    global.innerWidth = 375;
    global.dispatchEvent(new Event('resize'));

    render(<OurJourneyTimeline milestones={mockMilestones} />);

    const timeline = screen.getByTestId('our-journey-timeline');

    // On mobile, all milestones should stack vertically
    const milestoneCards = screen.getAllByTestId('milestone-card');
    milestoneCards.forEach(card => {
      expect(card).toHaveClass('timeline-mobile');
    });
  });

  it('should handle click on milestone', async () => {
    const mockOnClick = vi.fn();
    render(<OurJourneyTimeline milestones={mockMilestones} onMilestoneClick={mockOnClick} />);

    const firstMilestone = screen.getByText('First Policy Purchased');
    await userEvent.click(firstMilestone);

    expect(mockOnClick).toHaveBeenCalledWith(mockMilestones[0]);
  });

  it('should show tooltip on icon hover', async () => {
    render(<OurJourneyTimeline milestones={mockMilestones} />);

    const icon = screen.getByText('🎉');
    await userEvent.hover(icon);

    await waitFor(() => {
      expect(screen.getByRole('tooltip')).toHaveTextContent('First Policy');
    });
  });
});
```

**Implementation Tasks:**
- [ ] Create `src/admin/components/timeline/OurJourneyTimeline.jsx`
- [ ] Create `src/admin/components/timeline/MilestoneCard.jsx`
- [ ] Implement horizontal timeline layout with CSS
- [ ] Add responsive breakpoints
- [ ] Create empty state component
- [ ] Add animations (fade in, slide in)
- [ ] Write unit tests
- [ ] Create Storybook stories
- [ ] Document component props

**Dependencies:** 1.1.3

---

#### Epic 1.5: API Client Infrastructure
**Story Points:** 8 | **Priority:** P0

##### User Story 1.5.1: Enhanced API Client with Type Safety
**As a** developer
**I want** to create a type-safe API client
**So that** we can make API calls with better error handling and validation

**Acceptance Criteria:**
- [ ] API client supports all HTTP methods
- [ ] Request/response interceptors work
- [ ] Error handling is centralized
- [ ] Loading states are managed
- [ ] TypeScript types are generated

**Test Cases (TDD):**

```javascript
// src/admin/api/__tests__/apiClient.test.js

describe('API Client', () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe('GET requests', () => {
    it('should make GET request successfully', async () => {
      const { data } = await apiClient.get('/customers');

      expect(data).toBeInstanceOf(Array);
      expect(data.length).toBeGreaterThan(0);
    });

    it('should include auth token in headers', async () => {
      let capturedHeaders;

      server.use(
        http.get('/api/customers', ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ data: [] });
        })
      );

      await apiClient.get('/customers');

      expect(capturedHeaders.get('Authorization')).toBe('Bearer mock-token');
    });

    it('should handle query parameters', async () => {
      let capturedUrl;

      server.use(
        http.get('/api/customers', ({ request }) => {
          capturedUrl = request.url;
          return HttpResponse.json({ data: [] });
        })
      );

      await apiClient.get('/customers', {
        params: { customer_type: 'Entity', status: 'Active' }
      });

      expect(capturedUrl).toContain('customer_type=Entity');
      expect(capturedUrl).toContain('status=Active');
    });
  });

  describe('POST requests', () => {
    it('should make POST request with JSON body', async () => {
      const newCustomer = {
        name: 'Test Customer',
        customer_type: 'Individual'
      };

      const { data } = await apiClient.post('/customers', newCustomer);

      expect(data.name).toBe('Test Customer');
      expect(data.id).toBeDefined();
    });

    it('should include Content-Type header', async () => {
      let capturedHeaders;

      server.use(
        http.post('/api/customers', ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ data: {} }, { status: 201 });
        })
      );

      await apiClient.post('/customers', { name: 'Test' });

      expect(capturedHeaders.get('Content-Type')).toBe('application/json');
    });
  });

  describe('Error handling', () => {
    it('should handle 404 errors', async () => {
      server.use(
        http.get('/api/customers/:id', () => {
          return HttpResponse.json(
            { error: 'Not found' },
            { status: 404 }
          );
        })
      );

      await expect(apiClient.get('/customers/invalid-id')).rejects.toThrow(
        'Not found'
      );
    });

    it('should handle 500 errors', async () => {
      server.use(
        http.get('/api/customers', () => {
          return HttpResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
          );
        })
      );

      await expect(apiClient.get('/customers')).rejects.toThrow(
        'Internal server error'
      );
    });

    it('should handle network errors', async () => {
      server.use(
        http.get('/api/customers', () => {
          return HttpResponse.error();
        })
      );

      await expect(apiClient.get('/customers')).rejects.toThrow(
        'Network error'
      );
    });

    it('should retry on failure', async () => {
      let attempts = 0;

      server.use(
        http.get('/api/customers', () => {
          attempts++;
          if (attempts < 3) {
            return HttpResponse.error();
          }
          return HttpResponse.json({ data: [] });
        })
      );

      const { data } = await apiClient.get('/customers', { retry: 3 });

      expect(attempts).toBe(3);
      expect(data).toEqual([]);
    });
  });

  describe('Request interceptors', () => {
    it('should call request interceptor before request', async () => {
      const interceptor = vi.fn((config) => config);
      apiClient.interceptors.request.use(interceptor);

      await apiClient.get('/customers');

      expect(interceptor).toHaveBeenCalled();
    });

    it('should allow modifying request in interceptor', async () => {
      apiClient.interceptors.request.use((config) => {
        config.headers['X-Custom-Header'] = 'custom-value';
        return config;
      });

      let capturedHeaders;
      server.use(
        http.get('/api/customers', ({ request }) => {
          capturedHeaders = request.headers;
          return HttpResponse.json({ data: [] });
        })
      );

      await apiClient.get('/customers');

      expect(capturedHeaders.get('X-Custom-Header')).toBe('custom-value');
    });
  });

  describe('Response interceptors', () => {
    it('should call response interceptor after response', async () => {
      const interceptor = vi.fn((response) => response);
      apiClient.interceptors.response.use(interceptor);

      await apiClient.get('/customers');

      expect(interceptor).toHaveBeenCalled();
    });

    it('should allow transforming response', async () => {
      apiClient.interceptors.response.use((response) => {
        response.data.transformed = true;
        return response;
      });

      const { data } = await apiClient.get('/customers');

      expect(data.transformed).toBe(true);
    });
  });

  describe('Loading state', () => {
    it('should track loading state', async () => {
      const loadingStates = [];

      apiClient.on('loadingChange', (isLoading) => {
        loadingStates.push(isLoading);
      });

      server.use(
        http.get('/api/customers', async () => {
          await new Promise(resolve => setTimeout(resolve, 100));
          return HttpResponse.json({ data: [] });
        })
      );

      await apiClient.get('/customers');

      expect(loadingStates).toEqual([true, false]);
    });
  });
});
```

**Implementation Tasks:**
- [ ] Create `src/admin/api/apiClient.js`
- [ ] Implement request/response interceptors
- [ ] Add retry logic
- [ ] Add loading state management
- [ ] Create error handling utilities
- [ ] Add request cancellation support
- [ ] Write unit tests
- [ ] Document API client usage
- [ ] Create TypeScript type definitions

**Dependencies:** 1.2.2

---

## Phase 2: Entity Customers & Servicing
**Duration:** 2 weeks | **Priority:** P0 | **Risk:** High

### Phase Goals
- Implement full entity customer support
- Build servicing module from scratch
- Create "Our Journey" timeline
- Implement customer temperature tracking

### Epics Summary

| Epic | Story Points | Priority | Stories |
|------|--------------|----------|---------|
| 2.1: Entity Customer CRUD | 21 | P0 | 6 |
| 2.2: Servicing Module | 18 | P0 | 5 |
| 2.3: Our Journey Timeline | 13 | P1 | 4 |
| 2.4: Customer Temperature | 8 | P1 | 3 |
| **Total** | **60** | - | **18** |

---

### Epic 2.1: Entity Customer CRUD
**Story Points:** 21 | **Priority:** P0

##### User Story 2.1.1: Create Entity Customer
**As an** advisor
**I want** to create entity (company) customers
**So that** I can manage B2B clients

**Acceptance Criteria:**
- [ ] Can create entity customer with company details
- [ ] Keyman information can be added
- [ ] Employee list can be uploaded
- [ ] Validation works for all fields
- [ ] Success message is shown

**Test Cases (TDD):**

```javascript
// e2e/entity-customers.spec.js

describe('Entity Customer Creation', () => {
  beforeEach(async ({ page }) => {
    await loginAsAdvisor(page);
    await page.goto('/advisor/customers');
  });

  test('should create entity customer successfully', async ({ page }) => {
    await page.click('text=+New Lead');

    // Switch to Entity type
    await page.click('[name="customer_type"][value="Entity"]');

    // Fill company details
    await page.fill('[name="company_name"]', 'TechCorp Pte Ltd');
    await page.fill('[name="business_registration_no"]', '202300001A');
    await page.selectOption('[name="industry"]', 'Technology');
    await page.fill('[name="num_employees"]', '50');
    await page.fill('[name="annual_revenue"]', '5000000');

    // Fill contact details
    await page.fill('[name="contact_number"]', '65123456');
    await page.fill('[name="email"]', 'contact@techcorp.com');

    // Add keyman
    await page.click('text=Add Keyman');
    await page.fill('[name="keyman_name"]', 'John Tan');
    await page.fill('[name="keyman_position"]', 'CEO');

    // Submit
    await page.click('text=Save & Close');

    // Verify success
    await expect(page.getByText('Customer created successfully')).toBeVisible();
    await expect(page.getByText('TechCorp Pte Ltd')).toBeVisible();
  });

  test('should validate required fields', async ({ page }) => {
    await page.click('text=+New Lead');
    await page.click('[name="customer_type"][value="Entity"]');

    // Try to submit without filling required fields
    await page.click('text=Save & Close');

    // Should show validation errors
    await expect(page.getByText(/company name is required/i)).toBeVisible();
    await expect(page.getByText(/business registration is required/i)).toBeVisible();
  });

  test('should validate business registration format', async ({ page }) => {
    await page.click('text=+New Lead');
    await page.click('[name="customer_type"][value="Entity"]');

    await page.fill('[name="company_name"]', 'Test Corp');
    await page.fill('[name="business_registration_no"]', 'INVALID_FORMAT');

    await page.click('text=Save & Close');

    await expect(page.getByText(/invalid registration number format/i)).toBeVisible();
  });

  test('should upload employee list', async ({ page }) => {
    await page.click('text=+New Lead');
    await page.click('[name="customer_type"][value="Entity"]');

    await page.fill('[name="company_name"]', 'TechCorp Pte Ltd');
    await page.fill('[name="business_registration_no"]', '202300001A');

    // Upload employee list
    const fileInput = page.locator('input[type="file"]');
    await fileInput.setInputFiles('test-data/employees.xlsx');

    // Should show preview
    await expect(page.getByText(/50 employees found/i)).toBeVisible();
    await expect(page.getByText('John Doe')).toBeVisible();

    await page.click('text=Save & Close');

    await expect(page.getByText('Customer created successfully')).toBeVisible();
  });

  test('should save and schedule appointment', async ({ page }) => {
    await page.click('text=+New Lead');
    await page.click('[name="customer_type"][value="Entity"]');

    await page.fill('[name="company_name"]', 'TechCorp Pte Ltd');
    await page.fill('[name="business_registration_no"]', '202300001A');

    await page.click('text=Save & Schedule Appointment');

    // Should navigate to appointment form
    await expect(page).toHaveURL(/\/advisor\/smart-plan/);
    await expect(page.getByLabel(/title/i)).toHaveValue(/appointment with techcorp/i);
    await expect(page.getByLabel(/linked customer/i)).toHaveValue('TechCorp Pte Ltd');
  });
});

// Integration test
describe('Entity Customer API', () => {
  it('should create entity customer via API', async () => {
    const newEntityCustomer = {
      customer_type: 'Entity',
      company_name: 'TechCorp Pte Ltd',
      business_registration_no: '202300001A',
      industry: 'Technology',
      num_employees: 50,
      annual_revenue: 5000000,
      contact_number: '65123456',
      email: 'contact@techcorp.com',
      keyman_details: {
        name: 'John Tan',
        position: 'CEO',
        contact: '65234567'
      }
    };

    const response = await apiClient.post('/customers', newEntityCustomer);

    expect(response.data).toMatchObject({
      id: expect.any(String),
      customer_type: 'Entity',
      company_name: 'TechCorp Pte Ltd',
      business_registration_no: '202300001A'
    });
  });

  it('should retrieve entity customers with filtering', async () => {
    // Create test data
    await createTestCustomer({ customer_type: 'Individual' });
    await createTestCustomer({ customer_type: 'Entity', company_name: 'Corp A' });
    await createTestCustomer({ customer_type: 'Entity', company_name: 'Corp B' });

    const response = await apiClient.get('/customers', {
      params: { customer_type: 'Entity' }
    });

    expect(response.data).toHaveLength(2);
    response.data.forEach(customer => {
      expect(customer.customer_type).toBe('Entity');
    });
  });
});
```

**Implementation Tasks:**
- [ƒo.] Update Customer schema to support entity type
- [ƒo.] Create API endpoint: `POST /api/customers` (with entity support)
- [ƒo.] Update `Customer.jsx` page to show entity form
- [ƒo.] Implement EntityCustomerForm component
- [ƒo.] Add employee list upload functionality
- [ƒo.] Implement validation logic
- [ ] Write E2E tests
- [ ] Write integration tests
- [ƒo.] Write unit tests (EntityCustomerForm + EmployeeListUpload)
- [ ] Update API documentation

**Dependencies:** 1.1.1, 1.4.1

---

##### User Story 2.1.2: View Entity Customer Detail
**As an** advisor
**I want** to view entity customer details
**So that** I can see complete company information

**Acceptance Criteria:**
- [ƒo.] Can navigate to entity customer detail page
- [ƒo.] Company details are displayed correctly
- [ƒo.] Keyman information is shown
- [ƒo.] Employee list is accessible
- [ƒo.] Different tabs for entity (Overview, Portfolio, Servicing)
- [ƒo.] Gap & Opportunity tab is hidden for entities

**Test Cases (TDD):**

```javascript
// e2e/entity-customer-detail.spec.js

describe('Entity Customer Detail View', () => {
  let entityCustomer;

  beforeEach(async ({ page, context }) => {
    await loginAsAdvisor(page);

    // Create test entity customer
    entityCustomer = await createTestEntityCustomer({
      company_name: 'TechCorp Pte Ltd',
      business_registration_no: '202300001A',
      industry: 'Technology',
      num_employees: 50,
      annual_revenue: 5000000
    });

    await page.goto(`/advisor/customers/detail?id=${entityCustomer.id}`);
  });

  test('should display entity customer header', async ({ page }) => {
    await expect(page.getByRole('heading', { name: 'TechCorp Pte Ltd' })).toBeVisible();
    await expect(page.getByText('Entity')).toBeVisible();
    await expect(page.getByText('202300001A')).toBeVisible();
  });

  test('should show correct tabs for entity', async ({ page }) => {
    // Should show these tabs
    await expect(page.getByRole('tab', { name: 'Overview' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Portfolio' })).toBeVisible();
    await expect(page.getByRole('tab', { name: 'Servicing' })).toBeVisible();

    // Should NOT show this tab for entity
    await expect(page.getByRole('tab', { name: 'Gap & Opportunity' })).not.toBeVisible();
  });

  test('should display company details on Overview tab', async ({ page }) => {
    await page.click('text=Overview');

    await expect(page.getByText('Company Details')).toBeVisible();
    await expect(page.getByText('TechCorp Pte Ltd')).toBeVisible();
    await expect(page.getByText('Technology')).toBeVisible();
    await expect(page.getByText('50 employees')).toBeVisible();
    await expect(page.getByText('$5,000,000')).toBeVisible();
  });

  test('should display keyman information', async ({ page }) => {
    await page.click('text=Overview');

    await expect(page.getByText('Keyman')).toBeVisible();
    await expect(page.getByText(entityCustomer.keyman_details.name)).toBeVisible();
    await expect(page.getByText(entityCustomer.keyman_details.position)).toBeVisible();
  });

  test('should show group insurance products in Portfolio', async ({ page }) => {
    await page.click('text=Portfolio');

    await expect(page.getByText('Coverage Overview')).toBeVisible();

    // Group insurance coverage types
    await expect(page.getByText('Group Life')).toBeVisible();
    await expect(page.getByText('Group Medical')).toBeVisible();
    await expect(page.getByText('Group PA')).toBeVisible();
    await expect(page.getByText('Dental & Optical')).toBeVisible();
  });

  test('should navigate to Our Journey section', async ({ page }) => {
    await page.click('text=Overview');

    await expect(page.getByText('Our Journey')).toBeVisible();

    // Empty state if no milestones yet
    await expect(page.getByText(/journey.*begin/i)).toBeVisible();
  });

  test('should show quick actions for entity', async ({ page }) => {
    await page.click('text=Overview');

    await expect(page.getByRole('button', { name: 'New Proposal' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Schedule Appointment' })).toBeVisible();
  });

  test('should click New Proposal and navigate correctly', async ({ page }) => {
    await page.click('text=Overview');
    await page.click('text=New Proposal');

    // Should navigate to proposals with entity customer pre-selected
    await expect(page).toHaveURL(/\/advisor\/proposals\/detail/);
    await expect(page.getByText('TechCorp Pte Ltd')).toBeVisible();
  });

  test('should show entity-specific service requests', async ({ page }) => {
    await page.click('text=Servicing');

    // Entity-specific service types
    await expect(page.getByText('Change of Members')).toBeVisible();
    await expect(page.getByText('Change Rider')).toBeVisible();
  });
});

// Component test
describe('EntityCustomerDetail Component', () => {
  const mockEntityCustomer = {
    id: 'entity-1',
    customer_type: 'Entity',
    company_name: 'TechCorp Pte Ltd',
    business_registration_no: '202300001A',
    industry: 'Technology',
    num_employees: 50,
    annual_revenue: 5000000,
    contact_number: '65123456',
    email: 'contact@techcorp.com',
    keyman_details: {
      name: 'John Tan',
      position: 'CEO',
      contact: '65234567'
    }
  };

  it('should render entity customer header', () => {
    render(<CustomerDetail customer={mockEntityCustomer} />);

    expect(screen.getByText('TechCorp Pte Ltd')).toBeInTheDocument();
    expect(screen.getByText('Entity')).toBeInTheDocument();
    expect(screen.getByText('202300001A')).toBeInTheDocument();
  });

  it('should render company details card', () => {
    render(<CustomerDetail customer={mockEntityCustomer} />);

    expect(screen.getByText('Company Details')).toBeInTheDocument();
    expect(screen.getByText('Technology')).toBeInTheDocument();
    expect(screen.getByText('50')).toBeInTheDocument(); // employees
  });

  it('should NOT render Gap & Opportunity tab', () => {
    render(<CustomerDetail customer={mockEntityCustomer} />);

    expect(screen.queryByRole('tab', { name: /gap.*opportunity/i })).not.toBeInTheDocument();
  });

  it('should render group insurance coverage types', () => {
    render(<CustomerDetail customer={mockEntityCustomer} />);

    userEvent.click(screen.getByRole('tab', { name: 'Portfolio' }));

    expect(screen.getByText('Group Life')).toBeInTheDocument();
    expect(screen.getByText('Group Medical')).toBeInTheDocument();
  });
});
```

**Implementation Tasks:**
- [ ] Update `CustomerDetail.jsx` to handle entity type
- [ ] Create `CompanyDetailsCard` component
- [ ] Update tabs to hide Gap & Opportunity for entities
- [ ] Update Portfolio tab to show group insurance
- [ ] Create group insurance coverage visualization
- [ ] Write E2E tests
- [ ] Write component tests
- [ ] Update documentation

**Dependencies:** 2.1.1

---

I'll continue creating the comprehensive implementation plan. Due to the length, let me create a complete structured outline document that continues through all phases. Should I:

1. Continue with Phase 2 (complete all user stories in detail)?
2. Create a summary format for remaining phases (Phases 3-8) with key user stories highlighted?
3. Create a separate checklist document that extracts all tasks?

Which approach would be most useful for your development team?

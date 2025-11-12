import type { AgentTool } from "../../types.ts";

export interface Product {
  id: string;
  name: string;
  category: string;
  premium: number;
}

export interface ProductDetail extends Product {
  description: string;
  riders: string[];
  coverage: number;
}

export interface ComparisonMatrix {
  ids: string[];
  metrics: Array<{ metric: string; values: Record<string, string | number> }>;
}

export interface Category {
  id: string;
  name: string;
}

const mockProducts: ProductDetail[] = [
  {
    id: "PR-1001",
    name: "LifeShield Prime",
    category: "Protection",
    premium: 120,
    description: "Whole life protection with cash value",
    riders: ["Critical Illness", "Payor Benefit"],
    coverage: 250000,
  },
  {
    id: "PR-1002",
    name: "EduGrow Plus",
    category: "Savings",
    premium: 150,
    description: "Education savings with guaranteed returns",
    riders: ["Waiver of Premium"],
    coverage: 150000,
  },
];

async function searchProducts(keyword: string, category?: string): Promise<Product[]> {
  const lower = keyword.toLowerCase();
  return mockProducts
    .filter((p) => (!category || p.category === category) && p.name.toLowerCase().includes(lower))
    .map(({ description, riders, coverage, ...product }) => product);
}

async function getProductDetails(id: string): Promise<ProductDetail> {
  const product = mockProducts.find((p) => p.id === id);
  if (!product) throw new Error(`Product ${id} not found`);
  return product;
}

async function compareProducts(ids: string[]): Promise<ComparisonMatrix> {
  const products = mockProducts.filter((p) => ids.includes(p.id));
  return {
    ids,
    metrics: [
      {
        metric: "Premium",
        values: Object.fromEntries(products.map((p) => [p.id, `$${p.premium}`])),
      },
      {
        metric: "Coverage",
        values: Object.fromEntries(products.map((p) => [p.id, `$${p.coverage}`])),
      },
    ],
  };
}

async function listCategories(): Promise<Category[]> {
  const categories = new Map<string, string>();
  mockProducts.forEach((p) => categories.set(p.category, p.category));
  return Array.from(categories.entries()).map(([id, name]) => ({ id, name }));
}

export function getProductTools(): AgentTool[] {
  return [
    {
      name: "products.search",
      description: "Search products by keyword and category",
      handler: async (input: { keyword: string; category?: string }) =>
        searchProducts(input.keyword, input.category),
    },
    {
      name: "products.getDetails",
      description: "Get product detail by id",
      handler: async (input: { id: string }) => getProductDetails(input.id),
    },
    {
      name: "products.compare",
      description: "Compare multiple products",
      handler: async (input: { ids: string[] }) => compareProducts(input.ids),
    },
    {
      name: "products.listCategories",
      description: "List product categories",
      handler: async () => listCategories(),
    },
  ];
}

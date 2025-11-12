import React, { useCallback, useMemo, useRef, useState } from "react";
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/admin/utils";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/admin/components/ui/card";
import { Button } from "@/admin/components/ui/button";
import { Badge } from "@/admin/components/ui/badge";
import { Input } from "@/admin/components/ui/input";
import { Label } from "@/admin/components/ui/label";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import { Skeleton } from "@/admin/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/admin/components/ui/tabs";
import { usePreferences } from "@/admin/state/PreferencesContext.jsx";
import {
  Activity,
  ArrowLeft,
  Calculator,
  Check,
  Heart,
  PiggyBank,
  Shield,
  Sparkles,
  Umbrella,
  ChevronRight,
} from "lucide-react";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";

const LIFE_NEED_TYPES = new Set([
  "Protection",
  "Savings",
  "Investment",
  "Retirement",
]);

const CATEGORY_CONFIG = [
  {
    id: "life",
    title: "Life Insurance",
    description:
      "Protection, savings, investment and retirement solutions for long-term planning.",
    gradient: "from-blue-500 via-indigo-500 to-purple-500",
    icon: Shield,
  },
  {
    id: "health",
    title: "Health Insurance",
    description:
      "Comprehensive medical coverage plans including hospitalization and critical illness.",
    gradient: "from-rose-500 via-pink-500 to-red-500",
    icon: Heart,
  },
  {
    id: "general",
    title: "General Insurance",
    description:
      "Short-term protection for property, travel, and specialty risks.",
    gradient: "from-emerald-500 via-teal-500 to-cyan-500",
    icon: Activity,
  },
];

const DEFAULT_CATEGORY_ID = CATEGORY_CONFIG[0].id;

const coverageIcons = {
  Protection: Shield,
  Health: Heart,
  Savings: PiggyBank,
  Investment: Sparkles,
  Retirement: Umbrella,
};

const coverageColors = {
  Protection: "from-blue-500 to-blue-600",
  Health: "from-red-500 to-red-600",
  Savings: "from-green-500 to-green-600",
  Investment: "from-purple-500 to-purple-600",
  Retirement: "from-orange-500 to-orange-600",
};

const categoryForNeedType = (needType) => {
  if (!needType) return "general";
  if (needType === "Health") return "health";
  if (LIFE_NEED_TYPES.has(needType)) return "life";
  return "general";
};

const ProductImage = ({ index }) => {
  const images = [
    "/images/products/product-card-1.png",
    "/images/products/product-card-2.png",
    "/images/products/product-card-3.png",
  ];
  const imageUrl = images[index % images.length];

  return (
    <div className="relative h-[201px] w-full overflow-hidden rounded-t-xl">
      <img src={imageUrl} alt="Product" className="h-full w-full object-cover" />
    </div>
  );
};

export default function Product() {
  const [activeCategoryId, setActiveCategoryId] = useState(DEFAULT_CATEGORY_ID);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const touchStartXRef = useRef(null);

  const {
    data: products = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["products"],
    queryFn: () => adviseUAdminApi.entities.Product.list(),
  });

  const productsWithCategory = useMemo(
    () =>
      products.map((product) => ({
        ...product,
        categoryId: categoryForNeedType(product.need_type),
      })),
    [products],
  );

  const categories = useMemo(
    () =>
      CATEGORY_CONFIG.map((config) => {
        const categoryProducts = productsWithCategory.filter(
          (product) => product.categoryId === config.id,
        );
        return {
          ...config,
          products: categoryProducts,
          count: categoryProducts.length,
        };
      }),
    [productsWithCategory],
  );

  const activeCategory =
    categories.find((category) => category.id === activeCategoryId) ??
    categories[0];

  const handleTabChange = useCallback((value) => {
    setActiveCategoryId(value);
    setSelectedProduct(null);
  }, []);

  const handleTouchStart = useCallback((event) => {
    touchStartXRef.current = event.touches?.[0]?.clientX ?? null;
  }, []);

  const handleTouchEnd = useCallback(
    (event) => {
      const startX = touchStartXRef.current;
      if (startX === null) return;
      const endX = event.changedTouches?.[0]?.clientX ?? startX;
      const deltaX = endX - startX;
      const swipeThreshold = 60;
      if (Math.abs(deltaX) > swipeThreshold) {
        const direction = deltaX < 0 ? 1 : -1;
        const currentIndex = categories.findIndex(
          (category) => category.id === activeCategoryId,
        );
        const targetIndex = currentIndex + direction;
        if (categories[targetIndex]) {
          setActiveCategoryId(categories[targetIndex].id);
          setSelectedProduct(null);
        }
      }
      touchStartXRef.current = null;
    },
    [activeCategoryId, categories],
  );

  const handleSelectProduct = useCallback((product) => {
    setActiveCategoryId(product.categoryId);
    setSelectedProduct(product);
  }, []);

  const handleBackToList = useCallback(() => {
    setSelectedProduct(null);
  }, []);

  const selectedProductId = selectedProduct?.id ?? null;

  useMiraPageData(
    () => ({
      view: "product_catalog",
      activeCategoryId,
      selectedProductId,
    }),
    [activeCategoryId, selectedProductId],
  );

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
        <div className="mx-auto max-w-4xl">
          <Card className="border-slate-200">
            <CardContent className="p-6 text-slate-700">
              <p className="mb-2 font-semibold">Unable to load products</p>
              <p className="text-sm">Please refresh the page and try again.</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <PageHeader
          title="Products"
          subtitle="Browse insurance solutions by line of business and generate a quote in seconds."
          icon={Calculator}
        />

        <div onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
          <Tabs value={activeCategoryId} onValueChange={handleTabChange} className="w-full">
            <div className="-mx-2 overflow-x-auto pb-2">
              <TabsList className="mx-2 flex-nowrap gap-2 border-none bg-transparent shadow-none">
                {categories.map((category) => (
                  <TabsTrigger
                    key={category.id}
                    value={category.id}
                    className="min-w-[150px] gap-2 rounded-full px-4 py-2 text-sm"
                  >
                    <span>{category.title}</span>
                    <span className="rounded-full bg-white/25 px-2 py-0.5 text-xs font-semibold">
                      {category.count}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {categories.map((category) => (
              <TabsContent
                key={category.id}
                value={category.id}
                className="mt-6 border-0 bg-transparent p-0 shadow-none"
              >
                {selectedProduct && selectedProduct.categoryId === category.id ? (
                  <ProductDetail
                    product={selectedProduct}
                    category={category}
                    onBack={handleBackToList}
                  />
                ) : (
                  <ProductGrid
                    category={category}
                    isLoading={isLoading}
                    onSelectProduct={handleSelectProduct}
                  />
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}

function ProductGrid({ category, isLoading, onSelectProduct }) {
  if (!category) {
    return null;
  }

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(6)].map((_, index) => (
          <Card key={index} className="border-slate-200 shadow-lg">
            <CardContent className="space-y-4 p-4">
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-6 w-3/4" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-10 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (category.products.length === 0) {
    return (
      <Card className="border-slate-200 bg-slate-50">
        <CardContent className="p-12 text-center text-slate-500">
          No products available in this category yet.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {category.products.map((product, index) => (
        <Card
          key={product.id}
          className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-[0px_2px_4px_rgba(15,23,42,0.05),0px_16px_32px_rgba(37,99,235,0.08)] transition-all hover:-translate-y-1 hover:shadow-2xl"
          onClick={() => onSelectProduct(product)}
        >
          <ProductImage index={index} />
          <CardContent className="flex flex-col gap-4 p-5">
            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-slate-900 group-hover:text-primary-600">
                {product.product_name}
              </h3>
              <p className="line-clamp-2 text-sm text-slate-600">
                {product.description}
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <Badge
                variant="outline"
                className="rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
              >
                {product.need_type}
              </Badge>
              {typeof product.min_age === "number" &&
                typeof product.max_age === "number" && (
                  <Badge
                    variant="outline"
                    className="rounded-full bg-slate-100 text-xs font-semibold text-slate-600"
                  >
                    Ages {product.min_age} – {product.max_age}
                  </Badge>
                )}
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-primary-600">
                Learn more
              </span>
              <Button
                type="button"
                size="icon"
                variant="secondary"
                className="h-9 w-9 rounded-full"
                onClick={(event) => {
                  event.stopPropagation();
                  onSelectProduct(product);
                }}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

function ProductDetail({ product, category, onBack }) {
  const navigate = useNavigate();
  const { prefs } = usePreferences();
  const [formData, setFormData] = useState({
    age: "",
    gender: "",
    smoker: "No",
    sum_assured: "",
    policy_term: "",
  });

  const Icon = coverageIcons[product.need_type] || Shield;
  const gradientColor =
    coverageColors[product.need_type] || "from-slate-500 to-slate-600";

  const handleCalculate = () => {
    const age = parseInt(formData.age, 10);
    const sumAssured = parseInt(formData.sum_assured, 10);
    const term = parseInt(formData.policy_term, 10);

    if (!age || !sumAssured || !term || !formData.gender) {
      return;
    }

    let baseRate = 0.002;

    if (age < 30) baseRate *= 0.8;
    else if (age > 50) baseRate *= 1.5;

    if (formData.gender === "Female") baseRate *= 0.9;
    if (formData.smoker === "Yes") baseRate *= 1.5;

    const typeMultipliers = {
      Protection: 1.0,
      Health: 0.8,
      Savings: 1.2,
      Investment: 1.3,
      Retirement: 1.1,
    };
    baseRate *= typeMultipliers[product.need_type] || 1.0;

    const annualPremium = sumAssured * baseRate;
    const monthlyPremium = annualPremium / 12;
    const totalPremium = annualPremium * term;

    const params = new URLSearchParams({
      productId: product.id,
      productName: product.product_name,
      productType: product.need_type,
      age: formData.age,
      gender: formData.gender,
      smoker: formData.smoker,
      sumAssured: formData.sum_assured,
      policyTerm: formData.policy_term,
      monthly: monthlyPremium.toFixed(2),
      annual: annualPremium.toFixed(2),
      total: totalPremium.toFixed(2),
    });

    navigate(`${createPageUrl("QuoteSummary")}?${params.toString()}`);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.product_name}
        subtitle="Complete the client profile to generate a tailored quick quote."
        icon={Icon}
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to {category?.title ?? "products"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => {
                const from = encodeURIComponent("/product");
                const prompt = encodeURIComponent(
                  `What are the key benefits and suitability considerations for ${product.product_name}?`
                );
                navigate(`${createPageUrl("ChatMira")}?from=${from}&prompt=${prompt}`);
              }}
            >
              Ask Mira
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Calculator className="h-5 w-5 text-blue-600" />
                Client Information
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Age</Label>
                  <Input
                    type="number"
                    placeholder={
                      product.min_age && product.max_age
                        ? `${product.min_age} - ${product.max_age}`
                        : "Client age"
                    }
                    min={product.min_age ?? undefined}
                    max={product.max_age ?? undefined}
                    value={formData.age}
                    onChange={(event) =>
                      setFormData({ ...formData, age: event.target.value })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Gender</Label>
                  <select
                    value={formData.gender}
                    onChange={(event) =>
                      setFormData({ ...formData, gender: event.target.value })
                    }
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="" disabled>
                      Select gender
                    </option>
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label>Smoker Status</Label>
                  <select
                    value={formData.smoker}
                    onChange={(event) =>
                      setFormData({ ...formData, smoker: event.target.value })
                    }
                    className="h-10 w-full rounded-md border border-slate-300 bg-white px-3 text-sm focus:border-primary-400 focus:outline-none focus:ring-2 focus:ring-primary-100"
                  >
                    <option value="No">Non-Smoker</option>
                    <option value="Yes">Smoker</option>
                  </select>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-600" />
                Coverage Details
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Sum Assured ({prefs.currency})</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 500000"
                    value={formData.sum_assured}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        sum_assured: event.target.value,
                      })
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Policy Term (years)</Label>
                  <Input
                    type="number"
                    placeholder="e.g., 20"
                    value={formData.policy_term}
                    onChange={(event) =>
                      setFormData({
                        ...formData,
                        policy_term: event.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          <Button
            onClick={handleCalculate}
            disabled={
              !formData.age ||
              !formData.gender ||
              !formData.sum_assured ||
              !formData.policy_term
            }
            className="h-14 w-full text-lg font-semibold shadow-lg"
          >
            <Calculator className="mr-2 h-5 w-5" />
            Generate Quick Quote
          </Button>
        </div>

        <div className="space-y-4">
          <Card className="border-slate-200 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="flex items-center gap-2">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br ${gradientColor} text-white shadow-lg`}
                >
                  <Icon className="h-5 w-5" />
                </div>
                Product Snapshot
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 pt-4 text-sm text-slate-600">
              <div>
                <p className="font-semibold text-slate-900">
                  {product.product_name}
                </p>
                <p>{product.description}</p>
              </div>
              {product.features?.length > 0 && (
                <div className="space-y-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Key Benefits
                  </p>
                  <div className="space-y-2">
                    {product.features.map((feature, index) => (
                      <div
                        key={`${feature}-${index}`}
                        className="flex items-start gap-2"
                      >
                        <Check className="mt-0.5 h-4 w-4 flex-shrink-0 text-green-600" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {typeof product.recommended_sum_assured === "number" && (
                <div className="rounded-lg bg-slate-100 px-3 py-2">
                  <p className="text-xs uppercase tracking-wide text-slate-500">
                    Recommended Sum Assured
                  </p>
                  <p className="text-sm font-semibold text-slate-800">
                    {prefs.currency}{" "}
                    {product.recommended_sum_assured.toLocaleString()}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-slate-200 bg-slate-50 shadow-lg">
            <CardContent className="p-4 text-center text-sm text-slate-600">
              Provide the client profile and coverage expectations to preview a
              premium illustration instantly.
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

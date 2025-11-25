import {
  Card,
  CardContent,
} from "@/admin/components/ui/card";
import PageHeader from "@/admin/components/ui/page-header.jsx";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/admin/components/ui/popover";
import SearchFilterBar from "@/admin/components/ui/search-filter-bar.jsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/admin/components/ui/select";
import { Button } from "@/admin/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import { supabase } from "@/admin/api/supabaseClient";
import ProductCard from "@/admin/modules/product/components/ProductCard";
import { products as productSeed } from "@/admin/modules/product/data/products";
import { createPageUrl } from "@/admin/utils";
import {
  Calculator,
  Filter,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

// Category definitions
const CATEGORIES = [
  { id: "all", label: "All" },
  { id: "life", label: "Life Insurance" },
  { id: "health", label: "Health Insurance" },
  { id: "general", label: "General Insurance" },
  { id: "group", label: "Group Insurance" },
];

const CATEGORY_IMAGES = {
  life: "https://images.unsplash.com/photo-1517840545244-4b3cd4b316a8?auto=format&fit=crop&w=800&q=80",
  health: "https://images.unsplash.com/photo-1582719478248-54e9f2ac2c74?auto=format&fit=crop&w=800&q=80",
  general: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=800&q=80",
  group: "https://images.unsplash.com/photo-1522071820081-009f0129c71c?auto=format&fit=crop&w=800&q=80",
  other: "https://images.unsplash.com/photo-1508387024700-9fe5c0b39cc7?auto=format&fit=crop&w=800&q=80",
};

const getProductCategory = (product) => {
  const type = (product.product_type || "").toLowerCase();
  const name = (product.product_name || "").toLowerCase();

  if (type.includes("group") || name.includes("group")) return "group";
  if (type.includes("life") || type.includes("retirement") || type.includes("endowment") || type.includes("investment") || type.includes("savings")) return "life";
  if (type.includes("health") || type.includes("hospital") || type.includes("critical illness") || type.includes("medical")) return "health";
  if (type.includes("motor") || type.includes("travel") || type.includes("home") || type.includes("pet") || type.includes("cyber") || type.includes("gadget") || type.includes("maid")) return "general";

  return "other";
};

const PRODUCT_METADATA = productSeed.reduce((acc, product) => {
  acc[product.id] = {
    ...product,
    need_type: product.need_type || [],
    key_features: product.key_features || [],
    premium_modes: product.premium_modes || [],
    allow_quick_quote: Boolean(product.allow_quick_quote),
    require_fact_finding: Boolean(product.require_fact_finding),
  };
  return acc;
}, {});

const mergeProduct = (dbProduct) => {
  const metadata = PRODUCT_METADATA[dbProduct.id] || {};
  const needTypeFromDb = Array.isArray(dbProduct.need_type)
    ? dbProduct.need_type
    : dbProduct.need_type
      ? dbProduct.need_type.split(",").map((v) => v.trim()).filter(Boolean)
      : [];

  const merged = {
    ...dbProduct,
    ...metadata,
    product_type:
      metadata.product_type ||
      dbProduct.product_type ||
      metadata.need_type?.[0] ||
      "General",
    need_type: metadata.need_type || needTypeFromDb,
    key_features: metadata.key_features || dbProduct.features || [],
    premium_modes: metadata.premium_modes || dbProduct.premium_modes || [],
    min_sum_assured:
      metadata.min_sum_assured ||
      dbProduct.min_sum_assured ||
      dbProduct.recommended_sum_assured ||
      null,
    max_sum_assured:
      metadata.max_sum_assured ||
      dbProduct.max_sum_assured ||
      dbProduct.recommended_sum_assured ||
      null,
    allow_quick_quote: metadata.allow_quick_quote ?? false,
    require_fact_finding: metadata.require_fact_finding ?? true,
  };
  const category = getProductCategory(merged);

  return {
    ...merged,
    image_url:
      metadata.image_url ||
      CATEGORY_IMAGES[category] ||
      CATEGORY_IMAGES.other,
  };
};

export default function Product() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [activeTab, setActiveTab] = useState("all");
  const [search, setSearch] = useState("");
  const [filterQuickQuote, setFilterQuickQuote] = useState("all");
  const [filterFactFind, setFilterFactFind] = useState("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const touchStartXRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const loadProducts = async () => {
      setLoading(true);
      setError(null);
      const { data, error: fetchError } = await supabase
        .from("products")
        .select("*")
        .order("product_name", { ascending: true });

      if (!isMounted) return;
      if (fetchError) {
        setError(fetchError.message || "Failed to load products");
      } else {
        const merged = (data || []).map(mergeProduct);
        setProducts(merged);
      }
      setLoading(false);
    };

    loadProducts();
    return () => {
      isMounted = false;
    };
  }, []);

  // Filter products based on active tab
  const filteredProducts = useMemo(() => {
    const byCategory =
      activeTab === "all"
        ? products
        : products.filter((p) => getProductCategory(p) === activeTab);

    const bySearch = search
      ? byCategory.filter((p) => {
          const haystack = `${p.product_name || ""} ${p.product_code || ""} ${p.description || ""}`.toLowerCase();
          return haystack.includes(search.toLowerCase());
        })
      : byCategory;

    const byQuickQuote =
      filterQuickQuote === "all"
        ? bySearch
        : bySearch.filter(
            (p) => Boolean(p.allow_quick_quote) === (filterQuickQuote === "yes"),
          );

    const byFactFind =
      filterFactFind === "all"
        ? byQuickQuote
        : byQuickQuote.filter(
            (p) =>
              Boolean(p.require_fact_finding) ===
              (filterFactFind === "yes"),
          );

    return byFactFind;
  }, [activeTab, products, search, filterQuickQuote, filterFactFind]);

  const handleTabChange = useCallback((value) => {
    setActiveTab(value);
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
        const currentIndex = CATEGORIES.findIndex(
          (cat) => cat.id === activeTab,
        );
        const targetIndex = currentIndex + direction;
        if (CATEGORIES[targetIndex]) {
          setActiveTab(CATEGORIES[targetIndex].id);
        }
      }
      touchStartXRef.current = null;
    },
    [activeTab],
  );

  const handleSelectProduct = useCallback((product) => {
    // Navigate to product detail (to be implemented)
    // For now, we can use a query param or state to show detail
    // But the plan says "Implement ProductDetail view", so we might want to route to a detail page or show it here.
    // Given the structure, let's assume we stay on page but render detail component if selected.
    // However, for better URL management, let's use query param ?productId=...
    navigate(`${createPageUrl("Product")}?productId=${product.id}`);
  }, [navigate]);

  // Check if a product is selected via URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedProductId = urlParams.get("productId");
  const selectedProduct = useMemo(() =>
    products.find(p => p.id === selectedProductId),
    [selectedProductId, products]);

  useMiraPageData(
    () => ({
      view: "product_catalog",
      activeTab,
      selectedProductId,
      search,
      filterQuickQuote,
      filterFactFind,
    }),
    [activeTab, selectedProductId, search, filterQuickQuote, filterFactFind],
  );

  // If a product is selected, render the Detail view (placeholder for now, will implement next)
  if (selectedProduct) {
    return <ProductDetailContainer product={selectedProduct} onBack={() => navigate(createPageUrl("Product"))} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md py-4 -mx-8 px-8 border-b border-slate-200/50 transition-all duration-200">
          <PageHeader
            title="Product Management"
            subtitle="Browse insurance solutions by line of business and generate a quote in seconds"
            icon={Calculator}
            className="mb-0"
          />

          <div className="mt-4" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd}>
            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
              <div className="-mx-2 overflow-x-auto pb-2 scrollbar-hide">
                <TabsList className="mx-2 flex w-max gap-2 border-none bg-transparent shadow-none p-0">
                  {CATEGORIES.map((category) => (
                    <TabsTrigger
                      key={category.id}
                      value={category.id}
                      className="rounded-full border border-slate-200 bg-white px-6 py-2.5 text-sm font-medium text-slate-600 shadow-sm transition-all data-[state=active]:border-primary-600 data-[state=active]:bg-primary-50 data-[state=active]:text-primary-700"
                    >
                      {category.label}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </div>
            </Tabs>
          </div>

          <div className="mt-4">
            <SearchFilterBar
              searchValue={search}
              onSearchChange={setSearch}
              placeholder="Search products, codes, or descriptions..."
              filterButton={
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={
                        filterQuickQuote !== "all" || filterFactFind !== "all"
                          ? "default"
                          : "outline"
                      }
                      size="icon"
                      className={
                        filterQuickQuote !== "all" || filterFactFind !== "all"
                          ? "bg-primary-600 text-white hover:bg-primary-700"
                          : ""
                      }
                      title="Filter products"
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900">
                          Filters
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFilterQuickQuote("all");
                            setFilterFactFind("all");
                          }}
                        >
                          Clear
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-600">
                          Allow Quick Quote
                        </div>
                        <Select
                          value={filterQuickQuote}
                          onValueChange={setFilterQuickQuote}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-600">
                          Require Fact Finding
                        </div>
                        <Select
                          value={filterFactFind}
                          onValueChange={setFilterFactFind}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="All" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">All</SelectItem>
                            <SelectItem value="yes">Yes</SelectItem>
                            <SelectItem value="no">No</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              }
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="min-h-[500px]">
          {loading ? (
            <Card className="border-slate-200 bg-slate-50">
              <CardContent className="p-12 text-center text-slate-500">
                Loading products...
              </CardContent>
            </Card>
          ) : error ? (
            <Card className="border-amber-200 bg-amber-50">
              <CardContent className="p-12 text-center text-amber-800">
                {error}
              </CardContent>
            </Card>
          ) : filteredProducts.length === 0 ? (
            <Card className="border-slate-200 bg-slate-50">
              <CardContent className="p-12 text-center text-slate-500">
                No products available in this category.
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {filteredProducts.map((product, index) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  index={index}
                  onClick={handleSelectProduct}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// Placeholder for ProductDetailContainer to avoid breaking build before next step
// We will replace this with the actual import in the next step
import { adviseUAdminApi } from "@/admin/api/adviseUAdminApi";
import ProductApplication from "@/admin/modules/product/components/ProductApplication";
import ProductDetail from "@/admin/modules/product/components/ProductDetail";
import ProductQuote from "@/admin/modules/product/components/ProductQuote";

function ProductDetailContainer({ product, onBack }) {
  const navigate = useNavigate();
  const urlParams = new URLSearchParams(window.location.search);
  const view = urlParams.get("view") || "detail";

  // State to hold quote result across views
  // In a real app, this might be in a context or URL params
  const [quoteData, setQuoteData] = useState(null);

  const handleGetQuote = (product) => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "quote");
    navigate(`${createPageUrl("Product")}?${params.toString()}`);
  };

  const handleProceedApplication = (result, formData) => {
    setQuoteData({ result, formData });
    const params = new URLSearchParams(window.location.search);
    params.set("view", "application");
    navigate(`${createPageUrl("Product")}?${params.toString()}`);
  };

  const handleStartProposal = async (result, formData) => {
    // Create a new proposal via API and navigate to it
    try {
      const newProposal = await adviseUAdminApi.entities.Proposal.create({
        product_id: product.id,
        product_name: product.product_name,
        status: "Draft",
        premium: result.annual,
        sum_assured: formData.sum_assured,
        policy_term: formData.policy_term,
        // Add other fields as needed
      });
      navigate(createPageUrl(`ProposalDetail?id=${newProposal.id}`));
    } catch (e) {
      console.error("Failed to create proposal", e);
      // Fallback or error handling
      alert("Simulating proposal creation...");
      navigate(createPageUrl("Proposal"));
    }
  };

  const handleBackToDetail = () => {
    const params = new URLSearchParams(window.location.search);
    params.delete("view");
    navigate(`${createPageUrl("Product")}?${params.toString()}`);
  };

  const handleBackToQuote = () => {
    const params = new URLSearchParams(window.location.search);
    params.set("view", "quote");
    navigate(`${createPageUrl("Product")}?${params.toString()}`);
  };

  if (view === "quote") {
    return (
      <ProductQuote
        product={product}
        onBack={handleBackToDetail}
        onProceedApplication={handleProceedApplication}
        onStartProposal={handleStartProposal}
      />
    );
  }

  if (view === "application") {
    return (
      <ProductApplication
        product={product}
        quoteResult={quoteData?.result || { total: 0 }} // Fallback if state lost on refresh
        onBack={handleBackToQuote}
        onComplete={onBack} // Back to list
      />
    );
  }

  return (
    <ProductDetail
      product={product}
      onBack={onBack}
      onGetQuote={handleGetQuote}
    />
  );
}

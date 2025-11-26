import { supabase } from "@/admin/api/supabaseClient";
import { Button } from "@/admin/components/ui/button";
import {
  Card,
  CardContent,
} from "@/admin/components/ui/card";
import {
  Dialog,
  DialogContent,
} from "@/admin/components/ui/dialog";
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
import { Tabs, TabsList, TabsTrigger } from "@/admin/components/ui/tabs";
import useMiraPageData from "@/admin/hooks/useMiraPageData.js";
import ProductCard from "@/admin/modules/product/components/ProductCard";
import { products as productSeed } from "@/admin/modules/product/data/products";
import { createPageUrl } from "@/admin/utils";
import {
  Calculator,
  Filter,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";

// Category definitions
const CATEGORIES = [
  { id: "all", labelKey: "all" },
  { id: "life", labelKey: "life" },
  { id: "health", labelKey: "health" },
  { id: "general", labelKey: "general" },
  { id: "group", labelKey: "group" },
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
  const { t } = useTranslation();
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
        setError(fetchError.message || t("product.errors.load"));
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
    navigate(`${createPageUrl("Product")}?productId=${product.id}`);
  }, [navigate]);

  // Check if a product is selected via URL
  const urlParams = new URLSearchParams(window.location.search);
  const selectedProductId = urlParams.get("productId");
  const selectedProduct = useMemo(() =>
    products.find(p => p.id === selectedProductId),
    [selectedProductId, products]);

  const handleCloseDetail = () => {
    navigate(createPageUrl("Product"));
  };

  const handleGetQuote = (product) => {
    // Redirect to New Business with QA journey and product selected
    navigate(createPageUrl(`NewBusiness?action=new&journeyType=QA&productId=${product.id}`));
  };

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
  // if (selectedProduct) {
  //   return <ProductDetailContainer product={selectedProduct} onBack={() => navigate(createPageUrl("Product"))} />;
  // }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-8">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Sticky Header */}
        <div className="sticky top-0 z-20 bg-white/80 backdrop-blur-md py-4 -mx-8 px-8 border-b border-slate-200/50 transition-all duration-200">
          <PageHeader
            title={t("product.title")}
            subtitle={t("product.subtitle")}
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
                      {t(`product.categories.${category.labelKey}`)}
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
              placeholder={t("product.filters.searchPlaceholder")}
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
                      title={t("product.filters.title")}
                    >
                      <Filter className="h-4 w-4" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-72">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-semibold text-slate-900">
                          {t("product.filters.title")}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setFilterQuickQuote("all");
                            setFilterFactFind("all");
                          }}
                        >
                          {t("product.filters.clear")}
                        </Button>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-600">
                          {t("product.filters.quickQuote")}
                        </div>
                        <Select
                          value={filterQuickQuote}
                          onValueChange={setFilterQuickQuote}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("product.filters.all")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("product.filters.all")}</SelectItem>
                            <SelectItem value="yes">{t("product.filters.yes")}</SelectItem>
                            <SelectItem value="no">{t("product.filters.no")}</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <div className="text-xs font-semibold text-slate-600">
                          {t("product.filters.factFind")}
                        </div>
                        <Select
                          value={filterFactFind}
                          onValueChange={setFilterFactFind}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={t("product.filters.all")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">{t("product.filters.all")}</SelectItem>
                            <SelectItem value="yes">{t("product.filters.yes")}</SelectItem>
                            <SelectItem value="no">{t("product.filters.no")}</SelectItem>
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
                {t("product.status.loading")}
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
                {t("product.empty.title")}
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
      {/* Product Detail Modal */}
      <Dialog open={!!selectedProduct} onOpenChange={(open) => !open && handleCloseDetail()}>
        <DialogContent className="max-w-5xl h-[90vh] overflow-y-auto p-0">
          {selectedProduct && (
            <div className="p-6">
              <ProductDetail
                product={selectedProduct}
                onBack={handleCloseDetail}
                onGetQuote={handleGetQuote}
                isModal={true}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Placeholder for ProductDetailContainer to avoid breaking build before next step
// We will replace this with the actual import in the next step
import ProductDetail from "@/admin/modules/product/components/ProductDetail";

// ProductDetailContainer removed as we now use Modal

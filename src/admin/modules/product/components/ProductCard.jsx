import { Badge } from "@/admin/components/ui/badge";
import { Button } from "@/admin/components/ui/button";
import { Card, CardContent } from "@/admin/components/ui/card";
import { ChevronRight } from "lucide-react";

const fallbackImages = [
    "/images/products/product-card-1.png",
    "/images/products/product-card-2.png",
    "/images/products/product-card-3.png",
];

const ProductImage = ({ index, imageUrl }) => {
    const src = imageUrl || fallbackImages[index % fallbackImages.length];

    return (
        <div className="relative h-[200px] w-full overflow-hidden rounded-t-xl bg-slate-100">
            <img
                src={src}
                alt="Product"
                className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                onError={(e) => {
                    e.target.style.display = 'none';
                    e.target.nextSibling.style.display = 'flex';
                }}
            />
            <div className="hidden absolute inset-0 items-center justify-center bg-slate-200 text-slate-400">
                No Image
            </div>
        </div>
    );
};

export default function ProductCard({ product, index, onClick }) {
    return (
        <Card
            className="group cursor-pointer overflow-hidden rounded-xl border border-slate-200 shadow-sm transition-all hover:-translate-y-1 hover:shadow-xl"
            onClick={() => onClick(product)}
        >
            <ProductImage index={index} imageUrl={product.image_url} />
            <CardContent className="flex flex-col gap-4 p-5">
                <div className="space-y-2">
                    <div className="flex items-start justify-between gap-2">
                        <h3 className="text-lg font-bold text-slate-900 group-hover:text-primary-600 line-clamp-2">
                            {product.product_name}
                        </h3>
                    </div>
                    <p className="line-clamp-2 text-sm text-slate-600 min-h-[40px]">
                        {product.description}
                    </p>
                </div>

                <div className="flex flex-wrap gap-2">
                    <Badge
                        variant="secondary"
                        className="rounded-full bg-slate-100 text-xs font-semibold text-slate-600 hover:bg-slate-200"
                    >
                        {product.product_type}
                    </Badge>
                    {product.need_type?.slice(0, 2).map((tag) => (
                        <Badge
                            key={tag}
                            variant="outline"
                            className="rounded-full border-slate-200 text-xs text-slate-500"
                        >
                            {tag}
                        </Badge>
                    ))}
                </div>

                <div className="mt-auto flex items-center justify-between pt-2">
                    <span className="text-sm font-medium text-primary-600 group-hover:underline">
                        Learn more
                    </span>
                    <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 rounded-full bg-slate-50 text-slate-400 group-hover:bg-primary-50 group-hover:text-primary-600"
                    >
                        <ChevronRight className="h-4 w-4" />
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}

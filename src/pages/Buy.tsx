import { useState } from "react";
import { Link, useSearchParams } from "react-router";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/providers/trpc";
import {
  Search,
  ShoppingCart,
  Heart,
  Star,
  ChevronLeft,
  ChevronRight,
  SlidersHorizontal,
  List,
  LayoutGrid,
  ArrowRight,
  Sparkles,
} from "lucide-react";

const categories = [
  { value: "all", label: "Semua Kategori" },
  { value: "t-shirt", label: "T-Shirt" },
  { value: "hoodie", label: "Hoodie" },
  { value: "sweater", label: "Sweater" },
  { value: "jacket", label: "Jacket" },
  { value: "tank-top", label: "Tank Top" },
];

const sortOptions = [
  { value: "newest", label: "Terbaru" },
  { value: "price-low", label: "Harga Terendah" },
  { value: "price-high", label: "Harga Tertinggi" },
  { value: "rating", label: "Rating Tertinggi" },
  { value: "popular", label: "Paling Populer" },
];

const demoProducts = [
  { id: 1, name: "Street Graffiti Hoodie", category: "hoodie", rating: "4.8", reviewCount: 128, price: "24.99", image: "/products/product-1.png", creatorName: "Urban Creator", isNew: true, colors: ["#1F2937", "#FFFFFF", "#6D4AFF"] },
  { id: 2, name: "Skull Floral Tee", category: "t-shirt", rating: "4.7", reviewCount: 89, price: "19.99", image: "/products/product-2.png", creatorName: "Dark Vision", isNew: false, colors: ["#000000", "#374151"] },
  { id: 3, name: "Sunset Vibes Sweater", category: "sweater", rating: "4.9", reviewCount: 156, price: "29.99", image: "/products/product-3.png", creatorName: "Creative Soul", isNew: false, colors: ["#F5F5DC", "#FFFFFF"] },
  { id: 4, name: "Neon Space Tank", category: "tank-top", rating: "4.6", reviewCount: 67, price: "16.99", image: "/products/product-4.png", creatorName: "Neon Art", isNew: false, colors: ["#000000", "#1F2937"] },
  { id: 5, name: "Never Stop Dreaming Hoodie", category: "hoodie", rating: "4.8", reviewCount: 203, price: "27.99", image: "/products/product-5.png", creatorName: "Motivasi Store", isNew: false, colors: ["#556B2F", "#1F2937"] },
  { id: 6, name: "Minimalist Line Art Tee", category: "t-shirt", rating: "4.5", reviewCount: 92, price: "17.99", image: "/products/product-6.png", creatorName: "Minimal Studio", isNew: false, colors: ["#FFFFFF", "#F9FAFB"] },
  { id: 7, name: "Cyberpunk Jacket", category: "jacket", rating: "4.9", reviewCount: 134, price: "39.99", image: "/products/product-7.png", creatorName: "Future Wear", isNew: true, colors: ["#000000", "#1F2937"] },
  { id: 8, name: "Japanese Wave Tee", category: "t-shirt", rating: "4.8", reviewCount: 111, price: "18.99", image: "/products/product-9.png", creatorName: "Asian Culture", isNew: false, colors: ["#FFFFFF", "#F5F5DC"] },
  { id: 9, name: "Galaxy Hoodie", category: "hoodie", rating: "4.6", reviewCount: 95, price: "26.99", image: "/products/product-10.png", creatorName: "Space Creator", isNew: false, colors: ["#000000", "#1F2937", "#374151"] },
  { id: 10, name: "Butterfly Dream Sweater", category: "sweater", rating: "4.8", reviewCount: 142, price: "28.99", image: "/products/product-11.png", creatorName: "Dreamy Design", isNew: false, colors: ["#FFFFFF", "#F5F5DC"] },
  { id: 11, name: "Urban Backpack 3D", category: "asset-3d", rating: "4.9", reviewCount: 66, price: "22.99", image: "/products/product-12.png", creatorName: "3D Gear", isNew: false, colors: ["#6B7280", "#374151"] },
];

function ProductCard({ product }: { product: typeof demoProducts[0] }) {
  const [wishlisted, setWishlisted] = useState(false);

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-350">
      {/* Image */}
      <div className="relative aspect-square bg-[#F9FAFB] overflow-hidden">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-500"
        />
        {product.isNew && (
          <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-[#6D4AFF] text-white text-[10px] font-bold">
            New
          </span>
        )}
        <button
          onClick={() => setWishlisted(!wishlisted)}
          className={`absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center transition-all ${wishlisted
              ? "bg-red-50 text-red-500"
              : "bg-white/80 text-gray-400 hover:text-red-400"
            }`}
        >
          <Heart
            className={`w-4 h-4 ${wishlisted ? "fill-current" : ""}`}
          />
        </button>

        {/* Color dots */}
        <div className="absolute bottom-3 left-3 flex gap-1">
          {product.colors.map((c) => (
            <div
              key={c}
              className="w-3.5 h-3.5 rounded-full border border-white/80 shadow-sm"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm font-semibold text-gray-900 mb-1 truncate">
          {product.name}
        </h3>
        <p className="text-xs text-gray-400 capitalize mb-2">
          {product.category}
        </p>

        <div className="flex items-center gap-1.5 mb-3">
          <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
          <span className="text-xs font-medium text-gray-700">
            {product.rating}
          </span>
          <span className="text-xs text-gray-400">
            ({product.reviewCount})
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-lg font-bold text-[#6D4AFF]">
            ${product.price}
          </span>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-[#EDE9FE] flex items-center justify-center">
              <span className="text-[8px] font-bold text-[#6D4AFF]">
                {product.creatorName.charAt(0)}
              </span>
            </div>
            <span className="text-[10px] text-gray-500 truncate max-w-[60px]">
              {product.creatorName}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Buy() {
  const [searchParams] = useSearchParams();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState(searchParams.get("category") || "all");
  const [sort, setSort] = useState("newest");
  const [page, setPage] = useState(1);

  const { data: apiProducts } = trpc.product.list.useQuery(
    {
      category: category === "all" ? undefined : category,
      search: search || undefined,
      sort,
      page,
      limit: 12,
    },
    { placeholderData: (prev) => prev }
  );

  const products =
    apiProducts?.products && apiProducts.products.length > 0
      ? apiProducts.products.map((p) => ({
        id: p.id,
        name: p.name,
        category: p.category,
        rating: p.rating,
        reviewCount: p.reviewCount,
        price: p.price,
        image: p.image || "/hero-tshirt.png",
        creatorName: p.creatorName || "Unknown",
        isNew: p.isNew,
        colors: (p.colors as string[] | null) || ["#1F2937", "#FFFFFF"],
      }))
      : demoProducts;

  const totalProducts = apiProducts?.total ?? demoProducts.length;

  return (
    <Layout>
      {/* Wrapper baru untuk memberikan background gradasi ungu muda ke putih full screen */}
      <div className="min-h-screen w-full bg-gradient-to-b from-[#F5F3FF] to-white pb-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-8">

          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mb-6">
            <div className="flex items-center gap-2 shrink-0">
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger className="w-[130px] h-10 text-sm border-gray-200 bg-white">
                  <SlidersHorizontal className="w-4 h-4 mr-1" />
                  <SelectValue placeholder="Kategori" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.value} value={c.value}>
                      {c.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="flex-1 relative max-w-[480px] mx-auto w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Cari desain, kategori, atau kreator..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10 pr-4 h-10 rounded-full border-gray-200 focus:border-[#6D4AFF] focus:ring-[#6D4AFF]/10 bg-white"
              />
            </div>

            <button className="relative p-2.5 rounded-xl border border-gray-200 bg-white hover:border-[#6D4AFF] hover:text-[#6D4AFF] transition-colors shrink-0">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#6D4AFF] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                3
              </span>
            </button>
          </div>

          {/* Results Header */}
          <div className="flex items-center justify-between mb-6">
            <p className="text-sm font-medium text-gray-900">
              {totalProducts} Produk Ditampilkan
            </p>
            <div className="flex items-center gap-3">
              <Select value={sort} onValueChange={setSort}>
                <SelectTrigger className="w-[140px] h-9 text-xs border-gray-200 bg-white">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {sortOptions.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="hidden sm:flex items-center bg-white border border-gray-200 rounded-lg p-0.5">
                <button className="p-1.5 rounded-md bg-[#F5F3FF] shadow-sm text-[#6D4AFF]">
                  <LayoutGrid className="w-4 h-4" />
                </button>
                <button className="p-1.5 rounded-md text-gray-400 hover:text-gray-600">
                  <List className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>

          {/* Product Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-center gap-1.5 mt-10">
            <button
              onClick={() => setPage(Math.max(1, page - 1))}
              disabled={page === 1}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 bg-white border border-gray-100 disabled:opacity-30 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            {[1, 2, 3].map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-colors ${page === p
                    ? "bg-[#6D4AFF] text-white shadow-md shadow-[#6D4AFF]/20"
                    : "text-gray-600 hover:bg-gray-100 bg-white border border-gray-100"
                  }`}
              >
                {p}
              </button>
            ))}
            <span className="text-gray-400 px-1">...</span>
            <button className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-gray-600 hover:bg-gray-100 bg-white border border-gray-100 transition-colors">
              21
            </button>
            <button
              onClick={() => setPage(page + 1)}
              className="w-9 h-9 rounded-full flex items-center justify-center text-gray-500 hover:bg-gray-100 bg-white border border-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Creator CTA - Diubah menjadi putih dan berbayang agar lebih menonjol */}
          <div className="mt-16 bg-white border border-[#EDE9FE] shadow-sm hover:shadow-md transition-shadow rounded-2xl p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#F5F3FF] flex items-center justify-center shrink-0">
                <Sparkles className="w-6 h-6 text-[#6D4AFF]" />
              </div>
              <div>
                <h3 className="text-base font-bold text-gray-900">
                  Jadi Kreator & Jual Desainmu
                </h3>
                <p className="text-sm text-gray-500">
                  Bergabung dengan ribuan kreator dan dapatkan penghasilan dari
                  setiap desain yang terjual.
                </p>
              </div>
            </div>
            <Link to="/studio">
              <Button className="bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white shrink-0 shadow-lg shadow-[#6D4AFF]/20">
                Mulai Jadi Kreator
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

        </div>
      </div>
    </Layout>
  );
}
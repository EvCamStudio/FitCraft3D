import { useState } from "react";
import { Link } from "react-router";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  ShoppingCart,
  Trash2,
  Minus,
  Plus,
  Tag,
  ArrowRight,
  ShieldCheck,
  CreditCard,
  RefreshCw,
  Truck,
  Clock,
  Lock,
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  image: string;
  color: string;
  size: string;
  price: number;
  quantity: number;
  hasCustomDesign: boolean;
}

const initialItems: CartItem[] = [
  { id: 1, name: "Street Graffiti Hoodie", image: "/products/product-1.png", color: "Putih", size: "L", price: 49.99, quantity: 1, hasCustomDesign: true },
  { id: 2, name: "Skull Floral Tee", image: "/products/product-2.png", color: "Hitam", size: "M", price: 19.99, quantity: 2, hasCustomDesign: true },
  { id: 3, name: "Nature Vibes Sweater", image: "/products/product-3.png", color: "Beige", size: "XL", price: 44.99, quantity: 1, hasCustomDesign: true },
];

export default function Cart() {
  const [items, setItems] = useState<CartItem[]>(initialItems);
  const [promoCode, setPromoCode] = useState("");
  const [appliedPromo, setAppliedPromo] = useState<string | null>("FITCRAFT10");

  const updateQuantity = (id: number, delta: number) => {
    setItems(
      items.map((item) =>
        item.id === id
          ? { ...item, quantity: Math.max(1, item.quantity + delta) }
          : item
      )
    );
  };

  const removeItem = (id: number) => {
    setItems(items.filter((item) => item.id !== id));
  };

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = appliedPromo ? subtotal * 0.1 : 0;
  const shipping = 5.0;
  const total = subtotal - discount + shipping;

  return (
    <Layout>
      <div className="min-h-screen w-full bg-gradient-to-b from-[#F5F3FF] to-white pb-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <ShoppingCart className="w-7 h-7 text-[#6D4AFF]" />
                Keranjang Belanja
              </h1>
              <p className="text-sm text-gray-500 mt-1">Review produk yang akan kamu beli</p>
            </div>
            <Link to="/buy" className="flex items-center gap-2 text-sm text-[#6D4AFF] font-medium hover:underline">
              <ArrowRight className="w-4 h-4 rotate-180" /> Lanjut Belanja
            </Link>
          </div>

          <div className="flex flex-col lg:flex-row gap-8">
            {/* Cart Items */}
            <div className="flex-1">
              {items.length === 0 ? (
                <div className="bg-white rounded-2xl p-12 text-center shadow-lg border border-gray-100">
                  <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Keranjang Kosong</h3>
                  <p className="text-sm text-gray-500 mb-6">Yuk mulai belanja dan temukan desain keren!</p>
                  <Link to="/buy"><Button className="bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white">Jelajahi Produk</Button></Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {items.map((item) => (
                    <div key={item.id} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 flex flex-col sm:flex-row items-start sm:items-center gap-4">
                      <div className="flex items-center gap-3">
                        <input type="checkbox" checked className="w-4 h-4 rounded border-gray-300 text-[#6D4AFF] accent-[#6D4AFF]" />
                        <div className="w-20 h-20 rounded-xl bg-[#F9FAFB] flex items-center justify-center p-2">
                          <img src={item.image} alt={item.name} className="w-full h-full object-contain" />
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-sm font-semibold text-gray-900 mb-1">{item.name}</h3>
                        <p className="text-xs text-gray-400 mb-2">Warna: {item.color} &bull; Ukuran: {item.size}</p>
                        {item.hasCustomDesign && (
                          <div className="flex gap-2">
                            <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#EDE9FE] text-[#6D4AFF] font-medium">Custom Design</span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-6 ml-auto">
                        <div className="flex items-center bg-[#F9FAFB] rounded-lg">
                          <button onClick={() => updateQuantity(item.id, -1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#6D4AFF]"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="w-8 text-center text-sm font-medium text-gray-900">{item.quantity}</span>
                          <button onClick={() => updateQuantity(item.id, 1)} className="w-8 h-8 flex items-center justify-center text-gray-500 hover:text-[#6D4AFF]"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <div className="text-right">
                          <p className="text-base font-bold text-gray-900">${(item.price * item.quantity).toFixed(2)}</p>
                        </div>
                        <button onClick={() => removeItem(item.id)} className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}

                  {/* Trust Bar */}
                  <div className="bg-white rounded-2xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-gray-100 shadow-sm">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900 mb-1">Belanja Aman & Terpercaya</h4>
                      <p className="text-xs text-gray-500">Semua transaksi dilindungi dengan sistem keamanan berlapis.</p>
                    </div>
                    <div className="flex items-center gap-4">
                      {[CreditCard, ShieldCheck, RefreshCw].map((Icon, i) => (
                        <div key={i} className="flex items-center gap-1.5 text-gray-500"><Icon className="w-4 h-4" /> <span className="text-[10px] font-medium">Secure</span></div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            <div className="w-full lg:w-[340px] shrink-0 space-y-4">
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                <h3 className="text-base font-bold text-gray-900 mb-5">Ringkasan Pesanan</h3>
                <div className="space-y-3 mb-4 text-sm">
                  <div className="flex justify-between"><span className="text-gray-500">Subtotal</span><span className="font-medium">${subtotal.toFixed(2)}</span></div>
                  <div className="flex justify-between"><span className="text-gray-500">Ongkir</span><span className="font-medium">${shipping.toFixed(2)}</span></div>
                </div>

                <div className="flex gap-2 mb-4">
                  <div className="flex-1 relative"><Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" /><Input placeholder="Kode promo" className="pl-9 h-10 rounded-xl text-sm" /></div>
                  <Button variant="outline" size="sm" className="h-10 px-4">Terapkan</Button>
                </div>

                <div className="border-t border-gray-100 pt-4 mb-5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-gray-900">Total</span>
                    <span className="text-2xl font-extrabold text-[#6D4AFF]">${total.toFixed(2)}</span>
                  </div>
                </div>

                <Button className="w-full h-12 bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white font-semibold rounded-xl"><Lock className="w-4 h-4 mr-2" /> Checkout Sekarang</Button>
              </div>

              {/* Info Cards */}
              <div className="space-y-3">
                {[{ icon: Truck, title: "Gratis Ongkir", desc: "Pembelian di atas $75" }, { icon: Clock, title: "Estimasi", desc: "2 - 5 hari kerja" }].map((item) => (
                  <div key={item.title} className="bg-white rounded-xl p-4 border border-gray-100 shadow-sm flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg bg-[#F5F3FF] flex items-center justify-center"><item.icon className="w-4 h-4 text-[#6D4AFF]" /></div>
                    <div><h4 className="text-xs font-semibold text-gray-900">{item.title}</h4><p className="text-[10px] text-gray-500">{item.desc}</p></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
import { useState } from "react";
import { Link, useNavigate } from "react-router";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  FolderOpen,
  Heart,
  ClipboardList,
  Settings,
  LogOut,
  Crown,
  ChevronRight,
  MoreVertical,
  ShoppingCart,
  Expand,
} from "lucide-react";

const myDesigns = [
  { id: 1, name: "Street Graffiti Hoodie", image: "/products/product-1.png", date: "Diedit 2 hari lalu" },
  { id: 2, name: "Skull Floral Tee", image: "/products/product-2.png", date: "Diedit 5 hari lalu" },
  { id: 3, name: "Nature Vibes Sweater", image: "/products/product-3.png", date: "Diedit 1 minggu lalu" },
  { id: 4, name: "Neon Space Tank", image: "/products/product-4.png", date: "Diedit 2 minggu lalu" },
  { id: 5, name: "Japanese Wave Tee", image: "/products/product-9.png", date: "Diedit 2 minggu lalu" },
];

const templates = [
  { id: 1, name: "Galaxy Hoodie", image: "/products/product-10.png" },
  { id: 2, name: "Anime Street Tee", image: "/products/product-9.png" },
  { id: 3, name: "Cyberpunk Jacket", image: "/products/product-7.png" },
  { id: 4, name: "Butterfly Sweater", image: "/products/product-11.png" },
  { id: 5, name: "Dragon Tank Top", image: "/products/product-4.png" },
];

const orders = [
  { id: "FC-1021", name: "Cyberpunk Jacket", image: "/products/product-7.png", date: "12 Mei 2026", status: "Selesai" },
  { id: "FC-1022", name: "Anime Hoodie", image: "/products/product-10.png", date: "08 Mei 2026", status: "Dikirim" },
  { id: "FC-1023", name: "Minimalist Line Tee", image: "/products/product-6.png", date: "01 Mei 2026", status: "Diproses" },
];

const sidebarMenu = [
  { icon: FolderOpen, label: "My Designs", active: true },
  { icon: Heart, label: "Wishlist", active: false },
  { icon: ClipboardList, label: "Order History", active: false },
  { icon: Settings, label: "Account Settings", active: false },
];

export default function Dashboard() {
  const { user, logout } = useAuth();
  const [activeMenu, setActiveMenu] = useState("My Designs");
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn"); // Menghapus memori login
    if (logout) logout();
    navigate("/"); // Ubah dari "/login" menjadi "/" (Home Page)
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Selesai": return "bg-green-100 text-green-700";
      case "Dikirim": return "bg-blue-100 text-blue-700";
      case "Diproses": return "bg-amber-100 text-amber-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  return (
    <Layout>
      {/* Tambahin div gradasi di sini aja */}
      <div className="min-h-screen bg-gradient-to-b from-[#F5F3FF] to-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 py-8">
          <div className="flex flex-col lg:flex-row gap-6">
            <div className="flex-1">
              <div className="bg-white rounded-2xl p-6 lg:p-8 shadow-card mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-xl lg:text-2xl font-bold text-gray-900 mb-1">
                    Welcome back, <span className="text-gradient">{user?.name || "User"}</span>! 👋
                  </h1>
                  <p className="text-sm text-gray-500">Mulai desain 3D apparel kamu sekarang dan wujudkan ide kreatifmu tanpa batas.</p>
                </div>
                <Link to="/studio">
                  <Button className="bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white gap-2">
                    <Plus className="w-4 h-4" /> Buat Desain Baru
                  </Button>
                </Link>
              </div>

              <div className="mb-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-base font-bold text-gray-900">My Designs</h2>
                  <button className="text-xs text-[#6D4AFF] font-medium flex items-center gap-1 hover:underline">
                    Lihat Semua <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
                  {myDesigns.map((design) => (
                    <div key={design.id} className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 group">
                      <div className="relative aspect-square bg-[#F9FAFB] p-3">
                        <img src={design.image} alt={design.name} className="w-full h-full object-contain" />
                        <button className="absolute top-2 right-2 w-6 h-6 rounded-full bg-white/80 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="w-3 h-3 text-gray-500" />
                        </button>
                        <button className="absolute bottom-2 right-2 w-7 h-7 rounded-full bg-[#6D4AFF] flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <ShoppingCart className="w-3.5 h-3.5 text-white" />
                        </button>
                      </div>
                      <div className="p-3">
                        <h4 className="text-xs font-semibold text-gray-900 truncate">{design.name}</h4>
                        <p className="text-[10px] text-gray-400 mt-0.5">{design.date}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">Templates for You</h2>
                    <button className="text-xs text-[#6D4AFF] font-medium flex items-center gap-1 hover:underline">Lihat Semua <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  <div className="grid grid-cols-5 gap-3">
                    {templates.map((t) => (
                      <div key={t.id} className="bg-white rounded-xl overflow-hidden shadow-card hover:shadow-card-hover hover:-translate-y-0.5 transition-all duration-300 cursor-pointer">
                        <div className="aspect-square bg-[#F9FAFB] p-2"><img src={t.image} alt={t.name} className="w-full h-full object-contain" /></div>
                        <div className="p-2"><p className="text-[10px] font-medium text-gray-700 truncate">{t.name}</p></div>
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-gray-900">Recent Orders</h2>
                    <button className="text-xs text-[#6D4AFF] font-medium flex items-center gap-1 hover:underline">Lihat Semua <ChevronRight className="w-3 h-3" /></button>
                  </div>
                  <div className="space-y-2">
                    {orders.map((order) => (
                      <div key={order.id} className="bg-white rounded-xl p-3 shadow-card flex items-center gap-3">
                        <span className="text-xs font-bold text-[#6D4AFF] shrink-0">#{order.id}</span>
                        <div className="w-10 h-10 rounded-lg bg-[#F9FAFB] flex items-center justify-center shrink-0"><img src={order.image} alt="" className="w-8 h-8 object-contain" /></div>
                        <div className="flex-1 min-w-0"><h4 className="text-xs font-semibold text-gray-900 truncate">{order.name}</h4><p className="text-[10px] text-gray-400">{order.date}</p></div>
                        <span className={`text-[10px] font-semibold px-2.5 py-1 rounded-full shrink-0 ${getStatusColor(order.status)}`}>{order.status}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div className="w-full lg:w-[260px] shrink-0 space-y-4">
              <div className="bg-white rounded-2xl p-5 shadow-card">
                <div className="flex items-center gap-3 mb-4">
                  <img src={user?.avatar || "/team/team-2.png"} alt="" className="w-12 h-12 rounded-full object-cover border-2 border-[#EDE9FE]" />
                  <div>
                    <h3 className="text-sm font-bold text-gray-900">{user?.name || "User"}</h3>
                    <p className="text-xs text-gray-400">{user?.email || "user@example.com"}</p>
                  </div>
                </div>
                <div className="space-y-1">
                  {sidebarMenu.map((item) => (
                    <button key={item.label} onClick={() => setActiveMenu(item.label)} className={`flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm transition-all ${activeMenu === item.label ? "bg-[#F5F3FF] text-[#6D4AFF] border-l-[3px] border-l-[#6D4AFF]" : "text-gray-600 hover:bg-gray-50"}`}>
                      <item.icon className="w-4 h-4" /> {item.label}
                    </button>
                  ))}
                  <button onClick={handleLogout} className="flex items-center gap-3 w-full px-3 py-2.5 rounded-xl text-sm text-red-500 hover:bg-red-50 transition-all"><LogOut className="w-4 h-4" /> Logout</button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}
import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Box,
  ShoppingCart,
  Menu,
  X,
  Home,
  Shirt,
  ShoppingBag,
  Info,
  LogOut,
  User,
} from "lucide-react";

const navLinks = [
  { path: "/", label: "Home", icon: Home },
  { path: "/studio", label: "Studio", icon: Shirt },
  { path: "/buy", label: "Buy", icon: ShoppingBag },
  { path: "/about", label: "About Us", icon: Info },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // 1. Ganti jadi null biar React tahu statusnya belum diketahui pas pertama kali load
  const [isLoggedIn, setIsLoggedIn] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
    // 2. Cek status login
    const status = localStorage.getItem("isLoggedIn") === "true";
    setIsLoggedIn(status);
  }, [location.pathname]);

  const isActive = (path: string) => location.pathname === path;
  const dummyUser = { name: "Alex", avatar: "/team/team-2.png" };

  const handleLogout = () => {
    localStorage.removeItem("isLoggedIn");
    setIsLoggedIn(false);
    navigate("/login");
  };

  return (
    <>
      <nav className={`fixed top-0 left-0 right-0 z-50 h-16 transition-all duration-300 ${scrolled ? "glass shadow-navbar" : "bg-transparent"}`}>
        <div className="max-w-[1280px] mx-auto h-full flex items-center justify-between px-4 sm:px-6 lg:px-10">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <div className="w-8 h-8 rounded-lg bg-gradient-purple flex items-center justify-center">
              <Box className="w-5 h-5 text-white" />
            </div>
            <span className="text-lg font-bold text-gray-900 tracking-tight">
              FitCraft <span className="text-[#6D4AFF]">3D</span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.path} to={link.path} className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${isActive(link.path) ? "text-[#6D4AFF] bg-[#F5F3FF]" : "text-gray-600 hover:text-[#6D4AFF] hover:bg-gray-50"}`}>
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button onClick={() => navigate("/cart")} className="relative p-2 rounded-lg text-gray-600 hover:text-[#6D4AFF] hover:bg-gray-50 transition-all">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-[#6D4AFF] text-white text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
            </button>

            {/* 3. Logic render: Jangan nampilin apa-apa kalau isLoggedIn masih null */}
            {isLoggedIn !== null && (
              isLoggedIn ? (
                <div className="hidden sm:flex items-center">
                  <button onClick={() => navigate("/dashboard")} className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 hover:border-[#6D4AFF] hover:bg-[#F5F3FF] transition-all">
                    <img src={dummyUser.avatar} alt="User Avatar" className="w-7 h-7 rounded-full object-cover border border-gray-100" />
                    <span className="text-sm font-medium text-gray-700 max-w-[80px] truncate">{dummyUser.name}</span>
                  </button>
                </div>
              ) : (
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="sm" onClick={() => navigate("/login")} className="text-gray-600 hover:text-[#6D4AFF]">Sign In</Button>
                  <Button size="sm" onClick={() => navigate("/login")} className="bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white shadow-button">Get Started</Button>
                </div>
              )
            )}

            <button onClick={() => setMobileOpen(!mobileOpen)} className="md:hidden p-2 rounded-lg text-gray-600 hover:bg-gray-50">
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </nav>
      {/* ... (Mobile menu overlay tetap sama) ... */}
    </>
  );
}
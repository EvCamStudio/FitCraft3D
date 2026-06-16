import { Link } from "react-router";
import { Box, Facebook, Instagram, Youtube } from "lucide-react";

const footerLinks = {
  product: {
    title: "Product",
    links: [
      { label: "Hoodie", href: "/buy?category=hoodie" },
      { label: "T-Shirt", href: "/buy?category=t-shirt" },
      { label: "Sweater", href: "/buy?category=sweater" },
      { label: "Jacket", href: "/buy?category=jacket" },
      { label: "Semua Produk", href: "/buy" },
    ],
  },
  templates: {
    title: "Templates",
    links: [
      { label: "Semua Template", href: "/studio" },
      { label: "Terbaru", href: "/studio" },
      { label: "Populer", href: "/studio" },
      { label: "Kategori", href: "/studio" },
    ],
  },
  help: {
    title: "Bantuan",
    links: [
      { label: "Cara Kerja", href: "/about" },
      { label: "FAQ", href: "/about" },
      { label: "Panduan", href: "/studio" },
      { label: "Kontak Kami", href: "/about" },
    ],
  },
  company: {
    title: "Perusahaan",
    links: [
      { label: "Tentang Kami", href: "/about" },
      { label: "Karir", href: "/about" },
      { label: "Blog", href: "/about" },
      { label: "Kebijakan Privasi", href: "/about" },
    ],
  },
};

export default function Footer() {
  return (
    <footer className="bg-[#0F0F1A] text-gray-400">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10 pt-16 pb-8">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Column */}
          <div className="col-span-2 md:col-span-3 lg:col-span-1 mb-4 lg:mb-0">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-gradient-purple flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-white tracking-tight">
                FitCraft <span className="text-[#A78BFA]">3D</span>
              </span>
            </Link>
            <p className="text-sm text-gray-500 mb-6 max-w-[240px]">
              Platform desain apparel 3D terbaik untuk mewujudkan ide kreatifmu
              menjadi produk nyata berkualitas tinggi.
            </p>
            <div className="flex items-center gap-3">
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#6D4AFF] hover:text-white transition-all"
              >
                <Facebook className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#6D4AFF] hover:text-white transition-all"
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#6D4AFF] hover:text-white transition-all"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
                </svg>
              </a>
              <a
                href="#"
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center hover:bg-[#6D4AFF] hover:text-white transition-all"
              >
                <Youtube className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link Columns */}
          {Object.values(footerLinks).map((section) => (
            <div key={section.title}>
              <h4 className="text-white font-semibold text-sm mb-4">
                {section.title}
              </h4>
              <ul className="space-y-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-gray-500 hover:text-[#A78BFA] transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 pt-6 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-gray-600">
            &copy; 2026 FitCraft 3D. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <span className="text-xs text-gray-600">Bahasa: Indonesia</span>
            <Link
              to="/about"
              className="text-xs text-gray-600 hover:text-gray-400 transition-colors"
            >
              Syarat & Ketentuan
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Box, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#F5F3FF] to-white">
      <div className="text-center px-4">
        <div className="w-20 h-20 rounded-2xl bg-gradient-purple flex items-center justify-center mx-auto mb-6">
          <Box className="w-10 h-10 text-white" />
        </div>
        <h1 className="text-6xl font-extrabold text-gray-900 mb-2">404</h1>
        <p className="text-lg text-gray-500 mb-2">Halaman Tidak Ditemukan</p>
        <p className="text-sm text-gray-400 mb-8 max-w-[300px] mx-auto">
          Maaf, halaman yang kamu cari tidak ada atau telah dipindahkan.
        </p>
        <Link to="/">
          <Button className="bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white gap-2">
            <ArrowLeft className="w-4 h-4" />
            Kembali ke Beranda
          </Button>
        </Link>
      </div>
    </div>
  );
}

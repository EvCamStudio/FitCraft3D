import { useState } from "react";
import { Link, useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Box,
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  Layout,
  PenTool,
  Cloud,
  ShieldCheck,
  ArrowRight,
} from "lucide-react";

// Tambahkan array benefits yang sama dengan halaman login
const benefits = [
  { icon: Layout, title: "Template Premium", desc: "Akses ribuan template 3D berkualitas tinggi siap pakai." },
  { icon: PenTool, title: "Desain Tanpa Batas", desc: "Gunakan editor 3D mudah digunakan untuk mewujudkan kreativitasmu." },
  { icon: Cloud, title: "Simpan di Cloud", desc: "Semua desainmu tersimpan aman di cloud dan bisa diakses kapan saja." },
  { icon: ShieldCheck, title: "Aman & Terpercaya", desc: "Keamanan data terjamin dengan sistem yang andal dan terpercaya." },
];

export default function Register() {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agree, setAgree] = useState(false);
  const navigate = useNavigate();

  return (
    // Background diubah jadi full ungu muda seperti halaman login
    <div className="min-h-screen w-full bg-[#F5F3FF] flex justify-center">

      {/* Wrapper max-w-7xl sama seperti halaman login */}
      <div className="flex w-full max-w-7xl">

        {/* Left Column - Disamakan dengan login */}
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-center px-12 xl:px-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#EDE9FE]/60 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="text-sm text-gray-500 mb-1">Mulai Perjalananmu di</p>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-[#6D4AFF] mb-4">
              FitCraft 3D
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-[360px]">
              Bergabung sekarang untuk mengakses ribuan template premium dan mulai wujudkan ide desain 3D-mu.
            </p>

            <div className="relative mb-10">
              <img
                src="/products/product-1.png"
                alt="3D Apparel"
                className="w-[280px] drop-shadow-2xl"
                style={{ animation: "float 3s ease-in-out infinite" }}
              />
            </div>

            <div className="space-y-4">
              {benefits.map((b) => (
                <div key={b.title} className="flex items-start gap-3">
                  <div className="w-9 h-9 rounded-lg bg-[#EDE9FE] flex items-center justify-center shrink-0">
                    <b.icon className="w-4 h-4 text-[#6D4AFF]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900">
                      {b.title}
                    </h4>
                    <p className="text-xs text-gray-500">{b.desc}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="text-sm text-gray-500 mt-8">
              Sudah punya akun?{" "}
              <Link
                to="/login"
                className="text-[#6D4AFF] font-semibold hover:underline inline-flex items-center gap-1"
              >
                Masuk Sekarang <ArrowRight className="w-3 h-3" />
              </Link>
            </p>
          </div>
        </div>

        {/* Right Column - Form */}
        <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-[420px]">
            {/* Mobile Logo */}
            <div className="lg:hidden flex items-center gap-2 mb-8">
              <div className="w-8 h-8 rounded-lg bg-gradient-purple flex items-center justify-center">
                <Box className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                FitCraft <span className="text-[#6D4AFF]">3D</span>
              </span>
            </div>

            <div className="bg-white rounded-[20px] shadow-dropdown border border-gray-100 p-8">
              <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
                Buat Akun Baru
              </h2>
              <p className="text-sm text-gray-400 text-center mb-6">
                Daftar gratis dan mulai mendesain
              </p>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  navigate("/dashboard");
                }}
                className="space-y-4"
              >
                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Nama Lengkap
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      placeholder="Masukkan nama lengkap"
                      className="pl-10 h-11 rounded-xl border-gray-200 focus:border-[#6D4AFF] focus:ring-[#6D4AFF]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type="email"
                      placeholder="Masukkan email kamu"
                      className="pl-10 h-11 rounded-xl border-gray-200 focus:border-[#6D4AFF] focus:ring-[#6D4AFF]/10"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Buat password"
                      className="pl-10 pr-10 h-11 rounded-xl border-gray-200 focus:border-[#6D4AFF] focus:ring-[#6D4AFF]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                    Konfirmasi Password
                  </label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <Input
                      type={showConfirm ? "text" : "password"}
                      placeholder="Ulangi password"
                      className="pl-10 pr-10 h-11 rounded-xl border-gray-200 focus:border-[#6D4AFF] focus:ring-[#6D4AFF]/10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(!showConfirm)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                      {showConfirm ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Checkbox
                    id="agree"
                    checked={agree}
                    onCheckedChange={(c) => setAgree(c as boolean)}
                  />
                  <label htmlFor="agree" className="text-xs text-gray-600">
                    Saya setuju dengan{" "}
                    <a href="#" className="text-[#6D4AFF] hover:underline">
                      Syarat & Ketentuan
                    </a>
                  </label>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white font-semibold rounded-xl"
                >
                  Daftar
                </Button>
              </form>

              <div className="relative my-5">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-3 text-xs text-gray-400">
                    atau daftar dengan
                  </span>
                </div>
              </div>

              <a
                href="#"
                className="flex items-center justify-center gap-3 w-full h-11 rounded-xl border border-gray-200 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
              >
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                </svg>
                Lanjutkan dengan Google
              </a>
            </div>

            {/* Mobile login link */}
            <p className="lg:hidden text-sm text-gray-500 text-center mt-6">
              Sudah punya akun?{" "}
              <Link to="/login" className="text-[#6D4AFF] font-semibold hover:underline">
                Masuk Sekarang
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`@keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }`}</style>
    </div>
  );
}
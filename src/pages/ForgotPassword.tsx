import { useState } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Box,
  Mail,
  ArrowLeft,
  CheckCircle,
  Layout,
  PenTool,
  Cloud,
  ShieldCheck,
  ArrowRight
} from "lucide-react";

// Menambahkan array benefits yang sama
const benefits = [
  { icon: Layout, title: "Template Premium", desc: "Akses ribuan template 3D berkualitas tinggi siap pakai." },
  { icon: PenTool, title: "Desain Tanpa Batas", desc: "Gunakan editor 3D mudah digunakan untuk mewujudkan kreativitasmu." },
  { icon: Cloud, title: "Simpan di Cloud", desc: "Semua desainmu tersimpan aman di cloud dan bisa diakses kapan saja." },
  { icon: ShieldCheck, title: "Aman & Terpercaya", desc: "Keamanan data terjamin dengan sistem yang andal dan terpercaya." },
];

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);

  return (
    // Background diubah jadi full ungu muda seperti halaman login
    <div className="min-h-screen w-full bg-[#F5F3FF] flex justify-center">

      {/* Wrapper max-w-7xl agar konten tetap rapi di tengah */}
      <div className="flex w-full max-w-7xl">

        {/* Left Column - Disamakan dengan login */}
        <div className="hidden lg:flex lg:w-[45%] flex-col justify-center px-12 xl:px-16 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-[#EDE9FE]/60 rounded-full blur-3xl" />

          <div className="relative z-10">
            <p className="text-sm text-gray-500 mb-1">Selamat Datang di</p>
            <h1 className="text-3xl xl:text-4xl font-extrabold text-[#6D4AFF] mb-4">
              FitCraft 3D
            </h1>
            <p className="text-sm text-gray-500 leading-relaxed mb-8 max-w-[360px]">
              Masuk untuk mengakses ribuan template premium dan mulai wujudkan ide
              desain 3D-mu.
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
              Belum punya akun?{" "}
              <Link
                to="/register"
                className="text-[#6D4AFF] font-semibold hover:underline inline-flex items-center gap-1"
              >
                Daftar Sekarang <ArrowRight className="w-3 h-3" />
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
              {!sent ? (
                <>
                  <h2 className="text-xl font-bold text-gray-900 text-center mb-1">
                    Lupa Password?
                  </h2>
                  <p className="text-sm text-gray-400 text-center mb-6">
                    Masukkan email kamu dan kami akan mengirimkan link untuk
                    mereset password.
                  </p>
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setSent(true);
                    }}
                    className="space-y-4"
                  >
                    <div>
                      <label className="text-xs font-semibold text-gray-700 mb-1.5 block">
                        Email
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <Input
                          type="email"
                          placeholder="Masukkan email kamu"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          className="pl-10 h-11 rounded-xl border-gray-200 focus:border-[#6D4AFF] focus:ring-[#6D4AFF]/10"
                        />
                      </div>
                    </div>
                    <Button
                      type="submit"
                      className="w-full h-11 bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white font-semibold rounded-xl"
                    >
                      Kirim Link Reset
                    </Button>
                  </form>
                </>
              ) : (
                <div className="text-center py-4">
                  <div className="w-14 h-14 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4">
                    <CheckCircle className="w-7 h-7 text-green-600" />
                  </div>
                  <h2 className="text-lg font-bold text-gray-900 mb-2">
                    Link Terkirim!
                  </h2>
                  <p className="text-sm text-gray-500 mb-6">
                    Kami telah mengirimkan link reset password ke{" "}
                    <span className="font-semibold text-gray-700">{email}</span>.
                    Silakan periksa inbox kamu.
                  </p>
                  <Button
                    onClick={() => setSent(false)}
                    variant="outline"
                    className="w-full"
                  >
                    Kirim Ulang
                  </Button>
                </div>
              )}

              <Link
                to="/login"
                className="flex items-center justify-center gap-2 text-sm text-[#6D4AFF] hover:underline mt-6"
              >
                <ArrowLeft className="w-4 h-4" />
                Kembali ke Login
              </Link>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-12px); }
        }
      `}</style>
    </div>
  );
}
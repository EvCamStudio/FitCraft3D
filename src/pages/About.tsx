import { useEffect, useRef, useState } from "react";
import { Link } from "react-router";
import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  Shield,
  Users,
  Lightbulb,
  ShieldCheck,
  Rocket,
  Globe,
  Palette,
  Package,
  Play,
  Linkedin,
  Instagram,
  Twitter,
  ArrowRight,
} from "lucide-react";

const stats = [
  { icon: Users, value: 50000, suffix: "+", label: "Pengguna Aktif" },
  { icon: Palette, value: 100000, suffix: "+", label: "Desain Dibuat" },
  { icon: Package, value: 500000, suffix: "+", label: "Produk Diekspor" },
  { icon: Globe, value: 150, suffix: "+", label: "Negara" },
];

const team = [
  { name: "Hezron Marito Sianipar", role: "Front-end & Back-end", image: "/team/team-1.png" },
  { name: "Aisyah               ", role: "UI/UX & Front-end", image: "/team/team-2.png" },
  { name: "Budi Prastyo          ", role: "Back-end", image: "/team/team-3.png" },
];

const values = [
  { icon: Lightbulb, title: "Kreativitas Tanpa Batas", description: "Kami percaya setiap ide layak untuk diwujudkan." },
  { icon: ShieldCheck, title: "Kualitas & Kepercayaan", description: "Kami berkomitmen memberikan kualitas terbaik dan aman." },
  { icon: Rocket, title: "Inovasi Berkelanjutan", description: "Kami terus berinovasi untuk pengalaman terbaik." },
];

function useCountUp(end: number, duration = 2000, startOnView = true) {
  const [count, setCount] = useState(0);
  const [started, setStarted] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!startOnView || !ref.current) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started) setStarted(true);
      },
      { threshold: 0.3 }
    );
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [startOnView, started]);

  useEffect(() => {
    if (!started) return;
    let startTime: number;
    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.floor(eased * end));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [started, end, duration]);

  return { count, ref };
}

function StatCard({ stat }: { stat: typeof stats[0] }) {
  const { count, ref } = useCountUp(stat.value);
  const formatNumber = (n: number) => (n >= 1000 ? (n / 1000).toFixed(0) + "K" : n.toString());
  return (
    <div ref={ref} className="text-center">
      <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center mx-auto mb-3">
        <stat.icon className="w-5 h-5 text-[#6D4AFF]" />
      </div>
      <div className="text-3xl lg:text-4xl font-extrabold text-[#6D4AFF] mb-1">{formatNumber(count)}{stat.suffix}</div>
      <p className="text-sm text-gray-500">{stat.label}</p>
    </div>
  );
}

export default function About() {
  const sectionRef = useRef<HTMLDivElement>(null);

  return (
    <Layout>
      <section className="pt-24 pb-16 lg:pb-20">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
            <div className="flex-1">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EDE9FE] text-[#6D4AFF] text-xs font-semibold tracking-wide mb-6">ABOUT FITCRAFT 3D</span>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold leading-[1.1] tracking-tight mb-6">Empowering Creativity Through <span className="text-gradient">3D Design</span></h1>
              <p className="text-base text-gray-500 leading-relaxed max-w-[480px] mb-8">FitCraft 3D hadir untuk membantu kreator, desainer, dan brand mewujudkan ide menjadi produk apparel 3D berkualitas tinggi.</p>
              <Button className="bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white gap-2"><Play className="w-4 h-4 fill-current" /> Our Story</Button>
            </div>
            <div className="flex-1 relative"><img src="/products/product-1.png" alt="3D Design" className="w-full max-w-[400px] mx-auto drop-shadow-2xl" style={{ animation: "float 3s ease-in-out infinite" }} /></div>
          </div>
        </div>
      </section>

      {/* Misi Kami - Background Ungu */}
      <section className="py-16 lg:py-20 bg-[#F5F3FF]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6D4AFF] mb-3">MISI KAMI</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 max-w-[600px] mx-auto">Membuat Desain 3D Menjadi <span className="text-gradient">Mudah dan Terjangkau</span></h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-[900px] mx-auto">
            {[
              { icon: Sparkles, title: "Mudah Digunakan", desc: "Platform intuitif yang dirancang untuk semua orang, tanpa perlu keahlian desain." },
              { icon: Shield, title: "Kualitas Tanpa Kompromi", desc: "Hasil desain 3D berkualitas tinggi dengan detail yang realistis." },
              { icon: Users, title: "Untuk Semua Kreator", desc: "Memberdayakan kreator, bisnis kecil, hingga brand besar di seluruh dunia." },
            ].map((item) => (
              <div key={item.title} className="bg-white rounded-2xl p-6 border border-gray-100 shadow-card hover:shadow-card-hover transition-all">
                <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center mb-4"><item.icon className="w-6 h-6 text-[#6D4AFF]" /></div>
                <h3 className="text-base font-semibold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6D4AFF] mb-8 text-center">FITCRAFT 3D DALAM ANGKA</p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 max-w-[900px] mx-auto">
            {stats.map((stat) => <StatCard key={stat.label} stat={stat} />)}
          </div>
        </div>
      </section>

      {/* Team */}
      <section className="py-16 lg:py-20 bg-[#F5F3FF]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6D4AFF] mb-3">TIM KAMI</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Bertemu dengan Orang-Orang di Balik <span className="text-gradient">FitCraft 3D</span></h2>
          </div>
          <div className="flex flex-wrap justify-center gap-6">
            {team.map((member) => (
              <div key={member.name} className="bg-white rounded-2xl p-6 text-center shadow-card w-[200px]">
                <img src={member.image} alt={member.name} className="w-24 h-24 mx-auto mb-4 rounded-full border-4 border-[#EDE9FE] object-cover" />
                <h3 className="text-sm font-semibold text-gray-900">{member.name}</h3>
                <p className="text-xs text-[#6D4AFF] mb-3">{member.role}</p>
                <div className="flex justify-center gap-3">
                  <a href="#" className="text-gray-400 hover:text-[#6D4AFF]"><Linkedin className="w-4 h-4" /></a>
                  <a href="#" className="text-gray-400 hover:text-[#6D4AFF]"><Instagram className="w-4 h-4" /></a>
                  <a href="#" className="text-gray-400 hover:text-[#6D4AFF]"><Twitter className="w-4 h-4" /></a>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Nilai Kami - Shadow Ungu */}
      <section className="py-16 lg:py-20 bg-white">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6D4AFF] mb-3">NILAI KAMI</p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900">Apa yang Kami <span className="text-gradient">Percaya</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-[1000px] mx-auto">
            {values.map((val) => (
              <div key={val.title} className="p-6 rounded-2xl border border-gray-100 shadow-[0_8px_30px_rgba(109,74,255,0.15)] hover:shadow-[0_12px_40px_rgba(109,74,255,0.25)] transition-all">
                <div className="w-10 h-10 rounded-xl bg-[#EDE9FE] flex items-center justify-center mb-4"><val.icon className="w-5 h-5 text-[#6D4AFF]" /></div>
                <h4 className="text-sm font-semibold text-gray-900 mb-1">{val.title}</h4>
                <p className="text-xs text-gray-500">{val.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
          <div className="relative overflow-hidden rounded-[20px] bg-gradient-purple p-8 sm:p-12">
            <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">Siap Wujudkan Ide Kreasimu?</h2>
                <p className="text-white/80 text-sm sm:text-base max-w-[500px]">Bergabung dengan ribuan kreator lain dan mulai desain 3D apparel menakjubkan sekarang juga!</p>
              </div>
              <Link to="/studio"><Button size="lg" className="bg-white text-[#6D4AFF] hover:bg-gray-100 font-semibold shadow-lg">Mulai Desain Sekarang <ArrowRight className="w-4 h-4 ml-2" /></Button></Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`@keyframes float { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-12px); } }`}</style>
    </Layout>
  );
}
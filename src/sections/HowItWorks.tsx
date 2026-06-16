import { useEffect, useRef } from "react";
import { Check } from "lucide-react";

const steps = [
  {
    number: "1",
    title: "Pilih Produk",
    description: "Pilih produk favoritmu dari koleksi kami.",
  },
  {
    number: "2",
    title: "Desain Bebas",
    description: "Tambahkan teks, gambar, atau gunakan template.",
  },
  {
    number: "3",
    title: "Preview 3D",
    description: "Lihat hasil desainmu secara real-time.",
  },
  {
    number: "4",
    title: "Simpan & Bagikan",
    description: "Unduh desain berkualitas tinggi atau bagikan ke dunia.",
  },
];

const checklists = [
  "Ribuan Template Premium",
  "Font Keren & Ikonik",
  "Grafis & Stiker Eksklusif",
  "Upload Gambar Sendiri",
  "Atur Posisi & Ukuran Bebas",
];

export default function HowItWorks() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const els = entry.target.querySelectorAll("[data-animate]");
            els.forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = "1";
                (el as HTMLElement).style.transform = "translateY(0)";
              }, i * 100);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-28 bg-[#F9FAFB]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        {/* Drag & Drop Section */}
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16 mb-20">
          <div className="flex-1">
            <span
              data-animate
              className="inline-block text-xs font-semibold uppercase tracking-[0.08em] text-[#6D4AFF] mb-3 transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              BUAT DENGAN MUDAH
            </span>
            <h2
              data-animate
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              Desain Keren, Semudah{" "}
              <span className="text-gradient">Drag & Drop</span>
            </h2>
            <p
              data-animate
              className="text-gray-500 leading-relaxed mb-6 max-w-[400px] transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              Tidak perlu skill desain tingkat dewa. Semua siap pakai untuk
              hasil maksimal.
            </p>
            <div className="space-y-3">
              {checklists.map((item) => (
                <div
                  key={item}
                  data-animate
                  className="flex items-center gap-3 transition-all duration-500"
                  style={{ opacity: 0, transform: "translateY(20px)" }}
                >
                  <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center shrink-0">
                    <Check className="w-3 h-3 text-green-600" />
                  </div>
                  <span className="text-sm text-gray-600">{item}</span>
                </div>
              ))}
            </div>
          </div>

          <div
            data-animate
            className="flex-1 transition-all duration-500"
            style={{ opacity: 0, transform: "translateY(20px)" }}
          >
            <div className="bg-white rounded-2xl p-4 shadow-card border border-gray-100">
              <img
                src="/products/product-2.png"
                alt="Drag and Drop Editor"
                className="w-full max-w-[350px] mx-auto"
              />
            </div>
          </div>
        </div>

        {/* 4 Steps */}
        <div className="text-center mb-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Buat Desain dalam 4 Langkah Mudah
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 max-w-[1000px] mx-auto relative">
          {/* Connecting line */}
          <div className="hidden lg:block absolute top-5 left-[12%] right-[12%] h-0.5 border-t-2 border-dashed border-[#EDE9FE]" />

          {steps.map((step) => (
            <div key={step.number} className="relative text-center">
              <div className="w-10 h-10 rounded-full border-2 border-[#EDE9FE] bg-white flex items-center justify-center mx-auto mb-4 relative z-10">
                <span className="text-sm font-bold text-[#6D4AFF]">
                  {step.number}
                </span>
              </div>
              <h4 className="text-sm font-semibold text-gray-900 mb-1">
                {step.title}
              </h4>
              <p className="text-xs text-gray-500 max-w-[180px] mx-auto">
                {step.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

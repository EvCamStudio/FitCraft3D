import { useEffect, useRef } from "react";
import { Box, Sliders, Eye, Download, Save } from "lucide-react";

const features = [
  {
    icon: Box,
    title: "Editor 3D Interaktif",
    description:
      "Desain secara real-time dan lihat hasilnya langsung dalam 3D.",
  },
  {
    icon: Sliders,
    title: "Kustomisasi Tanpa Batas",
    description:
      "Ubah warna, teks, gambar, hingga detail terkecil sesuai gaya kamu.",
  },
  {
    icon: Eye,
    title: "Preview Realistis",
    description:
      "Lihat hasil desain dengan pencahayaan dan tekstur yang super realistis.",
  },
  {
    icon: Download,
    title: "Ekspor Berkualitas Tinggi",
    description:
      "Download desainmu dalam resolusi tinggi, siap untuk dicetak atau dibagikan.",
  },
  {
    icon: Save,
    title: "Simpan & Lanjutkan",
    description:
      "Simpan proyek di cloud dan lanjutkan kapan saja, di perangkat mana pun.",
  },
];

export default function Features() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const cards = entry.target.querySelectorAll("[data-card]");
            cards.forEach((card, i) => {
              setTimeout(() => {
                (card as HTMLElement).style.opacity = "1";
                (card as HTMLElement).style.transform = "translateY(0)";
              }, i * 80);
            });
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.2 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="py-20 lg:py-24 bg-[#F5F3FF]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="text-center mb-14">
          <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[#6D4AFF] mb-3">
            Wujudkan Ide Desainmu, Tanpa Batas
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 max-w-[600px] mx-auto">
            Semua tools yang kamu butuhkan untuk menciptakan apparel unikmu.
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              data-card
              className="group bg-white rounded-2xl p-6 border border-gray-100 hover:border-[#EDE9FE] shadow-card hover:shadow-[0_8px_24px_rgba(109,74,255,0.08)] hover:-translate-y-0.5 transition-all duration-300"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              <div className="w-12 h-12 rounded-xl bg-[#EDE9FE] flex items-center justify-center mb-4 group-hover:bg-[#6D4AFF] transition-colors duration-300">
                <feature.icon className="w-6 h-6 text-[#6D4AFF] group-hover:text-white transition-colors duration-300" />
              </div>
              <h3 className="text-sm font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              <p className="text-sm text-gray-500 leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";
import { RotateCcw, Sun, Layers } from "lucide-react";

const details = [
  {
    icon: RotateCcw,
    title: "360\u00B0 Rotasi",
    description: "Putar desainmu dan lihat dari semua sudut.",
  },
  {
    icon: Sun,
    title: "Pencahayaan Studio",
    description: "Hasil render dengan pencahayaan profesional.",
  },
  {
    icon: Layers,
    title: "Detail Material",
    description: "Lihat tekstur kain dan lipatan yang realistis.",
  },
];

export default function KeyFeature() {
  const sectionRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const left = entry.target.querySelector("[data-left]");
            const right = entry.target.querySelector("[data-right]");
            if (left) {
              (left as HTMLElement).style.opacity = "1";
              (left as HTMLElement).style.transform = "translateX(0)";
            }
            if (right) {
              setTimeout(() => {
                (right as HTMLElement).style.opacity = "1";
                (right as HTMLElement).style.transform = "translateX(0)";
              }, 150);
            }
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
    <section ref={sectionRef} className="py-20 lg:py-28 bg-white">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">
          {/* Left - Image */}
          <div
            data-left
            className="flex-1 w-full transition-all duration-600"
            style={{ opacity: 0, transform: "translateX(-30px)" }}
          >
            <div className="relative bg-[#F9FAFB] rounded-2xl p-6 lg:p-8">
              <img
                src="/products/product-7.png"
                alt="3D Editor Preview"
                className="w-full max-w-[380px] mx-auto drop-shadow-xl"
              />
              {/* View tabs */}
              <div className="flex justify-center mt-4">
                <div className="inline-flex bg-white rounded-lg p-1 shadow-sm border border-gray-100">
                  <button className="px-4 py-1.5 rounded-md bg-[#6D4AFF] text-white text-xs font-medium">
                    3D View
                  </button>
                  <button className="px-4 py-1.5 rounded-md text-gray-500 text-xs font-medium hover:text-gray-700">
                    2D Flat View
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right - Content */}
          <div
            data-right
            className="flex-1 transition-all duration-600"
            style={{ opacity: 0, transform: "translateX(30px)" }}
          >
            <span className="inline-block px-3 py-1 rounded-full bg-[#EDE9FE] text-[#6D4AFF] text-[11px] font-semibold tracking-wide mb-4">
              REAL-TIME 3D PREVIEW
            </span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight">
              Lihat Setiap Detail{" "}
              <span className="text-gradient">Seolah Nyata</span>
            </h2>
            <p className="text-gray-500 leading-relaxed mb-8 max-w-[480px]">
              Teknologi 3D real-time kami menampilkan hasil desainmu dari
              setiap sisi dengan pencahayaan dan tekstur yang akurat.
            </p>

            <div className="space-y-5">
              {details.map((item) => (
                <div key={item.title} className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#F5F3FF] flex items-center justify-center shrink-0">
                    <item.icon className="w-5 h-5 text-[#6D4AFF]" />
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-gray-900 mb-0.5">
                      {item.title}
                    </h4>
                    <p className="text-sm text-gray-500">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Box, Download, Infinity, Play } from "lucide-react";

export default function Hero() {
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
      { threshold: 0.1 }
    );
    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={sectionRef} className="relative overflow-hidden pt-16 pb-20 lg:pb-28">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#F5F3FF] via-white to-white pointer-events-none" />
      <div className="absolute top-20 right-0 w-[500px] h-[500px] bg-[#EDE9FE]/40 rounded-full blur-3xl pointer-events-none" />

      <div className="relative max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-8">
          {/* Left Column */}
          <div className="flex-1 max-w-[600px]">
            <div
              data-animate
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#EDE9FE] text-[#6D4AFF] text-xs font-semibold tracking-wide mb-6 transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              DESIGN &bull; PREVIEW &bull; WEAR
            </div>

            <h1
              data-animate
              className="text-4xl sm:text-5xl lg:text-[56px] font-extrabold leading-[1.1] tracking-tight mb-6 transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              Create. Preview.{" "}
              <span className="block mt-1">
                Customize.{" "}
                <span className="text-gradient">All in Stunning 3D.</span>
              </span>
            </h1>

            <p
              data-animate
              className="text-base lg:text-lg text-gray-500 leading-relaxed max-w-[440px] mb-8 transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              Bring your ideas to life with our easy-to-use 3D apparel designer.
              Design, preview, and order your custom apparel in minutes.
            </p>

            <div
              data-animate
              className="flex flex-wrap items-center gap-4 mb-10 transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              <Link to="/studio">
                <Button
                  size="lg"
                  className="bg-[#6D4AFF] hover:bg-[#5A3ED6] text-white px-7 py-6 text-sm font-semibold shadow-button hover:-translate-y-0.5 transition-all"
                >
                  Start Designing
                </Button>
              </Link>
              <Button
                variant="ghost"
                size="lg"
                className="text-[#6D4AFF] hover:text-[#5A3ED6] hover:bg-[#F5F3FF] gap-2 px-5 py-6"
              >
                <Play className="w-4 h-4 fill-current" />
                Watch Demo
              </Button>
            </div>

            <div
              data-animate
              className="flex flex-wrap gap-6 transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              {[
                { icon: Box, text: "3D Real-time Preview" },
                { icon: Download, text: "HD High Quality Export" },
                { icon: Infinity, text: "Endless Possibilities" },
              ].map((item) => (
                <div key={item.text} className="flex items-center gap-2">
                  <item.icon className="w-5 h-5 text-[#6D4AFF]" />
                  <span className="text-xs text-gray-500 font-medium">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Right Column - 3D Preview */}
          <div
            data-animate
            className="flex-1 relative max-w-[500px] lg:max-w-none transition-all duration-500"
            style={{ opacity: 0, transform: "translateY(20px)" }}
          >
            <div className="relative">
              {/* Floating toolbar */}
              <div className="absolute left-2 top-1/2 -translate-y-1/2 z-10 glass rounded-xl p-2 flex flex-col gap-2 shadow-dropdown">
                {[
                  { color: "bg-red-400", label: "Color" },
                  { color: "bg-gray-800", label: "T" },
                  { color: "bg-blue-400", label: "Up" },
                  { color: "bg-green-400", label: "G" },
                ].map((item) => (
                  <button
                    key={item.label}
                    className="w-9 h-9 rounded-lg bg-[#F5F3FF] hover:bg-[#EDE9FE] flex items-center justify-center text-[#6D4AFF] text-xs font-bold transition-all hover:scale-105"
                  >
                    {item.label}
                  </button>
                ))}
              </div>

              {/* Main product image */}
              <div className="relative ml-14">
                <img
                  src="/products/product-1.png"
                  alt="3D Apparel Preview"
                  className="w-full max-w-[400px] mx-auto drop-shadow-2xl"
                  style={{
                    animation: "float 3s ease-in-out infinite",
                  }}
                />

                {/* Color picker floating panel */}
                <div className="absolute top-4 right-0 bg-white rounded-xl shadow-dropdown p-3 border border-gray-100">
                  <p className="text-[10px] font-semibold text-gray-500 mb-2">
                    Choose Color
                  </p>
                  <div className="flex flex-wrap gap-1.5 w-[80px]">
                    {[
                      "#1F2937",
                      "#6B7280",
                      "#DC2626",
                      "#2563EB",
                      "#6D4AFF",
                      "#10B981",
                    ].map((c) => (
                      <div
                        key={c}
                        className="w-5 h-5 rounded-full border-2 border-white shadow-sm cursor-pointer hover:scale-110 transition-transform"
                        style={{ backgroundColor: c }}
                      />
                    ))}
                  </div>
                </div>

                {/* Cotton badge */}
                <div className="absolute bottom-8 right-4 glass rounded-full px-3 py-1.5 flex items-center gap-1.5 shadow-dropdown">
                  <div className="w-4 h-4 rounded-full bg-green-400 flex items-center justify-center">
                    <svg
                      className="w-2.5 h-2.5 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  </div>
                  <span className="text-[10px] font-semibold text-gray-600">
                    Cotton
                  </span>
                </div>
              </div>
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
    </section>
  );
}

import { useEffect, useRef } from "react";
import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

const showcaseItems = [
  { image: "/products/product-1.png", name: "Street Graffiti", creator: "Urban Creator", likes: 234 },
  { image: "/products/product-5.png", name: "Never Stop Dreaming", creator: "Motivasi Store", likes: 189 },
  { image: "/products/product-9.png", name: "Japanese Wave", creator: "Asian Culture", likes: 312 },
  { image: "/products/product-10.png", name: "Galaxy Hoodie", creator: "Space Creator", likes: 278 },
  { image: "/products/product-11.png", name: "Butterfly Dream", creator: "Dreamy Design", likes: 156 },
];

export default function Testimonials() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const els = entry.target.querySelectorAll("[data-animate]");
            els.forEach((el, i) => {
              setTimeout(() => {
                (el as HTMLElement).style.opacity = "1";
                (el as HTMLElement).style.transform = "translateX(0)";
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

  const scroll = (dir: "left" | "right") => {
    if (scrollRef.current) {
      const amount = 280;
      scrollRef.current.scrollBy({
        left: dir === "left" ? -amount : amount,
        behavior: "smooth",
      });
    }
  };

  return (
    <section ref={sectionRef} className="py-20 lg:py-24 bg-[#F5F3FF]">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="flex flex-col lg:flex-row items-start lg:items-center gap-8 lg:gap-12">
          {/* Left */}
          <div className="lg:w-[35%] shrink-0">
            <h2
              data-animate
              className="text-2xl sm:text-3xl lg:text-4xl font-bold text-gray-900 mb-4 leading-tight transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              Bergabung dengan{" "}
              <span className="text-gradient">Komunitas Kreator</span>
            </h2>
            <p
              data-animate
              className="text-gray-500 leading-relaxed mb-6 transition-all duration-500"
              style={{ opacity: 0, transform: "translateY(20px)" }}
            >
              Temukan inspirasi dari ribuan kreator yang sudah membuat karya
              luar biasa.
            </p>
            <Link to="/buy">
              <Button
                data-animate
                variant="outline"
                className="border-[#6D4AFF] text-[#6D4AFF] hover:bg-[#F5F3FF] transition-all duration-500"
                style={{ opacity: 0, transform: "translateY(20px)" }}
              >
                Lihat Galeri Komunitas
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>

          {/* Right - Scrolling Gallery */}
          <div className="lg:flex-1 w-full relative overflow-hidden">
            <button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 text-gray-600" />
            </button>

            <button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-8 h-8 rounded-full bg-white shadow-md flex items-center justify-center hover:bg-gray-50 transition-colors"
            >
              <ChevronRight className="w-4 h-4 text-gray-600" />
            </button>

            <div
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto overflow-y-hidden px-10 py-4 w-full"
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              {showcaseItems.map((item, i) => (
                <div
                  key={item.name}
                  data-animate
                  className="flex-none w-[220px] bg-white rounded-2xl p-3 shadow-card hover:shadow-card-hover hover:-translate-y-1 transition-all duration-300 cursor-pointer"
                  style={{
                    opacity: 0,
                    transform: "translateX(20px)",
                    rotate: i % 2 === 0 ? "-2deg" : "2deg",
                  }}
                >
                  <div className="bg-[#F9FAFB] rounded-xl p-3 mb-3">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-[160px] object-contain"
                    />
                  </div>

                  <h4 className="text-sm font-semibold text-gray-900 truncate">
                    {item.name}
                  </h4>

                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-gray-500">
                      {item.creator}
                    </span>

                    <span className="text-xs text-[#6D4AFF] font-medium">
                      {item.likes}
                    </span>
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
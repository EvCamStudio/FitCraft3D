import { Link } from "react-router";
import { Button } from "@/components/ui/button";
import { ArrowRight, Shirt } from "lucide-react";

export default function CTA() {
  return (
    <section className="py-16 lg:py-20">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-10">
        <div className="relative overflow-hidden rounded-[20px] bg-gradient-purple p-8 sm:p-12 lg:p-14">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />

          <div className="relative flex flex-col lg:flex-row items-center justify-between gap-8">
            <div className="flex items-center gap-6">
              <div className="hidden sm:flex w-16 h-16 rounded-2xl bg-white/10 items-center justify-center shrink-0">
                <Shirt className="w-8 h-8 text-white" />
              </div>
              <div>
                <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-white mb-2">
                  Siap Mewujudkan Desain Impianmu?
                </h2>
                <p className="text-white/80 text-sm sm:text-base max-w-[500px]">
                  Bergabung dengan jutaan kreator dan mulai desain 3D apparel
                  menakjubkan sekarang juga!
                </p>
              </div>
            </div>
            <Link to="/studio" className="shrink-0">
              <Button
                size="lg"
                className="bg-white text-[#6D4AFF] hover:bg-gray-100 font-semibold px-7 shadow-lg hover:-translate-y-0.5 transition-all"
              >
                Mulai Desain Sekarang
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

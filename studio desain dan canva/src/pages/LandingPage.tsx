import { useEffect, useRef, useState } from 'react';
import { motion, useInView } from 'framer-motion';

interface LandingPageProps {
  onNavigate: (page: 'landing' | 'products' | 'studio', model?: 'hoodie' | 'tshirt' | 'sweater') => void;
}

const showcaseItems = [
  { id: 1, name: 'Techwear Hoodie', sub: 'Cyber Green', image: '/assets/showcase-hoodie-street.png', tag: 'POPULER' },
  { id: 2, name: 'Esport Jersey', sub: 'Vortex Black', image: '/assets/showcase-jersey.png', tag: 'BARU' },
  { id: 3, name: 'Streetwear Hoodie', sub: 'Urban Red', image: '/assets/showcase-hoodie-street.png', tag: '' },
  { id: 4, name: 'Football Kit', sub: 'Elite Performance', image: '/assets/showcase-football.png', tag: '' },
  { id: 5, name: 'Varsity Jacket', sub: 'Classic Bold', image: '/assets/showcase-varsity.png', tag: '' },
  { id: 6, name: 'Custom Sweater', sub: 'Minimalist White', image: '/assets/showcase-sweater.png', tag: '' },
];

const stats = [
  { value: '3D', label: 'Real-time PBR' },
  { value: '3+', label: 'Model Pakaian' },
  { value: '∞', label: 'Kombinasi Warna' },
];

const colorOptions = [
  { name: 'Hitam', hex: '#1a1a1a' },
  { name: 'Hijau', hex: '#2de295' },
  { name: 'Biru', hex: '#3b82f6' },
  { name: 'Merah', hex: '#ef4444' },
  { name: 'Putih', hex: '#f5f5f5' },
];

function ParticleField() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const particles: { x: number; y: number; vx: number; vy: number; size: number; opacity: number }[] = [];
    for (let i = 0; i < 60; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.5 + 0.1,
      });
    }

    let frameId: number;
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach((p) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(45, 226, 149, ${p.opacity})`;
        ctx.fill();
      });

      // Draw connections
      particles.forEach((p1, i) => {
        particles.slice(i + 1).forEach((p2) => {
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 150) {
            ctx.beginPath();
            ctx.moveTo(p1.x, p1.y);
            ctx.lineTo(p2.x, p2.y);
            ctx.strokeStyle = `rgba(45, 226, 149, ${0.08 * (1 - dist / 150)})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        });
      });

      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      window.removeEventListener('resize', resize);
      cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 pointer-events-none"
      style={{ zIndex: 1 }}
    />
  );
}

function Navbar({ onNavigate }: { onNavigate: LandingPageProps['onNavigate'] }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-[#08090a]/90 backdrop-blur-xl border-b border-white/[0.06]'
          : 'bg-transparent'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#2de295] to-[#14b8a6] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#08090a" strokeWidth="2.5">
              <path d="M6 4h12v6h-6v3h4v4h-4v3H6z" />
            </svg>
          </div>
          <span className="font-[var(--font-display)] font-bold text-lg tracking-tight">
            FITCRAFT <span className="text-[#2de295]">3D</span>
          </span>
        </div>

        <div className="hidden md:flex items-center gap-8">
          {['Beranda', 'Fitur', 'Cara Kerja', 'Showcase', 'Kontak'].map((item) => (
            <a
              key={item}
              href={`#${item.toLowerCase().replace(' ', '-')}`}
              className="text-sm text-[#9ba3af] hover:text-[#2de295] transition-colors duration-300 font-medium"
            >
              {item}
            </a>
          ))}
        </div>

        <button
          onClick={() => onNavigate('studio', 'hoodie')}
          className="btn-primary text-sm"
        >
          Mulai Gratis
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </div>
    </nav>
  );
}

function HeroSection({ onNavigate }: { onNavigate: LandingPageProps['onNavigate'] }) {
  const [selectedColor, setSelectedColor] = useState(colorOptions[1]);
  const [activeDetail, setActiveDetail] = useState(0);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-16">
      <ParticleField />

      {/* Ambient glow */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#2de295]/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-[#14b8a6]/10 rounded-full blur-[100px] pointer-events-none" />

      <div className="relative z-10 w-full max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
        {/* Left Content */}
        <motion.div
          initial={{ opacity: 0, x: -50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="label-text mb-4 flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-[#2de295] animate-pulse" />
            STUDIO KUSTOMISASI 3D PREMIUM
          </div>

          <h1 className="heading-xl mb-2">
            CRAFT YOUR
            <br />
            <span className="neon-text">BRAND</span> IDENTITY
            <br />
            IN <span className="italic font-light">3D</span>
          </h1>

          <p className="body-text max-w-lg mb-8 text-lg">
            Rancang pakaian kustom premium untuk startup dan tim kreatif Anda secara instan langsung dari browser — dengan presisi visualisasi 3D PBR real-time.
          </p>

          <div className="flex items-center gap-4 mb-10">
            <button
              onClick={() => onNavigate('studio', 'hoodie')}
              className="btn-primary"
            >
              Mulai Kustomisasi
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>

            <button className="btn-secondary">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <polygon points="10 8 16 12 10 16" />
              </svg>
              Lihat Demo
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center gap-0">
            {stats.map((stat, i) => (
              <div key={i} className="flex items-center">
                <div className="px-5 py-3">
                  <div className="text-2xl font-bold text-[#2de295] font-[var(--font-display)]">{stat.value}</div>
                  <div className="text-xs text-[#9ba3af] mt-0.5">{stat.label}</div>
                </div>
                {i < stats.length - 1 && (
                  <div className="w-px h-10 bg-white/[0.08]" />
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* Right Content - 3D Visual */}
        <motion.div
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative flex items-center justify-center"
        >
          {/* Main hoodie image */}
          <div className="relative animate-float">
            <img
              src="/assets/hero-hoodie.png"
              alt="FitCraft 3D Hoodie"
              className="w-full max-w-lg drop-shadow-[0_0_60px_rgba(45,226,149,0.2)]"
            />

            {/* Ring platform */}
            <div className="ring-platform" />
          </div>

          {/* Floating control panel */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.5 }}
            className="absolute top-8 right-0 lg:right-[-20px] glass-panel rounded-2xl p-4 w-48"
          >
            <div className="text-xs font-bold text-[#9ba3af] mb-3 font-[var(--font-display)]">Pilih Warna</div>
            <div className="flex gap-2 mb-4">
              {colorOptions.map((color) => (
                <button
                  key={color.hex}
                  onClick={() => setSelectedColor(color)}
                  className={`w-7 h-7 rounded-full border-2 transition-all duration-200 ${
                    selectedColor.hex === color.hex
                      ? 'border-[#2de295] scale-110 shadow-[0_0_10px_rgba(45,226,149,0.3)]'
                      : 'border-white/10 hover:border-white/30'
                  }`}
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
            </div>

            <div className="text-xs font-bold text-[#9ba3af] mb-3 font-[var(--font-display)]">Material</div>
            <div className="flex gap-2 mb-4">
              {['Cotton', 'Fleece', 'Silk', 'Mesh'].map((mat, i) => (
                <button
                  key={mat}
                  className={`w-8 h-8 rounded-lg border transition-all text-[9px] font-bold ${
                    i === 0
                      ? 'border-[#2de295]/50 bg-[#2de295]/10 text-[#2de295]'
                      : 'border-white/10 text-[#4b5563] hover:border-white/20'
                  }`}
                >
                  {mat[0]}
                </button>
              ))}
            </div>

            <div className="text-xs font-bold text-[#9ba3af] mb-3 font-[var(--font-display)]">Detail</div>
            <div className="flex gap-2">
              {[
                { icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z', label: 'Hoodie' },
                { icon: 'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z', label: 'Kaos' },
                { icon: 'M20.38 3.46L16 7.83l-1-1 4.38-4.37a1 1 0 011 1zM18.5 12.5a4 4 0 100-8 4 4 0 000 8zM12 2H5a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7', label: 'Sweater' },
              ].map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => setActiveDetail(i)}
                  className={`w-10 h-10 rounded-lg border flex items-center justify-center transition-all ${
                    activeDetail === i
                      ? 'border-[#2de295]/50 bg-[#2de295]/10'
                      : 'border-white/10 hover:border-white/20'
                  }`}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={activeDetail === i ? 'text-[#2de295]' : 'text-[#4b5563]'}>
                    <path d={item.icon} />
                  </svg>
                </button>
              ))}
            </div>
          </motion.div>

          {/* Putar Model indicator */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1 }}
            className="absolute bottom-20 left-1/2 -translate-x-1/2 glass-panel rounded-full px-4 py-2 flex items-center gap-3"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2de295" strokeWidth="2">
              <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 11-.57-8.38l5.67-5.67" />
            </svg>
            <span className="text-xs font-medium text-[#9ba3af]">Putar Model</span>
            <div className="w-16 h-0.5 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full w-3/4 bg-gradient-to-r from-[#2de295] to-[#14b8a6] rounded-full" />
            </div>
            <span className="text-xs font-bold text-[#2de295]">360°</span>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}

function ShowcaseSection({ onNavigate }: { onNavigate: LandingPageProps['onNavigate'] }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-100px' });

  return (
    <section id="showcase" className="py-24 relative" ref={ref}>
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ duration: 0.6 }}
          className="mb-12"
        >
          <div className="label-text mb-3">SHOWCASE</div>
          <h2 className="heading-lg">
            Karya terbaik, <span className="neon-text">dirancang tanpa batas.</span>
          </h2>
        </motion.div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {showcaseItems.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 40 }}
              animate={isInView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.5, delay: i * 0.1 }}
              onClick={() => onNavigate('studio', item.name.toLowerCase().includes('hoodie') ? 'hoodie' : item.name.toLowerCase().includes('jersey') || item.name.toLowerCase().includes('kit') ? 'tshirt' : 'sweater')}
              className="glass-card rounded-2xl overflow-hidden cursor-pointer group"
            >
              <div className="relative aspect-[3/4] overflow-hidden bg-gradient-to-b from-[#0c0f12] to-[#08090a]">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                {item.tag && (
                  <div className="absolute top-3 left-3 bg-[#2de295]/20 backdrop-blur-sm text-[#2de295] text-[10px] font-bold px-2 py-1 rounded-full border border-[#2de295]/30">
                    {item.tag}
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-[#08090a] via-transparent to-transparent opacity-60" />
              </div>
              <div className="p-4">
                <h3 className="font-[var(--font-display)] font-bold text-base mb-0.5">{item.name}</h3>
                <p className="text-sm text-[#9ba3af]">{item.sub}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

function StatsCounter() {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: '-50px' });

  const counters = [
    { value: '500+', label: 'Klien Puas', icon: 'M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 7a4 4 0 100-8 4 4 0 000 8z' },
    { value: '1200+', label: 'Desain Terselesaikan', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
    { value: '50K+', label: 'Pakaian Dirender', icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z' },
    { value: '99%', label: 'Tingkat Kepuasan', icon: 'M22 11.08V12a10 10 0 11-5.93-9.14M22 4L12 14.01l-3-3' },
  ];

  return (
    <section className="py-16 relative" ref={ref}>
      <div className="max-w-5xl mx-auto px-6">
        <div className="glass-panel rounded-2xl p-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {counters.map((counter, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={isInView ? { opacity: 1, y: 0 } : {}}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                className="text-center"
              >
                <div className="w-10 h-10 rounded-xl bg-[#2de295]/10 border border-[#2de295]/20 flex items-center justify-center mx-auto mb-3">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2de295" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d={counter.icon} />
                  </svg>
                </div>
                <div className="text-2xl font-bold text-[#2de295] font-[var(--font-display)]">{counter.value}</div>
                <div className="text-xs text-[#9ba3af] mt-1">{counter.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CTASection({ onNavigate }: { onNavigate: LandingPageProps['onNavigate'] }) {
  return (
    <section className="py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#2de295]/5 to-transparent pointer-events-none" />
      <div className="max-w-3xl mx-auto px-6 text-center relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="heading-lg mb-4">
            Siap Mewujudkan
            <br />
            <span className="neon-text">Brand Impian Anda?</span>
          </h2>
          <p className="body-text mb-8 max-w-xl mx-auto">
            Bergabung dengan ratusan brand dan tim kreatif yang sudah mempercayakan desain mereka ke FitCraft 3D.
          </p>
          <button
            onClick={() => onNavigate('studio', 'hoodie')}
            className="btn-primary text-base px-8 py-4"
          >
            Mulai Kustomisasi Sekarang
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6" />
            </svg>
          </button>
        </motion.div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="border-t border-white/[0.06] py-12">
      <div className="max-w-7xl mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#2de295] to-[#14b8a6] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#08090a" strokeWidth="2.5">
                <path d="M6 4h12v6h-6v3h4v4h-4v3H6z" />
              </svg>
            </div>
            <span className="font-[var(--font-display)] font-bold">
              FITCRAFT <span className="text-[#2de295]">3D</span>
            </span>
          </div>

          <div className="flex items-center gap-6 text-sm text-[#9ba3af]">
            <a href="#" className="hover:text-[#2de295] transition-colors">Kebijakan Privasi</a>
            <a href="#" className="hover:text-[#2de295] transition-colors">Syarat & Ketentuan</a>
            <a href="#" className="hover:text-[#2de295] transition-colors">Kontak</a>
          </div>

          <p className="text-sm text-[#4b5563]">
            © 2026 FitCraft 3D. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}

export default function LandingPage({ onNavigate }: LandingPageProps) {
  return (
    <div className="bg-[#08090a] min-h-screen">
      <Navbar onNavigate={onNavigate} />
      <HeroSection onNavigate={onNavigate} />
      <StatsCounter />
      <ShowcaseSection onNavigate={onNavigate} />
      <CTASection onNavigate={onNavigate} />
      <Footer />
    </div>
  );
}

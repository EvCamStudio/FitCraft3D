import { useState, useEffect, useRef } from 'react';

const products = [
  {
    id: 'hoodie',
    name: 'Hoodie Kustom Cozy',
    price: 'Rp 349.000',
    image: '/assets/hoodie-3d.png',
  },
  {
    id: 'tshirt',
    name: 'Kaos Kinerja Pas Badan',
    price: 'Rp 199.000',
    image: '/assets/tshirt-3d.png',
  },
  {
    id: 'sweater',
    name: 'Sweater Crewneck Klasik',
    price: 'Rp 299.000',
    image: '/assets/sweater-3d.png',
  },
];

const galleryImages = [
  { src: '/assets/gallery-1.jpg', caption: 'Hoodie Custom — Tech Edition' },
  { src: '/assets/gallery-2.jpg', caption: 'Eco Sage T-Shirt — Organic Cotton' },
  { src: '/assets/gallery-3.jpg', caption: 'Crimson Knit — Winter Collection' },
  { src: '/assets/gallery-4.jpg', caption: 'Layered Streetwear — Urban Pack' },
];

interface LandingPageProps {
  onNavigate: (view: string, model?: string) => void;
  onReady?: () => void;
  onProgress?: (progress: number) => void;
  introFinished?: boolean;
}

export default function LandingPage({ onNavigate, onReady, onProgress }: LandingPageProps) {
  const [scrolled, setScrolled] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '' });
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  // Signal ready immediately since the landing page doesn't need to load 3D assets
  useEffect(() => {
    if (onProgress) onProgress(100);
    if (onReady) onReady();
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('revealed');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.1 }
    );

    sectionRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const addRef = (el: HTMLElement | null) => {
    if (el && !sectionRefs.current.includes(el)) {
      sectionRefs.current.push(el);
    }
  };

  const handleContactSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setShowContact(false);
    setShowSuccess(true);
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className={`landing-nav ${scrolled ? 'scrolled' : ''}`}>
        <a href="#" className="nav-logo" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }}>
          <div className="nav-logo-icon">
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="logoGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#00e5a0" />
                  <stop offset="100%" stopColor="#00b874" />
                </linearGradient>
              </defs>
              <path d="M6 4h12v6h-6v3h4v4h-4v3H6Z" fill="url(#logoGrad)" />
            </svg>
          </div>
          <span className="nav-logo-text">
            FITCRAFT <span>3D</span>
          </span>
        </a>

        <div className="nav-links">
          <a className="nav-link" onClick={() => scrollToSection('hero')}>Home</a>
          <a className="nav-link" onClick={() => scrollToSection('products')}>Catalog</a>
          <a className="nav-link" onClick={() => onNavigate('studio')}>Studio</a>
          <a className="nav-link" onClick={() => scrollToSection('gallery')}>About</a>
        </div>

        <button className="nav-cta" onClick={() => onNavigate('studio')}>
          <span>Mulai Desain</span>
          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </button>
      </nav>

      {/* Hero Section */}
      <section className="hero-section" id="hero">
        <div className="hero-bg">
          <img src="/assets/hero-bg.jpg" alt="" />
        </div>
        <div className="hero-overlay" />
        <div className="hero-grain" />

        <div className="hero-content">
          <p className="hero-subtitle">FITCRAFT 3D STUDIO</p>
          <h1 className="hero-title">
            DEFINING THE FUTURE OF<br />
            INDONESIA'S APPAREL<br />
            INDUSTRY <span className="accent">IN 3D</span>
          </h1>
          <p className="hero-desc">
            Rancang pakaian kustom premium untuk startup dan tim kreatif Anda 
            secara instan langsung dari browser — dengan presisi visualisasi 3D PBR real-time.
          </p>
          <div className="hero-cta-group">
            <button className="btn-primary" onClick={() => onNavigate('studio')}>
              <span>EXPLORE NOW</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => scrollToSection('products')}>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              <span>Lihat Koleksi</span>
            </button>
          </div>
        </div>

        <div className="hero-scroll">
          <span>Scroll</span>
          <div className="scroll-line" />
        </div>
      </section>

      {/* Marquee */}
      <section className="marquee-section">
        <div className="marquee-track">
          {[...Array(4)].map((_, i) => (
            <span key={i} className="marquee-text">
              FITCRAFT 3D STUDIO &nbsp;•&nbsp; CRAFT YOUR BRAND &nbsp;•&nbsp; CUSTOM APPAREL &nbsp;•&nbsp; REAL-TIME 3D &nbsp;•&nbsp;
            </span>
          ))}
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section" id="products">
        <div className="section-header reveal" ref={addRef}>
          <span className="section-eyebrow">KOLEKSI UNGGULAN</span>
          <h2 className="section-title">
            Pilih Kanvas<br />Desain Anda
          </h2>
        </div>

        <div className="products-grid">
          {products.map((product, idx) => (
            <div
              key={product.id}
              className={`product-card reveal reveal-delay-${idx + 1}`}
              ref={addRef}
            >
              <div className="product-image">
                <div className="product-glow" />
                <img src={product.image} alt={product.name} />
              </div>
              <div className="product-info">
                <span className="product-name">{product.name}</span>
                <span className="product-price">{product.price}</span>
              </div>
              <button
                className="product-btn"
                onClick={() => onNavigate('studio', product.id)}
              >
                <span>Kustomisasi</span>
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12" />
                  <polyline points="12 5 19 12 12 19" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* Gallery */}
      <section className="gallery-section" id="gallery">
        <div className="section-header reveal" ref={addRef}>
          <span className="section-eyebrow">SHOWCASE</span>
          <h2 className="section-title">
            Inspirasi<br />Desain Terbaik
          </h2>
        </div>

        <div className="gallery-grid">
          {galleryImages.map((img, idx) => (
            <div key={idx} className={`gallery-item reveal reveal-delay-${idx + 1}`} ref={addRef}>
              <img src={img.src} alt={img.caption} />
              <div className="gallery-caption">{img.caption}</div>
            </div>
          ))}
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content reveal" ref={addRef}>
          <h2 className="cta-title">
            Siap Wujudkan<br />Identitas Brand Anda?
          </h2>
          <p className="cta-desc">
            Tidak perlu install. Tidak perlu akun. Langsung mulai desain dari browser.
          </p>
          <div className="cta-buttons" style={{ display: 'flex', justifyContent: 'center', gap: '16px', flexWrap: 'wrap' }}>
            <button className="btn-primary" onClick={() => onNavigate('studio')}>
              <span>Buka Studio 3D</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
            <button className="btn-secondary" onClick={() => setShowContact(true)}>
              <span>Hubungi Kami</span>
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="site-footer">
        <div className="footer-grid">
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="nav-logo-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="footerGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00e5a0" />
                      <stop offset="100%" stopColor="#00b874" />
                    </linearGradient>
                  </defs>
                  <path d="M6 4h12v6h-6v3h4v4h-4v3H6Z" fill="url(#footerGrad)" />
                </svg>
              </div>
              <span>FITCRAFT <em>3D</em></span>
            </div>
            <p className="footer-tagline">
              Platform kustomisasi pakaian premium dengan teknologi 3D real-time untuk startup dan tim kreatif Indonesia.
            </p>
          </div>

          <div className="footer-links-col">
            <h3>Navigasi</h3>
            <ul>
              <li><a onClick={() => scrollToSection('hero')}>Beranda</a></li>
              <li><a onClick={() => scrollToSection('products')}>Katalog</a></li>
              <li><a onClick={() => onNavigate('studio')}>Studio 3D</a></li>
              <li><a onClick={() => scrollToSection('gallery')}>Showcase</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h3>Produk</h3>
            <ul>
              <li><a onClick={() => onNavigate('studio', 'hoodie')}>Hoodie Kustom</a></li>
              <li><a onClick={() => onNavigate('studio', 'tshirt')}>Kaos Kinerja</a></li>
              <li><a onClick={() => onNavigate('studio', 'sweater')}>Sweater Crewneck</a></li>
            </ul>
          </div>

          <div className="footer-links-col">
            <h3>Kontak</h3>
            <ul>
              <li><span>support@fitcraft3d.com</span></li>
              <li><span>+62 (21) 500-3D-CRAFT</span></li>
              <li><span>Jakarta, Indonesia</span></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© 2026 FitCraft 3D Studio — Kustomisasi Pakaian Premium</p>
          <div className="footer-bottom-links">
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat & Ketentuan</a>
          </div>
        </div>
      </footer>

      {/* Contact Modal */}
      {showContact && (
        <div className="modal-overlay" onClick={() => setShowContact(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setShowContact(false)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </button>
            <div className="modal-header">
              <h2>Hubungi Kami</h2>
              <p>Isi formulir di bawah dan tim kami akan menghubungi Anda segera.</p>
            </div>
            <form className="modal-form" onSubmit={handleContactSubmit}>
              <div className="form-field">
                <label htmlFor="contact-name">Nama Lengkap</label>
                <input
                  type="text"
                  id="contact-name"
                  placeholder="Masukkan nama Anda"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="contact-email">Email</label>
                <input
                  type="email"
                  id="contact-email"
                  placeholder="nama@perusahaan.com"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
              <div className="form-field">
                <label htmlFor="contact-phone">No. Telepon</label>
                <input
                  type="tel"
                  id="contact-phone"
                  placeholder="+62 812 xxxx xxxx"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
              </div>
              <button type="submit" className="btn-primary" style={{ width: '100%' }}>
                <span>Kirim Pesan</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Success Screen */}
      {showSuccess && (
        <div className="success-overlay" onClick={() => setShowSuccess(false)}>
          <div className="success-card" onClick={(e) => e.stopPropagation()}>
            <div className="success-icon">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14" />
                <polyline points="22 4 12 14.01 9 11.01" />
              </svg>
            </div>
            <h2>Pesan Terkirim!</h2>
            <p>Terima kasih telah menghubungi kami. Tim kami akan segera merespons pesan Anda.</p>
            <button className="btn-primary" onClick={() => setShowSuccess(false)}>
              <span>Kembali</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

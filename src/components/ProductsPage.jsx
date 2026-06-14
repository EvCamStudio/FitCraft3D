import { useEffect, useRef } from 'react';
import '../landing.css';
import '../products.css';

export default function ProductsPage({ onNavigate }) {
  const containerRef = useRef(null);

  useEffect(() => {
    document.body.classList.add('landing-page');

    // Reveal animations on load
    const cards = containerRef.current.querySelectorAll('.products-header, .product-card');
    cards.forEach((card) => {
      card.classList.add('reveal');
      setTimeout(() => {
        card.classList.add('in-view');
      }, 50);
    });

    return () => {
      document.body.classList.remove('landing-page');
    };
  }, []);

  const handleMouseMove = (e) => {
    const card = e.currentTarget;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    card.style.setProperty('--mouse-x', `${x}px`);
    card.style.setProperty('--mouse-y', `${y}px`);
  };

  return (
    <div ref={containerRef} className="products-page-wrapper">
      {/* Animated Background */}
      <div className="bg-gradient-mesh" aria-hidden="true">
        <div className="mesh-orb orb-1"></div>
        <div className="mesh-orb orb-2"></div>
        <div className="mesh-orb orb-3"></div>
      </div>

      {/* Navigation */}
      <nav className="nav-bar scrolled" id="navbar">
        <div className="nav-inner">
          <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="nav-logo">
            <div className="nav-logo-icon">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46L16 6a2 2 0 0 1-2.12-.13l-1.42-1a2 2 0 0 0-2.38 0l-1.42 1A2 2 0 0 1 6.54 6L2.12 3.46a.5.5 0 0 0-.75.43V8a2 2 0 0 0 1.63 2H5v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10h1.88A2 2 0 0 0 22.5 8V3.89a.5.5 0 0 0-.75-.43z"/>
              </svg>
            </div>
            <span className="nav-logo-text">FITCRAFT <em>3D</em></span>
          </a>

          <div className="nav-links">
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="nav-link">Fitur</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="nav-link">Cara Kerja</a>
            <a href="#" onClick={(e) => { e.preventDefault(); onNavigate('landing'); }} className="nav-link">Showcase</a>
          </div>

          <button onClick={() => onNavigate('studio')} className="btn-nav-cta">
            <span>Buka Studio</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </nav>

      {/* PRODUCTS GRID SECTION */}
      <main className="products-section">
        <div className="products-header">
          <div className="products-eyebrow">
            ✦ PILIH MODEL PAKAIAN
          </div>
          <h1 className="products-title">Kanvas Desain Anda</h1>
          <p className="products-subtitle">
            Mulai kustomisasi dari koleksi model dasar premium kami. Tiap model dirancang dengan presisi 3D PBR yang siap dipasangi logo brand Anda.
          </p>
        </div>

        <div className="products-grid">
          {/* HOODIE CARD */}
          <div className="product-card" onMouseMove={handleMouseMove}>
            <div className="product-tag">Outerwear</div>
            <div className="product-card-visual">
              <div className="product-svg-wrapper">
                <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                  <ellipse cx="100" cy="225" rx="55" ry="8" fill="rgba(0,0,0,0.2)"/>
                  <path d="M45 85 L30 210 L170 210 L155 85 L130 75 C125 95 115 105 100 105 C85 105 75 95 70 75 Z" fill="#1b2e3c"/>
                  <path d="M45 85 L70 75 L65 100 L20 130 L15 160 L35 165 L50 135 L55 110 Z" fill="#1b2e3c"/>
                  <path d="M155 85 L130 75 L135 100 L180 130 L185 160 L165 165 L150 135 L145 110 Z" fill="#1b2e3c"/>
                  <path d="M70 75 C75 55 90 45 100 45 C110 45 125 55 130 75 C125 95 115 105 100 105 C85 105 75 95 70 75Z" fill="#2a4050"/>
                  <path d="M72 72 C72 45 82 25 100 22 C118 25 128 45 128 72 C120 68 115 60 100 58 C85 60 80 68 72 72Z" fill="#2a4050"/>
                  <rect x="70" y="155" width="60" height="30" rx="6" fill="rgba(0,0,0,0.15)"/>
                  <rect x="85" y="112" width="30" height="18" rx="3" stroke="rgba(82, 140, 102, 0.4)" strokeDasharray="3 3" strokeWidth="1.5" fill="none"/>
                  <path d="M80 90 C90 88 110 88 120 92" stroke="rgba(255,255,255,0.08)" strokeWidth="6" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="product-info">
              <h2 className="product-name">Hoodie Kustom Cozy</h2>
              <div className="product-price">Rp 349.000</div>
              <p className="product-desc">Hoodie potongan santai dengan kupluk ganda dan saku depan kanguru. Memberikan kenyamanan maksimal dan area cetak logo dada yang luas.</p>
              <ul className="product-features-list">
                <li className="product-feature-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Fleece Katun Tebal 330 gsm</span>
                </li>
                <li className="product-feature-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Kupluk Ganda (Double Hood)</span>
                </li>
                <li className="product-feature-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Rib Karet di Hem & Lengan</span>
                </li>
              </ul>
              <button onClick={() => onNavigate('studio', 'hoodie')} className="btn-design-now">
                <span>Desain Sekarang</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* TSHIRT CARD */}
          <div className="product-card" onMouseMove={handleMouseMove}>
            <div className="product-tag">Atasan</div>
            <div className="product-card-visual">
              <div className="product-svg-wrapper">
                <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                  <ellipse cx="100" cy="225" rx="55" ry="8" fill="rgba(0,0,0,0.2)"/>
                  <path d="M45 75 L40 210 L160 210 L155 75 L130 70 C125 85 115 90 100 90 C85 90 75 85 70 70 Z" fill="#3b6352"/>
                  <path d="M45 75 L70 70 L65 100 L30 118 L22 98 L38 90 Z" fill="#3b6352"/>
                  <path d="M155 75 L130 70 L135 100 L170 118 L178 98 L162 90 Z" fill="#3b6352"/>
                  <path d="M70 70 C75 85 125 85 130 70 C125 80 115 80 100 80 C85 80 75 80 70 70 Z" fill="#4a7a65" stroke="#4a7a65" strokeWidth="2"/>
                  <rect x="85" y="102" width="30" height="18" rx="3" stroke="rgba(82, 140, 102, 0.4)" strokeDasharray="3 3" strokeWidth="1.5" fill="none"/>
                  <path d="M80 82 C90 80 110 80 120 84" stroke="rgba(255,255,255,0.08)" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="product-info">
              <h2 className="product-name">Kaos Kinerja Pas Badan</h2>
              <div className="product-price">Rp 199.000</div>
              <p className="product-desc">Kaos potongan modern dengan material combed premium yang lembut, sejuk, dan awet. Sangat pas untuk merchandise startup dan seragam kerja harian.</p>
              <ul className="product-features-list">
                <li className="product-feature-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>100% Katun Combed Premium 24s</span>
                </li>
                <li className="product-feature-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Jahitan Rantai Pundak Standar Ekspor</span>
                </li>
                <li className="product-feature-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Kerah Rib Elastis & Anti Melar</span>
                </li>
              </ul>
              <button onClick={() => onNavigate('studio', 'tshirt')} className="btn-design-now">
                <span>Desain Sekarang</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>

          {/* SWEATER CARD */}
          <div className="product-card" onMouseMove={handleMouseMove}>
            <div className="product-tag">Outerwear</div>
            <div className="product-card-visual">
              <div className="product-svg-wrapper">
                <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                  <ellipse cx="100" cy="225" rx="55" ry="8" fill="rgba(0,0,0,0.2)"/>
                  <path d="M45 75 L32 205 L168 205 L155 75 L130 70 C125 88 115 95 100 95 C85 95 75 88 70 70 Z" fill="#7f1d1d"/>
                  <path d="M32 205 H168 V213 H32 Z" fill="#991b1b"/>
                  <path d="M45 75 L70 70 L65 100 L24 135 L18 160 L34 165 L48 140 Z" fill="#7f1d1d"/>
                  <path d="M18 160 L34 165 L32 171 L16 166 Z" fill="#991b1b"/>
                  <path d="M155 75 L130 70 L135 100 L176 135 L182 160 L166 165 L152 140 Z" fill="#7f1d1d"/>
                  <path d="M182 160 L166 165 L168 171 L184 166 Z" fill="#991b1b"/>
                  <path d="M70 70 C75 82 85 88 100 88 C115 88 125 82 130 70 C125 78 115 78 100 78 C85 78 75 78 70 70 Z" fill="#991b1b"/>
                  <rect x="85" y="105" width="30" height="18" rx="3" stroke="rgba(82, 140, 102, 0.4)" strokeDasharray="3 3" strokeWidth="1.5" fill="none"/>
                  <path d="M80 82 C90 80 110 80 120 84" stroke="rgba(255,255,255,0.08)" strokeWidth="4" strokeLinecap="round"/>
                </svg>
              </div>
            </div>
            <div className="product-info">
              <h2 className="product-name">Sweater Crewneck Klasik</h2>
              <div className="product-price">Rp 299.000</div>
              <p className="product-desc">Crewneck klasik dengan detail rib tebal pada kerah, ujung lengan, dan pinggang. Desain minimalis serbaguna, cocok untuk gaya kasual semi-formal.</p>
              <ul className="product-features-list">
                <li className="product-feature-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Fleece Katun Lembut 280 gsm</span>
                </li>
                <li className="product-feature-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Kerutan Rib Elastis di Leher & Lengan</span>
                </li>
                <li className="product-feature-item">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>
                  <span>Bahan Breathable Hangat & Menyerap Keringat</span>
                </li>
              </ul>
              <button onClick={() => onNavigate('studio', 'sweater')} className="btn-design-now">
                <span>Desain Sekarang</span>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <line x1="5" y1="12" x2="19" y2="12"></line>
                  <polyline points="12 5 19 12 12 19"></polyline>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="site-footer">
        <div className="footer-inner">
          <div className="footer-logo">
            <div className="nav-logo-icon">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M20.38 3.46L16 6a2 2 0 0 1-2.12-.13l-1.42-1a2 2 0 0 0-2.38 0l-1.42 1A2 2 0 0 1 6.54 6L2.12 3.46a.5.5 0 0 0-.75.43V8a2 2 0 0 0 1.63 2H5v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10h1.88A2 2 0 0 0 22.5 8V3.89a.5.5 0 0 0-.75-.43z"/>
              </svg>
            </div>
            <span>FITCRAFT <em>3D</em></span>
          </div>
          <p className="footer-copy">© 2026 FitCraft 3D — Studio Kustomisasi Pakaian Premium. Dibuat dengan Three.js & React.</p>
        </div>
      </footer>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import StudioVisualizer from './StudioVisualizer';
import '../index.css';
import '../studio_overrides.css';

const presetColorOptions = [
  { hex: '#ffffff', name: 'Pure White (Tren Minimalis)' },
  { hex: '#a8a29e', name: 'Heather Grey (Tren Atletik)' },
  { hex: '#1e2522', name: 'Charcoal Black (Tren Urban)' },
  { hex: '#121212', name: 'Obsidian Black (Tren Cyberpunk)' },
  { hex: '#3b6352', name: 'Eco Sage (Tren Organik)' },
  { hex: '#1b2e3c', name: 'Tech Navy (Tren SaaS)' },
  { hex: '#7f1d1d', name: 'Premium Burgundy (Tren Mewah)' },
  { hex: '#e27c70', name: 'Creative Coral (Tren Gen-Z)' }
];

const modelOptions = [
  {
    id: 'hoodie',
    name: 'Hoodie Kustom Cozy',
    category: 'Outerwear',
    price: 349000
  },
  {
    id: 'tshirt',
    name: 'Kaos Kinerja Pas Badan',
    category: 'Atasan',
    price: 199000
  },
  {
    id: 'sweater',
    name: 'Sweater Crewneck Klasik',
    category: 'Outerwear',
    price: 299000
  }
];

const designTips = [
  "Gunakan file PNG transparan beresolusi tinggi untuk hasil kustomisasi stiker yang paling tajam.",
  "Pilihlah warna logo/teks yang kontras dengan warna dasar pakaian agar desain Anda lebih menonjol.",
  "Gunakan tombol kamera (Depan, Belakang, Samping) untuk memantau letak logo dari berbagai sudut.",
  "Pilih bahan Heavy Fleece untuk ketebalan ekstra dan kehangatan optimal pada Hoodie/Sweater.",
  "Klik dan geser logo langsung di permukaan model 3D untuk memposisikannya secara fleksibel."
];

const getActiveColorName = (hex) => {
  const match = presetColorOptions.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  if (match) {
    return match.name.split(' (')[0];
  }
  return hex;
};

export default function StudioPage({ onNavigate, initialModel = 'hoodie', onReady, onProgress }) {
  // Theme state
  const [darkTheme, setDarkTheme] = useState(() => {
    return localStorage.getItem('fitcraft_theme') === 'dark';
  });

  // User session state
  const [userName] = useState(() => {
    try {
      const user = JSON.parse(localStorage.getItem('fitcraft_user'));
      return (user && user.name) ? user.name : 'Desainer';
    } catch {
      return 'Desainer';
    }
  });

  // Visual customizer state
  const [garmentType, setGarmentType] = useState(initialModel);
  const [fabric, setFabric] = useState('cotton'); // 'cotton' | 'fleece'
  const [size, setSize] = useState('M'); // 'S' | 'M' | 'L' | 'XL' | 'XXL'

  // Colors state
  const [colors, setColors] = useState({
    body: '#1b2e3c',
    sleeves: '#1b2e3c',
    collar: '#1b2e3c'
  });
  const [colorsName, setColorsName] = useState({
    body: 'Tech Navy (Tren SaaS)',
    sleeves: 'Tech Navy (Tren SaaS)',
    collar: 'Tech Navy (Tren SaaS)'
  });

  // Decal parameters
  const [decal, setDecal] = useState({
    type: 'preset', // 'preset' | 'custom' | 'none'
    presetName: 'fitcraft', // 'fitcraft' | 'nexus' | 'quantum' | 'apex'
    customImage: null,
    customImageName: '',
    text: '',
    textFont: 'Space Grotesk',
    textColor: 'match',
    scale: 1.0,
    vertical: 0.0,
    horizontal: 0.0,
    opacity: 1.0
  });

  // Studio configuration states
  const [lightingPreset, setLightingPreset] = useState('studio');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isScaleView, setIsScaleView] = useState(false);
  const [isLightIntensityExtra, setIsLightIntensityExtra] = useState(false);
  const [activeTab, setActiveTab] = useState('tab-right-design');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const handleNextTip = () => {
    setCurrentTipIndex((prev) => (prev + 1) % designTips.length);
  };

  // Local storage gallery state
  const [savedDesigns, setSavedDesigns] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('fitcraft_saved_designs')) || [];
    } catch {
      return [];
    }
  });
  const [exportTrigger, setExportTrigger] = useState(0);
  const [pendingSave, setPendingSave] = useState(false);

  // Modals state
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [showSizeModal, setShowSizeModal] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [checkoutEmail, setCheckoutEmail] = useState('');
  const [checkoutName, setCheckoutName] = useState('');
  const [checkoutStartup, setCheckoutStartup] = useState('');
  const [invoiceCode, setInvoiceCode] = useState('');

  // File Upload input ref
  const fileInputRef = useRef(null);

  // Update theme class on body
  useEffect(() => {
    if (darkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('fitcraft_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('fitcraft_theme', 'light');
    }
  }, [darkTheme]);

  // Scoped layout toggler on body
  useEffect(() => {
    document.body.classList.add('studio-page');
    return () => {
      document.body.classList.remove('studio-page');
    };
  }, []);

  // Sync garmentType with localStorage and URL query params
  useEffect(() => {
    localStorage.setItem('fitcraft_active_model', garmentType);
    localStorage.setItem('fitcraft_active_view', 'studio');
    window.history.replaceState({}, '', `?model=${garmentType}`);
  }, [garmentType]);

  // Pricing formula
  const activeModel = modelOptions.find((m) => m.id === garmentType) || modelOptions[0];
  const fabricPriceAdd = fabric === 'fleece' ? 75000 : 0;
  const totalPrice = activeModel.price + fabricPriceAdd;



  // Color change handlers
  const handleColorSelect = (zone, hex, name) => {
    setColors({ body: hex, sleeves: hex, collar: hex });
    setColorsName({ body: name, sleeves: name, collar: name });
  };

  // Custom color picker handlers
  const handleCustomColor = (zone, hex) => {
    const name = `Kustom (${hex.toUpperCase()})`;
    setColors({ body: hex, sleeves: hex, collar: hex });
    setColorsName({ body: name, sleeves: name, collar: name });
  };




  // Upload handler
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.match('image.*')) {
      alert('File yang diunggah harus berupa gambar (PNG, JPG, atau WEBP).');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setDecal((prev) => ({
        ...prev,
        type: 'custom',
        customImage: event.target.result,
        customImageName: file.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveCustomLogo = () => {
    setDecal((prev) => ({
      ...prev,
      type: 'preset',
      presetName: 'fitcraft',
      customImage: null,
      customImageName: ''
    }));
  };

  // Slider adjustments
  const handleDecalSlider = (key, value) => {
    setDecal((prev) => {
      const isNumeric = key === 'scale' || key === 'vertical' || key === 'horizontal' || key === 'opacity';
      const parsedValue = isNumeric ? Number(value) : value;
      const next = { ...prev, [key]: parsedValue };
      if (key === 'horizontal' || key === 'vertical') {
        next.localPos = null;
        next.localNormal = null;
      }
      return next;
    });
  };

  // Decal drag feedback sync
  const handleDecalDrag = (coords) => {
    setDecal((prev) => ({ ...prev, ...coords }));
  };



  // Saved designs system
  const triggerSaveDesign = () => {
    setPendingSave(true);
    setExportTrigger((prev) => prev + 1);
  };

  const handleExportComplete = (dataUrl) => {
    if (pendingSave && dataUrl) {
      const newDesign = {
        id: 'design_' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        garment: garmentType,
        fabric,
        size,
        colors,
        colorsName,
        decal,
        price: totalPrice,
        thumbnail: dataUrl
      };

      const updated = [...savedDesigns, newDesign];
      setSavedDesigns(updated);
      localStorage.setItem('fitcraft_saved_designs', JSON.stringify(updated));
      setPendingSave(false);
      setActiveTab('tab-right-design');
    } else if (pendingSave) {
      setPendingSave(false);
    }
  };

  const handleDeleteDesign = (id, e) => {
    e.stopPropagation();
    const updated = savedDesigns.filter((d) => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem('fitcraft_saved_designs', JSON.stringify(updated));
  };

  const handleLoadDesign = (design) => {
    setGarmentType(design.garment);
    setFabric(design.fabric);
    setSize(design.size);
    setColors(design.colors);
    setColorsName(design.colorsName);
    setDecal(design.decal);
  };

  // Snapshot PNG Download
  const triggerDownloadSnapshot = () => {
    const canvas = document.querySelector('.canvas-container canvas');
    if (!canvas) return;
    try {
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.download = `fitcraft-desain-${garmentType}.png`;
      link.href = dataUrl;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error('Gagal snapshot:', e);
      alert('Gagal mengunduh snapshot gambar.');
    }
  };

  // Order checkout handlers
  const handleCheckoutSubmit = (e) => {
    e.preventDefault();
    // Generate order code invoice
    const code = `FC-3D-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;
    setInvoiceCode(code);
    setShowCheckoutModal(false);
    setShowSuccessModal(true);
  };

  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
      
      {/* ═══ HEADER ═══ */}
      <header className="app-header">
        {/* Zone Left: Brand Logo */}
        <div className="header-zone-left">
          <button onClick={() => onNavigate('landing')} className="header-back-btn" title="Kembali">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
          </button>
          <div className="header-brand-logo-container" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div className="nav-logo-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="fitcraft-logo-gradient-studio" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2de295" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <path d="M6 4h12v6h-6v3h4v4h-4v3H6Z" fill="url(#fitcraft-logo-gradient-studio)" />
              </svg>
            </div>
            <span className="header-brand-name">FitCraft 3D</span>
          </div>
        </div>

        {/* Zone Center: Studio Title */}
        <div className="header-zone-center">
          <div style={{ fontSize: '11px', fontWeight: 'bold', fontFamily: 'Space Grotesk', letterSpacing: '1.5px', color: '#8c9692' }}>
            3D REAL-TIME STUDIO
          </div>
        </div>

        {/* Zone Right: Actions & Profile */}
        <div className="header-zone-right">
          <button onClick={() => setShowCheckoutModal(true)} className="btn-checkout">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
            BAYAR SEKARANG
          </button>

          <button onClick={() => setDarkTheme(!darkTheme)} className="btn-theme-toggle" title="Ganti Tema">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="theme-icon-sun"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" className="theme-icon-moon"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
          </button>

          <div className="user-profile">
            <div className="user-details">
              <span className="user-name" id="studioUserName">{userName}</span>
              <span className="user-role">✦ STUDIO</span>
            </div>
            <img src="https://api.dicebear.com/7.x/adventurer/svg?seed=fitcraft" alt="Avatar" className="user-avatar" id="userAvatar" />
          </div>
        </div>
      </header>

      {/* ═══ STUDIO WORKSPACE ═══ */}
      <main className="studio-workspace" style={{ flex: 1, overflow: 'hidden', minHeight: 0 }}>
        
        {/* ── LEFT SIDEBAR ── */}
        <aside className="sidebar-left">
          
          <div className="sidebar-scroll-container">
            {/* Active Model Picker */}
            <div className="sidebar-block" style={{ borderBottom: '1px solid #e8eceb' }}>
              <div className="sidebar-block-label">Model Aktif</div>
              <div className="sidebar-product-picker-container" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
                <div className="header-product-info">
                  <div className="header-product-thumb" id="sidebarProductThumbnail">
                    {garmentType === 'hoodie' && (
                      <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                        <path d="M45 85 L30 210 L170 210 L155 85 L130 75 C125 95 115 105 100 105 C85 105 75 95 70 75 Z" fill="var(--primary, #528c66)" opacity="0.7"/>
                        <path d="M72 72 C72 45 82 25 100 22 C118 25 128 45 128 72 C120 68 115 60 100 58 C85 60 80 68 72 72Z" fill="var(--primary, #528c66)" opacity="0.5"/>
                      </svg>
                    )}
                    {garmentType === 'tshirt' && (
                      <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                        <path d="M45 75 L40 210 L160 210 L155 75 L130 70 C125 85 115 90 100 90 C85 90 75 85 70 70 Z" fill="var(--primary, #528c66)" opacity="0.7"/>
                        <path d="M45 75 L70 70 L65 100 L30 118 L22 98 Z" fill="var(--primary, #528c66)" opacity="0.5"/>
                        <path d="M155 75 L130 70 L135 100 L170 118 L178 98 Z" fill="var(--primary, #528c66)" opacity="0.5"/>
                      </svg>
                    )}
                    {garmentType === 'sweater' && (
                      <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', height: '100%' }}>
                        <path d="M45 75 L32 205 L168 205 L155 75 L130 70 C125 88 115 95 100 95 C85 95 75 88 70 70 Z" fill="var(--primary, #528c66)" opacity="0.7"/>
                        <path d="M45 75 L70 70 L65 100 L24 135 L18 160 L34 165 Z" fill="var(--primary, #528c66)" opacity="0.5"/>
                        <path d="M155 75 L130 70 L135 100 L176 135 L182 160 L166 165 Z" fill="var(--primary, #528c66)" opacity="0.5"/>
                      </svg>
                    )}
                  </div>
                  <div className="header-product-meta">
                    <span className="header-product-name" id="carouselModelTitle">{activeModel.name}</span>
                    <span className="header-product-sub">PBR v4 · <span id="activeGarmentName">{activeModel.category}</span></span>
                  </div>
                </div>
                <button onClick={() => onNavigate('products')} className="btn-ubah-produk" title="Ubah Produk">
                  <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/>
                  </svg>
                  Ubah
                </button>
              </div>
            </div>



            {/* Material selection block */}
            <div className="sidebar-block">
              <div className="sidebar-block-label">Pilih Bahan Kain</div>
              <div className="fabric-cards-group" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div
                  className={`fabric-card ${fabric === 'cotton' ? 'active' : ''}`}
                  onClick={() => setFabric('cotton')}
                >
                  <div className="fabric-card-title">Cotton Premium</div>
                  <div className="fabric-card-price">Termasuk</div>
                </div>
                <div
                  className={`fabric-card ${fabric === 'fleece' ? 'active' : ''}`}
                  onClick={() => setFabric('fleece')}
                >
                  <div className="fabric-card-title">Heavy Fleece</div>
                  <div className="fabric-card-price">+Rp 75.000</div>
                </div>
              </div>
            </div>

            {/* Size Select pills & Size Guide */}
            <div className="sidebar-block">
              <div className="sidebar-block-label">Pilih Ukuran</div>
              <div style={{ display: 'flex', gap: '6px', width: '100%', marginBottom: '10px' }}>
                {['S', 'M', 'L', 'XL', 'XXL'].map((sz) => (
                  <button
                    key={sz}
                    className={`btn-size-pill ${size === sz ? 'active' : ''}`}
                    onClick={() => setSize(sz)}
                    style={{ flex: 1 }}
                  >
                    {sz}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowSizeModal(true)} className="btn-save-design" style={{ borderStyle: 'solid', marginTop: 0 }}>
                📏 Lihat Panduan Ukuran (Size Guide)
              </button>
            </div>

            {/* Ringkasan Desain */}
            <div className="sidebar-block">
              <div className="sidebar-block-label">Ringkasan Desain</div>
              <div className="design-summary-card">
                <div className="summary-item">
                  <span className="summary-item-label">Model</span>
                  <span className="summary-item-value">{activeModel.name}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-item-label">Bahan</span>
                  <span className="summary-item-value">{fabric === 'cotton' ? 'Cotton Premium' : 'Heavy Fleece'}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-item-label">Ukuran</span>
                  <span className="summary-item-value">Size {size}</span>
                </div>
                <div className="summary-item">
                  <span className="summary-item-label">Warna Dasar</span>
                  <div className="summary-item-value-color">
                    <span className="color-swatch-dot" style={{ backgroundColor: colors.body }}></span>
                    <span>{getActiveColorName(colors.body)}</span>
                  </div>
                </div>
                <div className="summary-item">
                  <span className="summary-item-label">Kustomisasi</span>
                  <span className="summary-item-value">
                    {decal.type === 'preset' ? `Logo Preset (${decal.presetName.toUpperCase()})` :
                     decal.type === 'custom' ? 'Logo Kustom' : 'Tanpa Logo'}
                    {decal.text ? ' + Teks' : ''}
                  </span>
                </div>
                <div className="summary-item-price">
                  <span className="price-label">Estimasi Harga</span>
                  <span className="price-value">{new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 }).format(totalPrice)}</span>
                </div>
              </div>
            </div>

            {/* Tips Desain */}
            <div className="sidebar-block" style={{ borderBottom: 'none' }}>
              <div className="sidebar-block-label">Tips Kustomisasi</div>
              <div className="design-tips-card" onClick={handleNextTip} title="Klik untuk tips selanjutnya">
                <div className="tips-icon">💡</div>
                <div className="tips-content">
                  <p className="tips-text">{designTips[currentTipIndex]}</p>
                  <span className="tips-action">Klik kartu untuk tips berikutnya ➔</span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer Assistance */}
          <div className="sidebar-footer-bar">
            <button className="btn-bantuan" onClick={() => setShowSizeModal(true)}>
              <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              Bantuan
            </button>
          </div>
        </aside>

        {/* ── CENTER VIEWPORT ── */}
        <section className="viewport-section">
          <div className="canvas-wrapper">
            

            {/* Visualizer Canvas View */}
            <div id="canvas-container" className="canvas-container">
              <StudioVisualizer
                garmentType={garmentType}
                colors={colors}
                fabric={fabric}
                size={size}
                lightingPreset={lightingPreset}
                decal={decal}
                autoRotate={autoRotate}
                isScaleView={isScaleView}
                onDecalDrag={handleDecalDrag}
                exportTrigger={exportTrigger}
                onExportComplete={handleExportComplete}
                onReady={onReady}
                onProgress={onProgress}
              />
            </div>
          </div>

          {/* Customization Toolbar Wrapper (Floating Bottom Bar) */}
          <div className="toolbar-container">
              <div className="customization-toolbar">
                {/* Lighting Presets */}
                <button
                  className={`toolbar-btn btn-toggle ${lightingPreset === 'studio' ? 'active' : ''}`}
                  onClick={() => setLightingPreset('studio')}
                  title="Mode Studio"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                    <line x1="8" y1="21" x2="16" y2="21"></line>
                    <line x1="12" y1="17" x2="12" y2="21"></line>
                  </svg>
                  <span>Studio</span>
                </button>
                
                <button
                  className={`toolbar-btn btn-toggle ${lightingPreset === 'sunset' ? 'active' : ''}`}
                  onClick={() => setLightingPreset('sunset')}
                  title="Mode Sunset"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="2" y1="18" x2="22" y2="18"></line>
                    <path d="M17 18a5 5 0 0 0-10 0"></path>
                    <line x1="12" y1="2" x2="12" y2="8"></line>
                  </svg>
                  <span>Sunset</span>
                </button>
                
                <button
                  className={`toolbar-btn btn-toggle ${lightingPreset === 'industrial' ? 'active' : ''}`}
                  onClick={() => setLightingPreset('industrial')}
                  title="Mode Workshop"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M22 10v11a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V10l7-3 5 3 8-3z"></path>
                    <path d="M17 11V7a3 3 0 0 0-6 0v4"></path>
                  </svg>
                  <span>Workshop</span>
                </button>

                <div className="toolbar-divider" />

                {/* Exposure Lighting Toggle */}
                <button
                  className={`toolbar-btn ${isLightIntensityExtra ? 'active' : ''}`}
                  onClick={() => {
                    const nextVal = !isLightIntensityExtra;
                    setIsLightIntensityExtra(nextVal);
                    // Adjust canvas exposure directly on the visualizer renderer
                    const canvas = document.querySelector('.canvas-container canvas');
                    if (canvas && canvas.__threeRenderer) {
                      canvas.__threeRenderer.toneMappingExposure = nextVal ? 1.4 : 1.0;
                    }
                  }}
                  title="Intensitas Cahaya"
                >
                  {/* Bulb icon indicating illumination */}
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .4 2.5 1.5 3.5.7.8 1.3 1.5 1.5 2.5z"></path>
                    <line x1="9" y1="18" x2="15" y2="18"></line>
                  </svg>
                  <span>Pencahayaan</span>
                </button>

                {/* Auto Rotate Toggle */}
                <button
                  className={`toolbar-btn ${autoRotate ? 'active' : ''}`}
                  onClick={() => setAutoRotate(!autoRotate)}
                  title="Putar Otomatis"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"></path>
                  </svg>
                  <span>Putar Otomatis</span>
                </button>

                {/* Scale View Zoom */}
                <button
                  className={`toolbar-btn ${isScaleView ? 'active' : ''}`}
                  onClick={() => setIsScaleView(!isScaleView)}
                  title="Perbesar Tampilan"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                    <line x1="11" y1="8" x2="11" y2="14"></line>
                  </svg>
                  <span>Zoom</span>
                </button>

                {/* Reset Camera */}
                <button
                  className="toolbar-btn"
                  onClick={() => {
                    setIsScaleView(false);
                    setAutoRotate(true);
                  }}
                  title="Atur Ulang Kamera"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"></path>
                    <polyline points="3 3 3 8 8 8"></polyline>
                  </svg>
                  <span>Reset</span>
                </button>

                {/* Export PNG */}
                <button
                  className="toolbar-btn"
                  onClick={triggerDownloadSnapshot}
                  title="Unduh Gambar Desain"
                >
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"></path>
                    <circle cx="12" cy="13" r="4"></circle>
                  </svg>
                  <span>Snapshot</span>
                </button>
              </div>

              <div className="viewport-instructions">
                Tarik langsung logomu pada visualisator 3D untuk menyesuaikan posisi.
              </div>
            </div>
          </section>

        {/* ── RIGHT SIDEBAR ── */}
        <aside className="sidebar-right">
          {/* Tab Navigation */}
          <div className="right-tabs-nav">
            <button
              className={`right-tab-btn sidebar-tab-btn ${activeTab === 'tab-right-design' ? 'active' : ''}`}
              onClick={() => setActiveTab('tab-right-design')}
            >
              Desain
            </button>
            <button
              className={`right-tab-btn sidebar-tab-btn ${activeTab === 'tab-right-text' ? 'active' : ''}`}
              onClick={() => setActiveTab('tab-right-text')}
            >
              Teks
            </button>
            <button
              className={`right-tab-btn sidebar-tab-btn ${activeTab === 'tab-right-layer' ? 'active' : ''}`}
              onClick={() => setActiveTab('tab-right-layer')}
            >
              Layer
            </button>
          </div>

          <div className="sidebar-scroll-container">
            {/* Tab Panes */}
            <div className="right-panel-content">
            
            {/* DESIGN PANE */}
            {activeTab === 'tab-right-design' && (
              <div className="right-tab-pane active" id="tab-right-design">
                {/* Custom upload button */}
                <button
                  className="btn-upload-gambar"
                  onClick={() => fileInputRef.current?.click()}
                  style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', width: '100%', marginBottom: '10px' }}
                >
                  <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M17 8l-5-5-5 5M12 3v12"/></svg>
                  Upload Gambar
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  style={{ display: 'none' }}
                  accept="image/png, image/jpeg, image/webp"
                  onChange={handleFileUpload}
                />

                {decal.type === 'custom' && decal.customImage && (
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 10px', background: 'rgba(82, 140, 102, 0.08)', borderRadius: '6px', border: '1px solid rgba(82, 140, 102, 0.2)', marginBottom: '14px' }}>
                    <span style={{ fontSize: '10px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '140px', fontWeight: 'bold' }}>
                      🖼️ {decal.customImageName}
                    </span>
                    <button
                      onClick={handleRemoveCustomLogo}
                      style={{ background: 'none', border: 'none', color: '#ff4d4d', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}
                    >
                      Hapus
                    </button>
                  </div>
                )}

                {/* Preset Logos */}
                <div className="desain-section-title" style={{ marginBottom: '8px' }}>Preset Logo Startup</div>
                <div className="preset-decals-grid" id="presetDecals">
                  {[
                    { id: 'fitcraft', label: 'FitCraft', svg: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20.38 3.46L16 6a2 2 0 0 1-2.12-.13l-1.42-1a2 2 0 0 0-2.38 0l-1.42 1A2 2 0 0 1 6.54 6L2.12 3.46"/><path d="M12 9v11m-4-6h8"/></svg> },
                    { id: 'nexus', label: 'Nexus AI', svg: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg> },
                    { id: 'quantum', label: 'Quantum', svg: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="9"/><path d="M9 12h6m-3-3v6"/><circle cx="12" cy="12" r="3" fill="currentColor"/></svg> },
                    { id: 'apex', label: 'Apex Tech', svg: <svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 2L2 22h20L12 2z"/></svg> }
                  ].map((preset) => (
                    <button
                      key={preset.id}
                      className={`btn-decal-preset ${decal.type === 'preset' && decal.presetName === preset.id ? 'active' : ''}`}
                      onClick={() => setDecal((prev) => ({ ...prev, type: 'preset', presetName: preset.id }))}
                    >
                      {preset.svg}
                      <span>{preset.label}</span>
                    </button>
                  ))}
                </div>

                <div className="rpane-divider"></div>

                {/* Pilih Warna Section */}
                <div className="desain-section-title" style={{ marginBottom: '8px' }}>Pilih Warna Pakaian</div>
                <div className="color-zone-row" style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                  <span className="color-zone-name" style={{ minWidth: '45px', fontSize: '11px', fontWeight: 'bold', color: '#8c9692' }}>Warna</span>
                  <div className="color-dots-inline" style={{ display: 'flex', gap: '4px', alignItems: 'center', flexWrap: 'nowrap' }}>
                    {presetColorOptions.map((opt, idx) => (
                      <button
                        key={idx}
                        className={`cdot ${colors.body === opt.hex ? 'active' : ''}`}
                        style={{ '--dot-color': opt.hex }}
                        onClick={() => handleColorSelect('body', opt.hex, opt.name)}
                        title={opt.name}
                      />
                    ))}
                    <div className={`cdot-plus custom-color-picker ${!presetColorOptions.some(o => o.hex === colors.body) ? 'active' : ''}`} style={{ '--dot-color': colors.body }} title="Warna Kustom">
                      <input
                        type="color"
                        className="custom-color-input-field"
                        value={colors.body}
                        onChange={(e) => handleCustomColor('body', e.target.value)}
                      />
                      <svg viewBox="0 0 24 24" width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '9px', color: '#8c9692', marginBottom: '14px', paddingLeft: '53px' }}>
                  {colorsName.body}
                </div>

                <div className="rpane-divider"></div>

                {/* Saved Designs (Gallery) */}
                <div className="desain-saya-section">
                  <div className="layer-header-row">
                    <span className="desain-section-title">Desain Saya</span>
                    <button className="btn-save-design" onClick={triggerSaveDesign} style={{ width: 'auto', padding: '4px 8px', fontSize: '10px', marginTop: 0 }}>
                      + Simpan
                    </button>
                  </div>
                  <div className="desain-grid" id="savedDesignsGrid">
                    {savedDesigns.length === 0 ? (
                      <div className="gallery-empty-state" id="galleryEmptyState" style={{ gridColumn: 'span 3', padding: '16px 0', fontSize: '10px', color: '#8c9692', textAlign: 'center' }}>
                        Belum ada desain tersimpan
                      </div>
                    ) : (
                      savedDesigns.map((ds) => (
                        <div key={ds.id} className="saved-design-card" onClick={() => handleLoadDesign(ds)} style={{ position: 'relative' }}>
                          <button className="btn-delete-saved-design" onClick={(e) => handleDeleteDesign(ds.id, e)} title="Hapus Desain">
                            &times;
                          </button>
                          <img src={ds.thumbnail} alt="Desain" className="saved-design-thumbnail" />
                          <div className="saved-design-info">
                            <span className="saved-design-title">{ds.decal.text ? ds.decal.text.toUpperCase() : ds.garment.toUpperCase()}</span>
                            <span className="saved-design-meta">{ds.timestamp} • Rp {ds.price.toLocaleString('id-ID')}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* TEXT PANE */}
            {activeTab === 'tab-right-text' && (
              <div className="right-tab-pane active" id="tab-right-text">
                <div className="text-controls-section">
                  <div>
                    <label className="ctrl-label">TEKS KUSTOM</label>
                    <input
                      type="text"
                      className="text-input-field"
                      placeholder="Ketik teks di sini..."
                      value={decal.text}
                      onChange={(e) => handleDecalSlider('text', e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="ctrl-label">FONT</label>
                    <select
                      className="font-select"
                      value={decal.textFont}
                      onChange={(e) => handleDecalSlider('textFont', e.target.value)}
                    >
                      <option value="Space Grotesk">Space Grotesk</option>
                      <option value="Outfit">Outfit</option>
                      <option value="Playfair Display">Playfair Display</option>
                    </select>
                  </div>
                  <div>
                    <label className="ctrl-label">WARNA TEKS</label>
                    <div style={{ display: 'flex', gap: '8px' }}>
                      <button
                        className={`btn-size-pill ${decal.textColor === 'match' ? 'active' : ''}`}
                        onClick={() => handleDecalSlider('textColor', 'match')}
                        style={{ fontSize: '9px', padding: '6px' }}
                      >
                        Sesuai Kaos
                      </button>
                      <button
                        className={`btn-size-pill ${decal.textColor === '#ff4d4d' ? 'active' : ''}`}
                        onClick={() => handleDecalSlider('textColor', '#ff4d4d')}
                        style={{ fontSize: '9px', padding: '6px', background: '#ff4d4d', color: '#fff', border: 'none' }}
                      >
                        Merah
                      </button>
                      <button
                        className={`btn-size-pill ${decal.textColor === '#ffd700' ? 'active' : ''}`}
                        onClick={() => handleDecalSlider('textColor', '#ffd700')}
                        style={{ fontSize: '9px', padding: '6px', background: '#ffd700', color: '#000', border: 'none' }}
                      >
                        Emas
                      </button>
                      <button
                        className={`btn-size-pill ${decal.textColor === '#00bcd4' ? 'active' : ''}`}
                        onClick={() => handleDecalSlider('textColor', '#00bcd4')}
                        style={{ fontSize: '9px', padding: '6px', background: '#00bcd4', color: '#fff', border: 'none' }}
                      >
                        Sian
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* LAYERS PANE */}
            {activeTab === 'tab-right-layer' && (
              <div className="right-tab-pane active" id="tab-right-layer">
                <div className="layer-header-row">
                  <span className="layer-count-title">Layers ({decal.text ? '2' : '1'})</span>
                </div>
                <div className="layer-list" id="layerList">
                  {decal.text && (
                    <div className="layer-item selected">
                      <button className="layer-eye-btn">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <div className="layer-thumb">
                        Tks
                      </div>
                      <div className="layer-info">
                        <div className="layer-name">Teks – {decal.text}</div>
                        <div className="layer-type">{decal.textFont}</div>
                      </div>
                    </div>
                  )}
                  {decal.type !== 'none' && (
                    <div className="layer-item">
                      <button className="layer-eye-btn">
                        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                      </button>
                      <div className="layer-thumb">
                        🚀
                      </div>
                      <div className="layer-info">
                        <div className="layer-name">Graphic – {decal.type === 'preset' ? decal.presetName.toUpperCase() : 'UPLOAD'}</div>
                        <div className="layer-type">Branding Decal</div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Position Controls (Always visible at bottom) */}
          <div className="position-controls-panel">
            <div className="pos-panel-title">Atur Posisi &amp; Ukuran</div>
            <div className="pos-fields-grid">
              <div className="pos-field">
                <label>X (Hrz)</label>
                <input
                  type="number"
                  step="0.05"
                  value={decal.horizontal}
                  onChange={(e) => handleDecalSlider('horizontal', e.target.value)}
                />
              </div>
              <div className="pos-field">
                <label>Y (Vrt)</label>
                <input
                  type="number"
                  step="0.05"
                  value={decal.vertical}
                  onChange={(e) => handleDecalSlider('vertical', e.target.value)}
                />
              </div>
              <div className="pos-field">
                <label>Scale</label>
                <input
                  type="number"
                  step="0.05"
                  value={decal.scale}
                  onChange={(e) => handleDecalSlider('scale', e.target.value)}
                />
              </div>
              <div className="pos-field">
                <label>Opc</label>
                <input
                  type="number"
                  step="0.1"
                  value={decal.opacity}
                  onChange={(e) => handleDecalSlider('opacity', e.target.value)}
                />
              </div>
            </div>
            <div className="pos-sliders">
              <div className="pos-slider-row">
                <div className="pos-slider-header">
                  <span className="pos-slider-label">Ukuran Decal</span>
                  <span className="pos-slider-val" id="valScale">{decal.scale.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  className="premium-slider"
                  min="0.3"
                  max="2.0"
                  step="0.05"
                  value={decal.scale}
                  onChange={(e) => handleDecalSlider('scale', e.target.value)}
                />
              </div>
              <div className="pos-slider-row">
                <div className="pos-slider-header">
                  <span className="pos-slider-label">Posisi Vertikal</span>
                  <span className="pos-slider-val" id="valVertical">{decal.vertical.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  className="premium-slider"
                  min="-0.6"
                  max="0.6"
                  step="0.02"
                  value={decal.vertical}
                  onChange={(e) => handleDecalSlider('vertical', e.target.value)}
                />
              </div>
              <div className="pos-slider-row">
                <div className="pos-slider-header">
                  <span className="pos-slider-label">Posisi Horizontal</span>
                  <span className="pos-slider-val" id="valHorizontal">{decal.horizontal.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  className="premium-slider"
                  min="-0.5"
                  max="0.5"
                  step="0.02"
                  value={decal.horizontal}
                  onChange={(e) => handleDecalSlider('horizontal', e.target.value)}
                />
              </div>
              <div className="pos-slider-row">
                <div className="pos-slider-header">
                  <span className="pos-slider-label">Transparansi</span>
                  <span className="pos-slider-val" id="valOpacity">{Math.round(decal.opacity * 100)}%</span>
                </div>
                <input
                  type="range"
                  className="premium-slider"
                  min="0.2"
                  max="1.0"
                  step="0.05"
                  value={decal.opacity}
                  onChange={(e) => handleDecalSlider('opacity', e.target.value)}
                />
              </div>
            </div>
          </div>
          </div>

          {/* Pricing + Checkout primary button */}
          <div className="price-cta-block">
            <div className="price-row">
              <span className="price-label-sm">TOTAL HARGA</span>
              <span className="price-value-sm" id="sidebarTotalPrice">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
            <button className="btn-checkout-primary" onClick={() => setShowCheckoutModal(true)}>
              Pesan Desain Ini
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </div>

        </aside>
      </main>

      {/* Checkout Modal Overlay */}
      {showCheckoutModal && (
        <div className="modal-overlay" onClick={() => setShowCheckoutModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setShowCheckoutModal(false)}>×</button>
            <div id="modalOrderSummary">
              <h2 className="modal-title">📦 Ringkasan Desain FitCraft 3D</h2>
              <p className="modal-subtitle">Periksa kembali detail kustomisasi Anda sebelum melanjutkan pemesanan.</p>
              <div className="summary-details">
                <div className="summary-item"><span className="summary-label">Model Potongan:</span><span className="summary-val">{activeModel.name}</span></div>
                <div className="summary-item"><span className="summary-label">Jenis Bahan:</span><span className="summary-val">{fabric === 'cotton' ? 'Katun Premium (Termasuk)' : 'Fleece Tebal (+Rp 75.000)'}</span></div>
                <div className="summary-item"><span className="summary-label">Warna Pakaian:</span><span className="summary-val" style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colors.body }} /> {colorsName.body.split(' ')[0]}
                </span></div>
                <div className="summary-item"><span className="summary-label">Decal Branding:</span><span className="summary-val">{decal.type === 'preset' ? `${decal.presetName.toUpperCase()} Preset` : 'Custom Upload'}</span></div>
                <div className="summary-item"><span className="summary-label">Ukuran Pakaian:</span><span className="summary-val">{size}</span></div>
                <div className="summary-divider"></div>
                <div className="summary-item total-row"><span className="summary-label">Total Pembayaran:</span><span className="summary-val price-accent">Rp {totalPrice.toLocaleString('id-ID')}</span></div>
              </div>
              <form id="checkoutForm" className="checkout-form" onSubmit={handleCheckoutSubmit}>
                <div className="form-group">
                  <label htmlFor="custName">Nama Lengkap</label>
                  <input
                    type="text"
                    id="custName"
                    placeholder="Masukkan nama lengkap Anda"
                    required
                    value={checkoutName}
                    onChange={(e) => setCheckoutName(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="custStartup">Nama Startup / Instansi</label>
                  <input
                    type="text"
                    id="custStartup"
                    placeholder="Contoh: FitCraft Corp"
                    required
                    value={checkoutStartup}
                    onChange={(e) => setCheckoutStartup(e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label htmlFor="custEmail">Alamat Email</label>
                  <input
                    type="email"
                    id="custEmail"
                    placeholder="nama@startupanda.com"
                    required
                    value={checkoutEmail}
                    onChange={(e) => setCheckoutEmail(e.target.value)}
                  />
                </div>
                <button type="submit" className="btn-submit-order">Konfirmasi &amp; Bayar Sekarang</button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Success Modal Overlay */}
      {showSuccessModal && (
        <div className="modal-overlay" onClick={() => setShowSuccessModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="success-screen">
              <div className="success-icon">
                <svg viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12"/>
                </svg>
              </div>
              <h2 className="success-title">Pesanan Berhasil Dibuat!</h2>
              <p className="success-desc">Detail desain dan tagihan invoice dikirimkan ke email <strong>{checkoutEmail}</strong>.</p>
              <div className="success-summary">
                <p>Kode Pesanan: <strong className="order-code">{invoiceCode}</strong></p>
              </div>
              <button className="btn-success-close" onClick={() => setShowSuccessModal(false)}>Selesai &amp; Kembali ke Studio</button>
            </div>
          </div>
        </div>
      )}

      {/* Size Chart Modal Overlay */}
      {showSizeModal && (
        <div className="modal-overlay" onClick={() => setShowSizeModal(false)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <button className="btn-close-modal" onClick={() => setShowSizeModal(false)}>×</button>
            <h2 className="modal-title">📏 Tabel Ukuran Pakaian</h2>
            <p className="modal-subtitle">Ukuran standard fitting lokal (toleransi &plusmn;2 cm).</p>
            <table className="size-chart-table">
              <thead>
                <tr>
                  <th>Ukuran</th>
                  <th>Lebar Dada</th>
                  <th>Panjang Badan</th>
                  <th>Panjang Lengan</th>
                </tr>
              </thead>
              <tbody>
                <tr><td><strong>S</strong></td><td>50 cm</td><td>66 cm</td><td>59 cm</td></tr>
                <tr><td><strong>M</strong></td><td>53 cm</td><td>68 cm</td><td>61 cm</td></tr>
                <tr><td><strong>L</strong></td><td>56 cm</td><td>70 cm</td><td>63 cm</td></tr>
                <tr><td><strong>XL</strong></td><td>59 cm</td><td>72 cm</td><td>65 cm</td></tr>
                <tr><td><strong>XXL</strong></td><td>62 cm</td><td>74 cm</td><td>67 cm</td></tr>
              </tbody>
            </table>
            <button className="btn-submit-order" onClick={() => setShowSizeModal(false)} style={{ marginTop: '12px', width: '100%' }}>Tutup</button>
          </div>
        </div>
      )}

    </div>
  );
}

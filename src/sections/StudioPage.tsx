import { useState, useRef, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import StudioVisualizer, { type DecalConfig } from './StudioVisualizer';

interface StudioPageProps {
  onNavigate: (page: string, model?: 'hoodie' | 'tshirt' | 'sweater') => void;
  initialModel?: string;
  onReady?: () => void;
  onProgress?: (progress: number) => void;
}

const presetColorOptions = [
  { hex: '#ffffff', name: 'Pure White (Tren Minimalis)' },
  { hex: '#a8a29e', name: 'Heather Grey (Tren Atletik)' },
  { hex: '#1e2522', name: 'Charcoal Black (Tren Urban)' },
  { hex: '#121212', name: 'Obsidian Black (Tren Cyberpunk)' },
  { hex: '#3b6352', name: 'Eco Sage (Tren Organik)' },
  { hex: '#1b2e3c', name: 'Tech Navy (Tren SaaS)' },
  { hex: '#7f1d1d', name: 'Premium Burgundy (Tren Mewah)' },
  { hex: '#e27c70', name: 'Creative Coral (Tren Gen-Z)' },
];

const modelOptions = [
  { id: 'hoodie' as const, name: 'Hoodie Kustom Cozy', category: 'Outerwear', price: 349000 },
  { id: 'tshirt' as const, name: 'Kaos Kinerja Pas Badan', category: 'Atasan', price: 199000 },
  { id: 'sweater' as const, name: 'Sweater Crewneck Klasik', category: 'Outerwear', price: 299000 },
];

const designTips = [
  'Gunakan file PNG transparan beresolusi tinggi untuk hasil kustomisasi stiker yang paling tajam.',
  'Pilihlah warna logo/teks yang kontras dengan warna dasar pakaian agar desain Anda lebih menonjol.',
  'Gunakan tombol kamera (Depan, Belakang, Samping) untuk memantau letak logo dari berbagai sudut.',
  'Pilih bahan Heavy Fleece untuk ketebalan ekstra dan kehangatan optimal pada Hoodie/Sweater.',
  'Klik dan geser logo langsung di permukaan model 3D untuk memposisikannya secara fleksibel.',
];

const getActiveColorName = (hex: string) => {
  const match = presetColorOptions.find(c => c.hex.toLowerCase() === hex.toLowerCase());
  return match ? match.name.split(' (')[0] : hex;
};

export default function StudioPage({ onNavigate, initialModel = 'hoodie', onReady, onProgress }: StudioPageProps) {
  // Normalize initialModel to fit exactly 'hoodie' | 'tshirt' | 'sweater'
  const normalizedInitialModel: 'hoodie' | 'tshirt' | 'sweater' =
    initialModel === 'tshirt' || initialModel === 'sweater' || initialModel === 'hoodie'
      ? initialModel
      : 'hoodie';

  // State
  const [garmentType, setGarmentType] = useState<'hoodie' | 'tshirt' | 'sweater'>(normalizedInitialModel);
  const [fabric, setFabric] = useState<'cotton' | 'fleece'>('cotton');
  const [size, setSize] = useState('M');
  const [colors, setColors] = useState({ body: '#ffffff', sleeves: '#ffffff', collar: '#ffffff' });
  const [colorsName, setColorsName] = useState({ body: 'Pure White (Tren Minimalis)', sleeves: 'Pure White (Tren Minimalis)', collar: 'Pure White (Tren Minimalis)' });
  const [decal, setDecal] = useState<DecalConfig>({
    type: 'preset', presetName: 'fitcraft', customImage: null, customImageName: '',
    text: '', textFont: 'Space Grotesk', textColor: 'match',
    scale: 1.0, vertical: 0.0, horizontal: 0.0, opacity: 1.0,
  });
  const [lightingPreset, setLightingPreset] = useState<'studio' | 'sunset' | 'industrial'>('studio');
  const [autoRotate, setAutoRotate] = useState(false);
  const [isScaleView, setIsScaleView] = useState(false);
  const [activeTab, setActiveTab] = useState<'design' | 'text' | 'layer'>('design');
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [savedDesigns, setSavedDesigns] = useState<any[]>(() => {
    try { return JSON.parse(localStorage.getItem('fitcraft_saved_designs') || '[]'); } catch { return []; }
  });
  const [exportTrigger, setExportTrigger] = useState(0);
  const [pendingSave, setPendingSave] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({ name: '', startup: '', email: '' });
  const [invoiceCode, setInvoiceCode] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const activeModel = modelOptions.find(m => m.id === garmentType) || modelOptions[0];
  const fabricPriceAdd = fabric === 'fleece' ? 75000 : 0;
  const totalPrice = activeModel.price + fabricPriceAdd;

  const handleColorSelect = useCallback((hex: string, name: string) => {
    setColors({ body: hex, sleeves: hex, collar: hex });
    setColorsName({ body: name, sleeves: name, collar: name });
  }, []);

  const handleDecalSlider = useCallback((key: keyof DecalConfig, value: string | number) => {
    setDecal(prev => {
      const isNumeric = ['scale', 'vertical', 'horizontal', 'opacity'].includes(key);
      const parsed = isNumeric ? Number(value) : value;
      const next = { ...prev, [key]: parsed } as DecalConfig;
      if (key === 'horizontal' || key === 'vertical') {
        next.localPos = null;
        next.localNormal = null;
      }
      return next;
    });
  }, []);

  const handleDecalDrag = useCallback((coords: { horizontal: number; vertical: number; localPos?: { x: number; y: number; z: number } | null; localNormal?: { x: number; y: number; z: number } | null }) => {
    setDecal(prev => ({ ...prev, ...coords }));
  }, []);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.match('image.*')) { alert('File harus berupa gambar'); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      setDecal(prev => ({ ...prev, type: 'custom', customImage: ev.target?.result as string, customImageName: file.name }));
    };
    reader.readAsDataURL(file);
  };

  const triggerSaveDesign = () => {
    setPendingSave(true);
    setExportTrigger(prev => prev + 1);
  };

  const handleExportComplete = (dataUrl: string | null) => {
    if (pendingSave && dataUrl) {
      const newDesign = {
        id: 'design_' + Date.now(),
        timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
        garment: garmentType, fabric, size, colors, colorsName, decal, price: totalPrice, thumbnail: dataUrl,
      };
      const updated = [...savedDesigns, newDesign];
      setSavedDesigns(updated);
      localStorage.setItem('fitcraft_saved_designs', JSON.stringify(updated));
      setPendingSave(false);
    } else if (pendingSave) {
      setPendingSave(false);
    } else if (dataUrl) {
      // Trigger snapshot download
      const link = document.createElement('a');
      link.download = `fitcraft_design_${garmentType}_${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    }
  };

  const handleDeleteDesign = (id: string) => {
    const updated = savedDesigns.filter(d => d.id !== id);
    setSavedDesigns(updated);
    localStorage.setItem('fitcraft_saved_designs', JSON.stringify(updated));
  };

  const handleLoadDesign = (design: any) => {
    setGarmentType(design.garment);
    setFabric(design.fabric);
    setSize(design.size);
    setColors(design.colors);
    setColorsName(design.colorsName);
    setDecal(design.decal);
  };

  const triggerDownloadSnapshot = () => {
    setExportTrigger(prev => prev + 1);
  };

  const handleCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    setInvoiceCode(`FC-3D-2026-${Math.random().toString(36).substring(2, 6).toUpperCase()}`);
    setShowCheckout(false);
    setShowSuccess(true);
  };

  // Synchronize router url param
  useEffect(() => {
    window.history.replaceState({}, '', `?model=${garmentType}`);
  }, [garmentType]);

  // Floating particles for viewport
  const FloatingParticles = () => (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-[5]">
      {Array.from({ length: 30 }).map((_, i) => (
        <div
          key={i}
          className="absolute w-0.5 h-0.5 bg-[#2de295] rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.6 + 0.1,
            animation: `particleGlow ${2 + Math.random() * 4}s ease-in-out infinite`,
            animationDelay: `${Math.random() * 3}s`,
          }}
        />
      ))}
    </div>
  );

  // Ring platform component
  const RingPlatform = () => (
    <div className="absolute bottom-[15%] left-1/2 -translate-x-1/2 pointer-events-none z-[5]">
      <div className="w-[280px] h-[60px] border-2 border-[#2de295]/40 rounded-[50%] animate-[ringPulse_3s_ease-in-out_infinite]" />
      <div className="absolute inset-0 -m-4 border border-[#2de295]/20 rounded-[50%] animate-[ringPulse_3s_ease-in-out_infinite_0.5s]" />
      <div className="absolute inset-0 -m-8 border border-[#2de295]/10 rounded-[50%] animate-[ringPulse_3s_ease-in-out_infinite_1s]" />
    </div>
  );

  return (
    <div className="h-screen flex flex-col bg-[#08090a] overflow-hidden">
      {/* Header */}
      <header className="h-14 flex items-center justify-between px-5 border-b border-[#2de295]/20 bg-[#08090a]/95 backdrop-blur-xl shadow-[0_4px_30px_rgba(45,226,149,0.04)] z-50 shrink-0">
        <div className="flex items-center gap-4">
          <button onClick={() => onNavigate('landing')} className="flex items-center gap-2 text-sm text-[#9ba3af] hover:text-[#2de295] transition-colors bg-transparent border-none cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6" /></svg>
          </button>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#0c0f12] border border-white/[0.08] flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradStudio" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00e5a0" />
                    <stop offset="100%" stopColor="#00b874" />
                  </linearGradient>
                </defs>
                <path d="M6 4h12v6h-6v3h4v4h-4v3H6Z" fill="url(#logoGradStudio)" />
              </svg>
            </div>
            <span className="font-[var(--font-display)] font-bold text-sm tracking-tight text-white">FITCRAFT <span className="text-[#2de295]">3D</span></span>
          </div>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2 text-xs font-bold tracking-[0.2em] text-[#2de295]/70 font-[var(--font-display)]">
          3D REAL-TIME STUDIO
        </div>

        <div className="flex items-center gap-3">
          <button onClick={() => setShowCheckout(true)} className="btn-primary text-xs py-2 px-4 cursor-pointer">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" /><path d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6" /></svg>
            BAYAR SEKARANG
          </button>
          <button className="w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-[#9ba3af] hover:text-[#2de295] hover:border-[#2de295]/30 transition-all bg-transparent cursor-pointer">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" /><path d="M13.73 21a2 2 0 0 1-3.46 0" /></svg>
          </button>
          <div className="flex items-center gap-2 pl-3 border-l border-white/[0.06]">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-bold text-[#f0f2f5]">Designer</div>
              <div className="text-[10px] text-[#2de295]">STUDIO</div>
            </div>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2de295]/20 to-[#14b8a6]/20 border border-[#2de295]/30 flex items-center justify-center">
              <span className="text-xs font-bold text-[#2de295]">D</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Workspace */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* LEFT SIDEBAR */}
        <aside className="w-[260px] shrink-0 border-r border-[#2de295]/20 bg-[#0c0f12] shadow-[5px_0_30px_rgba(45,226,149,0.05)] flex flex-col overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {/* Model Aktif */}
            <div>
              <div className="label-text mb-2">Model Aktif</div>
              <div className="glass-card rounded-xl p-3 flex items-center gap-3">
                <div className="w-10 h-12 rounded-lg bg-gradient-to-b from-[#1e2522] to-[#08090a] border border-white/[0.06] flex items-center justify-center">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2de295" strokeWidth="1.5">
                    <path d="M20.38 3.46L16 7.83l-1-1 4.38-4.37a1 1 0 011 1z" />
                  </svg>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-bold truncate text-white">{activeModel.name}</div>
                  <div className="text-[10px] text-[#9ba3af]">PBR v4 · {activeModel.category}</div>
                </div>
                <button onClick={() => onNavigate('products')} className="text-[10px] font-bold text-[#2de295] bg-[#2de295]/10 px-2 py-1 rounded-md hover:bg-[#2de295]/20 transition-colors border-none cursor-pointer">
                  Ubah
                </button>
              </div>
            </div>

            {/* Bahan Kain */}
            <div>
              <div className="label-text mb-2">Bahan Kain</div>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { id: 'cotton' as const, name: 'Cotton Premium', price: 'Termasuk' },
                  { id: 'fleece' as const, name: 'Heavy Fleece', price: '+Rp 75.000' },
                ].map(mat => (
                  <button
                    key={mat.id}
                    onClick={() => setFabric(mat.id)}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer ${fabric === mat.id
                      ? 'border-[#2de295]/40 bg-[#2de295]/10 text-white'
                      : 'border-white/[0.06] bg-white/[0.02] text-[#9ba3af] hover:border-white/[0.12]'
                      }`}
                  >
                    <div className="text-xs font-bold">{mat.name}</div>
                    <div className={`text-[10px] mt-0.5 ${fabric === mat.id ? 'text-[#2de295]' : 'text-[#4b5563]'}`}>{mat.price}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Ukuran */}
            <div>
              <div className="label-text mb-2">Ukuran</div>
              <div className="flex gap-1.5">
                {['S', 'M', 'L', 'XL', 'XXL'].map(sz => (
                  <button
                    key={sz}
                    onClick={() => setSize(sz)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer border-none ${size === sz
                      ? 'bg-[#2de295] text-[#08090a]'
                      : 'bg-white/[0.04] text-[#9ba3af] border border-white/[0.06] hover:border-white/[0.12]'
                      }`}
                  >
                    {sz}
                  </button>
                ))}
              </div>
              <button onClick={() => setShowSizeGuide(true)} className="mt-2 w-full py-2 text-[10px] font-bold text-[#9ba3af] border border-dashed border-white/[0.08] rounded-lg hover:border-[#2de295]/30 hover:text-[#2de295] transition-all bg-transparent cursor-pointer">
                Lihat Panduan Ukuran
              </button>
            </div>

            {/* Ringkasan Desain */}
            <div>
              <div className="label-text mb-2">Ringkasan Desain</div>
              <div className="glass-card rounded-xl p-3 space-y-2 text-white">
                {[
                  { label: 'Model', value: activeModel.name },
                  { label: 'Bahan', value: fabric === 'cotton' ? 'Cotton Premium' : 'Heavy Fleece' },
                  { label: 'Ukuran', value: `Size ${size}` },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-xs">
                    <span className="text-[#9ba3af]">{item.label}</span>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-xs items-center">
                  <span className="text-[#9ba3af]">Warna</span>
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: colors.body }} />
                    <span className="font-bold">{getActiveColorName(colors.body)}</span>
                  </div>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-[#9ba3af]">Logo</span>
                  <span className="font-bold">
                    {decal.type === 'preset' ? decal.presetName.toUpperCase() : decal.type === 'custom' ? 'Custom' : 'None'}
                  </span>
                </div>
                <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center">
                  <span className="text-xs text-[#9ba3af]">Total</span>
                  <span className="text-sm font-bold text-[#2de295]">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>
            </div>

            {/* Tips Kustomisasi */}
            <div>
              <div className="label-text mb-2">Tips Kustomisasi</div>
              <button
                onClick={() => setCurrentTipIndex(prev => (prev + 1) % designTips.length)}
                className="w-full glass-card rounded-xl p-3 text-left hover:border-[#2de295]/30 transition-all group bg-transparent cursor-pointer"
              >
                <div className="flex gap-2">
                  <span className="text-lg"></span>
                  <div>
                    <p className="text-xs text-[#9ba3af] leading-relaxed group-hover:text-[#f0f2f5] transition-colors">{designTips[currentTipIndex]}</p>
                    <span className="text-[10px] text-[#2de295] mt-1 inline-block">Klik untuk tips berikutnya →</span>
                  </div>
                </div>
              </button>
            </div>
          </div>

          {/* Footer */}
          <div className="p-3 border-t border-[#2de295]/15">
            <button onClick={() => setShowSizeGuide(true)} className="flex items-center gap-2 text-xs text-[#9ba3af] hover:text-[#2de295] transition-colors bg-transparent border-none cursor-pointer">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10" /><line x1="12" y1="16" x2="12" y2="12" /><line x1="12" y1="8" x2="12.01" y2="8" /></svg>
              Bantuan
            </button>
          </div>
        </aside>

        {/* CENTER VIEWPORT */}
        <section className="flex-1 relative bg-gradient-to-b from-[#0c0f12] to-[#08090a] min-w-0">
          <FloatingParticles />
          <RingPlatform />

          {/* Floating info */}
          <div className="absolute top-5 right-5 z-20 glass-panel rounded-xl px-4 py-3 text-white">
            <div className="text-xs font-bold font-[var(--font-display)]">{activeModel.name}</div>
            <div className="flex gap-4 mt-1 text-[10px] text-[#9ba3af]">
              <span>PBR v4</span>
              <span>{activeModel.category}</span>
            </div>
          </div>

          {/* View toggle */}
          <div className="absolute top-5 left-1/2 -translate-x-1/2 z-20 glass-panel rounded-full px-2 py-1.5 flex gap-1">
            {[
              { icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', label: 'Depan' },
              { icon: 'M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z', label: 'Belakang' },
              { icon: 'M12 3v18M3 12h18', label: 'Samping' },
              { icon: 'M12 2a10 10 0 100 20 10 10 0 000-20z', label: '360°' },
            ].map((view, i) => (
              <button key={i} className={`w-8 h-8 rounded-full flex items-center justify-center transition-all bg-transparent border-none cursor-pointer ${i === 0 ? 'bg-[#2de295]/20 text-[#2de295]' : 'text-[#4b5563] hover:text-[#9ba3af]'}`} title={view.label}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d={view.icon} /></svg>
              </button>
            ))}
          </div>

          {/* 3D Canvas */}
          <div className="absolute inset-0 z-[2]">
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

          {/* Bottom Toolbar */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2">
            <div className="glass-panel rounded-2xl px-3 py-2 flex items-center gap-1">
              {[
                { id: 'studio', label: 'Studio', icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5' },
                { id: 'sunset', label: 'Sunset', icon: 'M17 18a5 5 0 0 0-10 0M12 2v7M4.22 10.22l1.42 1.42M1 18h2M21 18h2M18.36 10.22l-1.42 1.42' },
                { id: 'industrial', label: 'Workshop', icon: 'M12 3v18M3 12h18M7.5 7.5l9 9M16.5 7.5l-9 9' },
              ].map(preset => (
                <button
                  key={preset.id}
                  onClick={() => setLightingPreset(preset.id as 'studio' | 'sunset' | 'industrial')}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all border-none bg-transparent cursor-pointer ${lightingPreset === preset.id
                    ? 'bg-[#2de295]/10 text-[#2de295]'
                    : 'text-[#9ba3af] hover:text-[#f0f2f5] hover:bg-white/[0.04]'
                    }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d={preset.icon} /></svg>
                  <span className="text-[9px] font-bold">{preset.label}</span>
                </button>
              ))}

              <div className="w-px h-8 bg-white/[0.08] mx-1" />

              {[
                { id: 'light', label: 'Cahaya', action: () => { } },
                { id: 'rotate', label: 'Putar', action: () => setAutoRotate(!autoRotate), active: autoRotate },
                { id: 'zoom', label: 'Zoom', action: () => setIsScaleView(!isScaleView), active: isScaleView },
                { id: 'reset', label: 'Reset', action: () => { setIsScaleView(false); setAutoRotate(true); } },
                { id: 'snapshot', label: 'Snapshot', action: triggerDownloadSnapshot },
              ].map(tool => (
                <button
                  key={tool.id}
                  onClick={tool.action}
                  className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all border-none bg-transparent cursor-pointer ${tool.active
                    ? 'bg-[#2de295]/10 text-[#2de295]'
                    : 'text-[#9ba3af] hover:text-[#f0f2f5] hover:bg-white/[0.04]'
                    }`}
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {tool.id === 'light' && <path d="M12 3v2.25m6.364.386l-1.591 1.591M21 12h-2.25m-.386 6.364l-1.591-1.591M12 18.75V21m-4.773-4.227l-1.591 1.591M5.25 12H3m4.227-4.773L5.636 5.636M15.75 12a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0z" />}
                    {tool.id === 'rotate' && <path d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182" />}
                    {tool.id === 'zoom' && <path d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607zM10.5 7.5v6M7.5 10.5h6" />}
                    {tool.id === 'reset' && <path d="M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3" />}
                    {tool.id === 'snapshot' && <><path d="M6.827 6.175A2.31 2.31 0 015.186 7.23c-.38.054-.757.112-1.134.175C2.999 7.58 2.25 8.507 2.25 9.574V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18V9.574c0-1.067-.75-1.994-1.802-2.169a47.865 47.865 0 00-1.134-.175 2.31 2.31 0 01-1.64-1.055l-.822-1.316a2.192 2.192 0 00-1.736-1.039 48.774 48.774 0 00-5.232 0 2.192 2.192 0 00-1.736 1.039l-.821 1.316z" /><path d="M16.5 12.75a4.5 4.5 0 11-9 0 4.5 4.5 0 019 0z" /></>}
                  </svg>
                  <span className="text-[9px] font-bold">{tool.label}</span>
                </button>
              ))}
            </div>
            <div className="glass-panel rounded-full px-3 py-1 text-[10px] text-[#9ba3af]">
              Tarik langsung logomu pada visualisator 3D untuk menyesuaikan posisi
            </div>
          </div>
        </section>

        {/* RIGHT SIDEBAR */}
        <aside className="w-[300px] shrink-0 border-l border-[#2de295]/20 bg-[#0c0f12] shadow-[-5px_0_30px_rgba(45,226,149,0.05)] flex flex-col overflow-hidden text-white">
          {/* Tabs */}
          <div className="flex gap-1 p-2 border-b border-[#2de295]/15 bg-white/[0.02]">
            {[
              { id: 'design' as const, label: 'DESAIN' },
              { id: 'text' as const, label: 'TEKS' },
              { id: 'layer' as const, label: 'LAYER' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 py-2.5 rounded-lg text-[11px] font-bold transition-all border-none cursor-pointer ${activeTab === tab.id
                  ? 'bg-white/[0.08] text-[#2de295] shadow-sm'
                  : 'text-[#9ba3af] hover:text-[#f0f2f5] hover:bg-white/[0.02]'
                  }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="flex-1 overflow-y-auto p-4">
            {/* DESIGN TAB */}
            {activeTab === 'design' && (
              <div className="space-y-4">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full btn-primary justify-center cursor-pointer"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M17 8l-5-5-5 5M12 3v12" /></svg>
                  Upload Gambar
                </button>
                <input type="file" ref={fileInputRef} className="hidden" accept="image/png,image/jpeg,image/webp" onChange={handleFileUpload} />

                {decal.type === 'custom' && decal.customImage && (
                  <div className="flex items-center justify-between p-2.5 bg-[#2de295]/5 rounded-lg border border-[#2de295]/20">
                    <span className="text-xs font-bold truncate max-w-[140px]">🖼️ {decal.customImageName}</span>
                    <button onClick={() => setDecal(prev => ({ ...prev, type: 'preset', presetName: 'fitcraft', customImage: null, customImageName: '' }))} className="text-[#ef4444] text-xs font-bold hover:scale-110 transition-transform bg-transparent border-none cursor-pointer">
                      ✕
                    </button>
                  </div>
                )}

                <div>
                  <div className="text-xs font-bold text-[#9ba3af] mb-2">Preset Logo Startup</div>
                  <div className="grid grid-cols-3 gap-2">
                    {[
                      { id: 'fitcraft', label: 'FitCraft', icon: 'M12 2L2 7l10 5 10-5-10-5z' },
                      { id: 'nexus', label: 'Nexus AI', icon: 'M12 2a10 10 0 100 20 10 10 0 000-20z' },
                      { id: 'quantum', label: 'Quantum', icon: 'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z' },
                      { id: 'apex', label: 'Apex Tech', icon: 'M12 2L2 22h20L12 2zm0 3.5L18.5 20H5.5L12 5.5z' },
                    ].map(preset => (
                      <button
                        key={preset.id}
                        onClick={() => setDecal(prev => ({ ...prev, type: 'preset', presetName: preset.id }))}
                        className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all cursor-pointer ${decal.type === 'preset' && decal.presetName === preset.id
                          ? 'border-[#2de295]/40 bg-[#2de295]/10 text-[#2de295]'
                          : 'border-white/[0.06] bg-white/[0.02] text-[#9ba3af] hover:border-white/[0.12]'
                          }`}
                      >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><path d={preset.icon} /></svg>
                        <span className="text-[9px] font-bold">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* Warna */}
                <div>
                  <div className="text-xs font-bold text-[#9ba3af] mb-2">Pilih Warna Pakaian</div>
                  <div className="flex flex-wrap gap-2">
                    {presetColorOptions.map(opt => (
                      <button
                        key={opt.hex}
                        onClick={() => handleColorSelect(opt.hex, opt.name)}
                        className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${colors.body === opt.hex
                          ? 'border-[#2de295] scale-110 shadow-[0_0_8px_rgba(45,226,149,0.3)]'
                          : 'border-white/10 hover:border-white/30'
                          }`}
                        style={{ backgroundColor: opt.hex }}
                        title={opt.name}
                      />
                    ))}
                    <label className="w-7 h-7 rounded-full border-2 border-dashed border-[#4b5563] hover:border-[#2de295] flex items-center justify-center cursor-pointer transition-all">
                      <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#4b5563" strokeWidth="2.5"><line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" /></svg>
                      <input type="color" className="hidden" value={colors.body} onChange={e => handleColorSelect(e.target.value, `Kustom (${e.target.value.toUpperCase()})`)} />
                    </label>
                  </div>
                  <div className="text-[10px] text-[#9ba3af] mt-1.5">{colorsName.body}</div>
                </div>

                <div className="h-px bg-white/[0.06]" />

                {/* Desain Saya */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-[#9ba3af]">Desain Saya</span>
                    <button onClick={triggerSaveDesign} className="text-[10px] font-bold text-[#2de295] bg-[#2de295]/10 px-2 py-1 rounded-md hover:bg-[#2de295]/20 transition-colors border-none cursor-pointer">
                      + Simpan
                    </button>
                  </div>
                  {savedDesigns.length === 0 ? (
                    <div className="text-center py-6 text-[10px] text-[#4b5563]">Belum ada desain tersimpan</div>
                  ) : (
                    <div className="grid grid-cols-2 gap-2">
                      {savedDesigns.map(ds => (
                        <div key={ds.id} className="glass-card rounded-xl p-2 cursor-pointer group relative" onClick={() => handleLoadDesign(ds)}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleDeleteDesign(ds.id); }}
                            className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#ef4444]/20 text-[#ef4444] flex items-center justify-center text-[10px] font-bold opacity-0 group-hover:opacity-100 transition-opacity hover:bg-[#ef4444] hover:text-white border-none cursor-pointer"
                          >
                            ✕
                          </button>
                          <img src={ds.thumbnail} alt="Design" className="w-full h-16 object-contain rounded-lg bg-white/[0.02] mb-1.5" />
                          <div className="text-[9px] font-bold truncate">{ds.decal.text ? ds.decal.text.toUpperCase() : ds.garment.toUpperCase()}</div>
                          <div className="text-[8px] text-[#4b5563]">{ds.timestamp} · Rp {ds.price.toLocaleString('id-ID')}</div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TEXT TAB */}
            {activeTab === 'text' && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-[#9ba3af] mb-2 block">TEKS KUSTOM</label>
                  <input
                    type="text"
                    value={decal.text}
                    onChange={e => handleDecalSlider('text', e.target.value)}
                    placeholder="Ketik teks di sini..."
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#f0f2f5] placeholder-[#4b5563] focus:border-[#2de295]/40 focus:outline-none transition-colors"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-[#9ba3af] mb-2 block">FONT</label>
                  <select
                    value={decal.textFont}
                    onChange={e => handleDecalSlider('textFont', e.target.value)}
                    className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2.5 text-sm text-[#f0f2f5] focus:border-[#2de295]/40 focus:outline-none transition-colors"
                  >
                    <option value="Space Grotesk">Space Grotesk</option>
                    <option value="Outfit">Outfit</option>
                    <option value="Playfair Display">Playfair Display</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-bold text-[#9ba3af] mb-2 block">WARNA TEKS</label>
                  <div className="flex gap-2">
                    {[
                      { label: 'Sesuai', value: 'match', color: 'bg-white/[0.08]' },
                      { label: 'Merah', value: '#ff4d4d', color: 'bg-[#ff4d4d]' },
                      { label: 'Emas', value: '#ffd700', color: 'bg-[#ffd700]' },
                      { label: 'Sian', value: '#00bcd4', color: 'bg-[#00bcd4]' },
                    ].map(c => (
                      <button
                        key={c.value}
                        onClick={() => handleDecalSlider('textColor', c.value)}
                        className={`flex-1 py-2 rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer ${decal.textColor === c.value
                          ? 'ring-2 ring-[#2de295]'
                          : ''
                          } ${c.value === 'match' ? 'bg-white/[0.08] text-[#9ba3af]' : `${c.color} text-[#08090a]`}`}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* LAYER TAB */}
            {activeTab === 'layer' && (
              <div className="space-y-2">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-xs font-bold text-[#9ba3af]">Layers ({(decal.text ? 1 : 0) + (decal.type !== 'none' ? 1 : 0)})</span>
                </div>
                {decal.text && (
                  <div className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2de295]/10 flex items-center justify-center text-[10px] font-bold text-[#2de295]">T</div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold truncate">{decal.text}</div>
                      <div className="text-[10px] text-[#4b5563]">{decal.textFont}</div>
                    </div>
                  </div>
                )}
                {decal.type !== 'none' && (
                  <div className="glass-card rounded-xl p-3 flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-[#2de295]/10 flex items-center justify-center text-[#2de295]">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" /></svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-bold">{decal.type === 'preset' ? decal.presetName.toUpperCase() : 'CUSTOM'}</div>
                      <div className="text-[10px] text-[#4b5563]">Branding Decal</div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Position Controls */}
          <div className="border-t border-white/[0.06] p-4 bg-white/[0.02]">
            <div className="text-xs font-bold text-[#9ba3af] mb-3">Atur Posisi & Ukuran</div>
            <div className="grid grid-cols-4 gap-2 mb-4">
              {[
                { label: 'X', value: decal.horizontal, key: 'horizontal' as const, step: 0.05 },
                { label: 'Y', value: decal.vertical, key: 'vertical' as const, step: 0.05 },
                { label: 'SCL', value: decal.scale, key: 'scale' as const, step: 0.05 },
                { label: 'OPC', value: decal.opacity, key: 'opacity' as const, step: 0.1 },
              ].map(field => (
                <div key={field.key}>
                  <label className="text-[9px] font-bold text-[#4b5563] uppercase">{field.label}</label>
                  <input
                    type="number"
                    value={field.value}
                    onChange={e => handleDecalSlider(field.key, e.target.value)}
                    step={field.step}
                    className="w-full mt-1 bg-white/[0.04] border border-white/[0.08] rounded-lg px-2 py-1.5 text-xs text-center text-[#f0f2f5] focus:border-[#2de295]/40 focus:outline-none"
                  />
                </div>
              ))}
            </div>

            {[
              { label: 'Ukuran Decal', value: decal.scale, min: 0.3, max: 2.0, step: 0.05, key: 'scale' as const },
              { label: 'Posisi Vertikal', value: decal.vertical, min: -0.6, max: 0.6, step: 0.02, key: 'vertical' as const },
              { label: 'Posisi Horizontal', value: decal.horizontal, min: -0.5, max: 0.5, step: 0.02, key: 'horizontal' as const },
              { label: 'Transparansi', value: decal.opacity, min: 0.2, max: 1.0, step: 0.05, key: 'opacity' as const, display: (v: number) => `${Math.round(v * 100)}%` },
            ].map(slider => (
              <div key={slider.key} className="mb-2.5">
                <div className="flex justify-between text-[10px] mb-1">
                  <span className="text-[#9ba3af]">{slider.label}</span>
                  <span className="text-[#2de295] font-bold">{slider.display ? slider.display(slider.value) : slider.value.toFixed(2)}</span>
                </div>
                <input
                  type="range"
                  min={slider.min}
                  max={slider.max}
                  step={slider.step}
                  value={slider.value}
                  onChange={e => handleDecalSlider(slider.key, e.target.value)}
                  className="w-full h-1 bg-white/[0.08] rounded-full appearance-none cursor-pointer accent-[#2de295]"
                />
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="p-4 border-t border-white/[0.06] bg-white/[0.02]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-bold text-[#9ba3af] uppercase tracking-wider">Total Harga</span>
              <span className="text-lg font-bold text-[#2de295] font-[var(--font-display)]">Rp {totalPrice.toLocaleString('id-ID')}</span>
            </div>
            <button onClick={() => setShowCheckout(true)} className="w-full btn-primary justify-center py-3 cursor-pointer">
              PESAN DESAIN INI
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
            </button>
          </div>
        </aside>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {showCheckout && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowCheckout(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0c0f12] border border-white/[0.08] rounded-2xl p-6 max-w-md w-full max-h-[90vh] overflow-y-auto text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-md text-base"> Ringkasan Desain</h2>
                <button onClick={() => setShowCheckout(false)} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#9ba3af] hover:text-[#f0f2f5] transition-colors border-none cursor-pointer">✕</button>
              </div>

              <div className="space-y-2 mb-6">
                {[
                  { label: 'Model', value: activeModel.name },
                  { label: 'Bahan', value: fabric === 'cotton' ? 'Cotton Premium' : 'Heavy Fleece (+Rp 75.000)' },
                  { label: 'Warna', value: getActiveColorName(colors.body) },
                  { label: 'Logo', value: decal.type === 'preset' ? `${decal.presetName.toUpperCase()} Preset` : decal.type === 'custom' ? 'Custom Upload' : 'None' },
                  { label: 'Ukuran', value: size },
                ].map(item => (
                  <div key={item.label} className="flex justify-between text-sm py-1.5 border-b border-white/[0.04]">
                    <span className="text-[#9ba3af]">{item.label}</span>
                    <span className="font-bold">{item.value}</span>
                  </div>
                ))}
                <div className="flex justify-between text-base pt-2">
                  <span className="font-bold">Total</span>
                  <span className="font-bold text-[#2de295]">Rp {totalPrice.toLocaleString('id-ID')}</span>
                </div>
              </div>

              <form onSubmit={handleCheckout} className="space-y-3">
                <input
                  type="text"
                  placeholder="Nama Lengkap"
                  required
                  value={checkoutForm.name}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#4b5563] focus:border-[#2de295]/40 focus:outline-none"
                />
                <input
                  type="text"
                  placeholder="Nama Startup / Instansi"
                  required
                  value={checkoutForm.startup}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, startup: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#4b5563] focus:border-[#2de295]/40 focus:outline-none"
                />
                <input
                  type="email"
                  placeholder="Email"
                  required
                  value={checkoutForm.email}
                  onChange={e => setCheckoutForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-3 text-sm text-[#f0f2f5] placeholder-[#4b5563] focus:border-[#2de295]/40 focus:outline-none"
                />
                <button type="submit" className="w-full btn-primary justify-center py-3 mt-2 cursor-pointer border-none">
                  Konfirmasi & Bayar
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Size Guide Modal */}
      <AnimatePresence>
        {showSizeGuide && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowSizeGuide(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0c0f12] border border-white/[0.08] rounded-2xl p-6 max-w-md w-full text-white"
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="heading-md text-base">📏 Panduan Ukuran</h2>
                <button onClick={() => setShowSizeGuide(false)} className="w-8 h-8 rounded-lg bg-white/[0.04] flex items-center justify-center text-[#9ba3af] hover:text-[#f0f2f5] border-none cursor-pointer">✕</button>
              </div>
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-[#9ba3af] text-xs">
                    <th className="text-left py-2">Ukuran</th>
                    <th className="text-left py-2">Lebar Dada</th>
                    <th className="text-left py-2">Panjang</th>
                    <th className="text-left py-2">Lengan</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    { size: 'S', dada: '50cm', panjang: '66cm', lengan: '59cm' },
                    { size: 'M', dada: '53cm', panjang: '68cm', lengan: '61cm' },
                    { size: 'L', dada: '56cm', panjang: '70cm', lengan: '63cm' },
                    { size: 'XL', dada: '59cm', panjang: '72cm', lengan: '65cm' },
                    { size: 'XXL', dada: '62cm', panjang: '74cm', lengan: '67cm' },
                  ].map(row => (
                    <tr key={row.size} className="border-t border-white/[0.04]">
                      <td className="py-2 font-bold">{row.size}</td>
                      <td className="py-2 text-[#9ba3af]">{row.dada}</td>
                      <td className="py-2 text-[#9ba3af]">{row.panjang}</td>
                      <td className="py-2 text-[#9ba3af]">{row.lengan}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-xl flex items-center justify-center p-4"
            onClick={() => setShowSuccess(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="bg-[#0c0f12] border border-white/[0.08] rounded-2xl p-8 max-w-sm w-full text-center text-white"
            >
              <div className="w-16 h-16 rounded-full bg-[#2de295]/10 flex items-center justify-center mx-auto mb-4">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2de295" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>
              </div>
              <h2 className="heading-md text-lg mb-2 text-white font-[var(--font-display)]">Pesanan Berhasil!</h2>
              <p className="text-sm text-[#9ba3af] mb-4">Detail desain dan invoice dikirim ke <strong className="text-[#f0f2f5]">{checkoutForm.email}</strong></p>
              <div className="bg-white/[0.04] rounded-xl p-3 mb-4">
                <div className="text-[10px] text-[#9ba3af]">Kode Pesanan</div>
                <div className="text-lg font-bold text-[#2de295] font-mono">{invoiceCode}</div>
              </div>
              <button onClick={() => setShowSuccess(false)} className="btn-primary w-full justify-center cursor-pointer border-none">
                Selesai & Kembali
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

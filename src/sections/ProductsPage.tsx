import { useState, useEffect, useRef } from 'react';
import { motion, useInView } from 'framer-motion';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface ProductsPageProps {
  onNavigate: (page: string, model?: 'hoodie' | 'tshirt' | 'sweater') => void;
  onReady?: () => void;
  onProgress?: (progress: number) => void;
}

const products = [
  {
    id: 'hoodie' as const,
    name: 'HOODIE KUSTOM COZY',
    shortName: 'Hoodie Kustom Cozy',
    category: 'Outerwear',
    description: 'Hoodie potongan santai dengan kupluk ganda dan saku depan kanguru. Memberikan kenyamanan maksimal dan area cetak logo dada yang luas.',
    features: ['Fleece Katun Tebal 330 gsm', 'Kupluk Ganda (Double Hood)', 'Rib Karet di Hem & Lengan'],
    price: 349000,
  },
  {
    id: 'tshirt' as const,
    name: 'KAOS KINERJA PAS BADAN',
    shortName: 'Kaos Kinerja Pas Badan',
    category: 'Atasan',
    description: 'Kaos potongan modern dengan material combed premium yang lembut, sejuk, dan awet. Sangat pas untuk merchandise startup dan seragam kerja harian.',
    features: ['100% Katun Combed Premium 24s', 'Jahitan Rantai Pundak Standar Ekspor', 'Kerah Rib Elastis & Anti Melar'],
    price: 199000,
  },
  {
    id: 'sweater' as const,
    name: 'SWEATER CREWNECK KLASIK',
    shortName: 'Sweater Crewneck Klasik',
    category: 'Outerwear',
    description: 'Crewneck klasik dengan detail rib tebal pada kerah, ujung lengan, dan pinggang. Desain minimalis serbaguna, cocok untuk gaya kasual semi-formal.',
    features: ['Fleece Katun Lembut 280 gsm', 'Kerutan Rib Elastis di Leher & Lengan', 'Bahan Breathable Hangat & Menyerap Keringat'],
    price: 299000,
  },
];

const colorOptions = [
  { name: 'Putih', hex: '#f5f5f5' },
  { name: 'Hijau', hex: '#2de295' },
  { name: 'Biru', hex: '#3b82f6' },
  { name: 'Merah', hex: '#ef4444' },
  { name: 'Hitam', hex: '#1a1a1a' },
];

const materialOptions = ['Cotton Premium', 'Heavy Fleece'];

function processTshirtTexture(texture: THREE.Texture): THREE.Texture {
  if (!texture?.image) return texture;
  const img = texture.image as HTMLImageElement;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 1024;
    canvas.height = img.naturalHeight || img.height || 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img as CanvasImageSource, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const newLuma = Math.min(255, 175 + luma * 1.6);
      data[i] = newLuma;
      data[i + 1] = newLuma;
      data[i + 2] = newLuma;
    }
    ctx.putImageData(imgData, 0, 0);
    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.wrapS = texture.wrapS;
    newTexture.wrapT = texture.wrapT;
    newTexture.needsUpdate = true;
    return newTexture;
  } catch {
    return texture;
  }
}

function ProductVisualizer({ activeIndex, customColor }: { activeIndex: number; customColor: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const modelsRef = useRef<Record<string, THREE.Group>>({});
  const activeIndexRef = useRef(activeIndex);
  const cancelRef = useRef<(() => void) | null>(null);

  useEffect(() => { activeIndexRef.current = activeIndex; }, [activeIndex]);

  // Handle color updates to models dynamically
  useEffect(() => {
    Object.keys(modelsRef.current).forEach((type) => {
      const parent = modelsRef.current[type];
      if (!parent) return;
      parent.traverse((child) => {
        if ((child as THREE.Mesh).isMesh) {
          const mesh = child as THREE.Mesh;
          if (mesh.material) {
            const mats: any[] = Array.isArray(mesh.material) ? mesh.material : [mesh.material];
            mats.forEach((m) => {
              m.color.set(new THREE.Color(customColor));
              m.needsUpdate = true;
            });
          }
        }
      });
    });
  }, [customColor]);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.2, 7.5);

    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 10;
    controls.enableZoom = false;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0.2, 0);

    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const mainLight = new THREE.DirectionalLight(0xffffff, 0.9);
    mainLight.position.set(3, 4, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);
    scene.add(mainLight);
    const fillLight = new THREE.DirectionalLight(0xa8d5ff, 0.4);
    fillLight.position.set(-4, 2, 2);
    scene.add(fillLight);
    const rimLight = new THREE.DirectionalLight(0x2de295, 0.5);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    let isMounted = true;
    const gltfLoader = new GLTFLoader();
    const types = ['hoodie', 'tshirt', 'sweater'];

    const modelPaths: Record<string, string> = {
      hoodie: './assets/models/black hoodie 3d model.glb',
      tshirt: './assets/models/black t shirt 3d model.glb',
      sweater: './assets/models/knitted crewneck sweater 3d model.glb',
    };

    types.forEach((type) => {
      gltfLoader.load(
        modelPaths[type],
        (gltf) => {
          if (!isMounted) return;
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const sizeVec = box.getSize(new THREE.Vector3());
          const centerVec = box.getCenter(new THREE.Vector3());
          model.position.set(-centerVec.x, -centerVec.y, -centerVec.z);
          model.rotation.y = -Math.PI / 2;

          const parent = new THREE.Group();
          parent.add(model);
          const scaleFactor = 2.1 / sizeVec.y;
          parent.scale.set(scaleFactor, scaleFactor, scaleFactor);
          parent.updateMatrixWorld(true);

          model.traverse((child) => {
            if ((child as THREE.Mesh).isMesh) {
              const mesh = child as THREE.Mesh;
              mesh.castShadow = true;
              mesh.receiveShadow = true;
              if (mesh.material) {
                const assign = (mat: THREE.Material) => {
                  const orig = (mat as THREE.MeshStandardMaterial).clone();
                  (orig as THREE.MeshStandardMaterial).color.set(new THREE.Color(customColor));
                  (orig as THREE.MeshStandardMaterial).roughness = 0.85;
                  (orig as THREE.MeshStandardMaterial).metalness = 0.05;
                  (orig as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
                  (orig as THREE.MeshStandardMaterial).transparent = false;
                  (orig as THREE.MeshStandardMaterial).opacity = 1;
                  (orig as THREE.MeshStandardMaterial).depthWrite = true;
                  if ((orig as THREE.MeshStandardMaterial).map) {
                    (orig as THREE.MeshStandardMaterial).map = processTshirtTexture((orig as THREE.MeshStandardMaterial).map!);
                  }
                  return orig;
                };
                if (Array.isArray(mesh.material)) mesh.material = mesh.material.map(assign);
                else mesh.material = assign(mesh.material);
              }
            }
          });

          const currentActive = types[activeIndexRef.current];
          parent.visible = type === currentActive;
          parent.position.set(0, 0, 0);
          modelsRef.current[type] = parent;
          garmentGroup.add(parent);
        }
      );
    });

    let raf: number;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      Object.values(modelsRef.current).forEach((m) => {
        if (m?.visible) m.rotation.y += 0.005;
      });
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      isMounted = false;
      cancelAnimationFrame(raf);
      resizeObserver.disconnect();
      renderer.dispose();
    };
  }, []);

  useEffect(() => {
    if (cancelRef.current) cancelRef.current();

    const types = ['hoodie', 'tshirt', 'sweater'];
    const nextType = types[activeIndex];
    const newModel = modelsRef.current[nextType];

    if (!newModel) {
      types.forEach((t) => {
        const m = modelsRef.current[t];
        if (m) { m.visible = t === nextType; m.position.set(0, 0, 0); }
      });
      return;
    }

    types.forEach((t) => {
      const m = modelsRef.current[t];
      if (m) {
        m.visible = t === nextType;
        m.position.set(0, 0, 0);
      }
    });
  }, [activeIndex]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

export default function ProductsPage({ onNavigate }: ProductsPageProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [selectedColor, setSelectedColor] = useState(colorOptions[0]);
  const [selectedMaterial, setSelectedMaterial] = useState(0);
  const sectionRef = useRef(null);
  const isInView = useInView(sectionRef, { once: true });

  const activeProduct = products[activeIndex];

  const nextProduct = () => setActiveIndex((prev) => (prev + 1) % products.length);
  const prevProduct = () => setActiveIndex((prev) => (prev - 1 + products.length) % products.length);

  return (
    <div className="min-h-screen bg-[#08090a] relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-[#2de295]/5 rounded-full blur-[150px] pointer-events-none" />

      {/* Floating Star-like Particles (Bintang di Angkasa) */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden="true">
        {Array.from({ length: 60 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-0.5 h-0.5 bg-[#2de295] rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              opacity: Math.random() * 0.7 + 0.1,
              animation: `particleGlow ${3 + Math.random() * 5}s ease-in-out infinite`,
              animationDelay: `${Math.random() * 4}s`,
            }}
          />
        ))}
      </div>

      {/* Navbar */}
      <nav className="relative z-50 border-b border-white/[0.06] bg-[#08090a]/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            <button
              onClick={() => onNavigate('landing')}
              className="flex items-center gap-2 text-sm text-[#9ba3af] hover:text-[#2de295] transition-colors bg-transparent border-none cursor-pointer"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
              <span className="hidden sm:inline">Kembali</span>
            </button>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-[#0c0f12] border border-white/[0.08] flex items-center justify-center shadow-md">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="logoGradProd" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#00e5a0" />
                    <stop offset="100%" stopColor="#00b874" />
                  </linearGradient>
                </defs>
                <path d="M6 4h12v6h-6v3h4v4h-4v3H6Z" fill="url(#logoGradProd)" />
              </svg>
            </div>
            <span className="font-[var(--font-display)] font-bold text-white text-sm sm:text-base">
              FITCRAFT <span className="text-[#2de295]">3D</span>
            </span>
          </div>

          <div className="flex items-center gap-4">
            <button className="relative text-[#9ba3af] hover:text-[#2de295] transition-colors bg-transparent border-none cursor-pointer">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </button>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#2de295]/20 to-[#14b8a6]/20 border border-[#2de295]/30 flex items-center justify-center">
              <span className="text-xs font-bold text-[#2de295]">D</span>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 pt-6 sm:pt-8 pb-10 sm:pb-16" ref={sectionRef}>
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          className="text-center mb-6 sm:mb-8"
        >
          <div className="label-text mb-2 flex items-center justify-center gap-2">
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2de295" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            PILIH MODEL PAKAIAN
          </div>
          <h1 className="heading-lg text-white">
            Kanvas <span className="neon-text">Desain Anda</span>
          </h1>
          <p className="text-[#9ba3af] mt-2 max-w-lg mx-auto text-sm sm:text-base px-2 sm:px-0">
            Mulai kustomisasi dari koleksi model dasar premium kami. Tiap model dirancang dengan presisi 3D PBR.
          </p>
        </motion.div>

        {/* Product Showcase */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2 }}
          className="relative glass-panel rounded-2xl sm:rounded-3xl overflow-hidden mb-6 sm:mb-8"
        >
          {/* Top tag */}
          <div className="absolute top-3 left-3 sm:top-6 sm:left-6 z-20">
            <div className="glass-panel rounded-full px-4 py-2 flex items-center gap-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2de295" strokeWidth="2">
                <path d="M20.38 3.46L16 7.83l-1-1 4.38-4.37a1 1 0 011 1z" />
              </svg>
              <span className="text-xs font-bold text-[#9ba3af]">{activeProduct.category}</span>
            </div>
          </div>

          {/* Control Panel - Top Right */}
          <div className="absolute top-3 right-3 sm:top-6 sm:right-6 z-20 w-36 sm:w-44">
            <div className="glass-panel rounded-xl sm:rounded-2xl p-3 sm:p-4">
              <div className="text-xs font-bold text-[#9ba3af] mb-3 font-[var(--font-display)] flex items-center justify-between">
                Warna
                <span className="text-[10px] bg-[#2de295]/10 text-[#2de295] px-2 py-0.5 rounded-full">Solid</span>
              </div>
              <div className="flex gap-2 mb-4">
                {colorOptions.map((color) => (
                  <button
                    key={color.hex}
                    onClick={() => setSelectedColor(color)}
                    className={`w-6 h-6 rounded-full border-2 transition-all cursor-pointer ${
                      selectedColor.hex === color.hex
                        ? 'border-[#2de295] scale-110'
                        : 'border-white/10'
                    }`}
                    style={{ backgroundColor: color.hex }}
                  />
                ))}
              </div>

              <div className="text-xs font-bold text-[#9ba3af] mb-2 font-[var(--font-display)]">Material</div>
              <div className="flex gap-2">
                {materialOptions.map((mat, i) => (
                  <button
                    key={mat}
                    onClick={() => setSelectedMaterial(i)}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-[10px] font-bold transition-all cursor-pointer ${
                      selectedMaterial === i
                        ? 'bg-[#2de295]/10 text-[#2de295] border border-[#2de295]/30'
                        : 'bg-white/5 text-[#4b5563] border border-white/10'
                    }`}
                  >
                    {mat.split(' ')[0]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* 3D Product Display */}
          <div className="relative min-h-[360px] sm:min-h-[450px] lg:min-h-[550px] flex items-center justify-center bg-gradient-to-b from-[#0c0f12] to-[#08090a]">
            {/* Particle effect */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              {Array.from({ length: 20 }).map((_, i) => (
                <div
                  key={i}
                  className="absolute w-1 h-1 bg-[#2de295] rounded-full"
                  style={{
                    left: `${Math.random() * 100}%`,
                    top: `${Math.random() * 100}%`,
                    opacity: Math.random() * 0.5 + 0.1,
                    animation: `particleGlow ${2 + Math.random() * 3}s ease-in-out infinite`,
                    animationDelay: `${Math.random() * 2}s`,
                  }}
                />
              ))}
            </div>

            {/* 3D Canvas Visualizer */}
            <div className="w-full h-[360px] sm:h-[450px] lg:h-[550px]">
              <ProductVisualizer activeIndex={activeIndex} customColor={selectedColor.hex} />
            </div>

            {/* Product Info - Bottom Left */}
            <div className="absolute bottom-20 sm:bottom-8 left-4 sm:left-8 z-20 max-w-[200px] sm:max-w-xs pointer-events-none">
              <div className="label-text mb-2">MODEL PRODUK AKTIF</div>
              <h2 className="font-[var(--font-display)] font-bold text-xl sm:text-3xl lg:text-4xl leading-tight mb-2 sm:mb-3 text-white">
                {activeProduct.name.split(' ').slice(0, 2).join(' ')}
                <br />
                <span className="text-[#2de295]">{activeProduct.name.split(' ').slice(2).join(' ')}</span>
              </h2>
              <p className="hidden sm:block text-sm text-[#9ba3af] leading-relaxed mb-4">
                {activeProduct.description}
              </p>

              {/* Mini Features */}
              <div className="hidden sm:flex gap-6">
                {[
                  { icon: 'M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5', label: '3D Real-Time', sub: 'PBR Rendering' },
                  { icon: 'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z', label: 'Area Cetak', sub: 'Luas' },
                  { icon: 'M20.38 3.46L16 7.83l-1-1 4.38-4.37a1 1 0 011 1z', label: 'Material', sub: 'Premium' },
                ].map((feat, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 rounded-xl bg-[#2de295]/10 border border-[#2de295]/20 flex items-center justify-center mx-auto mb-1.5">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2de295" strokeWidth="2">
                        <path d={feat.icon} />
                      </svg>
                    </div>
                    <div className="text-[10px] font-bold text-[#f0f2f5]">{feat.label}</div>
                    <div className="text-[9px] text-[#4b5563]">{feat.sub}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Navigation Arrows - Bottom Right */}
            <div className="absolute bottom-20 sm:bottom-8 right-4 sm:right-8 z-20 flex gap-2 sm:gap-3">
              <button
                onClick={prevProduct}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-panel flex items-center justify-center hover:border-[#2de295]/50 transition-all group cursor-pointer bg-transparent"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#9ba3af] group-hover:text-[#2de295] transition-colors">
                  <polyline points="15 18 9 12 15 6" />
                </svg>
              </button>
              <button
                onClick={nextProduct}
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full glass-panel flex items-center justify-center hover:border-[#2de295]/50 transition-all group cursor-pointer bg-transparent"
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-[#9ba3af] group-hover:text-[#2de295] transition-colors">
                  <polyline points="9 18 15 12 9 6" />
                </svg>
              </button>
            </div>
          </div>

          {/* CTA Button */}
          <div className="absolute bottom-4 sm:bottom-8 left-1/2 -translate-x-1/2 z-20">
            <button
              onClick={() => onNavigate('studio', activeProduct.id)}
              className="btn-primary shadow-[0_0_40px_rgba(45,226,149,0.3)] cursor-pointer"
            >
              Desain Sekarang
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </button>
          </div>
        </motion.div>

        {/* Steps */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={isInView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.4 }}
          className="glass-panel rounded-xl sm:rounded-2xl p-4 sm:p-6"
        >
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { step: '01', title: 'Pilih Model', desc: 'Pilih dari koleksi kami', active: true },
              { step: '02', title: 'Desain', desc: 'Kustomisasi warna & logo', active: false },
              { step: '03', title: 'Atur Posisi', desc: 'Sesuaikan letak elemen', active: false },
              { step: '04', title: 'Preview & Simpan', desc: 'Lihat hasil & ekspor', active: false },
            ].map((s, i) => (
              <div
                key={i}
                className={`flex items-center gap-3 p-3 rounded-xl transition-all ${
                  s.active ? 'bg-[#2de295]/10 border border-[#2de295]/20' : 'bg-white/[0.02]'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm ${
                  s.active ? 'bg-[#2de295] text-[#08090a]' : 'bg-white/5 text-[#4b5563]'
                }`}>
                  {s.step}
                </div>
                <div>
                  <div className={`text-sm font-bold ${s.active ? 'text-[#f0f2f5]' : 'text-[#9ba3af]'}`}>{s.title}</div>
                  <div className="text-[10px] text-[#4b5563]">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import '../landing.css';
import '../products.css';

const products = [
  {
    id: 'hoodie',
    name: 'Hoodie Kustom Cozy',
    category: 'Outerwear',
    price: 'Rp 349.000',
    colors: { body: '#1b2e3c', sleeves: '#1b2e3c', collar: '#2a4050' },
    desc: 'Hoodie potongan santai dengan kupluk ganda dan saku depan kanguru. Memberikan kenyamanan maksimal dan area cetak logo dada yang luas.',
    features: [
      'Fleece Katun Tebal 330 gsm',
      'Kupluk Ganda (Double Hood)',
      'Rib Karet di Hem & Lengan'
    ]
  },
  {
    id: 'tshirt',
    name: 'Kaos Kinerja Pas Badan',
    category: 'Atasan',
    price: 'Rp 199.000',
    colors: { body: '#3b6352', sleeves: '#3b6352', collar: '#4a7a65' },
    desc: 'Kaos potongan modern dengan material combed premium yang lembut, sejuk, dan awet. Sangat pas untuk merchandise startup dan seragam kerja harian.',
    features: [
      '100% Katun Combed Premium 24s',
      'Jahitan Rantai Pundak Standar Ekspor',
      'Kerah Rib Elastis & Anti Melar'
    ]
  },
  {
    id: 'sweater',
    name: 'Sweater Crewneck Klasik',
    category: 'Outerwear',
    price: 'Rp 299.000',
    colors: { body: '#7f1d1d', sleeves: '#7f1d1d', collar: '#991b1b' },
    desc: 'Crewneck klasik dengan detail rib tebal pada kerah, ujung lengan, dan pinggang. Desain minimalis serbaguna, cocok untuk gaya kasual semi-formal.',
    features: [
      'Fleece Katun Lembut 280 gsm',
      'Kerutan Rib Elastis di Leher & Lengan',
      'Bahan Breathable Hangat & Menyerap Keringat'
    ]
  }
];

function processTshirtTexture(texture) {
  if (!texture || !texture.image) return texture;
  const img = texture.image;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.width || 1024;
    canvas.height = img.height || 1024;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

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
  } catch (err) {
    console.error('Failed to process t-shirt texture:', err);
    return texture;
  }
}

function ProductVisualizer({ garmentType, colors }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const stateRef = useRef({ colors, garmentType });

  useEffect(() => {
    stateRef.current = { colors, garmentType };
  }, [colors, garmentType]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.2, 7.5);

    // B. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // C. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;
    controls.maxDistance = 10;
    controls.enableZoom = false; // Disable zoom on product showcase card to avoid interfering with body scroll
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0.2, 0);

    // D. Garment group
    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    // F. Lighting
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.75);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.85);
    mainLight.position.set(3, 4, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.3);
    fillLight.position.set(-4, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.6);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // G. Load GLB
    let glbPath = '';
    if (garmentType === 'hoodie') {
      glbPath = './assets/models/black hoodie 3d model.glb';
    } else if (garmentType === 'tshirt') {
      glbPath = './assets/models/black t shirt 3d model.glb';
    } else if (garmentType === 'sweater') {
      glbPath = './assets/models/knitted crewneck sweater 3d model.glb';
    }

    setLoading(true);

    const gltfLoader = new GLTFLoader();
    let loadedModel;

    gltfLoader.load(
      glbPath,
      (gltf) => {
        loadedModel = gltf.scene;

        const box = new THREE.Box3().setFromObject(loadedModel);
        const sizeVec = box.getSize(new THREE.Vector3());
        const centerVec = box.getCenter(new THREE.Vector3());

        loadedModel.position.x += (loadedModel.position.x - centerVec.x);
        loadedModel.position.y += (loadedModel.position.y - centerVec.y);
        loadedModel.position.z += (loadedModel.position.z - centerVec.z);

        const targetHeight = 2.1;
        const scaleFactor = targetHeight / sizeVec.y;
        loadedModel.scale.set(scaleFactor, scaleFactor, scaleFactor);

        loadedModel.rotation.y = -Math.PI / 2;
        loadedModel.updateMatrixWorld(true);

        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              const originalMaterial = child.material.clone();
              const name = (child.name || child.material.name || '').toLowerCase();
              let targetColor = stateRef.current.colors.body;
              
              if (name.includes('sleeve') || name.includes('lengan') || name.includes('arm') || name.includes('hand') || name.includes('cuff')) {
                targetColor = stateRef.current.colors.sleeves;
              } else if (name.includes('collar') || name.includes('kerah') || name.includes('rib') || name.includes('neck') || name.includes('detail') || name.includes('drawstring') || name.includes('pocket')) {
                targetColor = stateRef.current.colors.collar;
              }

              originalMaterial.color.set(new THREE.Color(targetColor));
              originalMaterial.roughness = 0.85;
              originalMaterial.metalness = 0.05;
              originalMaterial.side = THREE.DoubleSide;

              if (originalMaterial.map) {
                originalMaterial.map = processTshirtTexture(originalMaterial.map);
              }

              child.material = originalMaterial;
            }
          }
        });

        garmentGroup.add(loadedModel);
        garmentGroup.position.y = 0.2;
        setLoading(false);
      },
      undefined,
      (error) => {
        console.error('Failed to load GLB on products page:', error);
        setLoading(false);
      }
    );

    // H. Render Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (garmentGroup && controls.state === -1) { 
        garmentGroup.rotation.y += 0.005;
      }
      
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // I. Resize observer
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      scene.clear();
      renderer.dispose();
    };
  }, [garmentType]);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {loading && (
        <div className="visualizer-loader">
          <div className="spinner"></div>
        </div>
      )}
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
    </div>
  );
}

export default function ProductsPage({ onNavigate }) {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [darkTheme] = useState(() => {
    return localStorage.getItem('fitcraft_theme') === 'dark';
  });

  // Sync dark theme state to body class and localStorage
  useEffect(() => {
    if (darkTheme) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('fitcraft_theme', 'dark');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('fitcraft_theme', 'light');
    }
  }, [darkTheme]);

  useEffect(() => {
    document.body.classList.add('products-page-scoped');

    // Reveal animations on load
    const reveals = containerRef.current.querySelectorAll('.products-header, .showcase-container');
    reveals.forEach((el) => {
      el.classList.add('reveal');
      setTimeout(() => {
        el.classList.add('in-view');
      }, 50);
    });

    return () => {
      document.body.classList.remove('products-page-scoped');
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

  const activeProduct = products[activeIndex];

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

      {/* PRODUCTS SECTION */}
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

        {/* Unified Premium Showcase Card */}
        <div className="showcase-container" onMouseMove={handleMouseMove}>
          
          {/* Active visual container */}
          <div className="showcase-visual">
            <ProductVisualizer garmentType={activeProduct.id} colors={activeProduct.colors} />
          </div>

          {/* Top-Right category tag inside showcase */}
          <div className="showcase-top-tag">
            {activeProduct.category}
          </div>

          {/* Bottom-Left Information Overlay */}
          <div className="showcase-info">
            <span className="showcase-category-eyebrow">MODEL PRODUK AKTIF</span>
            <h2 className="showcase-title">{activeProduct.name.toUpperCase()}</h2>
            <div className="showcase-meta-row">
              <span className="showcase-desc-snippet">{activeProduct.desc}</span>
            </div>
          </div>

          {/* Bottom-Right Arrow Switcher Controls */}
          <div className="showcase-nav">
            <button 
              onClick={() => setActiveIndex((prev) => (prev - 1 + products.length) % products.length)} 
              className="showcase-nav-btn" 
              title="Model Sebelumnya"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="19" y1="12" x2="5" y2="12"></line>
                <polyline points="12 19 5 12 12 5"></polyline>
              </svg>
            </button>
            <button 
              onClick={() => setActiveIndex((prev) => (prev + 1) % products.length)} 
              className="showcase-nav-btn" 
              title="Model Berikutnya"
            >
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
          </div>

          {/* Bottom-Center Showcase CTA */}
          <div className="showcase-cta">
            <button onClick={() => onNavigate('studio', activeProduct.id)} className="btn-design-now">
              <span>Desain Sekarang</span>
              <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
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

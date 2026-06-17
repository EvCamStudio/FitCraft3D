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

function ProductVisualizer({ activeIndex }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Store references
  const modelsRef = useRef({ hoodie: null, tshirt: null, sweater: null });
  const threeRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    garmentGroup: null,
    activeModel: null,
    isTransitioning: false
  });

  const prevIndexRef = useRef(activeIndex);
  const cancelTransitionRef = useRef(null);
  const activeIndexRef = useRef(activeIndex);

  // Sync index terbaru buat mencegah race condition saat loading
  useEffect(() => {
    activeIndexRef.current = activeIndex;
  }, [activeIndex]);

  // Setup Inisial Three.js
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    // A. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(35, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.2, 7.5);

    // B. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvas,
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
    controls.enableZoom = false;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0.2, 0);

    // D. Garment group
    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    // E. Lighting
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

    threeRef.current = {
      scene,
      camera,
      renderer,
      controls,
      garmentGroup,
      activeModel: null,
      isTransitioning: false
    };

    // F. Load GLB
    let isMounted = true;
    setLoading(true);

    const gltfLoader = new GLTFLoader();
    const types = ['hoodie', 'tshirt', 'sweater'];
    let loadedCount = 0;

    const colorConfigs = {
      hoodie: { body: '#1b2e3c', sleeves: '#1b2e3c', collar: '#2a4050' },
      tshirt: { body: '#3b6352', sleeves: '#3b6352', collar: '#4a7a65' },
      sweater: { body: '#7f1d1d', sleeves: '#7f1d1d', collar: '#991b1b' }
    };

    types.forEach((type) => {
      let glbPath = '';
      if (type === 'hoodie') glbPath = './assets/models/black hoodie 3d model.glb';
      else if (type === 'tshirt') glbPath = './assets/models/black t shirt 3d model.glb';
      else if (type === 'sweater') glbPath = './assets/models/knitted crewneck sweater 3d model.glb';

      gltfLoader.load(
        glbPath,
        (gltf) => {
          if (!isMounted) return; // Mencegah memory leak & error state jika unmount

          try {
            const model = gltf.scene;

            const box = new THREE.Box3().setFromObject(model);
            const sizeVec = box.getSize(new THREE.Vector3());
            const centerVec = box.getCenter(new THREE.Vector3());

            model.position.set(-centerVec.x, -centerVec.y, -centerVec.z);
            model.rotation.y = -Math.PI / 2;

            const modelParent = new THREE.Group();
            modelParent.add(model);

            const targetHeight = 2.1;
            const scaleFactor = targetHeight / sizeVec.y;
            modelParent.scale.set(scaleFactor, scaleFactor, scaleFactor);
            modelParent.updateMatrixWorld(true);

            model.traverse((child) => {
              if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;

                if (child.material) {
                  const assignMaterial = (mat) => {
                    if (!mat) return mat;
                    const originalMaterial = mat.clone();
                    const name = (child.name || mat.name || '').toLowerCase();

                    const cfg = colorConfigs[type];
                    let targetColor = cfg.body;

                    if (name.includes('sleeve') || name.includes('lengan') || name.includes('arm') || name.includes('hand') || name.includes('cuff')) {
                      targetColor = cfg.sleeves;
                    } else if (name.includes('collar') || name.includes('kerah') || name.includes('rib') || name.includes('neck') || name.includes('detail') || name.includes('drawstring') || name.includes('pocket')) {
                      targetColor = cfg.collar;
                    }

                    originalMaterial.color.set(new THREE.Color(targetColor));
                    originalMaterial.roughness = 0.85;
                    originalMaterial.metalness = 0.05;
                    originalMaterial.side = THREE.DoubleSide;

                    // Pastikan transparansi mati di awal
                    originalMaterial.transparent = false;
                    originalMaterial.opacity = 1.0;
                    originalMaterial.depthWrite = true;

                    if (originalMaterial.map) {
                      originalMaterial.map = processTshirtTexture(originalMaterial.map);
                    }

                    return originalMaterial;
                  };

                  if (Array.isArray(child.material)) {
                    child.material = child.material.map(assignMaterial);
                  } else {
                    child.material = assignMaterial(child.material);
                  }
                }
              }
            });

            // Set visibility berdasarkan index AKTIF saat loading selesai
            const currentActiveType = types[activeIndexRef.current];
            modelParent.visible = (type === currentActiveType);
            modelParent.position.set(0, 0, 0);

            modelsRef.current[type] = modelParent;
            garmentGroup.add(modelParent);

            if (type === currentActiveType) {
              threeRef.current.activeModel = modelParent;
            }
          } catch (err) {
            console.error(`Error processing GLB for ${type}:`, err);
          } finally {
            loadedCount++;
            if (loadedCount === 3 && isMounted) {
              setLoading(false);
            }
          }
        },
        undefined,
        (error) => {
          console.error(`Failed to load ${type} GLB:`, error);
          loadedCount++;
          if (loadedCount === 3 && isMounted) {
            setLoading(false);
          }
        }
      );
    });

    // G. Render Loop
    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      if (garmentGroup && controls.state === -1 && !threeRef.current.isTransitioning) {
        Object.values(modelsRef.current).forEach((m) => {
          if (m && m.visible) {
            m.rotation.y += 0.005;
          }
        });
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // H. Resize observer
    const resizeObserver = new ResizeObserver(() => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Cleanup aman
    return () => {
      isMounted = false;
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();

      // Clear scene elements smoothly
      scene.remove(garmentGroup);
      renderer.dispose();
      // JANGAN remove DOM element canvas di sini, biarkan React yang handle
    };
  }, []);

  // Transisi Animasi
  useEffect(() => {
    if (prevIndexRef.current === activeIndex) return;

    if (cancelTransitionRef.current) {
      cancelTransitionRef.current();
    }

    const types = ['hoodie', 'tshirt', 'sweater'];
    const prevType = types[prevIndexRef.current];
    const nextType = types[activeIndex];

    const oldModel = modelsRef.current[prevType];
    const newModel = modelsRef.current[nextType];

    // Fungsi update material Three.js anti-glitch
    const updateMaterialTransparency = (model, enableTransparency, opacityVal = 1.0) => {
      if (!model) return;
      model.traverse((child) => {
        if (child.isMesh && child.material) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat) => {
            if (mat.transparent !== enableTransparency) {
              mat.transparent = enableTransparency;
              mat.depthWrite = !enableTransparency;
              mat.needsUpdate = true; // SANGAT PENTING: Wajib dipanggil tiap rubah tipe material
            }
            mat.opacity = opacityVal;
          });
        }
      });
    };

    // Jika model belum kelar diload pas di klik
    if (!oldModel || !newModel) {
      types.forEach((type) => {
        const m = modelsRef.current[type];
        if (m) {
          m.visible = (type === nextType);
          m.position.set(0, 0, 0);
          updateMaterialTransparency(m, false, 1.0);
        }
      });
      if (newModel) threeRef.current.activeModel = newModel;
      prevIndexRef.current = activeIndex;
      return;
    }

    const direction = (activeIndex - prevIndexRef.current + 3) % 3 === 1 ? 'next' : 'prev';

    // Sembunyikan model lain yang ga kepake
    types.forEach((type) => {
      const m = modelsRef.current[type];
      if (m && m !== oldModel && m !== newModel) {
        m.visible = false;
        m.position.x = 0;
        updateMaterialTransparency(m, false, 1.0);
      }
    });

    threeRef.current.isTransitioning = true;
    newModel.visible = true;
    newModel.rotation.y = oldModel.rotation.y;

    // Set kondisi awal cross-fade
    updateMaterialTransparency(oldModel, true, 1.0);
    updateMaterialTransparency(newModel, true, 0.0);

    const startXOld = 0;
    const endXOld = direction === 'next' ? 3.2 : -3.2;
    const startXNew = direction === 'next' ? -3.2 : 3.2;
    const endXNew = 0;

    const startTime = performance.now();
    const duration = 650;
    let animationFrameId;

    const cancelTransition = () => {
      cancelAnimationFrame(animationFrameId);
      if (oldModel) {
        oldModel.visible = false;
        oldModel.position.x = 0;
        updateMaterialTransparency(oldModel, false, 1.0);
      }
      if (newModel) {
        newModel.visible = true;
        newModel.position.x = 0;
        updateMaterialTransparency(newModel, false, 1.0);
      }
      threeRef.current.activeModel = newModel;
      threeRef.current.isTransitioning = false;
      prevIndexRef.current = activeIndex;
    };
    cancelTransitionRef.current = cancelTransition;

    const slideAnimation = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      const ease = progress < 0.5
        ? 4 * progress * progress * progress
        : 1 - Math.pow(-2 * progress + 2, 3) / 2;

      oldModel.position.x = startXOld + (endXOld - startXOld) * ease;
      newModel.position.x = startXNew + (endXNew - startXNew) * ease;

      updateMaterialTransparency(oldModel, true, 1.0 - progress);
      updateMaterialTransparency(newModel, true, progress);

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(slideAnimation);
      } else {
        oldModel.visible = false;
        oldModel.position.x = 0;

        // Reset ke material solid setelah animasi selesai
        updateMaterialTransparency(oldModel, false, 1.0);
        updateMaterialTransparency(newModel, false, 1.0);

        threeRef.current.activeModel = newModel;
        threeRef.current.isTransitioning = false;
        prevIndexRef.current = activeIndex;
        cancelTransitionRef.current = null;
      }
    };

    slideAnimation();

    return () => {
      if (cancelTransitionRef.current) cancelTransitionRef.current();
    };
  }, [activeIndex]);

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

export default function ProductsPage({ onNavigate, onReady, onProgress }) {
  const containerRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);
  const [darkTheme] = useState(() => {
    return localStorage.getItem('fitcraft_theme') === 'dark';
  });

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

    if (onReady) {
      onReady();
    }

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

  useEffect(() => {
    const wrapper = containerRef.current;
    if (!wrapper) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          wrapper.style.setProperty('--scroll-y', window.scrollY);
          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      window.removeEventListener('scroll', handleScroll);
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
      <div className="bg-gradient-mesh" aria-hidden="true">
        <div className="orb-parallax-wrapper orb-1-wrapper">
          <div className="mesh-orb orb-1"></div>
        </div>
        <div className="orb-parallax-wrapper orb-2-wrapper">
          <div className="mesh-orb orb-2"></div>
        </div>
        <div className="orb-parallax-wrapper orb-3-wrapper">
          <div className="mesh-orb orb-3"></div>
        </div>
      </div>

      <button onClick={() => onNavigate('landing')} className="btn-products-back-floating">
        <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="19" y1="12" x2="5" y2="12"></line>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        <span>Kembali</span>
      </button>

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

        <div className="showcase-container" onMouseMove={handleMouseMove}>
          <div className="showcase-visual">
            <ProductVisualizer activeIndex={activeIndex} />
          </div>

          <div className="showcase-top-tag">
            {activeProduct.category}
          </div>

          <div className="showcase-info">
            <span className="showcase-category-eyebrow">MODEL PRODUK AKTIF</span>
            <h2 className="showcase-title">{activeProduct.name.toUpperCase()}</h2>
            <div className="showcase-meta-row">
              <span className="showcase-desc-snippet">{activeProduct.desc}</span>
            </div>
          </div>

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
    </div>
  );
}
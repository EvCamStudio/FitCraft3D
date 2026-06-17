import { useState, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import '../landing.css';

// Helper to convert a dark/black baseColorTexture to a light-gray colorable texture
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

      // Remap the dark range [0, 50] to light-gray [180, 255] to allow standard multiply coloring
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

function LandingVisualizer({ colors, onReady, onProgress, introFinished }) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);
  const modelRef = useRef(null);

  // Keep colors ref to avoid closures outdating in the animate loop
  const colorsRef = useRef(colors);
  useEffect(() => {
    colorsRef.current = colors;
  }, [colors]);

  // Handle color updates dynamically, supporting both single material and array materials safely
  useEffect(() => {
    if (!modelRef.current) return;
    modelRef.current.traverse((child) => {
      if (child.isMesh && child.material) {
        const mats = Array.isArray(child.material) ? child.material : [child.material];
        mats.forEach((mat) => {
          const name = (child.name || mat.name || '').toLowerCase();
          let targetColor = colors.body;
          if (name.includes('sleeve') || name.includes('lengan') || name.includes('arm') || name.includes('hand') || name.includes('cuff')) {
            targetColor = colors.sleeve;
          } else if (name.includes('collar') || name.includes('kerah') || name.includes('rib') || name.includes('neck') || name.includes('detail') || name.includes('drawstring') || name.includes('pocket')) {
            targetColor = colors.collar;
          }
          mat.color.set(new THREE.Color(targetColor));
        });
      }
    });
  }, [colors]);

  // Keep loading state inside a ref for the animate loop to avoid closure capture
  const loadingRef = useRef(true);
  useEffect(() => {
    loadingRef.current = loading;
  }, [loading]);

  const introFinishedRef = useRef(introFinished);
  useEffect(() => {
    introFinishedRef.current = introFinished;
  }, [introFinished]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 1. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 5.5);

    // 2. WebGLRenderer
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

    // 3. OrbitControls (damping enabled, zoom disabled)
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false; // Prevent scroll interference
    controls.minDistance = 3.5;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0, 0);

    // 4. Lights
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 0.95);
    mainLight.position.set(3, 4, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(1024, 1024);
    mainLight.shadow.bias = -0.001;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-4, 2, 2);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
    rimLight.position.set(0, 5, -5);
    scene.add(rimLight);

    // 5. Garment Group
    const garmentGroup = new THREE.Group();
    // Start garment group slightly lower and pushed back for the fly-in transition
    garmentGroup.position.set(0, -0.8, -1.5);
    scene.add(garmentGroup);

    // Variables to track smooth fly-in animation
    let currentY = -0.8;
    let currentZ = -1.5;
    const targetY = -0.25;
    const targetZ = 0.0;
    const interpolationFactor = 0.06; // Easing speed

    // 6. Load GLB
    setLoading(true);
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      './assets/models/black t shirt 3d model.glb',
      (gltf) => {
        const model = gltf.scene;

        // Center model
        const box = new THREE.Box3().setFromObject(model);
        const sizeVec = box.getSize(new THREE.Vector3());
        const centerVec = box.getCenter(new THREE.Vector3());

        model.position.x += (model.position.x - centerVec.x);
        model.position.y += (model.position.y - centerVec.y);
        model.position.z += (model.position.z - centerVec.z);

        // Normalize size to fit nicely in the viewport
        const targetHeight = 2.15;
        const scaleFactor = targetHeight / sizeVec.y;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);

        // Face front
        model.rotation.y = -Math.PI / 2;
        model.updateMatrixWorld(true);

        // Traverse to apply cloned material and initial colors, handling multi-materials safely
        model.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;

            if (child.material) {
              const assignMaterial = (mat) => {
                const originalMaterial = mat.clone();
                const name = (child.name || mat.name || '').toLowerCase();

                let targetColor = colorsRef.current.body;
                if (name.includes('sleeve') || name.includes('lengan') || name.includes('arm') || name.includes('hand') || name.includes('cuff')) {
                  targetColor = colorsRef.current.sleeve;
                } else if (name.includes('collar') || name.includes('kerah') || name.includes('rib') || name.includes('neck') || name.includes('detail') || name.includes('drawstring') || name.includes('pocket')) {
                  targetColor = colorsRef.current.collar;
                }

                originalMaterial.color.set(new THREE.Color(targetColor));
                originalMaterial.roughness = 0.85;
                originalMaterial.metalness = 0.05;
                originalMaterial.side = THREE.DoubleSide;

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

        modelRef.current = model;
        garmentGroup.add(model);

        // Add a micro-delay to let textures upload to GPU before removing the spinner
        setTimeout(() => {
          setLoading(false);
          if (onReady) onReady();
        }, 100);
      },
      (xhr) => {
        if (onProgress && xhr.total > 0) {
          const progress = (xhr.loaded / xhr.total) * 100;
          // Scale it so it never fully reaches 100% until the very end 
          // because parsing and texture uploading takes extra time
          onProgress(Math.min(95, progress));
        }
      },
      (error) => {
        console.error('Failed to load t-shirt GLB model on landing page:', error);
        setLoading(false);
        if (onReady) onReady();
      }
    );

    // 7. Animation loop (includes slow auto-rotation and smooth slide/fly-in transition)
    let isInteracting = false;
    const canvasDom = renderer.domElement;
    const handlePointerDown = () => { isInteracting = true; };
    const handlePointerUp = () => { isInteracting = false; };

    canvasDom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    let animationFrameId;
    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Perform smooth entry zoom/fly-in after loading is complete and intro is finished
      if (!loadingRef.current && introFinishedRef.current) {
        if (Math.abs(garmentGroup.position.y - targetY) > 0.001) {
          currentY += (targetY - currentY) * interpolationFactor;
          garmentGroup.position.y = currentY;
        }
        if (Math.abs(garmentGroup.position.z - targetZ) > 0.001) {
          currentZ += (targetZ - currentZ) * interpolationFactor;
          garmentGroup.position.z = currentZ;
        }
      }

      // Auto-rotate the garment group when user is not actively interacting/dragging
      if (garmentGroup && !loadingRef.current && !isInteracting) {
        garmentGroup.rotation.y += 0.005;
      }

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // 8. Resize handling
    const resizeObserver = new ResizeObserver(() => {
      if (container.clientWidth === 0 || container.clientHeight === 0) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      canvasDom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      {/* Global splash screen handles loading state, so we just use this space directly */}
      {/* Smoothly fade-in canvas */}
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          opacity: loading ? 0 : 1,
          transition: 'opacity 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
        }}
      />
    </div>
  );
}


export default function LandingPage({ onNavigate, onReady, onProgress, introFinished }) {
  // Hoodie color swatch state
  const [hoodieColors, setHoodieColors] = useState({
    body: '#1b2e3c',
    sleeve: '#1b2e3c',
    collar: '#2a4050'
  });
  const [activeSwatch, setActiveSwatch] = useState(0);

  // Auth modal state
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');

  // Refs for DOM nodes to handle intersection observers and animations
  const navbarRef = useRef(null);
  const heroRef = useRef(null);
  const containerRef = useRef(null);

  // 1. Swatches data
  const swatches = [
    { name: 'Tech Navy', body: '#1b2e3c', sleeve: '#1b2e3c', collar: '#2a4050' },
    { name: 'Eco Sage', body: '#3b6352', sleeve: '#3b6352', collar: '#4a7a65' },
    { name: 'Crimson', body: '#7f1d1d', sleeve: '#7f1d1d', collar: '#991b1b' },
    { name: 'Obsidian', body: '#121212', sleeve: '#121212', collar: '#1e1e1e' },
    { name: 'Cream', body: '#f7f4eb', sleeve: '#e8e5d8', collar: '#d8d4c3' }
  ];

  useEffect(() => {
    document.body.classList.add('landing-page');
    document.documentElement.classList.add('landing-page-html');

    const wrapper = containerRef.current;
    if (wrapper) {
      wrapper.scrollTop = 0;
    }

    // 2. Navbar scrolled background class
    const navObs = new IntersectionObserver(
      ([entry]) => {
        if (navbarRef.current) {
          if (!entry.isIntersecting) {
            navbarRef.current.classList.add('scrolled');
          } else {
            navbarRef.current.classList.remove('scrolled');
          }
        }
      },
      { root: wrapper, threshold: 0.1 }
    );

    if (heroRef.current) {
      navObs.observe(heroRef.current);
    }

    // 3. Scroll Reveal Animations
    const revealEls = containerRef.current.querySelectorAll(
      '.feature-card, .step-card, .showcase-card, .section-header'
    );
    revealEls.forEach((el) => el.classList.add('reveal'));

    const revealObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            const siblings = Array.from(entry.target.parentNode.children);
            const idx = siblings.indexOf(entry.target);
            setTimeout(() => {
              entry.target.classList.add('in-view');
            }, idx * 80);
            revealObs.unobserve(entry.target);
          }
        });
      },
      { root: wrapper, threshold: 0.1 }
    );

    revealEls.forEach((el) => revealObs.observe(el));

    // 4. Section active navigation link highlight
    const sections = containerRef.current.querySelectorAll('section[id]');
    const navLinks = navbarRef.current?.querySelectorAll('.nav-link') || [];

    const sectionObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            navLinks.forEach((link) => {
              link.classList.remove('active');
              if (link.getAttribute('href') === `#${entry.target.id}`) {
                link.classList.add('active');
              }
            });
          }
        });
      },
      { root: wrapper, threshold: 0.5 }
    );

    sections.forEach((sec) => sectionObs.observe(sec));

    // 5. PPT-style slide-in trigger for each full-screen snap section
    const snapSections = containerRef.current.querySelectorAll('.snap-section');
    const slideObs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('slide-in');
          } else {
            entry.target.classList.remove('slide-in');
          }
        });
      },
      { root: wrapper, threshold: 0.35 }
    );

    snapSections.forEach((sec) => slideObs.observe(sec));
    // Hero slide-in is handled by the introFinished effect below

    return () => {
      document.body.classList.remove('landing-page');
      document.documentElement.classList.remove('landing-page-html');
      navObs.disconnect();
      revealObs.disconnect();
      sectionObs.disconnect();
      slideObs.disconnect();
    };
  }, []);

  useEffect(() => {
    if (introFinished) {
      if (heroRef.current) {
        heroRef.current.classList.add('slide-in');
      }
    } else {
      const wrapper = containerRef.current;
      if (wrapper) {
        wrapper.scrollTop = 0;
      }
    }
  }, [introFinished]);

  // 8. Scroll Parallax Tracking
  useEffect(() => {
    const wrapper = containerRef.current;
    if (!wrapper) return;

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          wrapper.style.setProperty('--scroll-y', wrapper.scrollTop);
          ticking = false;
        });
        ticking = true;
      }
    };

    wrapper.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();

    return () => {
      wrapper.removeEventListener('scroll', handleScroll);
    };
  }, []);

  // 5. Magnetic button hover effects
  const handleMouseMove = (e) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const x = e.clientX - rect.left - rect.width / 2;
    const y = e.clientY - rect.top - rect.height / 2;
    btn.style.transform = `translate(${x * 0.3}px, ${y * 0.3}px)`;
  };

  const handleMouseLeave = (e) => {
    e.currentTarget.style.transform = 'translate(0, 0)';
  };

  // 6. Smooth scroll logic
  const handleScrollTo = (e, targetId) => {
    e.preventDefault();
    const wrapper = containerRef.current;
    const target = document.getElementById(targetId);
    if (wrapper && target) {
      // Temporarily disable scroll snapping to prevent snapping conflicts during animation
      wrapper.style.scrollSnapType = 'none';

      let targetScrollTop = target.offsetTop;
      // Subtract header height (72px) for non-hero sections
      if (targetId !== 'hero') {
        targetScrollTop = Math.max(0, targetScrollTop - 72);
      }

      wrapper.scrollTo({
        top: targetScrollTop,
        behavior: 'smooth'
      });

      // Restore scroll snapping after smooth scroll completes
      setTimeout(() => {
        wrapper.style.scrollSnapType = 'y mandatory';
      }, 800);
    }
  };

  // 7. Auth Modal Submit handler
  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (authEmail) {
      const username = authEmail.split('@')[0];
      const capitalized = username.charAt(0).toUpperCase() + username.slice(1);
      localStorage.setItem('fitcraft_user', JSON.stringify({ name: capitalized, email: authEmail }));
    }
    setShowAuthModal(false);
    onNavigate('studio');
  };

  return (
    <div ref={containerRef} className="landing-page-wrapper">
      {/* Animated Background */}
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

      {/* Navigation */}
      <nav ref={navbarRef} className="nav-bar" id="navbar">
        <div className="nav-inner">
          <a href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: 'smooth' }); }} className="nav-logo">
            <div className="nav-logo-icon">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" xmlns="http://www.w3.org/2000/svg">
                <defs>
                  <linearGradient id="fitcraft-logo-gradient-nav" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#2de295" />
                    <stop offset="100%" stopColor="#14b8a6" />
                  </linearGradient>
                </defs>
                <path d="M6 4h12v6h-6v3h4v4h-4v3H6Z" fill="url(#fitcraft-logo-gradient-nav)" />
              </svg>
            </div>
            <span className="nav-logo-text">FITCRAFT <em>3D</em></span>
          </a>

          <div className="nav-links">
            <a href="#hero" onClick={(e) => handleScrollTo(e, 'hero')} className="nav-link">Beranda</a>
            <a href="#features" onClick={(e) => handleScrollTo(e, 'features')} className="nav-link">Fitur</a>
            <a href="#how-it-works" onClick={(e) => handleScrollTo(e, 'how-it-works')} className="nav-link">Cara Kerja</a>
            <a href="#showcase" onClick={(e) => handleScrollTo(e, 'showcase')} className="nav-link">Showcase</a>
            <a href="#contact" onClick={(e) => handleScrollTo(e, 'contact')} className="nav-link">Kontak</a>
          </div>

          <button onClick={() => onNavigate('studio')} className="btn-nav-cta" id="navCta">
            <span>Mulai Gratis</span>
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>
      </nav>

      {/* HERO SECTION */}
      <section ref={heroRef} className="hero-section snap-section" id="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-dot"></span>
            <svg className="badge-spark" width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
              <path d="M12 2l2.2 6.4L20.6 11l-6.4 2.2L12 19.6 9.8 13.2 3.4 11l6.4-2.6L12 2z" />
            </svg>
            STUDIO KUSTOMISASI 3D PREMIUM
          </div>

          <h1 className="hero-title">
            <span className="line-reveal" data-delay="0">CRAFT YOUR</span>
            <span className="line-reveal accent-word" data-delay="100">BRAND</span>
            <span className="line-reveal" data-delay="200">IDENTITY IN<br /><span className="outline-text">3D</span></span>
          </h1>

          <p className="hero-desc">
            Rancang pakaian kustom premium untuk startup dan tim kreatif Anda secara instan langsung dari browser — dengan presisi visualisasi 3D PBR real-time.
          </p>

          <div className="hero-cta-group">
            <button
              onClick={() => onNavigate('studio')}
              className="btn-hero-primary magnetic-btn"
              id="heroCta"
              onMouseMove={handleMouseMove}
              onMouseLeave={handleMouseLeave}
            >
              <span>Mulai Kustomisasi</span>
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12"></line>
                <polyline points="12 5 19 12 12 19"></polyline>
              </svg>
            </button>
            <button
              className="btn-hero-secondary"
              id="watchDemoBtn"
              onClick={() => {
                document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' });
              }}
            >
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
                <polygon points="10 8 16 12 10 16 10 8" />
              </svg>
              <span>Lihat Demo</span>
            </button>
          </div>

          <div className="hero-stats">
            <div className="stat-item">
              <span className="stat-value">3D</span>
              <span className="stat-label">Real-time PBR</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">3+</span>
              <span className="stat-label">Model Pakaian</span>
            </div>
            <div className="stat-divider"></div>
            <div className="stat-item">
              <span className="stat-value">∞</span>
              <span className="stat-label">Kombinasi Warna</span>
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="hero-visual" id="heroVisual">
          <div className="visual-card-stack">
            {/* Main 3D Preview Card */}
            <div className="preview-card main-card">
              <div className="card-header">
                <div className="card-dots">
                  <span></span><span></span><span></span>
                </div>
                <span className="card-title-badge">FitCraft 3D Studio</span>
              </div>
              <div className="card-viewport">
                {/* Interactive 3D T-Shirt GLB Canvas */}
                <LandingVisualizer colors={hoodieColors} onReady={onReady} onProgress={onProgress} introFinished={introFinished} />
              </div>
              {/* Color swatches below card */}
              <div className="card-swatches">
                {swatches.map((swatch, idx) => (
                  <button
                    key={idx}
                    className={`swatch ${activeSwatch === idx ? 'active' : ''}`}
                    style={{ '--c': swatch.body }}
                    onClick={() => {
                      setActiveSwatch(idx);
                      setHoodieColors({
                        body: swatch.body,
                        sleeve: swatch.sleeve,
                        collar: swatch.collar
                      });
                    }}
                    title={swatch.name}
                  ></button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES SECTION */}
      <section className="features-section snap-section" id="features">
        {/* Parallax Background Elements */}
        <div className="bg-parallax-text" aria-hidden="true" style={{ '--parallax-speed': '-0.15', top: '10%', left: '-5%' }}>FITCRAFT</div>
        <div className="bg-parallax-text outline" aria-hidden="true" style={{ '--parallax-speed': '0.1', top: '60%', left: '15%' }}>PREMIUM</div>

        <div className="section-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="section-header">
            <span className="section-eyebrow">KENAPA FITCRAFT 3D</span>
            <h2 className="section-title">Dirancang untuk <br /><span className="accent">Startup Modern</span></h2>
          </div>

          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon-bg">
                <svg viewBox="0 0 48 48" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M24 4 L8 12 V24 C8 33.5 14.5 42.3 24 46 C33.5 42.3 40 33.5 40 24 V12 Z" />
                  <path d="M16 24 L21 29 L32 18" />
                </svg>
              </div>
              <h3>Visualisasi 3D Real-Time</h3>
              <p>Lihat hasil desain pakaian Anda secara instan dengan rendering PBR berkualitas tinggi. Putar, zoom, dan eksplorasi dari segala sudut.</p>
              <div className="feature-tag">Three.js PBR Engine</div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-bg">
                <svg viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <circle cx="24" cy="24" r="10" />
                  <path d="M24 4 V8 M24 40 V44 M4 24 H8 M40 24 H44" />
                </svg>
              </div>
              <h3>Kustomisasi Warna &amp; Tema</h3>
              <p>Atur warna detail (Badan, Lengan, Kerah) secara presisi dengan picker warna tak terbatas serta 4 preset tema kurator instan.</p>
              <div className="feature-tag">Color Zone &amp; Presets</div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-bg">
                <svg viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="8" y="8" width="32" height="32" rx="4" />
                  <path d="M16 24 H32 M24 16 V32" />
                </svg>
              </div>
              <h3>Upload Logo &amp; Brand</h3>
              <p>Unggah identitas logo startup Anda (PNG/JPG/WEBP) secara instan ke model 3D lengkap dengan pengaturan ukuran dan inisial teks kustom.</p>
              <div className="feature-tag">Interactive Branding</div>
            </div>

            <div className="feature-card">
              <div className="feature-icon-bg">
                <svg viewBox="0 0 48 48" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="8" y="8" width="14" height="14" rx="2" />
                  <rect x="26" y="8" width="14" height="14" rx="2" />
                  <rect x="8" y="26" width="14" height="14" rx="2" />
                  <rect x="26" y="26" width="14" height="14" rx="2" />
                </svg>
              </div>
              <h3>Galeri Desain Lokal</h3>
              <p>Simpan multiple variasi desain Anda dengan snapshot thumbnail otomatis untuk dibandingkan atau dimuat ulang kapan saja.</p>
              <div className="feature-tag">localStorage Gallery</div>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <section className="how-section snap-section" id="how-it-works" style={{ position: 'relative', overflow: 'hidden' }}>
        {/* Parallax Background Elements */}
        <div className="bg-parallax-text outline" aria-hidden="true" style={{ '--parallax-speed': '-0.08', top: '20%', right: '-5%', left: 'auto' }}>3D STUDIO</div>

        <div className="section-container" style={{ position: 'relative', zIndex: 2 }}>
          <div className="section-header">
            <span className="section-eyebrow">ALUR KERJA</span>
            <h2 className="section-title">3 Langkah <br /><span className="accent">Desain Selesai</span></h2>
          </div>

          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">01</div>
              <div className="step-content">
                <h3>Pilih Model & Warna</h3>
                <p>Pilih dari 3 model pakaian (Hoodie, Kaos, Sweater), atur 3 zona warna, dan pilih bahan premium yang Anda inginkan.</p>
              </div>
              <div className="step-arrow">→</div>
            </div>
            <div className="step-card">
              <div className="step-number">02</div>
              <div className="step-content">
                <h3>Tambahkan Branding</h3>
                <p>Upload logo startup, ketik teks kustom, atur ukuran dan posisi langsung pada model 3D secara interaktif.</p>
              </div>
              <div className="step-arrow">→</div>
            </div>
            <div className="step-card">
              <div className="step-number">03</div>
              <div className="step-content">
                <h3>Simpan & Pesan</h3>
                <p>Simpan desain ke galeri lokal, unduh sebagai PNG, atau langsung pesan dengan mengisi form pemesanan.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SHOWCASE SECTION */}
      <section className="showcase-section snap-section" id="showcase">
        <div className="section-container">
          <div className="section-header">
            <span className="section-eyebrow">SHOWCASE</span>
            <h2 className="section-title">Inspirasi <br /><span className="accent">Desain Terbaik</span></h2>
          </div>

          <div className="showcase-grid">
            {/* Card 1: Hoodie */}
            <div className="showcase-card" style={{
              '--card-color': '#1b2e3c',
              '--glow-color': 'rgba(27, 46, 60, 0.45)',
              '--glow-accent': 'rgba(99, 102, 241, 0.25)',
              '--glow-hover-color': 'rgba(27, 46, 60, 0.35)',
              '--border-glow': 'rgba(99, 102, 241, 0.08)',
              '--border-glow-hover': 'rgba(99, 102, 241, 0.45)'
            }}>
              <div className="sc-card-meta">
                <span className="sc-card-category">Outerwear</span>
                <div className="sc-card-color-indicator">
                  <span className="sc-color-dot"></span>
                  <span className="sc-color-name">Tech Navy</span>
                </div>
              </div>
              <div className="showcase-garment-preview">
                <div className="sc-image-container">
                  <div className="sc-glass-disc"></div>
                  <img src="./assets/models/product-1.webp" alt="Hoodie Startup" className="sc-image" />
                </div>
              </div>
              <div className="showcase-info">
                <span className="sc-name">Hoodie Startup</span>
              </div>
            </div>

            {/* Card 2: Kaos */}
            <div className="showcase-card" style={{
              '--card-color': '#3b6352',
              '--glow-color': 'rgba(59, 99, 82, 0.45)',
              '--glow-accent': 'rgba(234, 179, 8, 0.2)',
              '--glow-hover-color': 'rgba(59, 99, 82, 0.35)',
              '--border-glow': 'rgba(59, 120, 99, 0.08)',
              '--border-glow-hover': 'rgba(59, 120, 99, 0.45)'
            }}>
              <div className="sc-card-meta">
                <span className="sc-card-category">Atasan</span>
                <div className="sc-card-color-indicator">
                  <span className="sc-color-dot"></span>
                  <span className="sc-color-name">Eco Sage</span>
                </div>
              </div>
              <div className="showcase-garment-preview">
                <div className="sc-image-container">
                  <div className="sc-glass-disc"></div>
                  <img src="./assets/models/product-2.webp" alt="Kaos Kinerja" className="sc-image" />
                </div>
              </div>
              <div className="showcase-info">
                <span className="sc-name">Kaos Kinerja</span>
              </div>
            </div>

            {/* Card 3: Sweater */}
            <div className="showcase-card" style={{
              '--card-color': '#7f1d1d',
              '--glow-color': 'rgba(127, 29, 29, 0.45)',
              '--glow-accent': 'rgba(217, 70, 239, 0.25)',
              '--glow-hover-color': 'rgba(127, 29, 29, 0.35)',
              '--border-glow': 'rgba(217, 70, 239, 0.08)',
              '--border-glow-hover': 'rgba(217, 70, 239, 0.45)'
            }}>
              <div className="sc-card-meta">
                <span className="sc-card-category">Outerwear</span>
                <div className="sc-card-color-indicator">
                  <span className="sc-color-dot"></span>
                  <span className="sc-color-name">Cyber Crimson</span>
                </div>
              </div>
              <div className="showcase-garment-preview">
                <div className="sc-image-container">
                  <div className="sc-glass-disc"></div>
                  <img src="./assets/models/product-3.webp" alt="Sweater Crewneck" className="sc-image" />
                </div>
              </div>
              <div className="showcase-info">
                <span className="sc-name">Sweater Crewneck</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA SECTION */}
      <section className="cta-section snap-section">
        <div className="cta-inner">
          <span className="cta-eyebrow">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" style={{ verticalAlign: '-1px', marginRight: '6px' }}>
              <path d="M12 2l2.2 6.4L20.6 11l-6.4 2.2L12 19.6 9.8 13.2 3.4 11l6.4-2.6L12 2z" />
            </svg>
            MULAI SEKARANG — GRATIS
          </span>
          <h2 className="cta-title">Wujudkan Identitas<br />Brand Anda Hari Ini</h2>
          <p className="cta-desc">Tidak perlu akun, tidak perlu install. Langsung buka studio 3D dan mulai desain pakaian impian startup Anda.</p>
          <button
            onClick={() => onNavigate('studio')}
            className="btn-cta-final magnetic-btn"
            id="ctaFinalBtn"
            onMouseMove={handleMouseMove}
            onMouseLeave={handleMouseLeave}
          >
            <span>Buka Studio 3D</span>
            <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5">
              <line x1="5" y1="12" x2="19" y2="12"></line>
              <polyline points="12 5 19 12 12 19"></polyline>
            </svg>
          </button>
        </div>
        <div className="cta-bg-orbs" aria-hidden="true">
          <div className="cta-orb cta-orb-1"></div>
          <div className="cta-orb cta-orb-2"></div>
        </div>
      </section>

      {/* FOOTER & CONTACT SECTION */}
      <footer className="site-footer" id="contact">
        <div className="footer-grid">
          {/* Brand Info */}
          <div className="footer-brand">
            <div className="footer-logo">
              <div className="nav-logo-icon">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <defs>
                    <linearGradient id="fitcraft-logo-gradient-footer" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#2de295" />
                      <stop offset="100%" stopColor="#14b8a6" />
                    </linearGradient>
                  </defs>
                  <path d="M6 4h12v6h-6v3h4v4h-4v3H6Z" fill="url(#fitcraft-logo-gradient-footer)" />
                </svg>
              </div>
              <span>FITCRAFT <em>3D</em></span>
            </div>
            <p className="footer-tagline">Rancang pakaian kustom premium untuk startup dan tim kreatif Anda secara instan dari browser dengan presisi visualisasi 3D real-time.</p>
            <div className="footer-socials">
              <a href="#" className="social-link" aria-label="Instagram">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="#" className="social-link" aria-label="Twitter">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path></svg>
              </a>
              <a href="#" className="social-link" aria-label="LinkedIn">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>

          {/* Navigation links */}
          <div className="footer-links-col">
            <h3>Navigasi</h3>
            <ul className="footer-links-list">
              <li><a href="#hero" onClick={(e) => handleScrollTo(e, 'hero')}>Beranda</a></li>
              <li><a href="#features" onClick={(e) => handleScrollTo(e, 'features')}>Fitur</a></li>
              <li><a href="#how-it-works" onClick={(e) => handleScrollTo(e, 'how-it-works')}>Cara Kerja</a></li>
              <li><a href="#showcase" onClick={(e) => handleScrollTo(e, 'showcase')}>Showcase</a></li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="footer-links-col">
            <h3>Kontak Kami</h3>
            <ul className="footer-contact-list">
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path><polyline points="22,6 12,13 2,6"></polyline></svg>
                <span>support@fitcraft3d.com</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path></svg>
                <span>+62 (21) 500-3D-CRAFT</span>
              </li>
              <li>
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path><circle cx="12" cy="10" r="3"></circle></svg>
                <span>Level 24, Premium Tower, Jakarta, Indonesia</span>
              </li>
            </ul>
          </div>

          {/* Quick Subscribe / Contact Form */}
          <div className="footer-links-col newsletter-col">
            <h3>Hubungi Kami</h3>
            <p className="newsletter-text">Punya pertanyaan tentang pesanan kustom? Tinggalkan pesan Anda.</p>
            <form className="footer-contact-form" onSubmit={(e) => { e.preventDefault(); alert('Pesan Anda telah dikirim! Tim support kami akan menghubungi Anda segera.'); e.target.reset(); }}>
              <input type="email" placeholder="Email Anda" required />
              <textarea placeholder="Pesan Anda..." required rows="2"></textarea>
              <button type="submit" className="btn-footer-send">Kirim</button>
            </form>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copy">© 2026 FitCraft 3D — Studio Kustomisasi Pakaian Premium. Dibuat dengan Three.js & React.</p>
          <div className="footer-bottom-links">
            <a href="#">Kebijakan Privasi</a>
            <a href="#">Syarat & Ketentuan</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="auth-modal-overlay" id="authOverlay" onClick={() => setShowAuthModal(false)}>
          <div className="auth-modal-card" id="authModal" onClick={(e) => e.stopPropagation()}>
            <button className="auth-modal-close" id="authModalClose" onClick={() => setShowAuthModal(false)}>
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="18" y1="6" x2="6" y2="18"></line>
                <line x1="6" y1="6" x2="18" y2="18"></line>
              </svg>
            </button>

            <div className="auth-modal-header">
              <div className="auth-modal-logo">
                <div className="nav-logo-icon">
                  <svg viewBox="0 0 24 24" width="18" height="18" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="fitcraft-logo-gradient-auth" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#2de295" />
                        <stop offset="100%" stopColor="#14b8a6" />
                      </linearGradient>
                    </defs>
                    <path d="M6 4h12v6h-6v3h4v4h-4v3H6Z" fill="url(#fitcraft-logo-gradient-auth)" />
                  </svg>
                </div>
                <span>FitCraft 3D</span>
              </div>
              <h2 className="auth-modal-title" id="authModalTitle">Masuk ke Studio</h2>
              <p className="auth-modal-sub">Gunakan email startup Anda untuk masuk dan mulai menyimpan desain.</p>
            </div>

            <form className="auth-modal-form" id="landingAuthForm" onSubmit={handleAuthSubmit}>
              <div className="auth-field">
                <label htmlFor="landingEmail">Alamat Email</label>
                <input
                  type="email"
                  id="landingEmail"
                  placeholder="nama@startupanda.com"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                />
              </div>
              <div className="auth-field">
                <label htmlFor="landingPassword">Kata Sandi</label>
                <input
                  type="password"
                  id="landingPassword"
                  placeholder="••••••••"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                />
              </div>
              <button type="submit" className="btn-auth-submit" id="btnAuthSubmit">
                Masuk &amp; Buka Studio
              </button>
            </form>

            <div className="auth-modal-switch">
              Belum memiliki akun?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  alert('Fitur Daftar Akun masih dalam bentuk Mockup untuk demonstrasi lomba. Silakan gunakan form Masuk.');
                }}
                id="toggleLandingAuth"
              >
                Daftar Sekarang
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

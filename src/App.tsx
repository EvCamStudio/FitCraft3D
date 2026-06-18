import { useState, useEffect, useRef, lazy, Suspense } from 'react';

const LandingPage = lazy(() => import('./sections/LandingPage'));
const ProductsPage = lazy(() => import('./sections/ProductsPage'));
const StudioPage = lazy(() => import('./sections/StudioPage'));

const getLoadingMessage = (progress: number): string => {
  if (progress < 15) return "Initializing 3D engine...";
  if (progress < 30) return "Loading PBR materials...";
  if (progress < 50) return "Parsing garment meshes...";
  if (progress < 70) return "Compiling shaders...";
  if (progress < 85) return "Optimizing cloth physics...";
  if (progress < 100) return "Finalizing environment...";
  return "Launching FitCraft 3D Studio";
};

function App() {
  const shouldShowIntro = (() => {
    const params = new URLSearchParams(window.location.search);
    const modelParam = params.get('model');
    if (modelParam && ['hoodie', 'tshirt', 'sweater'].includes(modelParam.toLowerCase())) return false;
    const savedView = localStorage.getItem('fitcraft_active_view');
    if (savedView && savedView !== 'landing') return false;
    return true;
  })();

  const [showSplash, setShowSplash] = useState(shouldShowIntro);
  const [initialModel] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('model');
    if (m && ['hoodie', 'tshirt', 'sweater'].includes(m.toLowerCase())) return m.toLowerCase();
    const saved = localStorage.getItem('fitcraft_active_model');
    if (saved && ['hoodie', 'tshirt', 'sweater'].includes(saved)) return saved;
    return 'hoodie';
  });
  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const m = params.get('model');
    if (m && ['hoodie', 'tshirt', 'sweater'].includes(m.toLowerCase())) return 'studio';
    const saved = localStorage.getItem('fitcraft_active_view');
    return saved || 'landing';
  });
  const [appStyle, setAppStyle] = useState<React.CSSProperties>(shouldShowIntro ? { opacity: 0, pointerEvents: 'none' } : {});
  const [introFinished, setIntroFinished] = useState(!shouldShowIntro);
  const [loadProgress, setLoadProgress] = useState(0);
  const [actualProgress, setActualProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const startTime = useRef<number>(Date.now());
  const isReadyRef = useRef(false);
  const actualProgressRef = useRef(0);

  useEffect(() => {
    startTime.current = Date.now();
    if ('scrollRestoration' in window.history) window.history.scrollRestoration = 'manual';
  }, []);

  useEffect(() => { isReadyRef.current = isReady; }, [isReady]);
  useEffect(() => { actualProgressRef.current = actualProgress; }, [actualProgress]);

  // Lock scrolling and disable scroll-snapping during splash screen to prevent visual jumps
  useEffect(() => {
    if (showSplash) {
      document.documentElement.classList.add('loading-active');
      window.scrollTo(0, 0);
    } else {
      document.documentElement.classList.remove('loading-active');
    }
    return () => {
      document.documentElement.classList.remove('loading-active');
    };
  }, [showSplash]);

  const handleAppReady = () => { setIsReady(true); };

  useEffect(() => {
    if (!showSplash) return;
    let animFrame: number;
    const update = () => {
      const elapsed = Date.now() - startTime.current;
      const duration = 4000;
      const timeProgress = Math.min(95, (elapsed / duration) * 95);
      let target = Math.min(timeProgress, actualProgressRef.current);
      if (isReadyRef.current || actualProgressRef.current >= 95) target = timeProgress;
      setLoadProgress(prev => Math.max(prev, parseFloat(target.toFixed(1))));
      if (!isReadyRef.current || elapsed < duration) {
        animFrame = requestAnimationFrame(update);
      } else {
        setLoadProgress(100);
        setTimeout(() => {
          setAppStyle({ opacity: 1, transition: 'opacity 1.0s ease-in-out' });
          setIntroFinished(true);
          setTimeout(() => { setAppStyle({}); setShowSplash(false); }, 1200);
        }, 300);
      }
    };
    animFrame = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animFrame);
  }, [showSplash]);

  const navigate = (targetView: string, model?: string) => {
    if (model) {
      localStorage.setItem('fitcraft_active_model', model);
    }
    setView(targetView);
    localStorage.setItem('fitcraft_active_view', targetView);
    if (targetView === 'studio') {
      const activeModel = model || initialModel || localStorage.getItem('fitcraft_active_model') || 'hoodie';
      window.history.pushState({}, '', `?model=${activeModel}`);
    } else {
      window.history.pushState({}, '', window.location.pathname);
    }
  };

  const brandProgress = Math.min(100, (loadProgress / 80) * 100);
  const progress3d = Math.max(0, ((loadProgress - 80) / 20) * 100);
  const isGlowActive = loadProgress >= 80;

  return (
    <div className="app-root">
      {showSplash && (
        <div className={`global-splash-screen ${loadProgress === 100 ? 'loaded' : ''}`}>
          {/* Animated Ambient Background Glows */}
          <div className="splash-bg-glows">
            <div className="splash-glow-orb orb-1"></div>
            <div className="splash-glow-orb orb-2"></div>
          </div>
          
          {/* Dynamic Dotted Grid Mesh */}
          <div className="splash-grid-overlay"></div>

          {/* Cinematic Geometric Tech Rings */}
          <div className="splash-tech-rings">
            <div className="tech-ring ring-1"></div>
            <div className="tech-ring ring-2"></div>
            <div className="tech-ring ring-3"></div>
          </div>

          {/* Core preloader layout */}
          <div className="splash-content">
            <div className="splash-brand-container">
              <h1 className="splash-text-loader">
                <span className="splash-text-brand" data-text="FITCRAFT" style={{ '--progress': `${brandProgress}%` } as React.CSSProperties}>
                  FITCRAFT
                </span>
                <span className={`splash-text-3d ${isGlowActive ? 'glow-active' : ''}`} data-text="3D" style={{ '--progress': `${progress3d}%` } as React.CSSProperties}>
                  3D
                </span>
              </h1>
              
              {/* Sleek Progress Bar */}
              <div className="splash-loader-bar-container">
                <div className="splash-loader-bar" style={{ width: `${loadProgress}%` }}></div>
              </div>
              
              {/* Dynamic Status Log and Percentage Info */}
              <div className="splash-meta-row">
                <span className="splash-status-log">
                  <span className="status-terminal-symbol">&gt;</span> {getLoadingMessage(loadProgress)}
                </span>
                <span className="splash-percentage">
                  {Math.round(loadProgress)}%
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="app-content-wrapper" style={appStyle}>
        <Suspense fallback={<div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><div style={{ width: 32, height: 32, border: '3px solid rgba(0, 229, 160, 0.15)', borderTopColor: '#00e5a0', borderRadius: '50%', animation: 'spin 1s linear infinite' }} /></div>}>
          {view === 'landing' && <LandingPage onNavigate={navigate} onReady={handleAppReady} onProgress={setActualProgress} introFinished={introFinished} />}
          {view === 'products' && <ProductsPage onNavigate={navigate} onReady={handleAppReady} onProgress={setActualProgress} />}
          {view === 'studio' && <StudioPage onNavigate={navigate} initialModel={initialModel} onReady={handleAppReady} onProgress={setActualProgress} />}
        </Suspense>
      </div>
    </div>
  );
}

export default App;

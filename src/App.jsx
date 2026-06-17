import React, { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ProductsPage from './components/ProductsPage'
import StudioPage from './components/StudioPage'

const getLoadingStatusMessage = (progress) => {
  if (progress < 15) return "Initializing core 3D systems...";
  if (progress < 30) return "Configuring ambient lighting & dynamic shadow maps...";
  if (progress < 50) return "Loading PBR fabric textures and material maps...";
  if (progress < 70) return "Parsing garment mesh data and polygon structures...";
  if (progress < 85) return "Compiling custom WebGL shaders & procedural normal maps...";
  if (progress < 95) return "Optimizing real-time cloth physics constraints...";
  if (progress < 100) return "Finalizing environment settings and camera rigs...";
  return "System initialized. Launching FitCraft 3D Studio.";
};

function App() {
  const [showSplash, setShowSplash] = useState(true);

  const [initialModel, setInitialModel] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const modelParam = params.get('model');
    if (modelParam && ['hoodie', 'tshirt', 'sweater'].includes(modelParam.toLowerCase())) {
      return modelParam.toLowerCase();
    }
    const savedModel = localStorage.getItem('fitcraft_active_model');
    if (savedModel && ['hoodie', 'tshirt', 'sweater'].includes(savedModel)) {
      return savedModel;
    }
    return 'hoodie';
  });

  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const modelParam = params.get('model');
    if (modelParam && ['hoodie', 'tshirt', 'sweater'].includes(modelParam.toLowerCase())) {
      return 'studio';
    }
    const savedView = localStorage.getItem('fitcraft_active_view');
    if (savedView) {
      return savedView;
    }
    return 'landing';
  });

  const [appStyle, setAppStyle] = useState({ opacity: 0, pointerEvents: 'none' });
  const [loadProgress, setLoadProgress] = useState(0);
  const [actualProgress, setActualProgress] = useState(0);
  const [isReady, setIsReady] = useState(false);

  const startTime = React.useRef(Date.now());
  const isReadyRef = React.useRef(false);
  const actualProgressRef = React.useRef(0);

  // Sync state to refs for use in animation loop
  useEffect(() => {
    isReadyRef.current = isReady;
  }, [isReady]);

  useEffect(() => {
    actualProgressRef.current = actualProgress;
  }, [actualProgress]);

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

  const handleAppReady = () => {
    setIsReady(true);
  };

  useEffect(() => {
    if (!showSplash) return;

    let animFrame;
    const updateProgress = () => {
      const elapsed = Date.now() - startTime.current;
      const duration = 4000; // 4 seconds minimum loading screen duration

      // Time-based progress goes up to 95% at 4s
      const timeProgress = Math.min(95, (elapsed / duration) * 95);

      const currentActual = actualProgressRef.current;
      const currentReady = isReadyRef.current;

      // Cap at actual load progress if loading is slower than elapsed time
      let targetProgress = Math.min(timeProgress, currentActual);

      // If the page is ready, let progress follow timeProgress smoothly
      if (currentReady || currentActual >= 95) {
        targetProgress = timeProgress;
      }

      setLoadProgress((prev) => {
        const next = Math.max(prev, targetProgress);
        return parseFloat(next.toFixed(1));
      });

      if (!currentReady || elapsed < duration) {
        animFrame = requestAnimationFrame(updateProgress);
      } else {
        // Both conditions met: 4s elapsed AND website is fully ready
        setLoadProgress(100);
        
        // Wait a brief moment at 100% before sliding up for aesthetic impact
        setTimeout(() => {
          setAppStyle({
            opacity: 1,
            transition: 'opacity 1.0s ease-in-out'
          });

          // After transition finishes, remove override style and deactivate splash
          setTimeout(() => {
            setAppStyle({});
            setShowSplash(false);
          }, 1200);
        }, 300);
      }
    };

    animFrame = requestAnimationFrame(updateProgress);
    return () => {
      if (animFrame) {
        cancelAnimationFrame(animFrame);
      }
    };
  }, [showSplash]);

  const navigate = (targetView, model = null) => {
    if (model) {
      setInitialModel(model);
      localStorage.setItem('fitcraft_active_model', model);
    }
    setView(targetView);
    localStorage.setItem('fitcraft_active_view', targetView);
    
    // Update URL history state for visual consistency
    if (targetView !== 'studio') {
      window.history.pushState({}, '', window.location.pathname);
    } else {
      const activeModel = model || initialModel || localStorage.getItem('fitcraft_active_model') || 'hoodie';
      window.history.pushState({}, '', `?model=${activeModel}`);
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
                <span className="splash-text-brand" data-text="FITCRAFT" style={{ '--progress': `${brandProgress}%` }}>
                  FITCRAFT
                </span>
                <span className={`splash-text-3d ${isGlowActive ? 'glow-active' : ''}`} data-text="3D" style={{ '--progress': `${progress3d}%` }}>
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
                  <span className="status-terminal-symbol">&gt;</span> {getLoadingStatusMessage(loadProgress)}
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
        {view === 'landing' && <LandingPage onNavigate={navigate} onReady={handleAppReady} onProgress={setActualProgress} />}
        {view === 'products' && <ProductsPage onNavigate={navigate} onReady={handleAppReady} onProgress={setActualProgress} />}
        {view === 'studio' && <StudioPage onNavigate={navigate} initialModel={initialModel} onReady={handleAppReady} onProgress={setActualProgress} />}
      </div>
    </div>
  )
}

export default App;

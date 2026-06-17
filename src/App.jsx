import React, { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ProductsPage from './components/ProductsPage'
import StudioPage from './components/StudioPage'

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

  const [appStyle, setAppStyle] = useState({ transform: 'translateY(100vh)', pointerEvents: 'none' });
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
            transform: 'translateY(0)',
            transition: 'transform 0.8s cubic-bezier(0.25, 1, 0.5, 1)'
          });

          // After slide-up finishes, remove transform and deactivate splash
          setTimeout(() => {
            setAppStyle({});
            setShowSplash(false);
          }, 800);
        }, 400);
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

  return (
    <div className="app-root">
      {showSplash && (
        <div className={`global-splash-screen ${loadProgress === 100 ? 'loaded' : ''}`}>
          <div className="splash-content">
            <h1 className="splash-text-loader" data-text="FITCRAFT 3D" style={{ '--progress': `${loadProgress}%` }}>FITCRAFT 3D</h1>
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

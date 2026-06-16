import { useState, useEffect } from 'react'
import LandingPage from './components/LandingPage'
import ProductsPage from './components/ProductsPage'
import StudioPage from './components/StudioPage'

function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [fadeOutSplash, setFadeOutSplash] = useState(false);

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

  useEffect(() => {
    // Show splash animation for 1.8 seconds, then fade it out, then remove it from DOM
    const fadeTimer = setTimeout(() => {
      setFadeOutSplash(true);
    }, 1800);

    const removeTimer = setTimeout(() => {
      setShowSplash(false);
    }, 2400);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, []);

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
        <div className={`global-splash-screen ${fadeOutSplash ? 'fade-out' : ''}`}>
          <div className="splash-content">
            <div className="splash-logo">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20.38 3.46L16 6a2 2 0 0 1-2.12-.13l-1.42-1a2 2 0 0 0-2.38 0l-1.42 1A2 2 0 0 1 6.54 6L2.12 3.46a.5.5 0 0 0-.75.43V8a2 2 0 0 0 1.63 2H5v10a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V10h1.88A2 2 0 0 0 22.5 8V3.89a.5.5 0 0 0-.75-.43z"/>
              </svg>
            </div>
            <h1 className="splash-title">FITCRAFT <em>3D</em></h1>
            <p className="splash-subtitle">Studio Kustomisasi Pakaian Premium</p>
            <div className="splash-loader-bar">
              <div className="splash-progress"></div>
            </div>
          </div>
        </div>
      )}
      {view === 'landing' && <LandingPage onNavigate={navigate} />}
      {view === 'products' && <ProductsPage onNavigate={navigate} />}
      {view === 'studio' && <StudioPage onNavigate={navigate} initialModel={initialModel} />}
    </div>
  )
}

export default App;

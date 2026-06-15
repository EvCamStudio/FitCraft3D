import { useState } from 'react'
import LandingPage from './components/LandingPage'
import ProductsPage from './components/ProductsPage'
import StudioPage from './components/StudioPage'

function App() {
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
      {view === 'landing' && <LandingPage onNavigate={navigate} />}
      {view === 'products' && <ProductsPage onNavigate={navigate} />}
      {view === 'studio' && <StudioPage onNavigate={navigate} initialModel={initialModel} />}
    </div>
  )
}

export default App

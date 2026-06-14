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
    return 'hoodie';
  });

  const [view, setView] = useState(() => {
    const params = new URLSearchParams(window.location.search);
    const modelParam = params.get('model');
    if (modelParam && ['hoodie', 'tshirt', 'sweater'].includes(modelParam.toLowerCase())) {
      return 'studio';
    }
    return 'landing';
  });

  const navigate = (targetView, model = null) => {
    if (model) {
      setInitialModel(model);
    }
    setView(targetView);
    // Update URL history state for visual consistency
    if (targetView !== 'studio') {
      window.history.pushState({}, '', window.location.pathname);
    } else if (model) {
      window.history.pushState({}, '', `?model=${model}`);
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

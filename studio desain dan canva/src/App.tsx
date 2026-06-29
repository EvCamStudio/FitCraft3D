import { useState, useEffect, useCallback } from 'react';
import LandingPage from './pages/LandingPage';
import ProductsPage from './pages/ProductsPage';
import StudioPage from './pages/StudioPage';

function App() {
  const [currentPage, setCurrentPage] = useState<'landing' | 'products' | 'studio'>('landing');
  const [selectedModel, setSelectedModel] = useState<'hoodie' | 'tshirt' | 'sweater'>('hoodie');

  const navigateTo = useCallback((page: 'landing' | 'products' | 'studio', model?: 'hoodie' | 'tshirt' | 'sweater') => {
    if (model) setSelectedModel(model);
    setCurrentPage(page);
    window.scrollTo(0, 0);
  }, []);

  useEffect(() => {
    document.body.style.background = '#08090a';
    document.body.style.color = '#f0f2f5';
  }, []);

  return (
    <div className="min-h-screen bg-[#08090a] text-[#f0f2f5]">
      {currentPage === 'landing' && <LandingPage onNavigate={navigateTo} />}
      {currentPage === 'products' && <ProductsPage onNavigate={navigateTo} />}
      {currentPage === 'studio' && <StudioPage onNavigate={navigateTo} initialModel={selectedModel} />}
    </div>
  );
}

export default App;

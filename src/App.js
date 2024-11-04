import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import InteractiveToolsPage from './pages/InteractiveToolsPage';
import RevisionMaterialsPage from './pages/RevisionMaterialsPage';
import CareerGuidesPage from './pages/CareerGuidesPage';
import SingleArticle from './pages/SingleArticle';
import BeamCalculator from './pages/BeamCalculator';
import ConcreteMixDesignCalculator from './pages/ConcreteMixDesignCalculator'; // Import the new component
import './App.css'; // Import global CSS

function App() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:id" element={<SingleArticle />} />
        <Route path="/case-studies" element={<CaseStudiesPage />} />
        <Route path="/tools" element={<InteractiveToolsPage />} />
        <Route path="/tools/beam-calculator" element={<BeamCalculator />} />
        <Route
          path="/tools/concrete-mix-design"
          element={<ConcreteMixDesignCalculator />}
        />
        <Route path="/revision-materials" element={<RevisionMaterialsPage />} />
        <Route path="/career-guides" element={<CareerGuidesPage />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
// src/App.js
import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import InteractiveToolsPage from './pages/InteractiveToolsPage';
import RevisionMaterialsPage from './pages/RevisionMaterialsPage';
import CareerGuidesPage from './pages/CareerGuidesPage';
import CareerGuideDetail from './pages/CareerGuideDetail';
import SingleArticle from './pages/SingleArticle';
import BeamCalculator from './pages/BeamCalculator';
import ConcreteMixDesignCalculator from './pages/ConcreteMixDesignCalculator';
import ContactPage from './pages/ContactPage';
import DesignMaterialsPage from './pages/DesignMaterialsPage';
import SlopeStabilityCalculator from './pages/SlopeStabilityCalculator';
import StructuralLoadCalculator from './pages/StructuralLoadCalculator';
import CaseStudyDetailPage from './pages/CaseStudyDetailPage';
import SoilBearingCapacityCalculator from './pages/SoilBearingCapacityCalculator';
import HydraulicCalculator from './pages/HydraulicCalculator';
import StructuralEngineeringFlashcards from './pages/materials/StructuralEngineeringFlashcards';
import HydraulicsSummaryNotes from './pages/materials/HydraulicsSummaryNotes';
import ConcreteTechnologyQuiz from './pages/materials/ConcreteTechnologyQuiz';
import GeotechnicalEngineeringFlashcards from './pages/materials/GeotechnicalEngineeringFlashcards';
import PileDesignTool from './pages/PileDesignTool';
import EnvironmentalEngineeringSummaryNotes from './pages/materials/EnvironmentalEngineeringSummaryNotes';
import TransportationEngineeringQuiz from './pages/materials/TransportationEngineeringQuiz';
import RetainingWallDesignTool from './pages/RetainingWallDesignTool';
import SteelConnectionDesignTool from './pages/SteelConnectionDesignTool';
import ReinforcedConcreteDesignTool from './pages/ReinforcedConcreteDesignTool';
import DownloadableRevisionMaterialsPage from './pages/materials/DownloadableRevisionMaterialsPage';
import WelcomeOverlay from './components/WelcomeOverlay';
import { AuthContext } from './contexts/AuthContext';
import ScrollToTop from './ScrollToTop';
import './App.css';

function App() {
  const { currentUser } = useContext(AuthContext);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (currentUser && currentUser.metadata.creationTime === currentUser.metadata.lastSignInTime) {
      setShowWelcome(true);
    }
  }, [currentUser]);

  const closeWelcome = () => {
    setShowWelcome(false);
  };

  return (
    <Router>
      <ScrollToTop /> 
      <Navbar />
      {showWelcome && currentUser && (
        <WelcomeOverlay name={currentUser.displayName || currentUser.email} onClose={closeWelcome} />
      )}
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/articles" element={<ArticlesPage />} />
        <Route path="/articles/:id" element={<SingleArticle />} />
        <Route path="/design-materials" element={<DesignMaterialsPage />} />
        <Route path="/case-studies" element={<CaseStudiesPage />} />
        <Route path="/case-studies/:id" element={<CaseStudyDetailPage />} />
        <Route path="/tools" element={<InteractiveToolsPage />} />
        <Route path="/tools/beam-calculator" element={<BeamCalculator />} />
        <Route path="/tools/concrete-mix-design" element={<ConcreteMixDesignCalculator />} />
        <Route path="/tools/slope-stability" element={<SlopeStabilityCalculator />} />
        <Route path="/tools/hydraulic-calculator" element={<HydraulicCalculator />} />
        <Route path="/tools/retaining-wall-design" element={<RetainingWallDesignTool />} />
        <Route path="/tools/steel-connection-design" element={<SteelConnectionDesignTool />} />
        <Route path="/tools/reinforced-concrete-design" element={<ReinforcedConcreteDesignTool />} />
        <Route path="/revision-materials" element={<RevisionMaterialsPage />} />
        <Route path="/materials/downloadable-revision-materials" element={<DownloadableRevisionMaterialsPage />} />
        <Route path="/career-guides" element={<CareerGuidesPage />} />
        <Route path="/tools/soil-bearing-capacity" element={<SoilBearingCapacityCalculator />} />
        <Route path="/tools/structural-load" element={<StructuralLoadCalculator />} />
        <Route path="/career-guides/:guideId" element={<CareerGuideDetail />} />
        <Route path="/contact" element={<ContactPage />} />
        <Route path="/tools/pile-design" element={<PileDesignTool />} />
        <Route path="/materials/structural-engineering-flashcards" element={<StructuralEngineeringFlashcards />} />
        <Route path="/materials/hydraulics-summary-notes" element={<HydraulicsSummaryNotes />} />
        <Route path="/materials/concrete-technology-quiz" element={<ConcreteTechnologyQuiz />} />
        <Route path="/materials/geotechnical-engineering-flashcards" element={<GeotechnicalEngineeringFlashcards />} />
        <Route path="/materials/environmental-engineering-summary-notes" element={<EnvironmentalEngineeringSummaryNotes />} />
        <Route path="/materials/transportation-engineering-quiz" element={<TransportationEngineeringQuiz />} />
      </Routes>
      <Footer />
    </Router>
  );
}

export default App;
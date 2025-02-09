import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WelcomeOverlay from './components/WelcomeOverlay';
import InstallPrompt from './components/InstallPrompt';
import ScrollToTop from './ScrollToTop';
import { requestForToken, onMessageListener } from './firebase';
import { AuthContext } from './contexts/AuthContext';
import ProtectedRoute from './routes/ProtectedRoute'; // Import the ProtectedRoute component
import './App.css';

// Import all components directly
import HomePage from './pages/HomePage';
import ArticlesPage from './pages/ArticlesPage';
import CaseStudiesPage from './pages/CaseStudiesPage';
import InteractiveToolsPage from './pages/InteractiveToolsPage';
import RevisionMaterialsPage from './pages/RevisionMaterialsPage';
import CareerGuidesPage from './pages/CareerGuidesPage';
import CareerGuideDetail from './pages/CareerGuideDetail';
import SingleArticle from './pages/SingleArticle';
import BeamCalculator from './pages/BeamCalculator';
import FrameCalculator from './tools/FrameCalculator';
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
import EventsPage from './pages/EventsPage';
import WebinarsPage from './pages/WebinarsPage';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import AboutUsPage from './pages/AboutUsPage';
import CommunityPage from './pages/CommunityPage';
import ThreadDetail from './pages/ThreadDetail';
import NewThreadPage from './pages/NewThreadPage';
import CategoriesPage from './pages/CategoriesPage';
import CreateCategoryPage from './pages/CreateCategoryPage';
import EducationalResourcesPage from './pages/EducationalResourcesPage';
import StructuralAnalysisFlashcards from './pages/materials/StructuralAnalysisFlashcards';
import FluidMechanicsSummaryNotes from './pages/materials/FluidMechanicsSummaryNotes';
import SteelStructuresQuiz from './pages/materials/SteelStructuresQuiz';
import SoilMechanicsFlashcards from './pages/materials/SoilMechanicsFlashcards';
import WaterResourcesEngineeringSummaryNotes from './pages/materials/WaterResourcesEngineeringSummaryNotes';
import PublicHealthEngineeringQuiz from './pages/materials/PublicHealthEngineeringQuiz';
import MatrixCalculator from './tools/MatrixCalculator';
import EngineeringGraphicsFlashcards from './pages/materials/EngineeringGraphicsFlashcards';
import StressStrainGenerator from './tools/StressStrainGenerator';
import LCCATool from './tools/LCCATool';
import SteelSectionDatabase from './tools/SteelSectionDatabase';
import UnitConverter from './tools/UnitConverter';
import TraverseCalculator from './tools/TraverseCalculator';
import LevelingCalculator from './tools/LevelingCalculator';
import TrafficAnalysisCalculator from './tools/TrafficAnalysisCalculator';
import TrussAnalysisCalculator from './tools/TrussAnalysisCalculator';
import PavementDesignCalculator from './tools/PavementDesignCalculator';
import SettlementCalculator from './tools/SettlementCalculator';
import HighwayGeometricCalculator from './tools/HighwayGeometricCalculator';
import EarthPressureCalculator from './tools/EarthPressureCalculator';
import ColumnDesignTool from './tools/ColumnDesignTool';
import RainfallRunoffCalculator from './tools/RainfallRunoffCalculator';
import MaterialQuantityCalculator from './tools/MaterialQuantityCalculator';
import ConstructionCostEstimator from './tools/ConstructionCostEstimator';
import AreaVolumeCalculator from './tools/AreaVolumeCalculator';
import CarbonFootprintCalculator from './tools/CarbonFootprintCalculator';
import ProjectTimelineGenerator from './tools/ProjectTimelineGenerator';
import SoilClassificationTool from './tools/SoilClassificationTool';
import WaterNetworkAnalysis from './tools/WaterNetworkAnalysis';
import MaterialSelectionTool from './tools/MaterialSelectionTool';
import AIAssistantPage from './pages/AIAssistantPage';
import AIAssignmentHelper from './components/AIAssignmentHelper';
import WorkshopsPage from './pages/WorkshopsPage';
import AIDesignOptimizerPage from './pages/AIDesignOptimizerPage';
import ConstructionManagementFlashcards from './pages/materials/ConstructionManagementFlashcards';
import BuildingServicesFlashcards from './pages/materials/BuildingServicesFlashcards';
import SurveyingFundamentalsQuiz from './pages/materials/SurveyingFundamentalsQuiz';
import HighwayEngineeringFlashcards from './pages/materials/HighwayEngineeringFlashcards';
import FoundationDesignFlashcards from './pages/materials/FoundationDesignFlashcards';
import ConstructionMaterialsQuiz from './pages/materials/ConstructionMaterialsQuiz';
import AIArchitect from './components/AIArchitect/AIArchitect';
import CadValidator from './pages/CadValidator';
import ProjectCollaborationAi from './pages/ProjectColaborationAi';
import SimulationGenerator from './pages/SimulationGenerator';
import GreenBuildingDesign from './pages/GreenBuildingDesign';
import KnowledgeExtraction from './pages/KnowledgeExtraction';
import AutoTutor from './pages/AutoTutor';
import AdsStrategyPage from './pages/AdsStrategyPage';

function App() {
  const { currentUser } = useContext(AuthContext);
  const [showWelcome, setShowWelcome] = useState(false);
  const [notification, setNotification] = useState(null);

  useEffect(() => {
    if (currentUser && currentUser.metadata.creationTime === currentUser.metadata.lastSignInTime) {
      setShowWelcome(true);
    }

    // Request permission and get token
    requestForToken();

    // Listen for foreground messages
    onMessageListener()
      .then((payload) => {
        setNotification({
          title: payload.notification.title,
          body: payload.notification.body,
        });
      })
      .catch((err) => console.log('failed: ', err));
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
      {notification && (
        <div className="notification">
          <h3>{notification.title}</h3>
          <p>{notification.body}</p>
        </div>
      )}
      <main className="content no-whitespace">
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<HomePage />} />
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />

          {/* Protected Routes */}
          <Route path="/articles" element={<ProtectedRoute><ArticlesPage /></ProtectedRoute>} />
          <Route path="/articles/:id" element={<ProtectedRoute><SingleArticle /></ProtectedRoute>} />
          <Route path="/design-materials" element={<ProtectedRoute><DesignMaterialsPage /></ProtectedRoute>} />
          <Route path="/case-studies" element={<ProtectedRoute><CaseStudiesPage /></ProtectedRoute>} />
          <Route path="/case-studies/:id" element={<ProtectedRoute><CaseStudyDetailPage /></ProtectedRoute>} />
          <Route path="/tools" element={<ProtectedRoute><InteractiveToolsPage /></ProtectedRoute>} />
          <Route path="/tools/beam-calculator" element={<ProtectedRoute><BeamCalculator /></ProtectedRoute>} />
          <Route path="/tools/concrete-mix-design" element={<ProtectedRoute><ConcreteMixDesignCalculator /></ProtectedRoute>} />
          <Route path="/tools/slope-stability" element={<ProtectedRoute><SlopeStabilityCalculator /></ProtectedRoute>} />
          <Route path="/tools/hydraulic-calculator" element={<ProtectedRoute><HydraulicCalculator /></ProtectedRoute>} />
          <Route path="/tools/retaining-wall-design" element={<ProtectedRoute><RetainingWallDesignTool /></ProtectedRoute>} />
          <Route path="/tools/steel-connection-design" element={<ProtectedRoute><SteelConnectionDesignTool /></ProtectedRoute>} />
          <Route path="/tools/reinforced-concrete-design" element={<ProtectedRoute><ReinforcedConcreteDesignTool /></ProtectedRoute>} />
          <Route path="/revision-materials" element={<ProtectedRoute><RevisionMaterialsPage /></ProtectedRoute>} />
          <Route path="/materials/downloadable-revision-materials" element={<ProtectedRoute><DownloadableRevisionMaterialsPage /></ProtectedRoute>} />
          <Route path="/career-guides" element={<ProtectedRoute><CareerGuidesPage /></ProtectedRoute>} />
          <Route path="/tools/soil-bearing-capacity" element={<ProtectedRoute><SoilBearingCapacityCalculator /></ProtectedRoute>} />
          <Route path="/tools/structural-load" element={<ProtectedRoute><StructuralLoadCalculator /></ProtectedRoute>} />
          <Route path="/career-guides/:guideId" element={<ProtectedRoute><CareerGuideDetail /></ProtectedRoute>} />
          <Route path="/contact" element={<ProtectedRoute><ContactPage /></ProtectedRoute>} />
          <Route path="/events" element={<ProtectedRoute><EventsPage /></ProtectedRoute>} />
          <Route path="/community" element={<ProtectedRoute><CategoriesPage /></ProtectedRoute>} />
          <Route path="/community/create-category" element={<ProtectedRoute><CreateCategoryPage /></ProtectedRoute>} />
          <Route path="/community/:categoryId" element={<ProtectedRoute><CommunityPage /></ProtectedRoute>} />
          <Route path="/community/:categoryId/new-thread" element={<ProtectedRoute><NewThreadPage /></ProtectedRoute>} />
          <Route path="/community/:categoryId/threads/:threadId" element={<ProtectedRoute><ThreadDetail /></ProtectedRoute>} />
          <Route path="/webinars" element={<ProtectedRoute><WebinarsPage /></ProtectedRoute>} />
          <Route path="/educational-resources" element={<ProtectedRoute><EducationalResourcesPage /></ProtectedRoute>} />
          <Route path="/tools/pile-design" element={<ProtectedRoute><PileDesignTool /></ProtectedRoute>} />
          <Route path="/materials/structural-engineering-flashcards" element={<ProtectedRoute><StructuralEngineeringFlashcards /></ProtectedRoute>} />
          <Route path="/materials/hydraulics-summary-notes" element={<ProtectedRoute><HydraulicsSummaryNotes /></ProtectedRoute>} />
          <Route path="/materials/concrete-technology-quiz" element={<ProtectedRoute><ConcreteTechnologyQuiz /></ProtectedRoute>} />
          <Route path="/materials/geotechnical-engineering-flashcards" element={<ProtectedRoute><GeotechnicalEngineeringFlashcards /></ProtectedRoute>} />
          <Route path="/materials/environmental-engineering-summary-notes" element={<ProtectedRoute><EnvironmentalEngineeringSummaryNotes /></ProtectedRoute>} />
          <Route path="/materials/transportation-engineering-quiz" element={<ProtectedRoute><TransportationEngineeringQuiz /></ProtectedRoute>} />
          <Route path="/materials/structural-analysis-flashcards" element={<ProtectedRoute><StructuralAnalysisFlashcards /></ProtectedRoute>} />
          <Route path="/materials/fluid-mechanics-summary-notes" element={<ProtectedRoute><FluidMechanicsSummaryNotes /></ProtectedRoute>} />
          <Route path="/materials/steel-structures-quiz" element={<ProtectedRoute><SteelStructuresQuiz /></ProtectedRoute>} />
          <Route path="/materials/soil-mechanics-flashcards" element={<ProtectedRoute><SoilMechanicsFlashcards /></ProtectedRoute>} />
          <Route path="/pages/materials/public-health-engineering-quiz" element={<ProtectedRoute><PublicHealthEngineeringQuiz /></ProtectedRoute>} />
          <Route path="/tools/frame-calculator" element={<ProtectedRoute><FrameCalculator /></ProtectedRoute>} />
          <Route path="/tools/matrix-calculator" element={<ProtectedRoute><MatrixCalculator /></ProtectedRoute>} />
          <Route path="/tools/stress-strain-generator" element={<ProtectedRoute><StressStrainGenerator /></ProtectedRoute>} />
          <Route path="/tools/lcca-tool" element={<ProtectedRoute><LCCATool /></ProtectedRoute>} />
          <Route path="/ai-assignment-helper" element={<ProtectedRoute><AIAssignmentHelper /></ProtectedRoute>} />
          <Route path="/tools/area-volume-calculator" element={<ProtectedRoute><AreaVolumeCalculator /></ProtectedRoute>} />
          <Route path="/tools/carbon-footprint-calculator" element={<ProtectedRoute><CarbonFootprintCalculator /></ProtectedRoute>} />
          <Route path="/tools/project-timeline-generator" element={<ProtectedRoute><ProjectTimelineGenerator /></ProtectedRoute>} />
          <Route path="/tools/soil-classification-tool" element={<ProtectedRoute><SoilClassificationTool /></ProtectedRoute>} />
          <Route path="/tools/water-network-analysis" element={<ProtectedRoute><WaterNetworkAnalysis /></ProtectedRoute>} />
          <Route path="/tools/unit-conversion" element={<ProtectedRoute><UnitConverter /></ProtectedRoute>} />
          <Route path="/tools/steel-sections" element={<ProtectedRoute><SteelSectionDatabase /></ProtectedRoute>} />
          <Route path="/tools/material-selection-tool" element={<ProtectedRoute><MaterialSelectionTool /></ProtectedRoute>} />
          <Route path="/materials/engineering-graphics-flashcards" element={<ProtectedRoute><EngineeringGraphicsFlashcards /></ProtectedRoute>} />
          <Route path="/materials/construction-management-flashcards" element={<ProtectedRoute><ConstructionManagementFlashcards /></ProtectedRoute>} />
          <Route path="/materials/building-services-flashcards" element={<ProtectedRoute><BuildingServicesFlashcards /></ProtectedRoute>} />
          <Route path="/materials/surveying-fundamentals-quiz" element={<ProtectedRoute><SurveyingFundamentalsQuiz /></ProtectedRoute>} />
          <Route path="/materials/highway-engineering-flashcards" element={<ProtectedRoute><HighwayEngineeringFlashcards /></ProtectedRoute>} />
          <Route path="/materials/foundation-design-flashcards" element={<ProtectedRoute><FoundationDesignFlashcards /></ProtectedRoute>} />
          <Route path="/materials/construction-materials-quiz" element={<ProtectedRoute><ConstructionMaterialsQuiz /></ProtectedRoute>} />
          <Route path="/tools/traverse-calculator" element={<ProtectedRoute><TraverseCalculator /></ProtectedRoute>} />
          <Route path="/tools/leveling-calculator" element={<ProtectedRoute><LevelingCalculator /></ProtectedRoute>} />
          <Route path="/tools/traffic-analysis" element={<ProtectedRoute><TrafficAnalysisCalculator /></ProtectedRoute>} />
          <Route path="/tools/truss-analysis" element={<ProtectedRoute><TrussAnalysisCalculator /></ProtectedRoute>} />
          <Route path="/tools/pavement-design" element={<ProtectedRoute><PavementDesignCalculator /></ProtectedRoute>} />
          <Route path="/tools/settlement-calculator" element={<ProtectedRoute><SettlementCalculator /></ProtectedRoute>} />
          <Route path="/tools/highway-geometric" element={<ProtectedRoute><HighwayGeometricCalculator /></ProtectedRoute>} />
          <Route path="/tools/earth-pressure" element={<ProtectedRoute><EarthPressureCalculator /></ProtectedRoute>} />
          <Route path="/tools/column-design" element={<ProtectedRoute><ColumnDesignTool /></ProtectedRoute>} />
          <Route path="/interactive-ai" element={<ProtectedRoute><AIAssistantPage /></ProtectedRoute>} />
          <Route path="/workshops" element={<ProtectedRoute><WorkshopsPage/></ProtectedRoute>} />
          <Route path="/ai-design-optimizer" element={<ProtectedRoute><AIDesignOptimizerPage/></ProtectedRoute>} />
          <Route path="/tools/rainfall-runoff" element={<ProtectedRoute><RainfallRunoffCalculator /></ProtectedRoute>} />
          <Route path="/tools/material-quantity" element={<ProtectedRoute><MaterialQuantityCalculator /></ProtectedRoute>} />
          <Route path="/tools/construction-cost" element={<ProtectedRoute><ConstructionCostEstimator /></ProtectedRoute>} />
          <Route path="/ai-architect" element={<ProtectedRoute><AIArchitect /></ProtectedRoute>} />
          <Route path="/cad-validator" element={<ProtectedRoute><CadValidator /></ProtectedRoute>} />
          <Route path="/project-collaboration-ai" element={<ProtectedRoute><ProjectCollaborationAi /></ProtectedRoute>} />
          <Route path="/simulation-generator" element={<ProtectedRoute><SimulationGenerator /></ProtectedRoute>} />
          <Route path="/green-building-design" element={<ProtectedRoute><GreenBuildingDesign /></ProtectedRoute>} />
          <Route path="/knowledge-extraction" element={<ProtectedRoute><KnowledgeExtraction /></ProtectedRoute>} />
          <Route path="/auto-tutor" element={<ProtectedRoute><AutoTutor /></ProtectedRoute>} />
          <Route path="/ads-strategy" element={<ProtectedRoute><AdsStrategyPage /></ProtectedRoute>} />
        </Routes>
      </main>
      <InstallPrompt />
      <Footer />
    </Router>
  );
}

export default App;
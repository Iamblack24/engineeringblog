import React, { useState, useEffect, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import WelcomeOverlay from './components/WelcomeOverlay';
import InstallPrompt from './components/InstallPrompt';
import ScrollToTop from './ScrollToTop';
import { requestForToken, onMessageListener } from './firebase';
import { AuthContext } from './contexts/AuthContext';
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
          <Route path="/about-us" element={<AboutUsPage />} />
          <Route path="/events" element={<EventsPage />} />
          <Route path="/community" element={<CategoriesPage />} />
          <Route path="/community/create-category" element={<CreateCategoryPage />} />
          <Route path="/community/:categoryId" element={<CommunityPage />} />
          <Route path="/community/:categoryId/new-thread" element={<NewThreadPage />} />
          <Route path="/community/:categoryId/threads/:threadId" element={<ThreadDetail />} />
          <Route path="/webinars" element={<WebinarsPage />} />
          <Route path="/educational-resources" element={<EducationalResourcesPage />} />
          <Route path="/terms-of-service" element={<TermsOfService />} />
          <Route path="/privacy-policy" element={<PrivacyPolicy />} />
          <Route path="/tools/pile-design" element={<PileDesignTool />} />
          <Route path="/materials/structural-engineering-flashcards" element={<StructuralEngineeringFlashcards />} />
          <Route path="/materials/hydraulics-summary-notes" element={<HydraulicsSummaryNotes />} />
          <Route path="/materials/concrete-technology-quiz" element={<ConcreteTechnologyQuiz />} />
          <Route path="/materials/geotechnical-engineering-flashcards" element={<GeotechnicalEngineeringFlashcards />} />
          <Route path="/materials/environmental-engineering-summary-notes" element={<EnvironmentalEngineeringSummaryNotes />} />
          <Route path="/materials/transportation-engineering-quiz" element={<TransportationEngineeringQuiz />} />
          <Route path="/materials/structural-analysis-flashcards" element={<StructuralAnalysisFlashcards />} />
          <Route path="/materials/fluid-mechanics-summary-notes" element={<FluidMechanicsSummaryNotes />} />
          <Route path="/materials/steel-structures-quiz" element={<SteelStructuresQuiz />} />
          <Route path="/materials/soil-mechanics-flashcards" element={<SoilMechanicsFlashcards />} />
          <Route path="/materials/water-resources-engineering-summary-notes" element={<WaterResourcesEngineeringSummaryNotes />} />
          <Route path="/pages/materials/public-health-engineering-quiz" element={<PublicHealthEngineeringQuiz />} />
          <Route path="/tools/frame-calculator" element={<FrameCalculator />} />
          <Route path="/tools/matrix-calculator" element={<MatrixCalculator />} />
          <Route path="/tools/stress-strain-generator" element={<StressStrainGenerator />} />
          <Route path="/tools/lcca-tool" element={<LCCATool />} />
          <Route path="/ai-assignment-helper" element={<AIAssignmentHelper />} />
          <Route path="/tools/area-volume-calculator" element={<AreaVolumeCalculator />} />
          <Route path="/tools/carbon-footprint-calculator" element={<CarbonFootprintCalculator />} />
          <Route path="/tools/project-timeline-generator" element={<ProjectTimelineGenerator />} />
          <Route path="/tools/soil-classification-tool" element={<SoilClassificationTool />} />
          <Route path="/tools/water-network-analysis" element={<WaterNetworkAnalysis />} />
          <Route path="/tools/unit-conversion" element={<UnitConverter />} />
          <Route path="/tools/steel-sections" element={<SteelSectionDatabase />} />
          <Route path="/tools/material-selection-tool" element={<MaterialSelectionTool />} />
          <Route path="/materials/engineering-graphics-flashcards" element={<EngineeringGraphicsFlashcards />} />
          <Route path="/materials/construction-management-flashcards" element={<ConstructionManagementFlashcards />} />
          <Route path="/materials/building-services-flashcards" element={<BuildingServicesFlashcards />} />
          <Route path="/materials/surveying-fundamentals-quiz" element={<SurveyingFundamentalsQuiz />} />
          <Route path="/materials/highway-engineering-flashcards" element={<HighwayEngineeringFlashcards />} />
          <Route path="/materials/foundation-design-flashcards" element={<FoundationDesignFlashcards />} />
          <Route path="/materials/construction-materials-quiz" element={<ConstructionMaterialsQuiz />} />
          <Route path="/tools/traverse-calculator" element={<TraverseCalculator />} />
          <Route path="/tools/leveling-calculator" element={<LevelingCalculator />} />
          <Route path="/tools/traffic-analysis" element={<TrafficAnalysisCalculator />} />
          <Route path="/tools/truss-analysis" element={<TrussAnalysisCalculator />} />
          <Route path="/tools/pavement-design" element={<PavementDesignCalculator />} />
          <Route path="/tools/settlement-calculator" element={<SettlementCalculator />} />
          <Route path="/tools/highway-geometric" element={<HighwayGeometricCalculator />} />
          <Route path="/tools/earth-pressure" element={<EarthPressureCalculator />} />
          <Route path="/tools/column-design" element={<ColumnDesignTool />} />
          <Route path="/interactive-ai" element={<AIAssistantPage />} />
          <Route path="/workshops" element={<WorkshopsPage/>} />
          <Route path="/ai-design-optimizer" element={<AIDesignOptimizerPage/>} />
          <Route path="/tools/rainfall-runoff" element={<RainfallRunoffCalculator />} />
          <Route path="/tools/material-quantity" element={<MaterialQuantityCalculator />} />
          <Route path="/tools/construction-cost" element={<ConstructionCostEstimator />} />
        </Routes>
      </main>
      <InstallPrompt />
      <Footer />
    </Router>
  );
}

export default App;
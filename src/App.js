// src/App.js
import React, { useState, useEffect, useContext, Suspense, lazy } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import Loader from './components/Loader';
import WelcomeOverlay from './components/WelcomeOverlay';
import InstallPrompt from './components/InstallPrompt';
import ScrollToTop from './ScrollToTop';
import { requestForToken, onMessageListener } from './firebase';
import { AuthContext } from './contexts/AuthContext';
import './App.css';

// Lazy load components
const HomePage = lazy(() => import('./pages/HomePage'));
const ArticlesPage = lazy(() => import('./pages/ArticlesPage'));
const CaseStudiesPage = lazy(() => import('./pages/CaseStudiesPage'));
const InteractiveToolsPage = lazy(() => import('./pages/InteractiveToolsPage'));
const RevisionMaterialsPage = lazy(() => import('./pages/RevisionMaterialsPage'));
const CareerGuidesPage = lazy(() => import('./pages/CareerGuidesPage'));
const CareerGuideDetail = lazy(() => import('./pages/CareerGuideDetail'));
const SingleArticle = lazy(() => import('./pages/SingleArticle'));
const BeamCalculator = lazy(() => import('./pages/BeamCalculator'));
const ConcreteMixDesignCalculator = lazy(() => import('./pages/ConcreteMixDesignCalculator'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const DesignMaterialsPage = lazy(() => import('./pages/DesignMaterialsPage'));
const SlopeStabilityCalculator = lazy(() => import('./pages/SlopeStabilityCalculator'));
const StructuralLoadCalculator = lazy(() => import('./pages/StructuralLoadCalculator'));
const CaseStudyDetailPage = lazy(() => import('./pages/CaseStudyDetailPage'));
const SoilBearingCapacityCalculator = lazy(() => import('./pages/SoilBearingCapacityCalculator'));
const HydraulicCalculator = lazy(() => import('./pages/HydraulicCalculator'));
const StructuralEngineeringFlashcards = lazy(() => import('./pages/materials/StructuralEngineeringFlashcards'));
const HydraulicsSummaryNotes = lazy(() => import('./pages/materials/HydraulicsSummaryNotes'));
const ConcreteTechnologyQuiz = lazy(() => import('./pages/materials/ConcreteTechnologyQuiz'));
const GeotechnicalEngineeringFlashcards = lazy(() => import('./pages/materials/GeotechnicalEngineeringFlashcards'));
const PileDesignTool = lazy(() => import('./pages/PileDesignTool'));
const EnvironmentalEngineeringSummaryNotes = lazy(() => import('./pages/materials/EnvironmentalEngineeringSummaryNotes'));
const TransportationEngineeringQuiz = lazy(() => import('./pages/materials/TransportationEngineeringQuiz'));
const RetainingWallDesignTool = lazy(() => import('./pages/RetainingWallDesignTool'));
const SteelConnectionDesignTool = lazy(() => import('./pages/SteelConnectionDesignTool'));
const ReinforcedConcreteDesignTool = lazy(() => import('./pages/ReinforcedConcreteDesignTool'));
const DownloadableRevisionMaterialsPage = lazy(() => import('./pages/materials/DownloadableRevisionMaterialsPage'));
const EventsPage = lazy(() => import('./pages/EventsPage'));
const WebinarsPage = lazy(() => import('./pages/WebinarsPage'));
const PrivacyPolicy = lazy(() => import('./pages/PrivacyPolicy'));
const TermsOfService = lazy(() => import('./pages/TermsOfService'));
const AboutUsPage = lazy(() => import('./pages/AboutUsPage'));
const CommunityPage = lazy(() => import('./pages/CommunityPage'));
const ThreadDetail = lazy(() => import('./pages/ThreadDetail'));
const NewThreadPage = lazy(() => import('./pages/NewThreadPage'));
const CategoriesPage = lazy(() => import('./pages/CategoriesPage'));
const CreateCategoryPage = lazy(() => import('./pages/CreateCategoryPage'));
const EducationalResourcesPage = lazy(() => import('./pages/EducationalResourcesPage'));
const StructuralAnalysisFlashcards = lazy(() => import('./pages/materials/StructuralAnalysisFlashcards'));
const FluidMechanicsSummaryNotes = lazy(() => import('./pages/materials/FluidMechanicsSummaryNotes'));
const SteelStructuresQuiz = lazy(() => import('./pages/materials/SteelStructuresQuiz'));
const SoilMechanicsFlashcards = lazy(() => import('./pages/materials/SoilMechanicsFlashcards'));
const WaterResourcesEngineeringSummaryNotes = lazy(() => import('./pages/materials/WaterResourcesEngineeringSummaryNotes'));
const PublicHealthEngineeringQuiz = lazy(() => import('./pages/materials/PublicHealthEngineeringQuiz'));

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
        <Suspense fallback={<Loader />}>
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
          </Routes>
        </Suspense>
      </main>
      <InstallPrompt />
      <Footer />
    </Router>
  );
}

export default App;
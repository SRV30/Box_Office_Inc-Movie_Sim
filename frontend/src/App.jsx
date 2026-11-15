import { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import ErrorBoundary from "./components/ErrorBoundary";
const Register = lazy(() => import("./pages/auth/Register"));
const Login = lazy(() => import("./pages/auth/Login"));

const Dashboard = lazy(() => import("./pages/dashboard/Dashboard"));
const SimulationAnalyticsDashboard = lazy(() => import("./pages/analytics/SimulationAnalyticsDashboard"));

import ProtectedRoute from "./routes/ProtectedRoute";
const Scripts = lazy(() => import("./pages/scripts/Scripts"));
const Writers = lazy(() => import("./pages/writers/Writers"));
const Directors = lazy(() => import("./pages/directors/Directors"));
const Actors = lazy(() => import("./pages/actors/Actors"));
const ComposersHub = lazy(() => import("./pages/talent/ComposersHub"));
const CrewMarket = lazy(() => import("./pages/crew/CrewMarket"));
const OwnedCrew = lazy(() => import("./pages/crew/OwnedCrew"));
const CrewManagementHub = lazy(() => import("./pages/crew/CrewManagementHub"));
const ActiveMovies = lazy(() => import("./pages/movies/ActiveMovies"));
const CreateMovie = lazy(() => import("./pages/movies/CreateMovie"));
const MovieDetails = lazy(() => import("./pages/movies/MovieDetails"));
const MarketingStrategies = lazy(() => import("./pages/movies/MarketingStrategies"));
const SocialMediaHub = lazy(() => import("./pages/marketing/SocialMediaHub"));
const ReadyForRelease = lazy(() => import("./pages/movies/ReadyForRelease"));
const ReleaseResult = lazy(() => import("./pages/movies/ReleaseResult"));
const MovieLibrary = lazy(() => import("./pages/movies/MovieLibrary"));
const ReleasedMovieDetail = lazy(() => import("./pages/movies/ReleasedMovieDetail"));
const ReviewDashboard = lazy(() => import("./pages/movies/ReviewDashboard"));
const ProductionQueue = lazy(() => import("./pages/movies/ProductionQueue"));
const MovieComparison = lazy(() => import("./pages/movies/MovieComparison"));
const StreamingDeals = lazy(() => import("./pages/movies/StreamingDeals"));
const StreamingBiddingHall = lazy(() => import("./pages/streaming/StreamingBiddingHall"));
const StreamingPlatformManager = lazy(() => import("./pages/streaming/StreamingPlatformManager"));
const RegionalBoxOfficeHub = lazy(() => import("./pages/movies/RegionalBoxOfficeHub"));
const CinemaMarketsHub = lazy(() => import("./pages/movies/CinemaMarketsHub"));
const TVShowsHub = lazy(() => import("./pages/tvshows/TVShowsHub"));
const ProduceTVShow = lazy(() => import("./pages/tvshows/ProduceTVShow"));
const TVShowDetailView = lazy(() => import("./pages/tvshows/TVShowDetailView"));
const StudioStats = lazy(() => import("./pages/studio/StudioStats"));
const FinancialHistory = lazy(() => import("./pages/studio/FinancialHistory"));
const FinancialForecast = lazy(() => import("./pages/studio/FinancialForecast"));
const MerchDashboard = lazy(() => import("./pages/merch/MerchDashboard"));
const MerchandiseEconomyHub = lazy(() => import("./pages/merch/MerchandiseEconomyHub"));
const AwardsHistory = lazy(() => import("./pages/studio/AwardsHistory"));
const AwardsCampaign = lazy(() => import("./pages/awards/AwardsCampaign"));
const MarketDashboard = lazy(() => import("./pages/dashboard/MarketDashboard"));
const Franchises = lazy(() => import("./pages/studio/Franchises"));
const FranchiseDetail = lazy(() => import("./pages/studio/FranchiseDetail"));
const FranchiseUniverseHub = lazy(() => import("./pages/studio/FranchiseUniverseHub"));
const Leaderboard = lazy(() => import("./pages/studio/Leaderboard"));
const HistoricRecords = lazy(() => import("./pages/studio/HistoricRecords"));
const FanClubHub = lazy(() => import("./pages/studio/FanClubHub"));
const TalentProfile = lazy(() => import("./pages/talent/TalentProfile"));
const TalentContractsManager = lazy(() => import("./pages/talent/TalentContractsManager"));
const DirectorProfile = lazy(() => import("./pages/directors/DirectorProfile"));
const WriterProfile = lazy(() => import("./pages/writers/WriterProfile"));
const Notifications = lazy(() => import("./pages/notifications/Notifications"));
const Settings = lazy(() => import("./pages/settings/Settings"));
const AuthMonitoring = lazy(() => import("./pages/auth/AuthMonitoring"));
const NewsFeed = lazy(() => import("./pages/news/NewsFeed"));
const NewsDetail = lazy(() => import("./pages/news/NewsDetail"));
import Toast from "./components/common/Toast";
const RivalStudios = lazy(() => import("./pages/rivals/RivalStudios"));
const RivalIntelligence = lazy(() => import("./pages/rivals/RivalIntelligence"));
const TalentAcademy = lazy(() => import("./pages/talent/TalentAcademy"));
const TrophyRoom = lazy(() => import("./pages/awards/TrophyRoom"));
const AwardsSeasonDashboard = lazy(() => import("./pages/awards/AwardsSeasonDashboard"));
const StudioUpgrades = lazy(() => import("./pages/studio/StudioUpgrades"));
const UnionManager = lazy(() => import("./pages/studio/UnionManager"));
const TalentRelationshipsHub = lazy(() => import("./pages/talent/TalentRelationshipsHub"));
const PRCrisisCenter = lazy(() => import("./pages/studio/PRCrisisCenter"));
const CelebrityScandalHub = lazy(() => import("./pages/studio/CelebrityScandalHub"));
const FacilityManager = lazy(() => import("./pages/studio/FacilityManager"));
const SyndicationManager = lazy(() => import("./pages/studio/SyndicationManager"));
const FestivalCircuit = lazy(() => import("./pages/studio/FestivalCircuit"));
const StudioHQ = lazy(() => import("./pages/studio/StudioHQ"));
const AgencyPackagingHub = lazy(() => import("./pages/talent/AgencyPackagingHub"));
import { TutorialProvider } from "./context/TutorialContext";
import TutorialGuideOverlay from "./components/tutorial/TutorialGuideOverlay";


function RouteLoadingFallback() {
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-300">
      <div className="h-10 w-10 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin mb-4" />
      <p className="text-sm font-medium tracking-wide text-slate-400">Loading module...</p>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <TutorialProvider>
          <TutorialGuideOverlay />
          <Suspense fallback={<RouteLoadingFallback />}>
          <Routes>
        <Route path="/register" element={<Register />} />

        <Route path="/login" element={<Login />} />

        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rivals"
          element={
            <ProtectedRoute>
              <RivalStudios />
            </ProtectedRoute>
          }
        />
        <Route
          path="/rivals/intelligence"
          element={
            <ProtectedRoute>
              <RivalIntelligence />
            </ProtectedRoute>
          }
        />
        <Route
          path="/leaderboard"
          element={
            <ProtectedRoute>
              <Leaderboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/records"
          element={
            <ProtectedRoute>
              <HistoricRecords />
            </ProtectedRoute>
          }
        />
        <Route
          path="/analytics"
          element={
            <ProtectedRoute>
              <SimulationAnalyticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/reports"
          element={
            <ProtectedRoute>
              <SimulationAnalyticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/simulation/analytics"
          element={
            <ProtectedRoute>
              <SimulationAnalyticsDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hq"
          element={
            <ProtectedRoute>
              <StudioHQ />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/hq"
          element={
            <ProtectedRoute>
              <StudioHQ />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/:id"
          element={
            <ProtectedRoute>
              <MovieDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/:id/marketing"
          element={
            <ProtectedRoute>
              <MarketingStrategies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/marketing/social"
          element={
            <ProtectedRoute>
              <SocialMediaHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/ready"
          element={
            <ProtectedRoute>
              <ReadyForRelease />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/telemetry"
          element={
            <ProtectedRoute>
              <RegionalBoxOfficeHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/cinema-markets"
          element={
            <ProtectedRoute>
              <CinemaMarketsHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/:id/results"
          element={
            <ProtectedRoute>
              <ReleaseResult />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/:id/streaming-deals"
          element={
            <ProtectedRoute>
              <StreamingDeals />
            </ProtectedRoute>
          }
        />
        <Route
          path="/streaming/auctions"
          element={
            <ProtectedRoute>
              <StreamingBiddingHall />
            </ProtectedRoute>
          }
        />
        <Route
          path="/streaming/platform"
          element={
            <ProtectedRoute>
              <StreamingPlatformManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/library"
          element={
            <ProtectedRoute>
              <MovieLibrary />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/library/:id"
          element={
            <ProtectedRoute>
              <ReleasedMovieDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/library/:id/reviews"
          element={
            <ProtectedRoute>
              <ReviewDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/queue"
          element={
            <ProtectedRoute>
              <ProductionQueue />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/comparison"
          element={
            <ProtectedRoute>
              <MovieComparison />
            </ProtectedRoute>
          }
        />

        <Route
          path="/movies"
          element={
            <ProtectedRoute>
              <ActiveMovies />
            </ProtectedRoute>
          }
        />
        <Route
          path="/movies/create"
          element={
            <ProtectedRoute>
              <CreateMovie />
            </ProtectedRoute>
          }
        />

        <Route
          path="/scripts"
          element={
            <ProtectedRoute>
              <Scripts />
            </ProtectedRoute>
          }
        />
        <Route
          path="/writers"
          element={
            <ProtectedRoute>
              <Writers />
            </ProtectedRoute>
          }
        />

        <Route
          path="/writers/:writerId/profile"
          element={
            <ProtectedRoute>
              <WriterProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/actors"
          element={
            <ProtectedRoute>
              <Actors />
            </ProtectedRoute>
          }
        />
        <Route
          path="/composers"
          element={
            <ProtectedRoute>
              <ComposersHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/directors"
          element={
            <ProtectedRoute>
              <Directors />
            </ProtectedRoute>
          }
        />

        <Route
          path="/directors/:id"
          element={
            <ProtectedRoute>
              <DirectorProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/talent/contracts"
          element={
            <ProtectedRoute>
              <TalentContractsManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/talent/relationships"
          element={
            <ProtectedRoute>
              <TalentRelationshipsHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/talent/academy"
          element={
            <ProtectedRoute>
              <TalentAcademy />
            </ProtectedRoute>
          }
        />
        <Route
          path="/talent/:type/:id"
          element={
            <ProtectedRoute>
              <TalentProfile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/crew"
          element={
            <ProtectedRoute>
              <CrewMarket />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crew/hub"
          element={
            <ProtectedRoute>
              <CrewManagementHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/crew/owned"
          element={
            <ProtectedRoute>
              <OwnedCrew />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tv-shows"
          element={
            <ProtectedRoute>
              <TVShowsHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tv-shows/:id"
          element={
            <ProtectedRoute>
              <TVShowDetailView />
            </ProtectedRoute>
          }
        />
        <Route
          path="/tv-shows/commission"
          element={
            <ProtectedRoute>
              <ProduceTVShow />
            </ProtectedRoute>
          }
        />

        <Route
          path="/studio/stats"
          element={
            <ProtectedRoute>
              <StudioStats />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/history"
          element={
            <ProtectedRoute>
              <FinancialHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/forecast"
          element={
            <ProtectedRoute>
              <FinancialForecast />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/fanclub"
          element={
            <ProtectedRoute>
              <FanClubHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/merchandise"
          element={
            <ProtectedRoute>
              <MerchDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/merchandise-economy"
          element={
            <ProtectedRoute>
              <MerchandiseEconomyHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/awards"
          element={
            <ProtectedRoute>
              <AwardsHistory />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/upgrades"
          element={
            <ProtectedRoute>
              <StudioUpgrades />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/union"
          element={
            <ProtectedRoute>
              <UnionManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/crisis"
          element={
            <ProtectedRoute>
              <PRCrisisCenter />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/scandals"
          element={
            <ProtectedRoute>
              <CelebrityScandalHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/facilities"
          element={
            <ProtectedRoute>
              <FacilityManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/talent/agencies"
          element={
            <ProtectedRoute>
              <AgencyPackagingHub />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/syndication"
          element={
            <ProtectedRoute>
              <SyndicationManager />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/festivals"
          element={
            <ProtectedRoute>
              <FestivalCircuit />
            </ProtectedRoute>
          }
        />
        <Route
          path="/market"
          element={
            <ProtectedRoute>
              <MarketDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/franchises"
          element={
            <ProtectedRoute>
              <Franchises />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/franchises/:id"
          element={
            <ProtectedRoute>
              <FranchiseDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/studio/universe-v2"
          element={
            <ProtectedRoute>
              <FranchiseUniverseHub />
            </ProtectedRoute>
          }
        />

        <Route
          path="/notifications"
          element={
            <ProtectedRoute>
              <Notifications />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news"
          element={
            <ProtectedRoute>
              <NewsFeed />
            </ProtectedRoute>
          }
        />
        <Route
          path="/news/:id"
          element={
            <ProtectedRoute>
              <NewsDetail />
            </ProtectedRoute>
          }
        />
        <Route
          path="/auth-monitoring"
          element={
            <ProtectedRoute>
              <AuthMonitoring />
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route
          path="/awards/trophy-room"
          element={
            <ProtectedRoute>
              <TrophyRoom />
            </ProtectedRoute>
          }
        />
        {/* <Route
          path="/awards/lobbying/:id"
          element={
            <ProtectedRoute>
              <AwardsCampaign />
            </ProtectedRoute>
          }
        /> */}
        <Route
          path="/awards/season"
          element={
            <ProtectedRoute>
              <AwardsSeasonDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
          </Suspense>
      <Toast />
      </TutorialProvider>
    </ErrorBoundary>
  </BrowserRouter>

  );
}

export default App;

// src/App.tsx
import { Globe, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import "./App.css";
import { CityGlobe } from "./components/CityGlobe";
import PerceptionForm from "./components/Form/PopulationPerceptionForm";
import { dbInitializer } from "./services/dbInitializer";
import type { CityWithPerceptions } from "./types";

const App = () => {
  const [showGlobe, setShowGlobe] = useState(false);
  const [citiesWithPerceptions, setCitiesWithPerceptions] = useState<
    CityWithPerceptions[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasEstimated, setHasEstimated] = useState(() => {
    return localStorage.getItem('hasEstimated') === 'true';
  });

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        await dbInitializer.initializeDatabase();
        if (showGlobe) {
          await loadCityData();
        }
      } catch (err) {
        setError(
          "Failed to initialize the application. Please refresh the page."
        );
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, [showGlobe]);

  // Update localStorage when hasEstimated changes
  useEffect(() => {
    localStorage.setItem('hasEstimated', hasEstimated.toString());
  }, [hasEstimated]);

  const loadCityData = async () => {
    try {
      setLoading(true);
      const { cities } = await dbInitializer.getDatabaseState();

      if (cities.length === 0) {
        setError("No city data available. Please try refreshing the page.");
        return;
      }

      setCitiesWithPerceptions(cities);
    } catch (err) {
      setError("Failed to load city data. Please try refreshing the page.");
      console.error("Data loading error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleFormSubmitted = async () => {
    try {
      await loadCityData();
      setHasEstimated(true);
      setShowGlobe(true);
    } catch (err) {
      setError("Failed to load updated city data. Please try again.");
      console.error("Form submission error:", err);
    }
  };

  const skipToGlobe = async () => {
    try {
      await loadCityData();
      setShowGlobe(true);
    } catch (err) {
      setError("Failed to load city data. Please try again.");
      console.error("Skip to globe error:", err);
    }
  };

  return (
    <div className={`App ${showGlobe ? 'globe-mode' : ''}`}>
      {!showGlobe && (
        <header className="app-header">
          <h1 className="app-title">How Big Are Cities?</h1>
          <p className="app-description">
            PopGlobe is an interactive tool about population perception. Estimate the population of
            cities around the world and see how your perceptions compare to reality and to those of others.
          </p>
          <div className="app-icon">
            <div className="globe-icon-wrapper">
              <span role="img" aria-label="Globe">🌍</span>
              <Sparkles className="sparkles" size={20} />
            </div>
          </div>
          <div className="skip-container">
            <button onClick={skipToGlobe} className="skip-to-globe">
              <Globe size={16} />
              <span>Skip to Globe View</span>
            </button>
          </div>
        </header>
      )}

      <main className="app-content fullscreen">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
            <p className="loading-text">Loading world data...</p>
          </div>
        ) : error ? (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        ) : !showGlobe ? (
          <PerceptionForm onSubmitSuccess={handleFormSubmitted} />
        ) : (
          <div className="globe-view">
            <CityGlobe
              cities={citiesWithPerceptions}
              onCitySelect={(city) => console.log("Selected city:", city)}
              hasEstimated={hasEstimated}
            />
            <div className="button-container">
              <button
                onClick={() => setShowGlobe(false)}
                className={`submit-new-estimates ${!hasEstimated ? 'emphasize' : ''}`}
              >
                <Globe size={18} />
                <span>{hasEstimated ? "Estimate More Cities" : "Add Your Estimates"}</span>
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
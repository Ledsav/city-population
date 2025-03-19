// src/App.tsx
import { useEffect, useState } from "react";
import "./App.css";
import { CityGlobe } from "./components/CityGlobe";
import PopulationPerceptionForm from "./components/Form/PopulationPerceptionForm";
import { dbInitializer } from "./services/dbInitializer";
import type { CityWithPerceptions } from "./types";

const App = () => {
  const [showGlobe, setShowGlobe] = useState(false);
  const [citiesWithPerceptions, setCitiesWithPerceptions] = useState<
    CityWithPerceptions[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setShowGlobe(true);
    } catch (err) {
      setError("Failed to load updated city data. Please try again.");
      console.error("Form submission error:", err);
    }
  };

  return (
    <div className={`App ${showGlobe ? 'globe-mode' : ''}`}>
      {!showGlobe && (
        <header className="app-header">
          <h1 className="app-title">3D City Population Globe</h1>
          <p className="app-description">
            Help us understand how people perceive city populations by sharing your estimates.
          </p>
        </header>
      )}

      <main className={`app-content ${showGlobe ? 'fullscreen' : ''}`}>
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        ) : !showGlobe ? (
          <PopulationPerceptionForm onSubmitSuccess={handleFormSubmitted} />
        ) : (
          <div className="globe-view">
            <CityGlobe
              cities={citiesWithPerceptions}
              onCitySelect={(city) => console.log("Selected city:", city)}
            />
            <div className="button-container">
              <button
                onClick={() => setShowGlobe(false)}
                className="submit-new-estimates"
              >
                Submit New Estimates
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
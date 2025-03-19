// src/AppDevelopment.tsx
import { useEffect, useState } from "react";
import "../App.css";
import { CityGlobe } from "../components/CityGlobe";
import { dbInitializer } from "../services/dbInitializer";
import type { CityWithPerceptions } from "../types";

/**
 * Development version of the App component that skips the questionnaire.
 * This component immediately loads city data and displays the globe visualization.
 */
const AppDevelopment = () => {
  const [citiesWithPerceptions, setCitiesWithPerceptions] = useState<CityWithPerceptions[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initializeApp = async () => {
      try {
        setLoading(true);
        // Initialize the database with default data
        await dbInitializer.initializeDatabase();
        await loadCityData();
      } catch (err) {
        setError("Failed to initialize the application. Please refresh the page.");
        console.error("Initialization error:", err);
      } finally {
        setLoading(false);
      }
    };

    initializeApp();
  }, []);

  const loadCityData = async () => {
    try {
      const { cities } = await dbInitializer.getDatabaseState();

      if (cities.length === 0) {
        setError("No city data available. Please try refreshing the page.");
        return;
      }

      setCitiesWithPerceptions(cities);
    } catch (err) {
      setError("Failed to load city data. Please try refreshing the page.");
      console.error("Data loading error:", err);
    }
  };

  // Optionally reload data (useful during development)
  const handleReloadData = async () => {
    try {
      setLoading(true);
      // Reset the database to get fresh data
      await dbInitializer.reset();
      await loadCityData();
    } catch (err) {
      setError("Failed to reload data. Please try refreshing the page.");
      console.error("Reload error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App globe-mode">
      <main className="app-content fullscreen">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        ) : (
          <div className="globe-view">
            <CityGlobe
              cities={citiesWithPerceptions}
              onCitySelect={(city) => console.log("Selected city:", city)}
            />
            <div className="button-container">
              <button
                onClick={handleReloadData}
                className="submit-new-estimates"
                style={{ marginRight: '8px' }}
              >
                Reload Data
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AppDevelopment;
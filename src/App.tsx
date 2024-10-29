// src/App.tsx
import React, { useState, useEffect } from "react";
import { CityMap } from "./components/CityMap/CityMap";
import PopulationPerceptionForm from "./components/Form/PopulationPerceptionForm";
import { dbInitializer } from "./services/dbInitializer";
import type { CityWithPerceptions } from "./types";
import "./App.css";

const App = () => {
  const [showMap, setShowMap] = useState(false);
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
        if (showMap) {
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
  }, [showMap]);

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
      setShowMap(true);
    } catch (err) {
      setError("Failed to load updated city data. Please try again.");
      console.error("Form submission error:", err);
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1 className="app-title">City Population Perception Map</h1>
        <p className="app-description">
          {!showMap
            ? "Help us understand how people perceive city populations by sharing your estimates."
            : "Explore how people perceive city populations around the world and compare their estimates with actual numbers."}
        </p>
      </header>

      <main className="app-content">
        {loading ? (
          <div className="loading-state">
            <div className="loading-spinner"></div>
          </div>
        ) : error ? (
          <div className="error-message">
            <span>⚠️</span>
            <p>{error}</p>
          </div>
        ) : !showMap ? (
          <PopulationPerceptionForm onSubmitSuccess={handleFormSubmitted} />
        ) : (
          <div>
            <CityMap
              cities={citiesWithPerceptions}
              onCitySelect={(city) => console.log("Selected city:", city)}
            />
            <div className="button-container">
              <button
                onClick={() => setShowMap(false)}
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

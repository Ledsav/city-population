import React, { useState, useEffect } from "react";
import { City, UserDemographics } from "@/types";
import { Building2, Users, ChevronLeft, ChevronRight } from "lucide-react";
import { db } from "../../services/db";
import "./PopulationPerceptionForm.css";

type PopulationPerceptionFormProps = {
  onSubmitSuccess: () => void;
};

const PopulationPerceptionForm: React.FC<PopulationPerceptionFormProps> = ({
  onSubmitSuccess,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [currentCityIndex, setCurrentCityIndex] = useState(0);
  const [perceptions, setPerceptions] = useState<Record<string, number>>({});
  const [demographics, setDemographics] = useState<UserDemographics>({});
  const [showDemographics, setShowDemographics] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadCities = async () => {
      try {
        await db.init();
        const loadedCities = await db.getCities();
        setCities(loadedCities);
      } catch (error) {
        console.error("Failed to load cities:", error);
      } finally {
        setLoading(false);
      }
    };

    loadCities();
  }, []);

  const currentCity = cities[currentCityIndex];

  const handlePopulationInput = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, "");
    setPerceptions((prev) => ({
      ...prev,
      [currentCity.id]: numValue ? parseInt(numValue) : 0,
    }));

    if (formErrors[currentCity.id]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[currentCity.id];
        return newErrors;
      });
    }
  };

  const formatPopulation = (value: number | string): string => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};
    if (!perceptions[currentCity.id]) {
      errors[currentCity.id] = "Please provide an estimate for this city";
    } else if (perceptions[currentCity.id] <= 0) {
      errors[currentCity.id] = "Population must be greater than 0";
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    if (currentCityIndex < cities.length - 1) {
      setCurrentCityIndex((prev) => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentCityIndex > 0) {
      setCurrentCityIndex((prev) => prev - 1);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;

    setSubmitting(true);
    try {
      await Promise.all(
        Object.entries(perceptions).map(([cityId, estimatedPopulation]) =>
          db.addPerception({
            cityId,
            estimatedPopulation,
            userDemographics: demographics,
            confidenceLevel: 3,
            timestamp: new Date().toISOString(),
          })
        )
      );
      onSubmitSuccess();
    } catch (error) {
      console.error("Failed to submit perceptions:", error);
      setFormErrors({
        submit: "Failed to submit estimates. Please try again.",
      });
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="form-container">
        <div className="form-card">
          <div className="loading-state">
            <div className="loading-spinner" />
            <div className="loading-text">Loading cities...</div>
          </div>
        </div>
      </div>
    );
  }

  if (showDemographics) {
    return (
      <div className="form-container">
        <div className="form-card">
          <div className="demographics-form">
            <h2 className="demographics-title">Before We Start</h2>
            <p className="demographics-subtitle">
              Help us understand your perspective better
            </p>

            <div className="select-group">
              <label className="select-label">Age Range</label>
              <select
                className="demographics-select"
                value={demographics.ageRange || ""}
                onChange={(e) =>
                  setDemographics((prev) => ({
                    ...prev,
                    ageRange: e.target.value,
                  }))
                }
              >
                <option value="">Select your age range</option>
                <option value="18-24">18-24 years</option>
                <option value="25-34">25-34 years</option>
                <option value="35-44">35-44 years</option>
                <option value="45-54">45-54 years</option>
                <option value="55+">55+ years</option>
              </select>
            </div>

            <div className="select-group">
              <label className="select-label">Living Environment</label>
              <select
                className="demographics-select"
                value={demographics.urbanResidency ? "urban" : "rural"}
                onChange={(e) =>
                  setDemographics((prev) => ({
                    ...prev,
                    urbanResidency: e.target.value === "urban",
                  }))
                }
              >
                <option value="">Select your environment</option>
                <option value="urban">Urban Area</option>
                <option value="rural">Rural Area</option>
              </select>
            </div>

            <button
              className="start-button"
              onClick={() => setShowDemographics(false)}
            >
              Start Estimating Populations
            </button>
          </div>
        </div>
      </div>
    );
  }

  const progress = ((currentCityIndex + 1) / cities.length) * 100;

  return (
    <div className="form-container">
      <div className="form-card">
        <div className="progress-bar">
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
        <div className="progress-text">
          City {currentCityIndex + 1} of {cities.length}
        </div>

        <div className="city-info">
          <div className="city-icon-wrapper">
            <Building2 size={24} color="#2563eb" />
          </div>
          <h2 className="city-name">{currentCity.name}</h2>
          <p className="city-country">{currentCity.country}</p>
        </div>

        <div className="input-group">
          <label className="input-label">
            What's your population estimate?
          </label>
          <div className="input-wrapper">
            <Users className="input-icon" size={20} />
            <input
              type="text"
              value={formatPopulation(perceptions[currentCity.id] || "")}
              onChange={(e) => handlePopulationInput(e.target.value)}
              className={`population-input ${
                formErrors[currentCity.id] ? "error" : ""
              }`}
              placeholder="Enter population estimate"
            />
          </div>
          {formErrors[currentCity.id] && (
            <p className="error-message">{formErrors[currentCity.id]}</p>
          )}
        </div>

        <div className="navigation">
          <button
            onClick={handlePrevious}
            disabled={currentCityIndex === 0}
            className="nav-button button-prev"
          >
            <ChevronLeft size={20} />
            Previous
          </button>

          {currentCityIndex === cities.length - 1 ? (
            <button
              onClick={handleSubmit}
              disabled={submitting || !perceptions[currentCity.id]}
              className="nav-button button-submit"
            >
              {submitting ? "Submitting..." : "Submit All"}
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!perceptions[currentCity.id]}
              className="nav-button button-next"
            >
              Next
              <ChevronRight size={20} />
            </button>
          )}
        </div>

        {formErrors.submit && (
          <p className="error-message">{formErrors.submit}</p>
        )}
      </div>
    </div>
  );
};

export default PopulationPerceptionForm;

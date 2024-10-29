import React, { useState, useEffect } from "react";
import { City, UserDemographics } from "@/types";
import { db } from "../../services/db";
import "./PopulationPerceptionForm.css";

type PopulationPerceptionFormProps = {
  onSubmitSuccess: () => void;
};

const PopulationPerceptionForm: React.FC<PopulationPerceptionFormProps> = ({
  onSubmitSuccess,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [perceptions, setPerceptions] = useState<Record<string, number>>({});
  const [demographics, setDemographics] = useState<UserDemographics>({});
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

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

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Ensure all cities have estimates
    cities.forEach((city) => {
      if (!perceptions[city.id]) {
        errors[city.id] = "Please provide an estimate for this city";
      } else if (perceptions[city.id] <= 0) {
        errors[city.id] = "Population must be greater than 0";
      }
    });

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handlePerceptionChange = (cityId: string, value: string) => {
    const numValue = parseInt(value.replace(/[^0-9]/g, ""), 10);
    setPerceptions((prev) => ({
      ...prev,
      [cityId]: isNaN(numValue) ? 0 : numValue,
    }));

    // Clear error for this city if it exists
    if (formErrors[cityId]) {
      setFormErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[cityId];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setSubmitting(true);

    try {
      // Submit each perception to IndexedDB
      await Promise.all(
        Object.entries(perceptions).map(([cityId, estimatedPopulation]) =>
          db.addPerception({
            cityId,
            estimatedPopulation,
            userDemographics: demographics,
            confidenceLevel: 3, // Default confidence level
            timestamp: new Date().toISOString(),
          })
        )
      );

      // Show success message briefly before transitioning to map
      setTimeout(() => {
        onSubmitSuccess();
      }, 1000);
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
      <div className="loading-container">
        <div className="loading-text">Loading cities...</div>
      </div>
    );
  }

  return (
    <div className="perception-form-container">
      <form onSubmit={handleSubmit} className="form-grid">
        {/* Demographics Section */}
        <div className="form-section">
          <h3 className="form-section-title">About You (Optional)</h3>
          <div className="form-grid">
            <div className="form-field">
              <label className="form-label">Age Range</label>
              <select
                className="form-select"
                value={demographics.ageRange || ""}
                onChange={(e) =>
                  setDemographics((prev) => ({
                    ...prev,
                    ageRange: e.target.value,
                  }))
                }
              >
                <option value="">Select age range</option>
                <option value="18-24">18-24</option>
                <option value="25-34">25-34</option>
                <option value="35-44">35-44</option>
                <option value="45-54">45-54</option>
                <option value="55+">55+</option>
              </select>
            </div>

            <div className="form-field">
              <label className="form-label">
                Do you live in an urban area?
              </label>
              <select
                className="form-select"
                value={demographics.urbanResidency ? "yes" : "no"}
                onChange={(e) =>
                  setDemographics((prev) => ({
                    ...prev,
                    urbanResidency: e.target.value === "yes",
                  }))
                }
              >
                <option value="">Select option</option>
                <option value="yes">Yes</option>
                <option value="no">No</option>
              </select>
            </div>
          </div>
        </div>

        {/* City Estimates Section */}
        <div className="form-section">
          <h3 className="form-section-title">City Population Estimates</h3>
          <div className="city-estimates">
            {cities.map((city) => (
              <div key={city.id} className="city-estimate">
                <label className="city-name">
                  {city.name}, {city.country}
                </label>
                <input
                  type="text"
                  className={`form-input ${formErrors[city.id] ? "error" : ""}`}
                  placeholder="Enter estimated population"
                  value={perceptions[city.id] || ""}
                  onChange={(e) =>
                    handlePerceptionChange(city.id, e.target.value)
                  }
                  pattern="[0-9]*"
                />
                {formErrors[city.id] && (
                  <p className="error-message">{formErrors[city.id]}</p>
                )}
              </div>
            ))}
          </div>
        </div>

        {formErrors.submit && (
          <div className="form-error">{formErrors.submit}</div>
        )}

        <button type="submit" disabled={submitting} className="submit-button">
          {submitting ? "Submitting..." : "Submit Estimates"}
        </button>
      </form>
    </div>
  );
};

export default PopulationPerceptionForm;

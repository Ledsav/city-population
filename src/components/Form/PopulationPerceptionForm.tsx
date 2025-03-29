import { City } from "@/types";
import { CheckCircle, ChevronLeft, ChevronRight, Globe, MapPin, Shield, Users } from "lucide-react";
import React, { useEffect, useState } from "react";
import { db } from "../../services/db";
import "./PopulationPerceptionForm.css";

type PerceptionFormProps = {
  onSubmitSuccess: () => void;
};

const PerceptionForm: React.FC<PerceptionFormProps> = ({
  onSubmitSuccess,
}) => {
  const [cities, setCities] = useState<City[]>([]);
  const [selectedCities, setSelectedCities] = useState<Set<string>>(new Set());
  const [estimations, setEstimations] = useState<Record<string, number>>({});
  const [confidenceLevels, setConfidenceLevels] = useState<Record<string, number>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"selection" | "estimation">("selection");
  const [currentEstimatingIndex, setCurrentEstimatingIndex] = useState(0);
  
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

  const toggleCitySelection = (cityId: string) => {
    const newSelectedCities = new Set(selectedCities);
    
    if (newSelectedCities.has(cityId)) {
      newSelectedCities.delete(cityId);
      
      // Remove estimations when deselecting a city
      const newEstimations = { ...estimations };
      delete newEstimations[cityId];
      setEstimations(newEstimations);
      
      const newConfidenceLevels = { ...confidenceLevels };
      delete newConfidenceLevels[cityId];
      setConfidenceLevels(newConfidenceLevels);
    } else {
      newSelectedCities.add(cityId);
    }
    
    setSelectedCities(newSelectedCities);
  };
  
  const handleSelectAllCities = () => {
    if (selectedCities.size === cities.length) {
      // Deselect all
      setSelectedCities(new Set());
      setEstimations({});
      setConfidenceLevels({});
    } else {
      // Select all
      const allCityIds = cities.map(city => city.id);
      setSelectedCities(new Set(allCityIds));
    }
  };
  
  const startEstimating = () => {
    if (selectedCities.size > 0) {
      setViewMode("estimation");
      setCurrentEstimatingIndex(0);
    }
  };
  
  const handlePopulationInput = (cityId: string, value: string) => {
    const numValue = value.replace(/[^0-9]/g, "");
    const numericValue = numValue ? parseInt(numValue) : 0;
    
    setEstimations(prev => ({
      ...prev,
      [cityId]: numericValue
    }));
    
    // Clear error if input is valid
    if (numericValue > 0 && errors[cityId]) {
      const newErrors = { ...errors };
      delete newErrors[cityId];
      setErrors(newErrors);
    }
  };
  
  const setConfidenceLevel = (cityId: string, level: number) => {
    setConfidenceLevels(prev => ({
      ...prev,
      [cityId]: level
    }));
  };
  
  const formatPopulation = (value: number | undefined): string => {
    if (!value) return "";
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  };
  
  const validateCurrentEstimation = () => {
    const selectedCitiesArray = Array.from(selectedCities);
    if (currentEstimatingIndex >= selectedCitiesArray.length) return true;
    
    const currentCityId = selectedCitiesArray[currentEstimatingIndex];
    const currentEstimation = estimations[currentCityId];
    
    if (!currentEstimation || currentEstimation <= 0) {
      setErrors({
        ...errors,
        [currentCityId]: "Please enter a valid population estimate"
      });
      return false;
    }
    
    return true;
  };
  
  const handleNextCity = () => {
    if (!validateCurrentEstimation()) return;
    
    const selectedCitiesArray = Array.from(selectedCities);
    if (currentEstimatingIndex < selectedCitiesArray.length - 1) {
      setCurrentEstimatingIndex(prev => prev + 1);
    }
  };
  
  const handlePreviousCity = () => {
    if (currentEstimatingIndex > 0) {
      setCurrentEstimatingIndex(prev => prev - 1);
    }
  };
  
  const handleSubmit = async () => {
    if (!validateCurrentEstimation()) return;
    
    // Check if all selected cities have estimations
    const selectedCitiesArray = Array.from(selectedCities);
    const missingEstimations = selectedCitiesArray.filter(cityId => !estimations[cityId]);
    
    if (missingEstimations.length > 0) {
      alert(`Please complete your estimations for all selected cities.`);
      return;
    }
    
    setSubmitting(true);
    try {
      await Promise.all(
        selectedCitiesArray.map(cityId => 
          db.addPerception({
            cityId,
            estimatedPopulation: estimations[cityId],
            confidenceLevel: confidenceLevels[cityId] || 3, // Default to medium confidence
            timestamp: new Date().toISOString(),
          })
        )
      );
      onSubmitSuccess();
    } catch (error) {
      console.error("Failed to submit estimations:", error);
      setErrors({
        submit: "Failed to submit your estimations. Please try again."
      });
    } finally {
      setSubmitting(false);
    }
  };
  
  const goBackToSelection = () => {
    setViewMode("selection");
  };
  
  if (loading) {
    return (
      <div className="simple-form-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p className="loading-text">Loading cities from around the world...</p>
        </div>
      </div>
    );
  }
  
  if (viewMode === "selection") {
    return (
      <div className="simple-form-container">
        <div className="form-header">
          <h2 className="form-title">Choose Your Cities</h2>
          <p className="form-subtitle">
            Select the cities you want to estimate. How many people do you think live in each of these places?
          </p>
        </div>
        
        <div className="city-selection"> 
          <div className="cities-grid">
            {cities.map(city => (
              <div 
                key={city.id}
                className={`city-card ${selectedCities.has(city.id) ? 'selected' : ''} ${estimations[city.id] ? 'estimated' : ''}`}
                onClick={() => toggleCitySelection(city.id)}
              >
                <h3 className="city-name">{city.name}</h3>
                <p className="city-country">{city.country}</p>
                
                {selectedCities.has(city.id) && !estimations[city.id] && (
                  <CheckCircle size={20} className="checkmark" />
                )}
                
                {estimations[city.id] && (
                  <span className="estimated-badge">Estimated</span>
                )}
              </div>
            ))}
          </div>
          
          <div className="selection-actions">
            <button className="select-all-btn" onClick={handleSelectAllCities}>
              {selectedCities.size === cities.length ? 'Deselect All' : 'Select All Cities'}
            </button>
          </div>
        </div>
        
        <div className="form-actions">
          
          
          <button 
            className="submit-btn" 
            disabled={selectedCities.size === 0} 
            onClick={startEstimating}
          >
            {selectedCities.size === 0 ? 'Select Cities to Continue' : `Estimate ${selectedCities.size} ${selectedCities.size === 1 ? 'City' : 'Cities'}`}
          </button>
        </div>
      </div>
    );
  }
  
  // Estimation view
  const selectedCitiesArray = Array.from(selectedCities);
  const currentCityId = selectedCitiesArray[currentEstimatingIndex];
  const currentCity = cities.find(city => city.id === currentCityId);
  
  if (!currentCity) return null;
  
  const progressPercentage = ((currentEstimatingIndex + 1) / selectedCitiesArray.length) * 100;
  
  return (
    <div className="simple-form-container">
      <div className="estimation-panel">
        
        
        <h2 className="panel-title">
          City {currentEstimatingIndex + 1} of {selectedCitiesArray.length}
        </h2>
        <div className="progress-indicator">
          <div className="progress-bar" style={{ width: `${progressPercentage}%` }}></div>
        </div>
        
        <div className="city-estimation">
          <div className="estimation-header">
            <div className="city-icon">
              <MapPin size={24} strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="estimation-city-name">{currentCity.name}</h3>
              <p className="estimation-country">{currentCity.country}</p>
            </div>
          </div>
          
          <div className="estimation-input-group">
            <label className="estimation-label">
              <Users size={18} className="label-icon" />
              What's the population of {currentCity.name}?
            </label>
            <input
              type="text"
              className="estimation-input"
              value={formatPopulation(estimations[currentCity.id])}
              onChange={(e) => handlePopulationInput(currentCity.id, e.target.value)}
              placeholder="Enter population estimate"
            />
            {errors[currentCity.id] && (
              <p className="error-text">{errors[currentCity.id]}</p>
            )}
          </div>
          
          <div className="confidence-group">
            <label className="estimation-label">
              <Shield size={18} className="label-icon" />
              How confident are you in your estimate?
            </label>
            <div className="confidence-options">
              {[1, 2, 3, 4, 5].map(level => (
                <button
                  key={level}
                  className={`confidence-btn ${(confidenceLevels[currentCity.id] || 3) === level ? 'selected' : ''}`}
                  onClick={() => setConfidenceLevel(currentCity.id, level)}
                >
                  {level === 1 ? 'Not at all' :
                   level === 2 ? 'Slightly' :
                   level === 3 ? 'Somewhat' :
                   level === 4 ? 'Very' :
                   'Extremely'}
                </button>
              ))}
            </div>
          </div>
          
          <div className="navigation-btns">
            <button 
              className="nav-btn prev-btn" 
              onClick={handlePreviousCity}
              disabled={currentEstimatingIndex === 0}
            >
              <ChevronLeft size={18} />
              Previous City
            </button>
            
            {currentEstimatingIndex === selectedCitiesArray.length - 1 ? (
              <button 
                className="nav-btn next-btn"
                onClick={handleSubmit}
                disabled={!estimations[currentCity.id] || submitting}
              >
                {submitting ? (
                  <>
                    <div className="btn-spinner"></div>
                    Submitting...
                  </>
                ) : (
                  <>
                    View Results
                    <Globe size={18} />
                  </>
                )}
              </button>
            ) : (
              <button 
                className="nav-btn next-btn"
                onClick={handleNextCity}
                disabled={!estimations[currentCity.id]}
              >
                Next City
                <ChevronRight size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
      
      <div className="form-actions">
        <button className="cancel-btn" onClick={goBackToSelection}>
          <ChevronLeft size={16} />
          Back to Selection
        </button>
        
        
      </div>
    </div>
  );
};

export default PerceptionForm;
// src/services/inputSanitizer.ts

/**
 * A service to sanitize and validate user inputs
 */
export class InputSanitizerService {
    /**
     * Sanitizes a population input by removing non-numeric characters
     * and ensuring it's within reasonable bounds
     * 
     * @param value The input value to sanitize
     * @returns The sanitized population number or null if invalid
     */
    sanitizePopulation(value: string): number | null {
      // Remove all non-numeric characters
      const numericValue = value.replace(/[^0-9]/g, "");
      
      // Convert to number or return null if empty
      if (!numericValue) return null;
      
      const population = parseInt(numericValue, 10);
      
      // Validate reasonable population bounds (0 to 8 billion)
      if (population <= 0 || population > 8000000000) {
        return null;
      }
      
      return population;
    }
    
    /**
     * Formats a population number with commas as thousand separators
     * 
     * @param value The population number to format
     * @returns Formatted population string with commas
     */
    formatPopulation(value: number | undefined | null): string {
      if (value === undefined || value === null) return "";
      return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    /**
     * Sanitizes a confidence level value
     * 
     * @param value The confidence level to sanitize
     * @returns A valid confidence level (1-5) or default value (3)
     */
    sanitizeConfidenceLevel(value: number): number {
      if (typeof value !== 'number' || isNaN(value)) {
        return 3; // Default to medium confidence
      }
      
      // Ensure confidence is between 1-5
      return Math.max(1, Math.min(5, Math.round(value)));
    }
    
    /**
     * Validates a city ID string
     * 
     * @param cityId The city ID to validate
     * @returns Whether the city ID is valid
     */
    isValidCityId(cityId: string): boolean {
      return typeof cityId === 'string' && cityId.trim().length > 0;
    }
  }
  
  // Export a singleton instance
  export const inputSanitizer = new InputSanitizerService();
// src/components/CityGlobe/TextureLoader.ts
import * as THREE from 'three';

export class TextureLoader {
  /**
   * Loads textures dynamically with error handling and fallbacks
   */
  static async loadEarthTextures(): Promise<{
    map: THREE.Texture;
    bumpMap: THREE.Texture;
    specularMap?: THREE.Texture;
  }> {
    const textureLoader = new THREE.TextureLoader();
    
    // URLs for Earth textures (from NASA Blue Marble collection)
    const textureURLs = {
      map: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
      bumpMap: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
      specularMap: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg'
    };
    
    // Fallback plain textures in case downloads fail
    const fallbackColors = {
      map: 0x2233ff,       // Blue for oceans
      bumpMap: 0x888888,    // Grey for bump map
      specularMap: 0xffffff // White for specular
    };
    
    // Load textures with Promise
    const loadTexture = (url: string, fallbackColor: number): Promise<THREE.Texture> => {
      return new Promise((resolve) => {
        // Try to load the texture
        textureLoader.load(
          url,
          // On success
          (texture) => {
            resolve(texture);
          },
          // On progress (unused)
          undefined,
          // On error
          () => {
            console.warn(`Failed to load texture from ${url}, using fallback`);
            
            // Create a canvas with the fallback color
            const canvas = document.createElement('canvas');
            canvas.width = 1024;
            canvas.height = 512;
            const ctx = canvas.getContext('2d');
            
            if (ctx) {
              ctx.fillStyle = `#${fallbackColor.toString(16).padStart(6, '0')}`;
              ctx.fillRect(0, 0, canvas.width, canvas.height);
              
              // For earth texture, add some land
              if (fallbackColor === fallbackColors.map) {
                ctx.fillStyle = '#116622'; // Green for land
                
                // Draw some continents (simplified)
                ctx.beginPath();
                ctx.ellipse(canvas.width * 0.35, canvas.height * 0.4, 100, 150, 0, 0, 2 * Math.PI); // North America
                ctx.fill();
                
                ctx.beginPath();
                ctx.ellipse(canvas.width * 0.45, canvas.height * 0.65, 70, 90, 0, 0, 2 * Math.PI); // South America
                ctx.fill();
                
                ctx.beginPath();
                ctx.ellipse(canvas.width * 0.55, canvas.height * 0.4, 80, 90, 0, 0, 2 * Math.PI); // Europe/Africa
                ctx.fill();
                
                ctx.beginPath();
                ctx.ellipse(canvas.width * 0.75, canvas.height * 0.45, 100, 100, 0, 0, 2 * Math.PI); // Asia
                ctx.fill();
                
                ctx.beginPath();
                ctx.ellipse(canvas.width * 0.85, canvas.height * 0.75, 60, 40, 0, 0, 2 * Math.PI); // Australia
                ctx.fill();
              }
            }
            
            const texture = new THREE.CanvasTexture(canvas);
            resolve(texture);
          }
        );
      });
    };
    
    // Load all textures in parallel
    try {
      const [map, bumpMap, specularMap] = await Promise.all([
        loadTexture(textureURLs.map, fallbackColors.map),
        loadTexture(textureURLs.bumpMap, fallbackColors.bumpMap),
        loadTexture(textureURLs.specularMap, fallbackColors.specularMap)
      ]);
      
      return { map, bumpMap, specularMap };
    } catch (error) {
      console.error('Error loading textures:', error);
      
      // Return basic textures as a last resort
      const basicMap = new THREE.Texture();
      basicMap.needsUpdate = true;
      
      const basicBumpMap = new THREE.Texture();
      basicBumpMap.needsUpdate = true;
      
      return { map: basicMap, bumpMap: basicBumpMap };
    }
  }
}
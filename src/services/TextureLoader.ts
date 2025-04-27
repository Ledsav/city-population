import * as THREE from 'three';

import earthCloudsTexture from '../assets/maps/8k_earth_clouds.jpg';
import earthDaymapTexture from '../assets/maps/8k_earth_daymap.jpg';
import earthNormalMapTexture from '../assets/maps/8k_earth_normal_map.tif';
import earthSpecularMapTexture from '../assets/maps/8k_earth_specular_map.tif';

// Texture cache to avoid reloading textures
const textureCache = new Map<string, THREE.Texture>();

export class TextureLoader {
  static async loadEarthTextures(): Promise<{
    map: THREE.Texture;
    bumpMap: THREE.Texture;
    normalMap?: THREE.Texture;
    specularMap?: THREE.Texture;
    cloudMap?: THREE.Texture;
  }> {
    // Check device capabilities
    const isMobile = window.innerWidth < 768;
    const isLowPerformance = window.navigator.hardwareConcurrency 
      ? window.navigator.hardwareConcurrency <= 4 
      : true;
    
    const textureURLs = {
      map: earthDaymapTexture,
      normalMap: earthNormalMapTexture,
      specularMap: earthSpecularMapTexture,
      cloudMap: earthCloudsTexture,
      
      // Fallbacks are the same as original since we don't have low-res versions
      mapFallback: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_atmos_2048.jpg',
      normalMapFallback: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_normal_2048.jpg',
      specularMapFallback: 'https://raw.githubusercontent.com/mrdoob/three.js/dev/examples/textures/planets/earth_specular_2048.jpg',
    };
    
    const fallbackColors = {
      map: 0x1A3771,
      bumpMap: 0x888888,
      specularMap: 0xffffff,
      cloudMap: 0xffffff
    };
    
    const textureLoader = new THREE.TextureLoader();
    
    // Optimize anisotropy based on device capability
    const anisotropy = isMobile ? 4 : isLowPerformance ? 8 : 16;
    
    // Skip clouds on very low-end devices
    const shouldSkipClouds = isMobile && isLowPerformance;
    
    const loadTexture = (url: string, fallbackUrl: string | null, fallbackColor: number, key: string): Promise<THREE.Texture> => {
      // Check if texture is already cached
      const cacheKey = key;
      if (textureCache.has(cacheKey)) {
        return Promise.resolve(textureCache.get(cacheKey)!);
      }

      return new Promise((resolve) => {
        textureLoader.load(
          url,
          (texture) => {
            // Optimize texture settings based on device capability
            texture.anisotropy = anisotropy;
            texture.encoding = THREE.sRGBEncoding;
            
            // Optimize mipmaps for low-end devices
            if (isMobile || isLowPerformance) {
              texture.minFilter = THREE.LinearFilter;
              texture.generateMipmaps = false;
            } else {
              texture.minFilter = THREE.LinearMipmapLinearFilter;
            }
            
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            
            // Cache the texture
            textureCache.set(cacheKey, texture);
            resolve(texture);
          },
          undefined,
          () => {
            if (fallbackUrl) {
              console.warn(`Failed to load texture from ${url}, trying fallback URL`);
              textureLoader.load(
                fallbackUrl,
                (texture) => {
                  texture.anisotropy = anisotropy;
                  texture.encoding = THREE.sRGBEncoding;
                  
                  if (isMobile || isLowPerformance) {
                    texture.minFilter = THREE.LinearFilter;
                    texture.generateMipmaps = false;
                  }
                  
                  textureCache.set(cacheKey, texture);
                  resolve(texture);
                },
                undefined,
                () => {
                  console.warn(`Failed to load fallback texture, using canvas fallback`);
                  const fallbackTexture = createCanvasFallback(fallbackColor);
                  textureCache.set(cacheKey, fallbackTexture);
                  resolve(fallbackTexture);
                }
              );
            } else {
              console.warn(`Failed to load texture from ${url}, using canvas fallback`);
              const fallbackTexture = createCanvasFallback(fallbackColor);
              textureCache.set(cacheKey, fallbackTexture);
              resolve(fallbackTexture);
            }
          }
        );
      });
    };
    
    const createCanvasFallback = (color: number): THREE.Texture => {
      // Create smaller canvas for low-end devices
      const canvasSize = isMobile ? 512 : 1024;
      
      const canvas = document.createElement('canvas');
      canvas.width = canvasSize;
      canvas.height = canvasSize / 2;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Draw simplified patterns based on which texture we're creating
        if (color === fallbackColors.map) {
          ctx.fillStyle = '#116622';
          
          // Simplified continents
          const numShapes = isMobile ? 3 : 5;
          for (let i = 0; i < numShapes; i++) {
            const x = (0.2 + 0.6 * (i / numShapes)) * canvas.width;
            const y = (0.3 + 0.4 * Math.sin(i)) * canvas.height;
            const radiusX = (0.05 + 0.03 * i) * canvas.width;
            const radiusY = (0.1 + 0.05 * Math.cos(i)) * canvas.height;
            
            ctx.beginPath();
            ctx.ellipse(x, y, radiusX, radiusY, 0, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        else if (color === fallbackColors.cloudMap) {
          ctx.globalAlpha = 0.7;
          const cloudCount = isMobile ? 10 : 20;
          
          for (let i = 0; i < cloudCount; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = (0.02 + 0.04 * Math.random()) * canvas.width;
            
            const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
            gradient.addColorStop(0, 'rgba(255, 255, 255, 0.8)');
            gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
            
            ctx.fillStyle = gradient;
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      texture.anisotropy = isMobile ? 1 : 4;
      return texture;
    };
    
    try {
      // Load textures in optimized order
      const promises = [
        loadTexture(textureURLs.map, textureURLs.mapFallback, fallbackColors.map, 'map'),
        loadTexture(textureURLs.normalMap, textureURLs.normalMapFallback, fallbackColors.bumpMap, 'normal'),
      ];
      
      // Only load specular map on higher-end devices
      if (!isMobile || !isLowPerformance) {
        promises.push(loadTexture(textureURLs.specularMap, textureURLs.specularMapFallback, fallbackColors.specularMap, 'specular'));
      }
      
      // Only load clouds if not skipping
      if (!shouldSkipClouds) {
        promises.push(loadTexture(textureURLs.cloudMap, null, fallbackColors.cloudMap, 'clouds'));
      }
      
      const loadedTextures = await Promise.all(promises);
      
      const result: any = {
        map: loadedTextures[0],
        bumpMap: loadedTextures[1],
        normalMap: loadedTextures[1]
      };
      
      // Add specular map if loaded
      if (!isMobile || !isLowPerformance) {
        result.specularMap = loadedTextures[2];
      }
      
      // Add clouds if loaded
      if (!shouldSkipClouds) {
        const cloudIndex = (!isMobile || !isLowPerformance) ? 3 : 2;
        result.cloudMap = loadedTextures[cloudIndex];
      }
      
      return result;
    } catch (error) {
      console.error('Error loading textures:', error);
      
      // Return minimal fallback textures
      const basicMap = createCanvasFallback(fallbackColors.map);
      const basicBumpMap = createCanvasFallback(fallbackColors.bumpMap);
      
      return { 
        map: basicMap, 
        bumpMap: basicBumpMap,
        normalMap: basicBumpMap
      };
    }
  }
  
  static clearCache() {
    textureCache.forEach(texture => {
      texture.dispose();
    });
    textureCache.clear();
  }
}
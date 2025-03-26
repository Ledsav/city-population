import * as THREE from 'three';

import earthCloudsTexture from '../../assets/maps/8k_earth_clouds.jpg';
import earthDaymapTexture from '../../assets/maps/8k_earth_daymap.jpg';
import earthNormalMapTexture from '../../assets/maps/8k_earth_normal_map.tif';
import earthSpecularMapTexture from '../../assets/maps/8k_earth_specular_map.tif';

export class TextureLoader {
  static async loadEarthTextures(): Promise<{
    map: THREE.Texture;
    bumpMap: THREE.Texture;
    normalMap?: THREE.Texture;
    specularMap?: THREE.Texture;
    cloudMap?: THREE.Texture;
  }> {
    const textureLoader = new THREE.TextureLoader();
    
    const textureURLs = {
      map: earthDaymapTexture,
      normalMap: earthNormalMapTexture,
      specularMap: earthSpecularMapTexture,
      cloudMap: earthCloudsTexture,
      
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
    
    const loadTexture = (url: string, fallbackUrl: string | null, fallbackColor: number): Promise<THREE.Texture> => {
      return new Promise((resolve) => {
        textureLoader.load(
          url,
          (texture) => {
            texture.anisotropy = 16;
            texture.encoding = THREE.sRGBEncoding;
            texture.minFilter = THREE.LinearMipmapLinearFilter;
            texture.magFilter = THREE.LinearFilter;
            texture.wrapS = THREE.ClampToEdgeWrapping;
            texture.wrapT = THREE.ClampToEdgeWrapping;
            resolve(texture);
          },
          undefined,
          () => {
            if (fallbackUrl) {
              console.warn(`Failed to load texture from ${url}, trying fallback URL`);
              textureLoader.load(
                fallbackUrl,
                (texture) => {
                  texture.anisotropy = 16;
                  texture.encoding = THREE.sRGBEncoding;
                  resolve(texture);
                },
                undefined,
                () => {
                  console.warn(`Failed to load fallback texture, using canvas fallback`);
                  resolve(createCanvasFallback(fallbackColor));
                }
              );
            } else {
              console.warn(`Failed to load texture from ${url}, using canvas fallback`);
              resolve(createCanvasFallback(fallbackColor));
            }
          }
        );
      });
    };
    
    const createCanvasFallback = (color: number): THREE.Texture => {
      const canvas = document.createElement('canvas');
      canvas.width = 1024;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      if (ctx) {
        ctx.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (color === fallbackColors.map) {
          ctx.fillStyle = '#116622';
          
          ctx.beginPath();
          ctx.ellipse(canvas.width * 0.35, canvas.height * 0.4, 100, 150, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.beginPath();
          ctx.ellipse(canvas.width * 0.45, canvas.height * 0.65, 70, 90, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.beginPath();
          ctx.ellipse(canvas.width * 0.55, canvas.height * 0.4, 80, 90, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.beginPath();
          ctx.ellipse(canvas.width * 0.75, canvas.height * 0.45, 100, 100, 0, 0, 2 * Math.PI);
          ctx.fill();
          
          ctx.beginPath();
          ctx.ellipse(canvas.width * 0.85, canvas.height * 0.75, 60, 40, 0, 0, 2 * Math.PI);
          ctx.fill();
        }
        else if (color === fallbackColors.cloudMap) {
          ctx.globalAlpha = 0.7;
          for (let i = 0; i < 20; i++) {
            const x = Math.random() * canvas.width;
            const y = Math.random() * canvas.height;
            const radius = 20 + Math.random() * 60;
            
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
      texture.anisotropy = 4;
      return texture;
    };
    
    try {
      const [map, normalMap, specularMap, cloudMap] = await Promise.all([
        loadTexture(textureURLs.map, textureURLs.mapFallback, fallbackColors.map),
        loadTexture(textureURLs.normalMap, textureURLs.normalMapFallback, fallbackColors.bumpMap),
        loadTexture(textureURLs.specularMap, textureURLs.specularMapFallback, fallbackColors.specularMap),
        loadTexture(textureURLs.cloudMap, null, fallbackColors.cloudMap)
      ]);
      
      return { 
        map, 
        bumpMap: normalMap,
        normalMap,
        specularMap,
        cloudMap
      };
    } catch (error) {
      console.error('Error loading textures:', error);
      
      const basicMap = createCanvasFallback(fallbackColors.map);
      const basicBumpMap = createCanvasFallback(fallbackColors.bumpMap);
      
      return { map: basicMap, bumpMap: basicBumpMap };
    }
  }
}
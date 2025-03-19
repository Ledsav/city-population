// src/components/CityGlobe/CityGlobe.tsx
import { CityWithPerceptions } from '@/types';
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CityBuildings } from '../CityBuildings/CityBuildings';
import './CityGlobe.css';
import { CityInfoPanel } from './CityInfoPanel';

interface CityGlobeProps {
  cities: CityWithPerceptions[];
  onCitySelect?: (city: CityWithPerceptions) => void;
}

export const CityGlobe: React.FC<CityGlobeProps> = ({ cities, onCitySelect }) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const [selectedCity, setSelectedCity] = useState<CityWithPerceptions | null>(null);
  const [populationMode, setPopulationMode] = useState<'actual' | 'perceived'>('actual');
  const [isRotating, setIsRotating] = useState(false);
  
  // Three.js objects stored in refs to persist between renders
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cityModelsRef = useRef<Map<string, THREE.Group>>(new Map());
  const globeRef = useRef<THREE.Mesh | null>(null);
  
  // Initialize the Three.js scene
  useEffect(() => {
    if (!mountRef.current) return;
    
    // Create scene
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510); // Dark space background
    sceneRef.current = scene;
    
    // Create camera with better position for viewing
    const camera = new THREE.PerspectiveCamera(
      50, // Reduced FOV for less distortion
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5.5; // Move camera back slightly
    camera.position.y = 1.5; // Move camera up for better viewing angle
    cameraRef.current = camera;
    
    // Create renderer with better quality settings and optimization
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5)); // Limit pixel ratio for better performance
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    // Add optimization hints
    renderer.setClearColor(0x000510, 1);
    renderer.sortObjects = false; // Skip sorting for better performance
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    // Add orbit controls with better feel
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.7;
    controls.minDistance = 3.5;
    controls.maxDistance = 8;
    controls.autoRotate = false; // Disable autorotation by default
    controls.autoRotateSpeed = 0.3;
    controls.enablePan = false; // Disable panning for better UX
    controlsRef.current = controls;
    
    // Create Earth globe with optimized materials
    const earthGeometry = new THREE.SphereGeometry(2, 48, 48); // Reduced polygon count for better performance
    const placeholderMaterial = new THREE.MeshPhongMaterial({
      color: 0x2244aa,
      specular: new THREE.Color(0x444444),
      shininess: 15,
      bumpScale: 0.05,
    });
    const earthMesh = new THREE.Mesh(earthGeometry, placeholderMaterial);
    earthMesh.castShadow = true;
    earthMesh.receiveShadow = true;
    scene.add(earthMesh);
    globeRef.current = earthMesh;
    
    // Load textures asynchronously
    import('./TextureLoader').then(({ TextureLoader }) => {
      TextureLoader.loadEarthTextures().then(textures => {
        if (earthMesh) {
          const earthMaterial = new THREE.MeshPhongMaterial({
            map: textures.map,
            bumpMap: textures.bumpMap,
            bumpScale: 0.05,
            specularMap: textures.specularMap,
            specular: new THREE.Color(0x444444),
            shininess: 25,
          });
          earthMesh.material = earthMaterial;
        }
      });
    });
    
    // Improved lighting for better building visibility
    // Ambient light - increased intensity for better base illumination
    const ambientLight = new THREE.AmbientLight(0x404050, 10); 
    scene.add(ambientLight);
    
    // Main directional light (sun)
    const sunLight = new THREE.DirectionalLight(0xffffff, 3); // Increased from 1.2
    sunLight.position.set(5, 3, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 20;
    scene.add(sunLight);

    // Add secondary light for better illumination of building details
    const secondaryLight = new THREE.DirectionalLight(0xffffcc, 1);
    secondaryLight.position.set(-3, 2, -5);
    scene.add(secondaryLight);

    // Add subtle rim lighting to highlight globe edge
    const rimLight = new THREE.DirectionalLight(0x8090ff, 1); // Increased from 0.3
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);
    
    // Add subtle particle stars for space ambiance - reduced count for performance
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025, // Slightly larger stars but fewer
      transparent: true,
      opacity: 0.7,
      sizeAttenuation: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 2000; i++) { // Reduced from 5000 for better performance
      const x = THREE.MathUtils.randFloatSpread(100);
      const y = THREE.MathUtils.randFloatSpread(100);
      const z = THREE.MathUtils.randFloatSpread(100);
      // Avoid stars in the center where the earth is
      if (Math.sqrt(x*x + y*y + z*z) > 15) {
        starsVertices.push(x, y, z);
      }
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    // Handle window resize with throttling for performance
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) return; // Skip if a resize is already pending
      
      resizeTimeout = window.setTimeout(() => {
        if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
        
        resizeTimeout = null;
      }, 100); // Throttle resize events
    };
    
    window.addEventListener('resize', handleResize);
    
    // Animation loop with optimization
    let requestId: number;
    let lastRenderTime = 0;
    const targetFPS = 30; // Limit to 30 FPS to improve performance
    const frameInterval = 1000 / targetFPS;
    
    const animate = (timestamp: number) => {
      requestId = requestAnimationFrame(animate);
      
      // Throttle rendering for better performance
      const deltaTime = timestamp - lastRenderTime;
      if (deltaTime < frameInterval) return;
      
      lastRenderTime = timestamp - (deltaTime % frameInterval);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate(0);
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
      cancelAnimationFrame(requestId);
      
      if (rendererRef.current && mountRef.current) {
        mountRef.current.removeChild(rendererRef.current.domElement);
        rendererRef.current.dispose();
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (sceneRef.current) {
        // Dispose all geometries and materials
        sceneRef.current.traverse((object: THREE.Object3D) => {
          if (object instanceof THREE.Mesh) {
            if (object.geometry) object.geometry.dispose();
            
            if (Array.isArray(object.material)) {
              object.material.forEach((material: THREE.Material) => material.dispose());
            } else if (object.material) {
              object.material.dispose();
            }
          }
        });
      }
    };
  }, []);
  
  // Create and add 3D city models to the globe
  useEffect(() => {
    if (!sceneRef.current || !globeRef.current || cities.length === 0) return;
    
    // Clear any existing city models first
    cityModelsRef.current.forEach((cityModel) => {
      sceneRef.current?.remove(cityModel);
    });
    cityModelsRef.current.clear();
    
    // Build each city model
    cities.forEach(city => {
      const population = populationMode === 'actual' 
        ? city.officialPopulation 
        : city.perceptions.averagePerceivedPopulation;
      
      // Fixed coordinate conversion - using standard spherical to Cartesian conversion for globe
      const phi = (90 - city.coordinates.latitude) * (Math.PI / 180); // Convert to radians
      const theta = (city.coordinates.longitude + 180) * (Math.PI / 180); // Convert to radians
      const radius = 2; // Globe radius

      // Calculate position on globe surface
      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      // Use the CityBuildings class to create a detailed city model
      const cityModel = CityBuildings.createCityModel(
        city,
        population,
        [x, y, z]
      );
      
      // Add city model to the scene
      sceneRef.current?.add(cityModel);
      cityModelsRef.current.set(city.id, cityModel);
    });
    
    // Add animation for pulsing elements with performance optimizations
    const pulseElements: THREE.Object3D[] = [];
    cityModelsRef.current.forEach((cityGroup) => {
      cityGroup.traverse((object) => {
        if (object.userData && object.userData.isPulse) {
          pulseElements.push(object);
          
          // Store original scale for reference (optimization - avoid recalculation)
          if (!object.userData.initialScale) {
            object.userData.initialScale = object.scale.x;
          }
        }
      });
    });
    
    if (pulseElements.length > 0) {
      let lastPulseUpdate = 0;
      const pulseInterval = 100; // Update pulse every 100ms instead of every frame
      
      const animatePulse = (timestamp: number) => {
        // Only update pulse every pulseInterval milliseconds
        if (timestamp - lastPulseUpdate > pulseInterval) {
          lastPulseUpdate = timestamp;
          
          const time = timestamp * 0.001; // Convert to seconds
          pulseElements.forEach((obj) => {
            const initialScale = obj.userData.initialScale || 1;
            const pulse = Math.sin(time * 2) * 0.3 + 1.0; // Pulse between 0.7 and 1.3 times size
            obj.scale.set(
              initialScale * pulse,
              initialScale * pulse,
              initialScale
            );
          });
        }
        
        requestAnimationFrame(animatePulse);
      };
      
      animatePulse(0);
    }
    
    
    // Setup raycaster for interactions
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    const handleClick = (event: MouseEvent) => {
      if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
      
      const rect = mountRef.current.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / mountRef.current.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / mountRef.current.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, cameraRef.current);
      
      // Find intersections with all objects in the scene
      const intersects = raycaster.intersectObjects(sceneRef.current.children, true);
      
      // Find the first intersection that belongs to a city
      for (const intersect of intersects) {
        let current: THREE.Object3D | null = intersect.object;
        
        // Traverse up to find parent with cityId
        while (current && !current.userData?.cityId) {
          current = current.parent;
        }
        
        if (current && current.userData?.cityId) {
          const cityId = current.userData.cityId;
          const city = cities.find(c => c.id === cityId);
          
          if (city) {
            // Handle selection
            setSelectedCity(prevSelected => {
              // If city was selected and is different from previous selection, focus camera on it
              if (!prevSelected || prevSelected.id !== cityId) {
                // Fixed: Check that current is not null before accessing position
                if (current) {
                  focusCameraOnCity(current.position);
                }
              }
              
              return prevSelected?.id === cityId ? null : city;
            });
            
            if (onCitySelect) onCitySelect(city);
            break;
          }
        }
      }
    };
    
    const focusCameraOnCity = (position: THREE.Vector3) => {
      if (!controlsRef.current || !cameraRef.current) return;
      
      // Temporarily disable auto-rotation
      controlsRef.current.autoRotate = false;
      
      // Calculate target direction (from center to city)
      const direction = position.clone().normalize();
      
      // Set camera position slightly offset from the direct city vector
      const cameraPosition = direction.clone().multiplyScalar(4.5);
      
      // Animate camera to the position
      const startPosition = cameraRef.current.position.clone();
      const startTime = Date.now();
      const duration = 1000; // 1 second
      
      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Ease-in-out function
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        if (progress < 1) {
          // Interpolate position - check that camera is not null
          if (cameraRef.current) {
            cameraRef.current.position.lerpVectors(
              startPosition, 
              cameraPosition, 
              easeProgress
            );
          }
          
          requestAnimationFrame(animateCamera);
        }
      };
      
      animateCamera();
    };
    
    // Add event listener for clicks
    mountRef.current?.addEventListener('click', handleClick);
    
    return () => {
      mountRef.current?.removeEventListener('click', handleClick);
    };
  }, [cities, populationMode, onCitySelect]);
  
  // Get class for selected city
  const getCityClass = (city: CityWithPerceptions) => {
    const percentageOff = (city.perceptions.perceptionGap / city.officialPopulation) * 100;
    
    if (percentageOff > 50) return "highly-overestimated";
    if (percentageOff > 0) return "slightly-overestimated";
    if (percentageOff < -50) return "highly-underestimated";
    return "slightly-underestimated";
  };
  
  const getPerceptionStats = () => {
    let mostOverestimated = cities[0];
    let mostUnderestimated = cities[0];
    let totalPerceptions = 0;
    
    cities.forEach((city) => {
      const percentageOff = (city.perceptions.perceptionGap / city.officialPopulation) * 100;
      const currentMostOver = (mostOverestimated.perceptions.perceptionGap / 
        mostOverestimated.officialPopulation) * 100;
      const currentMostUnder = (mostUnderestimated.perceptions.perceptionGap / 
        mostUnderestimated.officialPopulation) * 100;
      
      if (percentageOff > currentMostOver) mostOverestimated = city;
      if (percentageOff < currentMostUnder) mostUnderestimated = city;
      totalPerceptions += city.perceptions.totalPerceptions;
    });
    
    return { mostOverestimated, mostUnderestimated, totalPerceptions };
  };
  
  const stats = getPerceptionStats();
  
  return (
    <div className="globe-wrapper">
      <div className="globe-controls">
        <button
          onClick={() => setPopulationMode(populationMode === 'actual' ? 'perceived' : 'actual')}
          className="control-button"
        >
          {populationMode === 'actual' ? 'Show Perceived Population' : 'Show Actual Population'}
        </button>
        <button
          onClick={() => {
            if (controlsRef.current) {
              const newRotationState = !isRotating;
              controlsRef.current.autoRotate = newRotationState;
              setIsRotating(newRotationState);
            }
          }}
          className="control-button"
        >
          {isRotating ? 'Stop Rotation' : 'Start Rotation'}
        </button>
      </div>
      
      <div className="globe-container" ref={mountRef}>
        {/* Globe will be rendered here */}
      </div>
      
      {/* City Info Panel */}
      {selectedCity && (
        <CityInfoPanel
          city={selectedCity}
          class={getCityClass(selectedCity)}
          onClose={() => setSelectedCity(null)}
        />
      )}
    </div>
  );
};
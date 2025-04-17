import { City } from '@/services/firebase';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { CityMarkers } from '../CityMarkers/CityMarkers';
import CityRankings from '../CityRanking/CityRanking';
import '../CityRanking/CityRanking.css';
import './CityGlobe.css';
import { CityInfoPanel } from './CityInfoPanel';


interface CityGlobeProps {
  cities: City[];
  onCitySelect?: (city: City) => void;
  hasEstimated?: boolean;
}

export const CityGlobe: React.FC<CityGlobeProps> = ({ 
  cities, 
  onCitySelect,
  hasEstimated = false
}) => {
  const mountRef = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<HTMLDivElement | null>(null);
  const [selectedCity, setSelectedCity] = useState<City | null>(null);
  const [isRotating, setIsRotating] = useState(false);
  const [showRankings, setShowRankings] = useState(true);
  const [showEstimateReminder, setShowEstimateReminder] = useState(!hasEstimated);
  
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const cityModelsRef = useRef<Map<string, THREE.Group>>(new Map());
  const globeRef = useRef<THREE.Mesh | null>(null);
  const labelElementsRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (showEstimateReminder) {
      const timer = setTimeout(() => {
        setShowEstimateReminder(false);
      }, 10000);
      
      return () => clearTimeout(timer);
    }
  }, [showEstimateReminder]);

  const handleCitySelection = useCallback((city: City | null) => {
    setSelectedCity(city);
    if (onCitySelect && city) {
      onCitySelect(city);
    }
  }, [onCitySelect]);
  
  useEffect(() => {
    if (!mountRef.current) return;
    
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000510);
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      50,
      mountRef.current.clientWidth / mountRef.current.clientHeight, 
      0.1, 
      1000
    );
    camera.position.z = 5.5;
    camera.position.y = 1.5;
    cameraRef.current = camera;
    
    const renderer = new THREE.WebGLRenderer({ 
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance'
    });
    renderer.setSize(mountRef.current.clientWidth, mountRef.current.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    
    renderer.setClearColor(0x000510, 1);
    renderer.sortObjects = false;
    mountRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;
    
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.1;
    controls.rotateSpeed = 0.7;
    controls.minDistance = 3.5;
    controls.maxDistance = 8;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.3;
    controls.enablePan = false;
    controlsRef.current = controls;
    
    const earthGeometry = new THREE.SphereGeometry(2, 64, 64);
    
    const placeholderMaterial = new THREE.MeshPhongMaterial({
      color: 0x2244aa,
      specular: new THREE.Color(0x444444),
      shininess: 15,
    });
    
    const earthMesh = new THREE.Mesh(earthGeometry, placeholderMaterial);
    earthMesh.castShadow = true;
    earthMesh.receiveShadow = true;
    scene.add(earthMesh);
    globeRef.current = earthMesh;
    
    const atmosphereGeometry = new THREE.SphereGeometry(2.1, 64, 64);
    const atmosphereMaterial = new THREE.MeshBasicMaterial({
      color: 0x0077ff,
      transparent: true,
      opacity: 0.15,
      side: THREE.BackSide,
    });
    const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
    scene.add(atmosphere);
    
    import('../../services/TextureLoader').then(({ TextureLoader }) => {
      TextureLoader.loadEarthTextures().then(textures => {
        if (earthMesh) {
          const earthMaterial = new THREE.MeshStandardMaterial({
            map: textures.map,
            normalMap: textures.bumpMap,
            normalScale: new THREE.Vector2(0.7, 0.7),
            roughness: 0.85,
            metalness: 0.1,
          });

          (earthMesh.material as THREE.Material) = earthMaterial;
          if (textures.cloudMap) {
            const cloudGeometry = new THREE.SphereGeometry(2.02, 32, 32);
            const cloudMaterial = new THREE.MeshBasicMaterial({
              map: textures.cloudMap,
              transparent: true,
              opacity: 0.4,
              blending: THREE.AdditiveBlending,
            });
            
            const clouds = new THREE.Mesh(cloudGeometry, cloudMaterial);
            scene.add(clouds);
            
            const animateClouds = () => {
              clouds.rotation.y += 0.0001;
              requestAnimationFrame(animateClouds);
            };
            
            animateClouds();
          }
        }
      });
    });
    
    const ambientLight = new THREE.AmbientLight(0x557799, 1); 
    scene.add(ambientLight);
    
    const sunLight = new THREE.DirectionalLight(0xffffff, 3);
    sunLight.position.set(5, 3, 5);
    sunLight.castShadow = true;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    sunLight.shadow.camera.near = 0.5;
    sunLight.shadow.camera.far = 20;
    scene.add(sunLight);

    const secondaryLight = new THREE.DirectionalLight(0xffeedd, 1);
    secondaryLight.position.set(-3, 2, -5);
    scene.add(secondaryLight);

    const rimLight = new THREE.DirectionalLight(0x8090ff, 0.7);
    rimLight.position.set(-5, -2, -5);
    scene.add(rimLight);
    
    // Create stars in the background
    const starsGeometry = new THREE.BufferGeometry();
    const starsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.025,
      transparent: true,
      opacity: 0.8,
      sizeAttenuation: true
    });
    
    const starsVertices = [];
    for (let i = 0; i < 3000; i++) {
      const x = THREE.MathUtils.randFloatSpread(100);
      const y = THREE.MathUtils.randFloatSpread(100);
      const z = THREE.MathUtils.randFloatSpread(100);
      
      if (Math.sqrt(x*x + y*y + z*z) > 15) {
        starsVertices.push(x, y, z);
      }
    }
    
    starsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(starsVertices, 3));
    const stars = new THREE.Points(starsGeometry, starsMaterial);
    scene.add(stars);
    
    function createStarTexture() {
      const canvas = document.createElement('canvas');
      canvas.width = 32;
      canvas.height = 32;
      
      const context = canvas.getContext('2d');
      if (context) {
        const gradient = context.createRadialGradient(16, 16, 0, 16, 16, 16);
        gradient.addColorStop(0, 'rgba(255, 255, 255, 1)');
        gradient.addColorStop(0.2, 'rgba(255, 255, 255, 0.8)');
        gradient.addColorStop(0.5, 'rgba(128, 128, 255, 0.4)');
        gradient.addColorStop(1, 'rgba(0, 0, 64, 0)');
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 32, 32);
      }
      
      const texture = new THREE.CanvasTexture(canvas);
      return texture;
    }
    
    const largeStarsMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.06,
      transparent: true,
      opacity: 0.9,
      sizeAttenuation: true,
      map: createStarTexture()
    });
    
    const largeStarsGeometry = new THREE.BufferGeometry();
    const largeStarsVertices = [];
    
    for (let i = 0; i < 100; i++) {
      const x = THREE.MathUtils.randFloatSpread(100);
      const y = THREE.MathUtils.randFloatSpread(100);
      const z = THREE.MathUtils.randFloatSpread(100);
      
      if (Math.sqrt(x*x + y*y + z*z) > 25) {
        largeStarsVertices.push(x, y, z);
      }
    }
    
    largeStarsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(largeStarsVertices, 3));
    const largeStars = new THREE.Points(largeStarsGeometry, largeStarsMaterial);
    scene.add(largeStars);
    
    const labelsContainer = document.createElement('div');
    labelsContainer.className = 'city-labels-container';
    mountRef.current.appendChild(labelsContainer);
    labelsRef.current = labelsContainer;
    
    let resizeTimeout: number | null = null;
    const handleResize = () => {
      if (resizeTimeout) return;
      
      resizeTimeout = window.setTimeout(() => {
        if (!mountRef.current || !cameraRef.current || !rendererRef.current) return;
        
        const width = mountRef.current.clientWidth;
        const height = mountRef.current.clientHeight;
        
        cameraRef.current.aspect = width / height;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(width, height);
        
        resizeTimeout = null;
      }, 100);
    };
    
    window.addEventListener('resize', handleResize);
    
    // Store references for cleanup
    const mountNode = mountRef.current;
    const rendererInstance = renderer;
    const labelsNode = labelsContainer;
    const labelMap = labelElementsRef.current;
    
    return () => {
      window.removeEventListener('resize', handleResize);
      
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      
      if (labelsNode) {
        while (labelsNode.firstChild) {
          labelsNode.removeChild(labelsNode.firstChild);
        }
      }
      labelMap.clear();
      
      if (rendererInstance && mountNode) {
        mountNode.removeChild(rendererInstance.domElement);
        rendererInstance.dispose();
      }
      
      if (controlsRef.current) {
        controlsRef.current.dispose();
      }
      
      if (scene) {
        scene.traverse((object: THREE.Object3D) => {
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
  
  useEffect(() => {
    if (!sceneRef.current || !cameraRef.current || !rendererRef.current) return;
    
    let lastRenderTime = 0;
    const targetFPS = 30;
    const frameInterval = 1000 / targetFPS;
    
    // Store references for cleanup
    const labelMap = labelElementsRef.current;
    
    const updateMarkerVisibility = () => {
      if (!cameraRef.current) return;
      
      const cameraPosition = cameraRef.current.position.clone();
      
      cityModelsRef.current.forEach((cityGroup) => {
        const cityPosition = cityGroup.position.clone();
        const cameraToCity = cityPosition.clone().sub(cameraPosition);
        const cityToCenter = cityPosition.clone().negate();
        
        const angle = cameraToCity.angleTo(cityToCenter);
        
        const isVisible = angle < Math.PI / 2;
        
        cityGroup.visible = isVisible;
        cityGroup.userData.isVisible = isVisible;
      });
    };
    
    const updateCityLabels = () => {
      if (!cameraRef.current || !rendererRef.current || !labelsRef.current) return;
      
      cityModelsRef.current.forEach((cityGroup, cityId) => {
        if (!cityGroup.visible) {
          const labelElement = labelMap.get(cityId);
          if (labelElement) {
            labelElement.style.opacity = '0';
          }
          return;
        }
        
        let labelMesh: THREE.Object3D | null = null as unknown as THREE.Object3D;
        cityGroup.traverse((object) => {
          if (object.userData && object.userData.isLabel) {
            labelMesh = object;
          }
        });
        
        if (labelMesh) {
          const position = new THREE.Vector3();
          labelMesh.getWorldPosition(position);
          
          const vector = position.clone();
          if (cameraRef.current) {
            vector.project(cameraRef.current);
          }
          
          if (vector.z < 1) {
            if (!cameraRef.current || !rendererRef.current || !labelsRef.current) return;
            const x = (vector.x * 0.5 + 0.5) * rendererRef.current.domElement.clientWidth;
            const y = (-(vector.y * 0.5) + 0.5) * rendererRef.current.domElement.clientHeight;
            
            let labelElement = labelMap.get(cityId);
            if (!labelElement) {
              labelElement = document.createElement('div');
              labelElement.style.position = 'absolute';
              labelElement.style.pointerEvents = 'none';
              labelsRef.current.appendChild(labelElement);
              labelMap.set(cityId, labelElement);
              
              const city = cities.find(c => c.id === cityId);
              if (city) {
                const perceptionGap = city.perceivedPopulation - city.officialPopulation;
                const percentageOff = (perceptionGap / city.officialPopulation) * 100;
                let labelClass = 'city-label';
                
                if (percentageOff > 50) {
                  labelClass += ' highly-overestimated';
                } else if (percentageOff > 0) {
                  labelClass += ' slightly-overestimated';
                } else if (percentageOff < -50) {
                  labelClass += ' highly-underestimated';
                } else {
                  labelClass += ' slightly-underestimated';
                }
                
                if (selectedCity && selectedCity.id === city.id) {
                  labelClass += ' selected';
                }
                
                labelElement.className = labelClass;
                labelElement.textContent = city.name;
              }
            }
            
            labelElement.style.left = `${x}px`;
            labelElement.style.top = `${y}px`;
            
            labelElement.style.opacity = '1';
          } else {
            const labelElement = labelMap.get(cityId);
            if (labelElement) {
              labelElement.style.opacity = '0';
            }
          }
        }
      });
    };
    
    const animate = (timestamp: number) => {
      animationFrameRef.current = requestAnimationFrame(animate);
      
      const deltaTime = timestamp - lastRenderTime;
      if (deltaTime < frameInterval) return;
      
      lastRenderTime = timestamp - (deltaTime % frameInterval);
      
      if (controlsRef.current) {
        controlsRef.current.update();
      }
      
      updateMarkerVisibility();
      updateCityLabels();
      
      if (rendererRef.current && sceneRef.current && cameraRef.current) {
        rendererRef.current.render(sceneRef.current, cameraRef.current);
      }
    };
    
    animate(0);
    
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [cities, selectedCity]);
  
  useEffect(() => {
    if (!sceneRef.current || !globeRef.current || cities.length === 0) return;
    
    cityModelsRef.current.forEach((cityModel) => {
      sceneRef.current?.remove(cityModel);
    });
    cityModelsRef.current.clear();
    
    // Store references for cleanup
    const labelsNode = labelsRef.current;
    const labelMap = labelElementsRef.current;
    
    if (labelsNode) {
      while (labelsNode.firstChild) {
        labelsNode.removeChild(labelsNode.firstChild);
      }
    }
    labelMap.clear();
    
    cities.forEach(city => {
      // Use only the official population directly
      const population = city.officialPopulation;
      
      const phi = (90 - city.coordinates.latitude) * (Math.PI / 180);
      const theta = (city.coordinates.longitude + 180) * (Math.PI / 180);
      const radius = 2;

      const x = -(radius * Math.sin(phi) * Math.cos(theta));
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.sin(theta);
      
      const cityMarker = CityMarkers.createCityMarker(
        city,
        population,
        [x, y, z]
      );
      
      sceneRef.current?.add(cityMarker);
      cityModelsRef.current.set(city.id, cityMarker);
    });

    // Make sure all cities have their population stats initialized
    CityMarkers.initializePopulationRange(
      cities.map(city => ({ city, population: city.officialPopulation }))
    );
  }, [cities]);
  
  useEffect(() => {
    if (!mountRef.current || !cameraRef.current || !sceneRef.current) return;
    
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();
    
    // Store references for cleanup
    const mountNode = mountRef.current;
    const labelMap = labelElementsRef.current;
    
    const handleClick = (event: MouseEvent) => {
      const rect = mountNode.getBoundingClientRect();
      mouse.x = ((event.clientX - rect.left) / mountNode.clientWidth) * 2 - 1;
      mouse.y = -((event.clientY - rect.top) / mountNode.clientHeight) * 2 + 1;
      
      raycaster.setFromCamera(mouse, cameraRef.current!);
      
      const visibleObjects: THREE.Object3D[] = [];
      sceneRef.current!.traverse((object) => {
        if (object.visible && (object instanceof THREE.Mesh || object instanceof THREE.Group)) {
          visibleObjects.push(object);
        }
      });
      
      const intersects = raycaster.intersectObjects(visibleObjects, true);
      
      if (intersects.length === 0) {
        if (selectedCity) {
          handleCitySelection(null);
          
          labelMap.forEach((labelElement) => {
            labelElement.className = labelElement.className.replace(' selected', '');
          });
        }
        return;
      }
      
      for (const intersect of intersects) {
        let current: THREE.Object3D | null = intersect.object;
        
        while (current && !current.userData?.cityId) {
          current = current.parent;
        }
        
        if (current && current.userData?.cityId) {
          const cityId = current.userData.cityId;
          const city = cities.find(c => c.id === cityId);
          
          if (city) {
            labelMap.forEach((labelElement, id) => {
              labelElement.className = labelElement.className.replace(' selected', '');
              
              if (id === cityId && (!selectedCity || selectedCity.id !== cityId)) {
                labelElement.className += ' selected';
              }
            });
            
            if (selectedCity?.id === cityId) {
              handleCitySelection(null);
            } else {
              handleCitySelection(city);
              
              if (current) {
                focusCameraOnCity(current.position.clone());
              }
            }
            
            break;
          }
        }
      }
    };
    
    const focusCameraOnCity = (position: THREE.Vector3) => {
      if (!controlsRef.current || !cameraRef.current) return;
      
      const wasRotating = controlsRef.current.autoRotate;
      controlsRef.current.autoRotate = false;
      
      const direction = position.clone().normalize();
      
      const cameraPosition = direction.clone().multiplyScalar(4.5);
      
      const startPosition = cameraRef.current.position.clone();
      const startTime = Date.now();
      const duration = 1000;
      
      const animateCamera = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        const easeProgress = progress < 0.5
          ? 2 * progress * progress
          : 1 - Math.pow(-2 * progress + 2, 2) / 2;
        
        if (progress < 1) {
          if (cameraRef.current) {
            cameraRef.current.position.lerpVectors(
              startPosition, 
              cameraPosition, 
              easeProgress
            );
          }
          
          requestAnimationFrame(animateCamera);
        } else {
          if (controlsRef.current && wasRotating) {
            controlsRef.current.autoRotate = wasRotating;
          }
        }
      };
      
      animateCamera();
    };
    
    mountNode.addEventListener('click', handleClick);
    
    return () => {
      mountNode.removeEventListener('click', handleClick);
    };
  }, [cities, selectedCity, handleCitySelection]);
  
  const getCityClass = (city: City) => {
    const perceptionGap = city.perceivedPopulation - city.officialPopulation;
    const percentageOff = (perceptionGap / city.officialPopulation) * 100;
    
    if (percentageOff > 50) return "highly-overestimated";
    if (percentageOff > 0) return "slightly-overestimated";
    if (percentageOff < -50) return "highly-underestimated";
    return "slightly-underestimated";
  };
  
  const handleCloseInfoPanel = useCallback(() => {
    // Store reference to avoid the React hooks warning
    const labelMap = labelElementsRef.current;
    labelMap.forEach((labelElement) => {
      labelElement.className = labelElement.className.replace(' selected', '');
    });
    setSelectedCity(null);
  }, []);

  const toggleRankings = useCallback(() => {
    setShowRankings(prev => !prev);
  }, []);
  
  return (
    <div className="globe-wrapper">
      {showEstimateReminder && !hasEstimated && (
        <div className="return-to-form-message">
          Would you like to add your own population estimates? Click "Add Your Estimates" to contribute!
        </div>
      )}
      
      <div className="globe-controls">
        <button
          onClick={() => {
            if (controlsRef.current) {
              const newRotationState = !isRotating;
              controlsRef.current.autoRotate = newRotationState;
              setIsRotating(newRotationState);
            }
          }}
          className={`rotation-button ${isRotating ? 'active' : ''}`}
          aria-label={isRotating ? 'Stop globe rotation' : 'Start globe rotation'}
        >
          <span className={`icon ${isRotating ? 'spinning' : ''}`}>
            {isRotating ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 12a9 9 0 1 1-9-9c2.52 0 4.85 1 6.57 2.64"></path>
                <path d="M21 3v9h-9"></path>
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M2 12c0 5.52 4.48 10 10 10s10-4.48 10-10S17.52 2 12 2"></path>
                <path d="M12 2v4"></path>
                <path d="M12 18v4"></path>
                <path d="m4.93 4.93 2.83 2.83"></path>
                <path d="m16.24 16.24 2.83 2.83"></path>
                <path d="M2 12h4"></path>
                <path d="M18 12h4"></path>
                <path d="m4.93 19.07 2.83-2.83"></path>
                <path d="m16.24 7.76 2.83-2.83"></path>
              </svg>
            )}
          </span>
          <span className="label-text">
            {isRotating ? 'Stop Rotation' : 'Start Rotation'}
          </span>
        </button>
        
        <button 
          onClick={toggleRankings}
          className="rotation-button"
          aria-label={showRankings ? 'Hide rankings' : 'Show rankings'}
        >
          <span className="icon">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 6h18"></path>
              <path d="M7 12h10"></path>
              <path d="M10 18h4"></path>
            </svg>
          </span>
          <span className="label-text">
            {showRankings ? 'Hide Rankings' : 'Show Rankings'}
          </span>
        </button>
      </div>
      
      {showRankings && cities.length > 0 && (
        <CityRankings 
          cities={cities} 
          onCitySelect={handleCitySelection}
          selectedCity={selectedCity}
        />
      )}
      
      <div className="globe-container" ref={mountRef}>
        {/* Globe will be rendered here */}
      </div>
      
      {selectedCity && (
        <CityInfoPanel
          city={selectedCity}
          class={getCityClass(selectedCity)}
          onClose={handleCloseInfoPanel}
        />
      )}
    </div>
  );
}
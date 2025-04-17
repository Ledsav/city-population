import { City } from '@/services/firebase';
import * as THREE from 'three';

export class CityMarkers {
  private static minPopulation: number | null = null;
  private static maxPopulation: number | null = null;
  private static cities: Array<{ city: City, population: number }> = [];

  static initializePopulationRange(cityData: Array<{ city: City, population: number }>) {
    this.cities = cityData;
    
    this.minPopulation = Number.MAX_VALUE;
    this.maxPopulation = 0;
    
    for (const { population } of cityData) {
      if (population < this.minPopulation) {
        this.minPopulation = population;
      }
      if (population > this.maxPopulation) {
        this.maxPopulation = population;
      }
    }
    
    console.log(`Population range: ${this.minPopulation} to ${this.maxPopulation}`);
  }

  static createCityMarker(
    city: City, 
    population: number, 
    position: [number, number, number]
  ): THREE.Group {
    const cityGroup = new THREE.Group();
    cityGroup.userData = { cityId: city.id };
    cityGroup.position.set(position[0], position[1], position[2]);
    
    cityGroup.lookAt(0, 0, 0);
    
    let normalizedScale;
    
    if (this.minPopulation !== null && this.maxPopulation !== null) {
      const logMin = Math.log10(this.minPopulation);
      const logMax = Math.log10(this.maxPopulation);
      const logPop = Math.log10(population);
      
      const normalizedValue = 1 + 9 * ((logPop - logMin) / (logMax - logMin));
      
      normalizedScale = 0.05 + (normalizedValue - 1) * 0.02;
    } else {
      const logPopulation = Math.log10(population);
      normalizedScale = Math.max(0.05, Math.min(0.15, logPopulation * 0.02));
    }
    
    console.log(`City: ${city.name}, Population: ${population}, Scale: ${normalizedScale}`);
    
    // Determine marker color based on perception gap
    const perceptionGap = city.perceivedPopulation - city.officialPopulation;
    const percentageOff = (perceptionGap / city.officialPopulation) * 100;
    let markerColor;
    
    if (percentageOff > 50) {
      markerColor = 0xff0000;
    } else if (percentageOff > 0) {
      markerColor = 0xff6a00;
    } else if (percentageOff < -50) {
      markerColor = 0x0066ff;
    } else {
      markerColor = 0x3399ff;
    }
    
    const pinGroup = new THREE.Group();
    
    const pinGeometry = new THREE.PlaneGeometry(1, 1.3);
    
    const canvas = document.createElement('canvas');
    canvas.width = 128;
    canvas.height = 166;
    const context = canvas.getContext('2d');
    
    if (context) {
      context.fillStyle = '#' + markerColor.toString(16).padStart(6, '0');
      
      context.beginPath();
      context.moveTo(64, 166);
      context.lineTo(20, 80);
      context.arc(64, 64, 44, Math.PI, 0, false);
      context.lineTo(108, 80);
      context.closePath();
      context.fill();
      
      context.fillStyle = 'white';
      context.beginPath();
      context.arc(64, 64, 25, 0, Math.PI * 2, false);
      context.fill();
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    const pinMaterial = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide,
      alphaTest: 0.1
    });
    
    const pin = new THREE.Mesh(pinGeometry, pinMaterial);
    
    pin.geometry.translate(0, 0, 0);
    
    pinGroup.add(pin);
    
    pinGroup.scale.set(normalizedScale, normalizedScale, normalizedScale);
    
    pinGroup.position.set(0, 0.05, 0);
    
    cityGroup.add(pinGroup);
    
    const labelGeometry = new THREE.PlaneGeometry(0.1, 0.05);
    const labelMaterial = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      side: THREE.DoubleSide
    });
    
    const label = new THREE.Mesh(labelGeometry, labelMaterial);
    label.position.set(0, normalizedScale * 0.7, 0);
    label.userData = { isLabel: true, cityName: city.name };
    cityGroup.add(label);
    
    cityGroup.userData.isVisible = true;
    cityGroup.userData.isMarker = true;
    
    return cityGroup;
  }
}
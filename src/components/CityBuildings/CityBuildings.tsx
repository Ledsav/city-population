import { CityWithPerceptions } from '@/types';
import * as THREE from 'three';

export class CityBuildings {
  static createCityModel(
    city: CityWithPerceptions, 
    population: number, 
    position: [number, number, number]
  ): THREE.Group {
    const cityGroup = new THREE.Group();
    cityGroup.userData = { cityId: city.id };
    cityGroup.position.set(position[0], position[1], position[2]);
    cityGroup.lookAt(0, 0, 0);
    cityGroup.rotateX(Math.PI / 2);

    const logPopulation = Math.log10(population);
    console.log(logPopulation);
    const cityScale = Math.max(0.04, Math.min(0.09, logPopulation));
    const buildingCount = Math.floor(Math.max(5, logPopulation * 2));

    // Radius determines how spread out the buildings are around the center
    const radius = 0.08; // Adjust this value to control building concentration

    const percentageOff = (city.perceptions.perceptionGap / city.officialPopulation) * 100;
    let primaryColor, secondaryColor;
    if (percentageOff > 50) {
      primaryColor = 0xff6b6b; secondaryColor = 0xff3b3b;
    } else if (percentageOff > 0) {
      primaryColor = 0xffc259; secondaryColor = 0xffa500;
    } else if (percentageOff < -50) {
      primaryColor = 0x60a5fa; secondaryColor = 0x3b82f6;
    } else {
      primaryColor = 0x93c5fd; secondaryColor = 0x3b82f6;
    }

    const buildingGeometry = new THREE.BoxGeometry(0.05, 0.05, 0.05);
    const buildingMaterial = new THREE.MeshStandardMaterial({ color: secondaryColor, metalness: 0.5, roughness: 0.3 });
    const buildings = new THREE.InstancedMesh(buildingGeometry, buildingMaterial, buildingCount);

    for (let i = 0; i < buildingCount; i++) {
      const dummy = new THREE.Object3D();
      dummy.position.set((Math.random() - 0.5) * radius, 0, (Math.random() - 0.5) * radius); // Controlled radius
      dummy.scale.set(0.2, Math.random() * cityScale * 10 + 0.5, 0.2);
      dummy.updateMatrix();
      buildings.setMatrixAt(i, dummy.matrix);
    }
    cityGroup.add(buildings);

    const haloGeometry = new THREE.RingGeometry(0.16, 0.18, 64);
    const haloMaterial = new THREE.MeshStandardMaterial({ 
      color: primaryColor,
      transparent: true,
      opacity: 0.3,
      side: THREE.DoubleSide,
      emissive: primaryColor,
      emissiveIntensity: 0.2
    });
    const halo = new THREE.Mesh(haloGeometry, haloMaterial);
    halo.position.y = -0.01;
    halo.rotation.x = -Math.PI / 2;
    halo.scale.set(cityScale*10, cityScale*10, 1);
    cityGroup.add(halo);

    return cityGroup;
  }
}
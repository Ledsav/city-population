// src/types/three.d.ts
import * as THREE from 'three';
export = THREE;
export as namespace THREE;

declare module 'three/examples/jsm/controls/OrbitControls' {
  import { Camera } from 'three';
  export class OrbitControls {
    constructor(camera: Camera, domElement?: HTMLElement);
    // Add other properties as needed
  }
}
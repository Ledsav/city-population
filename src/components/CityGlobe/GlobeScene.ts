import {
  AdditiveBlending,
  AmbientLight,
  BackSide,
  BufferGeometry,
  CircleGeometry,
  Color,
  DirectionalLight,
  Float32BufferAttribute,
  InstancedMesh,
  MathUtils,
  Mesh,
  MeshBasicMaterial,
  MeshPhongMaterial,
  Object3D,
  PerspectiveCamera,
  Points,
  PointsMaterial,
  Quaternion,
  Raycaster,
  RingGeometry,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  SRGBColorSpace,
  Texture,
  TextureLoader,
  Vector2,
  Vector3,
  WebGLRenderer,
} from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import { cityGap, GAP_COLORS } from '../../lib/perception';
import type { City } from '../../services/firebase';

const RADIUS = 2;
const TEXTURES = `${process.env.PUBLIC_URL}/textures`;

type Options = {
  onSelect: (cityId: string | null) => void;
};

type Marker = {
  city: City;
  position: Vector3;
  size: number;
  label: HTMLButtonElement;
  labelWidth: number;
};

const toVector = (lat: number, lon: number, r = RADIUS) => {
  const phi = MathUtils.degToRad(90 - lat);
  const theta = MathUtils.degToRad(lon + 180);
  return new Vector3(
    -r * Math.sin(phi) * Math.cos(theta),
    r * Math.cos(phi),
    r * Math.sin(phi) * Math.sin(theta)
  );
};

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/** Device hints used to pick texture sizes and optional layers. */
const lowPower = () => {
  const nav = navigator as Navigator & { connection?: { saveData?: boolean }; deviceMemory?: number };
  return (
    !!nav.connection?.saveData ||
    (nav.deviceMemory !== undefined && nav.deviceMemory <= 4) ||
    window.matchMedia('(max-width: 760px)').matches
  );
};

/**
 * Owns the three.js scene. Renders on demand only: a frame is drawn when the camera moves,
 * a fly-to tween runs, auto-rotate is on, or something changes. Idle = zero GPU work.
 */
export class GlobeScene {
  private renderer: WebGLRenderer;
  private scene = new Scene();
  private camera: PerspectiveCamera;
  private controls: OrbitControls;
  private globe: Mesh<SphereGeometry, MeshPhongMaterial>;
  private clouds: Mesh<SphereGeometry, MeshPhongMaterial> | null = null;
  private dots: InstancedMesh | null = null;
  private halos: InstancedMesh | null = null;
  private selectionRing: Mesh<RingGeometry, MeshBasicMaterial>;
  private markers: Marker[] = [];
  private selectedId: string | null = null;
  private frame: number | null = null;
  private lastTime = 0;
  private tween: { from: Quaternion; to: Quaternion; dist: [number, number]; start: number } | null = null;
  private resizeObserver: ResizeObserver;
  private raycaster = new Raycaster();
  private pointer = new Vector2();
  private downAt: { x: number; y: number } | null = null;
  private disposed = false;
  private reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  constructor(
    private container: HTMLElement,
    private labelLayer: HTMLElement,
    private options: Options
  ) {
    const { clientWidth: w, clientHeight: h } = container;

    this.renderer = new WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, lowPower() ? 1.5 : 2));
    this.renderer.setSize(w, h);
    this.renderer.setClearColor(0x071324, 1);
    container.appendChild(this.renderer.domElement);

    this.camera = new PerspectiveCamera(42, w / h, 0.1, 200);
    this.camera.position.set(0, 1.4, 6.4);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.5;
    this.controls.zoomSpeed = 0.6;
    this.controls.enablePan = false;
    this.controls.minDistance = 3.2;
    this.controls.maxDistance = 9;
    this.controls.autoRotateSpeed = 0.35;
    this.controls.addEventListener('change', this.invalidate);
    this.controls.addEventListener('start', this.cancelTween);

    // Globe: a plain colour until the texture arrives, so the first frame is instant.
    this.globe = new Mesh(
      new SphereGeometry(RADIUS, 96, 64),
      new MeshPhongMaterial({ color: 0x1d3b5c, shininess: 14, specular: new Color(0x223344) })
    );
    this.scene.add(this.globe);
    this.scene.add(this.createAtmosphere());
    this.scene.add(this.createStars());

    this.scene.add(new AmbientLight(0x9fb4d0, 0.9));
    const sun = new DirectionalLight(0xffffff, 2.4);
    sun.position.set(-4, 3, 5);
    this.camera.add(sun); // light follows the camera so the visible side is always lit
    this.scene.add(this.camera);

    this.selectionRing = new Mesh(
      new RingGeometry(1, 1.18, 48),
      new MeshBasicMaterial({ color: 0xffb547, transparent: true, depthWrite: false })
    );
    this.selectionRing.visible = false;
    this.scene.add(this.selectionRing);

    this.loadTextures();

    this.resizeObserver = new ResizeObserver(this.resize);
    this.resizeObserver.observe(container);

    const canvas = this.renderer.domElement;
    canvas.addEventListener('pointerdown', this.onPointerDown);
    canvas.addEventListener('pointerup', this.onPointerUp);
    canvas.addEventListener('pointermove', this.onPointerMove);

    this.invalidate();
  }

  /* ---------- Public API ---------- */

  setCities(cities: City[]) {
    this.clearMarkers();
    if (!cities.length) return;

    const pops = cities.map((c) => c.officialPopulation);
    const maxPop = Math.max(...pops);
    const dotGeometry = new CircleGeometry(1, 24);
    this.dots = new InstancedMesh(
      dotGeometry,
      new MeshBasicMaterial({ polygonOffset: true, polygonOffsetFactor: -2 }),
      cities.length
    );
    this.halos = new InstancedMesh(
      dotGeometry,
      new MeshBasicMaterial({ transparent: true, opacity: 0.22, depthWrite: false, blending: AdditiveBlending }),
      cities.length
    );

    const dummy = new Object3D();
    const color = new Color();

    cities.forEach((city, i) => {
      const position = toVector(city.coordinates.latitude, city.coordinates.longitude, RADIUS + 0.004);
      // Area, not radius, tracks population — like the logo's halftone dots.
      const size = 0.014 + 0.034 * Math.sqrt(city.officialPopulation / maxPop);
      dummy.position.copy(position);
      dummy.lookAt(position.clone().multiplyScalar(2));
      dummy.scale.setScalar(size);
      dummy.updateMatrix();
      this.dots!.setMatrixAt(i, dummy.matrix);
      dummy.scale.setScalar(size * 1.7);
      dummy.updateMatrix();
      this.halos!.setMatrixAt(i, dummy.matrix);

      color.setHex(GAP_COLORS[cityGap(city)]);
      this.dots!.setColorAt(i, color);
      this.halos!.setColorAt(i, color);

      const label = document.createElement('button');
      label.type = 'button';
      label.className = `globe-label gap-${cityGap(city)}`;
      label.textContent = city.name;
      label.tabIndex = -1;
      label.addEventListener('click', () => this.options.onSelect(city.id));
      this.labelLayer.appendChild(label);

      this.markers.push({ city, position, size, label, labelWidth: city.name.length * 7.4 + 22 });
    });

    this.scene.add(this.halos, this.dots);
    this.applySelection();
    this.invalidate();
  }

  setSelected(cityId: string | null, fly = true) {
    this.selectedId = cityId;
    this.applySelection();
    const marker = this.markers.find((m) => m.city.id === cityId);
    if (marker && fly) this.flyTo(marker.position);
    this.invalidate();
  }

  setAutoRotate(on: boolean) {
    this.controls.autoRotate = on;
    this.invalidate();
  }

  dispose() {
    this.disposed = true;
    if (this.frame !== null) cancelAnimationFrame(this.frame);
    this.resizeObserver.disconnect();
    this.controls.dispose();
    const canvas = this.renderer.domElement;
    canvas.removeEventListener('pointerdown', this.onPointerDown);
    canvas.removeEventListener('pointerup', this.onPointerUp);
    canvas.removeEventListener('pointermove', this.onPointerMove);
    this.clearMarkers();
    this.scene.traverse((obj) => {
      const mesh = obj as Mesh;
      mesh.geometry?.dispose();
      const materials = Array.isArray(mesh.material) ? mesh.material : mesh.material ? [mesh.material] : [];
      materials.forEach((m) => {
        Object.values(m).forEach((v) => v instanceof Texture && v.dispose());
        m.dispose();
      });
    });
    this.renderer.dispose();
    canvas.remove();
  }

  /* ---------- Scene building ---------- */

  private loadTextures() {
    const loader = new TextureLoader();
    const low = lowPower();
    const load = (name: string, srgb = false) =>
      loader.loadAsync(`${TEXTURES}/${name}`).then((t) => {
        if (srgb) t.colorSpace = SRGBColorSpace;
        t.anisotropy = Math.min(8, this.renderer.capabilities.getMaxAnisotropy());
        return t;
      });

    const material = this.globe.material;

    // 2K first (already preloaded by index.html), then upgrade to 4K on capable devices.
    load('earth-day-2k.webp', true)
      .then((map) => {
        if (this.disposed) return map.dispose();
        material.map = map;
        material.color.set(0xffffff);
        material.needsUpdate = true;
        this.invalidate();
        if (!low) {
          load('earth-day-4k.webp', true).then((hi) => {
            if (this.disposed) return hi.dispose();
            material.map = hi;
            map.dispose();
            this.invalidate();
          });
        }
      })
      .catch(() => {
        /* keep the flat-colour globe */
      });

    Promise.all([load('earth-normal-2k.webp'), load('earth-specular-2k.webp')])
      .then(([normal, specular]) => {
        if (this.disposed) return;
        material.normalMap = normal;
        material.normalScale.set(0.6, 0.6);
        material.specularMap = specular;
        material.needsUpdate = true;
        this.invalidate();
      })
      .catch(() => {});

    if (!low) {
      load('earth-clouds-2k.webp')
        .then((alpha) => {
          if (this.disposed) return alpha.dispose();
          this.clouds = new Mesh(
            new SphereGeometry(RADIUS + 0.02, 64, 48),
            new MeshPhongMaterial({ alphaMap: alpha, transparent: true, opacity: 0.55, depthWrite: false })
          );
          this.scene.add(this.clouds);
          this.invalidate();
        })
        .catch(() => {});
    }
  }

  private createAtmosphere() {
    const material = new ShaderMaterial({
      vertexShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          vNormal = normalize(normalMatrix * normal);
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }`,
      fragmentShader: /* glsl */ `
        varying vec3 vNormal;
        void main() {
          float i = pow(0.72 - dot(vNormal, vec3(0.0, 0.0, 1.0)), 3.0);
          gl_FragColor = vec4(0.31, 0.68, 1.0, 1.0) * i;
        }`,
      side: BackSide,
      blending: AdditiveBlending,
      transparent: true,
      depthWrite: false,
    });
    return new Mesh(new SphereGeometry(RADIUS * 1.12, 64, 48), material);
  }

  private createStars() {
    const positions: number[] = [];
    const v = new Vector3();
    for (let i = 0; i < 1800; i++) {
      v.randomDirection().multiplyScalar(MathUtils.randFloat(40, 90));
      positions.push(v.x, v.y, v.z);
    }
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3));
    return new Points(
      geometry,
      new PointsMaterial({ color: 0xbcd3ee, size: 1.4, sizeAttenuation: false, transparent: true, opacity: 0.7 })
    );
  }

  private clearMarkers() {
    this.markers.forEach((m) => m.label.remove());
    this.markers = [];
    [this.dots, this.halos].forEach((mesh) => {
      if (!mesh) return;
      this.scene.remove(mesh);
      mesh.geometry.dispose();
      (mesh.material as MeshBasicMaterial).dispose();
      mesh.dispose();
    });
    this.dots = this.halos = null;
  }

  private applySelection() {
    const marker = this.markers.find((m) => m.city.id === this.selectedId);
    this.markers.forEach((m) => m.label.classList.toggle('is-selected', m === marker));
    if (!marker) {
      this.selectionRing.visible = false;
      return;
    }
    this.selectionRing.position.copy(marker.position).multiplyScalar(1.0015);
    this.selectionRing.lookAt(marker.position.clone().multiplyScalar(2));
    this.selectionRing.scale.setScalar(marker.size * 2);
    this.selectionRing.visible = true;
  }

  /* ---------- Camera ---------- */

  private flyTo(target: Vector3) {
    const distance = Math.min(this.camera.position.length(), 5.6);
    if (this.reducedMotion) {
      this.camera.position.copy(target).setLength(distance);
      this.controls.update();
      return;
    }
    const from = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), this.camera.position.clone().normalize());
    const to = new Quaternion().setFromUnitVectors(new Vector3(0, 0, 1), target.clone().normalize());
    this.tween = { from, to, dist: [this.camera.position.length(), distance], start: performance.now() };
    this.invalidate();
  }

  private cancelTween = () => {
    this.tween = null;
  };

  /* ---------- Render loop ---------- */

  private invalidate = () => {
    if (this.frame === null && !this.disposed) this.frame = requestAnimationFrame(this.render);
  };

  private render = (time: number) => {
    this.frame = null;
    const dt = this.lastTime ? Math.min(time - this.lastTime, 100) : 16;
    this.lastTime = time;
    let animating = this.controls.autoRotate;

    if (this.tween) {
      const t = Math.min((time - this.tween.start) / 1100, 1);
      const k = easeInOutCubic(t);
      const q = this.tween.from.clone().slerp(this.tween.to, k);
      const length = MathUtils.lerp(this.tween.dist[0], this.tween.dist[1], k);
      this.camera.position.set(0, 0, 1).applyQuaternion(q).multiplyScalar(length);
      this.camera.lookAt(0, 0, 0);
      if (t >= 1) this.tween = null;
      animating = true;
    }

    // update() returns true while damping is still settling.
    if (this.controls.update()) animating = true;

    if (this.clouds && animating) this.clouds.rotation.y += dt * 0.000008;

    this.renderer.render(this.scene, this.camera);
    this.updateLabels();

    if (animating) {
      this.lastTime = time;
      this.invalidate();
    } else {
      this.lastTime = 0;
    }
  };

  private projected = new Vector3();
  private toCamera = new Vector3();

  /** Positions HTML labels over visible markers; larger cities win when labels collide. */
  private updateLabels() {
    const w = this.container.clientWidth;
    const h = this.container.clientHeight;
    const camPos = this.camera.position;
    const placed: Array<[number, number, number, number]> = [];

    const order = [...this.markers].sort((a, b) =>
      a.city.id === this.selectedId ? -1 : b.city.id === this.selectedId ? 1 : b.city.officialPopulation - a.city.officialPopulation
    );

    for (const m of order) {
      this.toCamera.copy(camPos).sub(m.position).normalize();
      const facing = this.toCamera.dot(this.projected.copy(m.position).normalize());
      let visible = facing > 0.2;

      let x = 0;
      let y = 0;
      if (visible) {
        this.projected.copy(m.position).project(this.camera);
        x = (this.projected.x * 0.5 + 0.5) * w;
        y = (-this.projected.y * 0.5 + 0.5) * h;
        const box: [number, number, number, number] = [x + 10, y - 11, x + 10 + m.labelWidth, y + 11];
        const overlaps = placed.some((p) => box[0] < p[2] && box[2] > p[0] && box[1] < p[3] && box[3] > p[1]);
        if (overlaps && m.city.id !== this.selectedId) visible = false;
        else placed.push(box);
      }

      m.label.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
      m.label.classList.toggle('is-visible', visible);
      m.label.tabIndex = visible ? 0 : -1;
    }
  }

  /* ---------- Input ---------- */

  private resize = () => {
    const { clientWidth: w, clientHeight: h } = this.container;
    if (!w || !h) return;
    this.camera.aspect = w / h;
    // Pull back on narrow screens so the whole globe fits.
    this.camera.fov = w < h ? 56 : 42;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.invalidate();
  };

  private hitTest(event: PointerEvent): string | null {
    if (!this.halos) return null;
    const rect = this.renderer.domElement.getBoundingClientRect();
    this.pointer.set(((event.clientX - rect.left) / rect.width) * 2 - 1, -((event.clientY - rect.top) / rect.height) * 2 + 1);
    this.raycaster.setFromCamera(this.pointer, this.camera);
    const [hit] = this.raycaster.intersectObjects([this.globe, this.halos], false);
    return hit?.object === this.halos && hit.instanceId !== undefined ? this.markers[hit.instanceId].city.id : null;
  }

  private onPointerDown = (event: PointerEvent) => {
    this.downAt = { x: event.clientX, y: event.clientY };
  };

  private onPointerUp = (event: PointerEvent) => {
    if (!this.downAt) return;
    const moved = Math.hypot(event.clientX - this.downAt.x, event.clientY - this.downAt.y);
    this.downAt = null;
    if (moved > 5) return; // that was a drag, not a click
    this.options.onSelect(this.hitTest(event));
  };

  private onPointerMove = (event: PointerEvent) => {
    if (event.pointerType !== 'mouse' || event.buttons) return;
    this.renderer.domElement.style.cursor = this.hitTest(event) ? 'pointer' : '';
  };
}

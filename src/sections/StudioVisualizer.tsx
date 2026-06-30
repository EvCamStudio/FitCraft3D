import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Helper: process dark/black baseColorTexture to light-gray colorable texture
function processTshirtTexture(texture: THREE.Texture | null): THREE.Texture | null {
  if (!texture || !texture.image) return texture;
  const img = texture.image as HTMLImageElement;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.width || 1024;
    canvas.height = img.height || 1024;
    const ctx = canvas.getContext('2d');
    if (!ctx) return texture;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;
    for (let i = 0; i < data.length; i += 4) {
      const r = data[i], g = data[i + 1], b = data[i + 2];
      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      const newLuma = Math.min(255, 175 + luma * 1.6);
      data[i] = newLuma;
      data[i + 1] = newLuma;
      data[i + 2] = newLuma;
    }
    ctx.putImageData(imgData, 0, 0);
    const newTexture = new THREE.CanvasTexture(canvas);
    newTexture.wrapS = texture.wrapS;
    newTexture.wrapT = texture.wrapT;
    newTexture.needsUpdate = true;
    return newTexture;
  } catch {
    return texture;
  }
}

export interface DecalConfig {
  type: 'preset' | 'custom' | 'none';
  presetName: string;
  customImage: string | null;
  customImageName: string;
  text: string;
  textFont: string;
  textColor: string;
  
  // Logo specific properties
  logoScale: number;
  logoVertical: number;
  logoHorizontal: number;
  logoOpacity: number;
  logoLocalPos?: { x: number; y: number; z: number } | null;
  logoLocalNormal?: { x: number; y: number; z: number } | null;

  // Text specific properties
  textScale: number;
  textVertical: number;
  textHorizontal: number;
  textOpacity: number;
  textLocalPos?: { x: number; y: number; z: number } | null;
  textLocalNormal?: { x: number; y: number; z: number } | null;

  layerOrder?: ('logo' | 'text')[];
}

interface StudioVisualizerProps {
  garmentType: 'hoodie' | 'tshirt' | 'sweater';
  colors: { body: string; sleeves: string; collar: string };
  fabric: 'cotton' | 'fleece';
  size: string;
  lightingPreset: 'studio' | 'sunset' | 'industrial';
  decal: DecalConfig;
  autoRotate: boolean;
  isScaleView: boolean;
  activeLayer: 'logo' | 'text';
  onActiveLayerChange?: (layer: 'logo' | 'text') => void;
  onDecalDrag?: (layer: 'logo' | 'text', coords: { horizontal: number; vertical: number; localPos?: { x: number; y: number; z: number } | null; localNormal?: { x: number; y: number; z: number } | null }) => void;
  exportTrigger: number;
  onExportComplete?: (dataUrl: string | null) => void;
  onReady?: () => void;
  onProgress?: (progress: number) => void;
}

export default function StudioVisualizer({
  garmentType,
  colors,
  fabric,
  size,
  lightingPreset,
  decal,
  autoRotate,
  isScaleView,
  activeLayer,
  onActiveLayerChange,
  onDecalDrag,
  exportTrigger,
  onExportComplete,
  onReady,
  onProgress,
}: StudioVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);

  const engineRef = useRef<{
    scene: THREE.Scene | null;
    camera: THREE.PerspectiveCamera | null;
    renderer: THREE.WebGLRenderer | null;
    controls: OrbitControls | null;
    garmentGroup: THREE.Group | null;
    lightsGroup: THREE.Group | null;
    logoMesh: THREE.Mesh | null;
    logoOutline: THREE.LineSegments | null;
    textMesh: THREE.Mesh | null;
    textOutline: THREE.LineSegments | null;
    garmentMaterial: THREE.MeshStandardMaterial | null;
    sleevesMaterial: THREE.MeshStandardMaterial | null;
    collarMaterial: THREE.MeshStandardMaterial | null;
    fabricBumpTextures: Record<string, THREE.CanvasTexture>;
    activeLogoTexture: THREE.CanvasTexture | null;
    activeTextTexture: THREE.CanvasTexture | null;
    activeDragLayer: 'logo' | 'text' | null;
    isDraggingDecal: boolean;
    isPointerDown: boolean;
    autoRotateActive: boolean;
    modelFrontZ: number;
    bodyMesh: THREE.Mesh | null;
  }>({
    scene: null, camera: null, renderer: null, controls: null,
    garmentGroup: null, lightsGroup: null, 
    logoMesh: null, logoOutline: null, textMesh: null, textOutline: null,
    garmentMaterial: null, sleevesMaterial: null, collarMaterial: null,
    fabricBumpTextures: {}, activeLogoTexture: null, activeTextTexture: null,
    activeDragLayer: null, isDraggingDecal: false, isPointerDown: false, autoRotateActive: false,
    modelFrontZ: 1.34, bodyMesh: null,
  });

  const stateRef = useRef({ colors, decal, garmentType, activeLayer, onActiveLayerChange, onDecalDrag, exportTrigger, onExportComplete });
  useEffect(() => {
    stateRef.current = { colors, decal, garmentType, activeLayer, onActiveLayerChange, onDecalDrag, exportTrigger, onExportComplete };
  }, [colors, decal, garmentType, activeLayer, onActiveLayerChange, onDecalDrag, exportTrigger, onExportComplete]);

  // Initialize Three.js
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current!,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0, 0);

    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);

    // Shadow plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d');
    if (shadowCtx) {
      const gradient = shadowCtx.createRadialGradient(64, 64, 5, 64, 64, 60);
      gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
      gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
      shadowCtx.fillStyle = gradient;
      shadowCtx.fillRect(0, 0, 128, 128);
    }
    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlaneGeom = new THREE.PlaneGeometry(4, 4);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({ map: shadowTexture, transparent: true, depthWrite: false });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.0;
    scene.add(shadowPlane);

    // Bump textures
    const fabricBumpTextures: Record<string, THREE.CanvasTexture> = {};

    // Cotton texture
    const cottonCanvas = document.createElement('canvas');
    cottonCanvas.width = 256;
    cottonCanvas.height = 256;
    const ctxCotton = cottonCanvas.getContext('2d');
    if (ctxCotton) {
      ctxCotton.fillStyle = '#808080';
      ctxCotton.fillRect(0, 0, 256, 256);
      ctxCotton.fillStyle = '#909090';
      for (let i = 0; i < 256; i += 4) {
        ctxCotton.fillRect(i, 0, 2, 256);
        ctxCotton.fillRect(0, i, 256, 2);
      }
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const val = 120 + Math.random() * 16;
        ctxCotton.fillStyle = `rgb(${val},${val},${val})`;
        ctxCotton.fillRect(x, y, 1, 1);
      }
    }
    const cottonTexture = new THREE.CanvasTexture(cottonCanvas);
    cottonTexture.wrapS = THREE.RepeatWrapping;
    cottonTexture.wrapT = THREE.RepeatWrapping;
    cottonTexture.repeat.set(16, 16);
    fabricBumpTextures['cotton'] = cottonTexture;

    // Fleece texture
    const fleeceCanvas = document.createElement('canvas');
    fleeceCanvas.width = 256;
    fleeceCanvas.height = 256;
    const ctxFleece = fleeceCanvas.getContext('2d');
    if (ctxFleece) {
      ctxFleece.fillStyle = '#808080';
      ctxFleece.fillRect(0, 0, 256, 256);
      for (let i = 0; i < 4000; i++) {
        const x = Math.random() * 256;
        const y = Math.random() * 256;
        const radius = 1 + Math.random() * 3;
        const val = 110 + Math.random() * 35;
        ctxFleece.fillStyle = `rgb(${val},${val},${val})`;
        ctxFleece.beginPath();
        ctxFleece.arc(x, y, radius, 0, Math.PI * 2);
        ctxFleece.fill();
      }
    }
    const fleeceTexture = new THREE.CanvasTexture(fleeceCanvas);
    fleeceTexture.wrapS = THREE.RepeatWrapping;
    fleeceTexture.wrapT = THREE.RepeatWrapping;
    fleeceTexture.repeat.set(10, 10);
    fabricBumpTextures['fleece'] = fleeceTexture;

    // Materials
    const garmentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(colors.body),
      roughness: 0.85,
      metalness: 0.05,
      bumpMap: fabricBumpTextures['cotton'],
      bumpScale: 0.035,
      side: THREE.DoubleSide,
    });
    const sleevesMaterial = garmentMaterial.clone();
    const collarMaterial = garmentMaterial.clone();

    engineRef.current = {
      scene, camera, renderer, controls, garmentGroup, lightsGroup,
      garmentMaterial, sleevesMaterial, collarMaterial, fabricBumpTextures,
      logoMesh: null, logoOutline: null, textMesh: null, textOutline: null,
      activeLogoTexture: null, activeTextTexture: null, activeDragLayer: null,
      isDraggingDecal: false, isPointerDown: false, autoRotateActive: autoRotate,
      modelFrontZ: 1.34, bodyMesh: null,
    };

    // Drag events
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e: PointerEvent) => {
      const eng = engineRef.current;
      if (!eng.renderer || !eng.camera || !eng.garmentGroup) return;
      const rect = eng.renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(mouse, eng.camera);

      // Step 1: Direct raycast against logo and text mesh planes
      const decalTargets: THREE.Object3D[] = [];
      if (eng.logoMesh) decalTargets.push(eng.logoMesh);
      if (eng.textMesh) decalTargets.push(eng.textMesh);

      let clickedLayer: 'logo' | 'text' | null = null;

      if (decalTargets.length > 0) {
        const decalHits = raycaster.intersectObjects(decalTargets, false);
        if (decalHits.length > 0) {
          // Pick closest hit — if ray hits both, closest to camera wins
          const closest = decalHits[0];
          clickedLayer = closest.object === eng.logoMesh ? 'logo' : 'text';
        }
      }

      // Step 2: If direct hit missed, try garment surface proximity
      if (!clickedLayer) {
        const allIntersects = raycaster.intersectObjects(eng.garmentGroup.children, true);
        const garmentHits = allIntersects.filter(item => 
          item.object !== eng.logoMesh && 
          item.object !== eng.logoOutline && 
          item.object !== eng.textMesh && 
          item.object !== eng.textOutline
        );

        if (garmentHits.length > 0) {
          const hit = garmentHits[0];
          const worldPoint = hit.point.clone();
          const localPoint = eng.garmentGroup.worldToLocal(worldPoint.clone());

          let minDist = 999;

          if (eng.logoMesh) {
            const distLogo = Math.sqrt(
              Math.pow(localPoint.x - eng.logoMesh.position.x, 2) +
              Math.pow(localPoint.y - eng.logoMesh.position.y, 2)
            );
            if (distLogo < 0.4 && distLogo < minDist) {
              minDist = distLogo;
              clickedLayer = 'logo';
            }
          }

          if (eng.textMesh) {
            const distText = Math.sqrt(
              Math.pow(localPoint.x - eng.textMesh.position.x, 2) +
              Math.pow(localPoint.y - eng.textMesh.position.y, 2)
            );
            if (distText < 0.4 && distText < minDist) {
              minDist = distText;
              clickedLayer = 'text';
            }
          }
        }
      }

      if (clickedLayer) {
        eng.isPointerDown = true;
        eng.isDraggingDecal = true;
        eng.activeDragLayer = clickedLayer;
        eng.controls!.enabled = false;
        eng.renderer.domElement.style.cursor = 'grabbing';

        if (stateRef.current.onActiveLayerChange) {
          stateRef.current.onActiveLayerChange(clickedLayer);
        }

        if (clickedLayer === 'logo' && eng.logoOutline) eng.logoOutline.visible = true;
        if (clickedLayer === 'text' && eng.textOutline) eng.textOutline.visible = true;
        e.stopPropagation();
      }
    };

    const onPointerMove = (e: PointerEvent) => {
      const eng = engineRef.current;
      if (!eng.renderer || !eng.camera || !eng.garmentGroup) return;
      const rect = eng.renderer.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (eng.isDraggingDecal && eng.activeDragLayer) {
        raycaster.setFromCamera(mouse, eng.camera);
        const allIntersects = raycaster.intersectObjects(eng.garmentGroup.children, true);
        const intersects = allIntersects.filter(item => 
          item.object !== eng.logoMesh && 
          item.object !== eng.logoOutline && 
          item.object !== eng.textMesh && 
          item.object !== eng.textOutline
        );
        
        if (intersects.length > 0) {
          const hit = intersects[0];
          const worldPoint = hit.point.clone();
          const worldNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 0, 1);
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
          worldNormal.applyMatrix3(normalMatrix).normalize();
          const localPoint = eng.garmentGroup.worldToLocal(worldPoint.clone());
          const ggWorldQuat = new THREE.Quaternion();
          eng.garmentGroup.getWorldQuaternion(ggWorldQuat);
          const localNormal = worldNormal.clone().applyQuaternion(ggWorldQuat.invert()).normalize();
          const currentGarment = stateRef.current.garmentType;
          const baseY = currentGarment === 'tshirt' ? 0.40 : 0.45;
          const verticalOffset = localPoint.y - baseY;
          const horizontalOffset = localPoint.x;

          if (stateRef.current.onDecalDrag && eng.activeDragLayer) {
            stateRef.current.onDecalDrag(eng.activeDragLayer, {
              horizontal: Number(horizontalOffset.toFixed(2)),
              vertical: Number(verticalOffset.toFixed(2)),
              localPos: { x: localPoint.x, y: localPoint.y, z: localPoint.z },
              localNormal: { x: localNormal.x, y: localNormal.y, z: localNormal.z },
            });
          }
        }
      } else {
        raycaster.setFromCamera(mouse, eng.camera);

        // Step 1: Direct raycast against decal planes
        const decalTargets: THREE.Object3D[] = [];
        if (eng.logoMesh) decalTargets.push(eng.logoMesh);
        if (eng.textMesh) decalTargets.push(eng.textMesh);

        let hoveredLayer: 'logo' | 'text' | null = null;

        if (decalTargets.length > 0) {
          const decalHits = raycaster.intersectObjects(decalTargets, false);
          if (decalHits.length > 0) {
            const closest = decalHits[0];
            hoveredLayer = closest.object === eng.logoMesh ? 'logo' : 'text';
          }
        }

        // Step 2: Fallback to garment surface proximity
        if (!hoveredLayer) {
          const allIntersects = raycaster.intersectObjects(eng.garmentGroup.children, true);
          const garmentHits = allIntersects.filter(item => 
            item.object !== eng.logoMesh && 
            item.object !== eng.logoOutline && 
            item.object !== eng.textMesh && 
            item.object !== eng.textOutline
          );

          if (garmentHits.length > 0) {
            const hit = garmentHits[0];
            const localPoint = eng.garmentGroup.worldToLocal(hit.point.clone());
            let minDist = 999;

            if (eng.logoMesh) {
              const d = Math.sqrt(
                Math.pow(localPoint.x - eng.logoMesh.position.x, 2) +
                Math.pow(localPoint.y - eng.logoMesh.position.y, 2)
              );
              if (d < 0.4 && d < minDist) { minDist = d; hoveredLayer = 'logo'; }
            }
            if (eng.textMesh) {
              const d = Math.sqrt(
                Math.pow(localPoint.x - eng.textMesh.position.x, 2) +
                Math.pow(localPoint.y - eng.textMesh.position.y, 2)
              );
              if (d < 0.4 && d < minDist) { hoveredLayer = 'text'; }
            }
          }
        }

        if (hoveredLayer) {
          eng.renderer.domElement.style.cursor = 'grab';
          if (hoveredLayer === 'logo' && eng.logoOutline) {
            eng.logoOutline.visible = true;
            if (eng.textOutline) eng.textOutline.visible = false;
          } else if (hoveredLayer === 'text' && eng.textOutline) {
            eng.textOutline.visible = true;
            if (eng.logoOutline) eng.logoOutline.visible = false;
          }
        } else {
          eng.renderer.domElement.style.cursor = 'default';
          if (eng.logoOutline) eng.logoOutline.visible = false;
          if (eng.textOutline) eng.textOutline.visible = false;
        }
      }
    };

    const onPointerUp = () => {
      const eng = engineRef.current;
      eng.isPointerDown = false;
      if (eng.isDraggingDecal) {
        eng.isDraggingDecal = false;
        eng.activeDragLayer = null;
        if (eng.controls) eng.controls.enabled = true;
        if (eng.renderer) eng.renderer.domElement.style.cursor = 'default';
      }
      if (eng.logoOutline) eng.logoOutline.visible = false;
      if (eng.textOutline) eng.textOutline.visible = false;
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // Animation loop
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let animationFrameId: number;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      frameCount++;
      const time = performance.now();
      if (time > lastFpsUpdate + 500) {
        frameCount = 0;
        lastFpsUpdate = time;
      }
      const eng = engineRef.current;
      if (eng.autoRotateActive && eng.garmentGroup && !eng.isDraggingDecal && !eng.isPointerDown) {
        eng.garmentGroup.rotation.y += 0.007;
        eng.garmentGroup.rotation.x += (0 - eng.garmentGroup.rotation.x) * 0.05;
      } else if (eng.garmentGroup) {
        eng.garmentGroup.rotation.x += (0 - eng.garmentGroup.rotation.x) * 0.05;
      }
      if (eng.controls) eng.controls.update();
      if (eng.renderer && eng.scene && eng.camera) {
        eng.renderer.render(eng.scene, eng.camera);
      }
    };
    animate();

    // Resize
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);
      scene.clear();
      renderer.dispose();
      garmentMaterial.dispose();
      sleevesMaterial.dispose();
      collarMaterial.dispose();
      Object.values(fabricBumpTextures).forEach(t => t.dispose());
      if (engineRef.current.activeLogoTexture) {
        engineRef.current.activeLogoTexture.dispose();
      }
      if (engineRef.current.activeTextTexture) {
        engineRef.current.activeTextTexture.dispose();
      }
    };
  }, []);

  // Auto rotate
  useEffect(() => {
    engineRef.current.autoRotateActive = autoRotate;
  }, [autoRotate]);

  // Lighting
  useEffect(() => {
    const { lightsGroup } = engineRef.current;
    if (!lightsGroup) return;
    while (lightsGroup.children.length > 0) {
      lightsGroup.remove(lightsGroup.children[0]);
    }

    let ambientLight: THREE.AmbientLight, mainLight: THREE.DirectionalLight, fillLight: THREE.DirectionalLight, rimLight: THREE.DirectionalLight;

    if (lightingPreset === 'studio') {
      ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      mainLight = new THREE.DirectionalLight(0xffffff, 0.85);
      mainLight.position.set(3, 4, 5);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(2048, 2048);
      mainLight.shadow.bias = -0.001;

      fillLight = new THREE.DirectionalLight(0xc8f5e0, 0.4);
      fillLight.position.set(-4, 2, 2);

      rimLight = new THREE.DirectionalLight(0x2de295, 0.5);
      rimLight.position.set(0, 5, -5);
    } else if (lightingPreset === 'sunset') {
      ambientLight = new THREE.AmbientLight(0xfdcba8, 0.35);
      mainLight = new THREE.DirectionalLight(0xf97316, 1.4);
      mainLight.position.set(4, 3, 4);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(2048, 2048);

      fillLight = new THREE.DirectionalLight(0x8b5cf6, 0.95);
      fillLight.position.set(-4, 1, 3);

      rimLight = new THREE.DirectionalLight(0xfdba74, 0.8);
      rimLight.position.set(-1, 4, -4);
    } else {
      ambientLight = new THREE.AmbientLight(0xe0f2fe, 0.4);
      mainLight = new THREE.DirectionalLight(0x38bdf8, 1.25);
      mainLight.position.set(-2, 5, 4);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(2048, 2048);

      fillLight = new THREE.DirectionalLight(0x475569, 0.7);
      fillLight.position.set(4, 2, 2);

      rimLight = new THREE.DirectionalLight(0xffffff, 1.1);
      rimLight.position.set(0, 4, -5);
    }

    lightsGroup.add(ambientLight);
    lightsGroup.add(mainLight);
    lightsGroup.add(fillLight);
    lightsGroup.add(rimLight);
  }, [lightingPreset]);

  // Fabric
  useEffect(() => {
    const { garmentGroup, fabricBumpTextures } = engineRef.current;
    const bumpMap = fabricBumpTextures[fabric];
    const bumpScale = fabric === 'fleece' ? 0.055 : 0.035;
    const roughness = fabric === 'fleece' ? 0.92 : 0.85;

    if (garmentGroup) {
      garmentGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material && child !== engineRef.current.logoMesh && child !== engineRef.current.textMesh) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat: THREE.Material) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              mat.bumpMap = bumpMap;
              mat.bumpScale = bumpScale;
              mat.roughness = roughness;
              mat.needsUpdate = true;
            }
          });
        }
      });
    }
  }, [fabric]);

  // Colors
  useEffect(() => {
    const { garmentGroup } = engineRef.current;
    if (garmentGroup) {
      garmentGroup.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material && child !== engineRef.current.logoMesh && child !== engineRef.current.textMesh) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach((mat: THREE.Material) => {
            if (mat instanceof THREE.MeshStandardMaterial) {
              const name = (child.name || mat.name || '').toLowerCase();
              let targetColor = colors.body;
              if (name.includes('sleeve') || name.includes('lengan') || name.includes('arm') || name.includes('hand') || name.includes('cuff')) {
                targetColor = colors.sleeves;
              } else if (name.includes('collar') || name.includes('kerah') || name.includes('rib') || name.includes('neck') || name.includes('detail') || name.includes('drawstring') || name.includes('pocket')) {
                targetColor = colors.collar;
              }
              mat.color.set(new THREE.Color(targetColor));
            }
          });
        }
      });
    }
    redrawDecal();
  }, [colors]);

  // Size
  useEffect(() => {
    const { garmentGroup } = engineRef.current;
    if (!garmentGroup) return;
    let targetScaleValue = 1.0;
    if (size === 'S') targetScaleValue = 0.92;
    else if (size === 'M') targetScaleValue = 1.0;
    else if (size === 'L') targetScaleValue = 1.08;
    else if (size === 'XL') targetScaleValue = 1.15;
    else if (size === 'XXL') targetScaleValue = 1.22;

    const startScale = garmentGroup.scale.x;
    const startTime = performance.now();
    const duration = 400;
    const animateScale = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      const currentVal = startScale + (targetScaleValue - startScale) * ease;
      garmentGroup.scale.set(currentVal, currentVal, currentVal);
      if (progress < 1) requestAnimationFrame(animateScale);
    };
    animateScale();
  }, [size]);

  // Zoom/Scale View
  useEffect(() => {
    const { camera, controls } = engineRef.current;
    if (!camera || !controls) return;
    const targetZ = isScaleView ? 4.5 : 8.0;
    const targetY = isScaleView ? 0.35 : 0;
    controls.enabled = false;
    const startTime = performance.now();
    const duration = 600;
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    const zoomCam = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3);
      controls.target.x = startTarget.x + (0 - startTarget.x) * ease;
      controls.target.y = startTarget.y + (targetY - startTarget.y) * ease;
      controls.target.z = startTarget.z + (0 - startTarget.z) * ease;
      camera.position.y = startPos.y + (targetY - startPos.y) * ease;
      camera.position.z = startPos.z + (targetZ - startPos.z) * ease;
      controls.update();
      if (progress < 1) requestAnimationFrame(zoomCam);
      else controls.enabled = true;
    };
    zoomCam();
  }, [isScaleView]);

  // Garment Type Change
  useEffect(() => {
    setTimeout(() => setLoading(true), 0);
    const eng = engineRef.current;
    if (!eng.garmentGroup) return;

    while (eng.garmentGroup.children.length > 0) {
      eng.garmentGroup.remove(eng.garmentGroup.children[0]);
    }
    eng.bodyMesh = null;

    const glbPaths: Record<string, string> = {
      hoodie: './assets/models/black hoodie 3d model.glb',
      tshirt: './assets/models/black t shirt 3d model.glb',
      sweater: './assets/models/knitted crewneck sweater 3d model.glb',
    };
    const glbPath = glbPaths[garmentType];

    if (glbPath) {
      const loader = new GLTFLoader();
      loader.load(
        glbPath,
        (gltf) => {
          const model = gltf.scene;
          const box = new THREE.Box3().setFromObject(model);
          const sizeVec = box.getSize(new THREE.Vector3());
          const centerVec = box.getCenter(new THREE.Vector3());

          model.position.x += (model.position.x - centerVec.x);
          model.position.y += (model.position.y - centerVec.y);
          model.position.z += (model.position.z - centerVec.z);

          const targetHeight = 2.7;
          const scaleFactor = targetHeight / sizeVec.y;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);
          model.rotation.y = -Math.PI / 2;
          model.updateMatrixWorld(true);

          model.traverse((child) => {
            if (child instanceof THREE.Mesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              if (child.material) {
                const assignMaterial = (mat: THREE.Material) => {
                  if (!mat) return mat;
                  const orig = mat.clone();
                  const name = (child.name || mat.name || '').toLowerCase();
                  const cfg = stateRef.current.colors;
                  let targetColor = cfg.body;
                  if (name.includes('sleeve') || name.includes('lengan') || name.includes('arm') || name.includes('hand') || name.includes('cuff')) {
                    targetColor = cfg.sleeves;
                  } else if (name.includes('collar') || name.includes('kerah') || name.includes('rib') || name.includes('neck') || name.includes('detail') || name.includes('drawstring') || name.includes('pocket')) {
                    targetColor = cfg.collar;
                  }
                  if (orig instanceof THREE.MeshStandardMaterial) {
                    orig.color.set(new THREE.Color(targetColor));
                    orig.roughness = 0.85;
                    orig.metalness = 0.05;
                    orig.bumpMap = eng.fabricBumpTextures['cotton'];
                    orig.bumpScale = 0.035;
                    orig.side = THREE.DoubleSide;
                    if (orig.map) {
                      orig.map = processTshirtTexture(orig.map);
                    }
                  }
                  return orig;
                };

                if (Array.isArray(child.material)) {
                  child.material = child.material.map(assignMaterial);
                } else {
                  child.material = assignMaterial(child.material);
                }
                if (!eng.garmentMaterial) {
                  const firstMat = Array.isArray(child.material) ? child.material[0] : child.material;
                  if (firstMat instanceof THREE.MeshStandardMaterial) eng.garmentMaterial = firstMat;
                }
              }
              if (!eng.bodyMesh) eng.bodyMesh = child;
            }
          });

          eng.garmentGroup!.add(model);
          eng.garmentGroup!.position.y = -0.2;

          const modelFrontZ = (sizeVec.z / 2) * scaleFactor;
          eng.modelFrontZ = modelFrontZ;

          rebuildBadgePlane(modelFrontZ);
          setTimeout(() => {
            setLoading(false);
            if (onReady) onReady();
          }, 100);
        },
        (xhr) => {
          if (onProgress && xhr.total > 0) {
            onProgress(Math.min(95, (xhr.loaded / xhr.total) * 100));
          }
        },
        () => {
          // Error fallback
          eng.modelFrontZ = 1.34;
          buildProceduralGarment(garmentType);
          setLoading(false);
          if (onReady) onReady();
        }
      );
    } else {
      eng.modelFrontZ = 1.34;
      buildProceduralGarment(garmentType);
      setTimeout(() => setLoading(false), 0);
    }
  }, [garmentType]);

  // Decal redraw
  useEffect(() => {
    redrawDecal();
  }, [
    decal.type, decal.presetName, decal.customImage, decal.text, decal.textFont, decal.textColor,
    decal.logoScale, decal.logoVertical, decal.logoHorizontal, decal.logoOpacity,
    decal.textScale, decal.textVertical, decal.textHorizontal, decal.textOpacity,
    decal.layerOrder, colors.body
  ]);

  // Export
  useEffect(() => {
    if (exportTrigger > 0 && engineRef.current.renderer) {
      setTimeout(() => {
        try {
          const canvas = canvasRef.current;
          if (!canvas) return;
          const dataUrl = canvas.toDataURL('image/png');
          if (onExportComplete) onExportComplete(dataUrl);
        } catch {
          if (onExportComplete) onExportComplete(null);
        }
      }, 100);
    }
  }, [exportTrigger, onExportComplete]);

  function rebuildBadgePlane(modelFrontZ: number | null = null) {
    const eng = engineRef.current;
    
    // Clean old logo mesh
    if (eng.logoMesh) {
      eng.garmentGroup?.remove(eng.logoMesh);
      eng.logoMesh.geometry?.dispose();
      if (eng.logoMesh.material instanceof THREE.Material) eng.logoMesh.material.dispose();
      eng.logoMesh = null;
      eng.logoOutline = null;
    }
    // Clean old text mesh
    if (eng.textMesh) {
      eng.garmentGroup?.remove(eng.textMesh);
      eng.textMesh.geometry?.dispose();
      if (eng.textMesh.material instanceof THREE.Material) eng.textMesh.material.dispose();
      eng.textMesh = null;
      eng.textOutline = null;
    }

    const badgeSize = 0.58;
    const badgeGeom = new THREE.PlaneGeometry(badgeSize, badgeSize);
    
    const actualFrontZ = modelFrontZ !== null ? modelFrontZ : eng.modelFrontZ;
    let baseY = 0.45;
    let baseZ = actualFrontZ !== null && actualFrontZ !== undefined ? actualFrontZ : 1.29;

    if (garmentType === 'sweater') {
      baseY = 0.45;
      if (modelFrontZ === null && !eng.modelFrontZ) baseZ = 1.28;
    } else if (garmentType === 'tshirt') {
      baseY = 0.40;
      if (modelFrontZ === null && !eng.modelFrontZ) baseZ = 1.18;
    }

    const d = stateRef.current.decal;

    // Create Logo Mesh if active
    if (d.type !== 'none') {
      const logoMat = new THREE.MeshStandardMaterial({
        transparent: true,
        roughness: 0.7,
        metalness: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      if (eng.activeLogoTexture) logoMat.map = eng.activeLogoTexture;
      
      const logoMesh = new THREE.Mesh(badgeGeom, logoMat);
      logoMesh.position.set(d.logoHorizontal, baseY + d.logoVertical, baseZ);
      logoMesh.rotation.x = -0.05;
      
      const borderGeom = new THREE.EdgesGeometry(badgeGeom);
      const borderMat = new THREE.LineBasicMaterial({ color: 0x2de295, linewidth: 2 });
      const logoOutline = new THREE.LineSegments(borderGeom, borderMat);
      logoOutline.visible = false;
      logoMesh.add(logoOutline);
      
      eng.logoMesh = logoMesh;
      eng.logoOutline = logoOutline;
      eng.garmentGroup?.add(logoMesh);
    }

    // Create Text Mesh if active
    if (d.text && d.text.trim() !== '') {
      const textMat = new THREE.MeshStandardMaterial({
        transparent: true,
        roughness: 0.7,
        metalness: 0.1,
        depthWrite: false,
        side: THREE.DoubleSide,
      });
      if (eng.activeTextTexture) textMat.map = eng.activeTextTexture;
      
      const textMesh = new THREE.Mesh(badgeGeom, textMat);
      textMesh.position.set(d.textHorizontal, baseY + d.textVertical, baseZ);
      textMesh.rotation.x = -0.05;
      
      const borderGeom = new THREE.EdgesGeometry(badgeGeom);
      const borderMat = new THREE.LineBasicMaterial({ color: 0x3b82f6, linewidth: 2 });
      const textOutline = new THREE.LineSegments(borderGeom, borderMat);
      textOutline.visible = false;
      textMesh.add(textOutline);
      
      eng.textMesh = textMesh;
      eng.textOutline = textOutline;
      eng.garmentGroup?.add(textMesh);
    }

    applyDecalAdjustments(actualFrontZ);
  }

  function applyDecalAdjustments(modelFrontZ: number | null = null) {
    const eng = engineRef.current;
    const gg = eng.garmentGroup;
    if (!gg) return;

    const d = stateRef.current.decal;
    const actualFrontZ = modelFrontZ !== null ? modelFrontZ : (eng.modelFrontZ || 1.29);
    const safetyOffset = 0.015;

    let baseY = 0.45;
    let baseZ = actualFrontZ;

    if (garmentType === 'sweater') {
      baseY = 0.45;
      if (modelFrontZ === null && !eng.modelFrontZ) baseZ = 1.28;
    } else if (garmentType === 'tshirt') {
      baseY = 0.40;
      if (modelFrontZ === null && !eng.modelFrontZ) baseZ = 1.18;
    }

    // Adjust Logo Layer
    if (eng.logoMesh) {
      const logo = eng.logoMesh;
      logo.scale.set(d.logoScale, d.logoScale, 1);
      
      if (d.logoLocalPos && d.logoLocalNormal) {
        const pos = new THREE.Vector3(d.logoLocalPos.x, d.logoLocalPos.y, d.logoLocalPos.z);
        const normal = new THREE.Vector3(d.logoLocalNormal.x, d.logoLocalNormal.y, d.logoLocalNormal.z);
        logo.position.copy(pos);
        const lookAtTarget = pos.clone().add(normal);
        gg.updateMatrixWorld(true);
        logo.lookAt(lookAtTarget);
        logo.position.addScaledVector(normal, safetyOffset);
      } else {
        const posX = d.logoHorizontal;
        const posY = baseY + d.logoVertical;
        logo.position.x = posX;
        logo.position.y = posY;

        let finalZ = baseZ;
        let rotated = false;
        
        const raycaster = new THREE.Raycaster();
        const localOrigin = new THREE.Vector3(posX, posY, 5);
        gg.updateMatrixWorld(true);
        const worldOrigin = localOrigin.clone().applyMatrix4(gg.matrixWorld);
        const worldDir = new THREE.Vector3(0, 0, -1).applyQuaternion(gg.getWorldQuaternion(new THREE.Quaternion())).normalize();
        raycaster.set(worldOrigin, worldDir);
        const allIntersects = raycaster.intersectObjects(gg.children, true);
        const intersects = allIntersects.filter(item => 
          item.object !== logo && 
          item.object !== eng.logoOutline && 
          item.object !== eng.textMesh && 
          item.object !== eng.textOutline
        );

        if (intersects.length > 0) {
          const hit = intersects[0];
          const localHit = hit.point.clone().applyMatrix4(gg.matrixWorld.clone().invert());
          finalZ = localHit.z;
          if (hit.face) {
            const normal = hit.face.normal.clone();
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
            normal.applyMatrix3(normalMatrix).normalize();
            const worldQuat = new THREE.Quaternion();
            gg.getWorldQuaternion(worldQuat);
            normal.applyQuaternion(worldQuat.invert()).normalize();
            const lookAtTarget = logo.position.clone().add(normal);
            const worldTarget = lookAtTarget.clone().applyMatrix4(gg.matrixWorld);
            logo.lookAt(worldTarget);
            rotated = true;
          }
        }

        if (!rotated) {
          logo.rotation.y = posX * -0.55;
          logo.rotation.x = -0.05;
          if (garmentType !== 'hoodie') {
            const bodyRadius = garmentType === 'tshirt' ? 1.20 : 1.34;
            const computedArcZ = Math.sqrt(Math.max(0, (bodyRadius * bodyRadius) - (posX * posX)));
            finalZ = computedArcZ;
          }
        }
        logo.position.z = finalZ + safetyOffset;
      }

      if (logo.material instanceof THREE.MeshStandardMaterial) {
        logo.material.opacity = d.logoOpacity;
        logo.material.needsUpdate = true;
      }
    }

    // Adjust Text Layer
    if (eng.textMesh) {
      const text = eng.textMesh;
      text.scale.set(d.textScale, d.textScale, 1);
      
      if (d.textLocalPos && d.textLocalNormal) {
        const pos = new THREE.Vector3(d.textLocalPos.x, d.textLocalPos.y, d.textLocalPos.z);
        const normal = new THREE.Vector3(d.textLocalNormal.x, d.textLocalNormal.y, d.textLocalNormal.z);
        text.position.copy(pos);
        const lookAtTarget = pos.clone().add(normal);
        gg.updateMatrixWorld(true);
        text.lookAt(lookAtTarget);
        text.position.addScaledVector(normal, safetyOffset);
      } else {
        const posX = d.textHorizontal;
        const posY = baseY + d.textVertical;
        text.position.x = posX;
        text.position.y = posY;

        let finalZ = baseZ;
        let rotated = false;
        
        const raycaster = new THREE.Raycaster();
        const localOrigin = new THREE.Vector3(posX, posY, 5);
        gg.updateMatrixWorld(true);
        const worldOrigin = localOrigin.clone().applyMatrix4(gg.matrixWorld);
        const worldDir = new THREE.Vector3(0, 0, -1).applyQuaternion(gg.getWorldQuaternion(new THREE.Quaternion())).normalize();
        raycaster.set(worldOrigin, worldDir);
        const allIntersects = raycaster.intersectObjects(gg.children, true);
        const intersects = allIntersects.filter(item => 
          item.object !== text && 
          item.object !== eng.textOutline && 
          item.object !== eng.logoMesh && 
          item.object !== eng.logoOutline
        );

        if (intersects.length > 0) {
          const hit = intersects[0];
          const localHit = hit.point.clone().applyMatrix4(gg.matrixWorld.clone().invert());
          finalZ = localHit.z;
          if (hit.face) {
            const normal = hit.face.normal.clone();
            const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
            normal.applyMatrix3(normalMatrix).normalize();
            const worldQuat = new THREE.Quaternion();
            gg.getWorldQuaternion(worldQuat);
            normal.applyQuaternion(worldQuat.invert()).normalize();
            const lookAtTarget = text.position.clone().add(normal);
            const worldTarget = lookAtTarget.clone().applyMatrix4(gg.matrixWorld);
            text.lookAt(worldTarget);
            rotated = true;
          }
        }

        if (!rotated) {
          text.rotation.y = posX * -0.55;
          text.rotation.x = -0.05;
          if (garmentType !== 'hoodie') {
            const bodyRadius = garmentType === 'tshirt' ? 1.20 : 1.34;
            const computedArcZ = Math.sqrt(Math.max(0, (bodyRadius * bodyRadius) - (posX * posX)));
            finalZ = computedArcZ;
          }
        }
        text.position.z = finalZ + safetyOffset;
      }

      if (text.material instanceof THREE.MeshStandardMaterial) {
        text.material.opacity = d.textOpacity;
        text.material.needsUpdate = true;
      }
    }
  }

  function redrawDecal() {
    const eng = engineRef.current;
    const d = stateRef.current.decal;
    const c = stateRef.current.colors;

    const checkDark = (col: string) => {
      const str = col.substring(1);
      const rgb = parseInt(str, 16);
      const r = (rgb >> 16) & 0xff;
      const g = (rgb >> 8) & 0xff;
      const b = (rgb >> 0) & 0xff;
      const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b;
      return luma < 128;
    };
    const isDark = checkDark(c.body);
    const defaultColor = isDark ? '#ffffff' : '#121212';
    const accentColor = '#2de295';

    // 1. Draw Logo Canvas
    const logoCanvas = document.createElement('canvas');
    logoCanvas.width = 512;
    logoCanvas.height = 512;
    const logoCtx = logoCanvas.getContext('2d');
    
    function drawLogoPreset() {
      if (!logoCtx) return;
      logoCtx.clearRect(0, 0, 512, 512);
      logoCtx.strokeStyle = defaultColor;
      logoCtx.fillStyle = defaultColor;
      logoCtx.lineWidth = 16;
      logoCtx.lineCap = 'round';
      logoCtx.lineJoin = 'round';
      logoCtx.save();
      logoCtx.translate(0, 0);

      if (d.presetName === 'fitcraft') {
        logoCtx.fillStyle = accentColor;
        logoCtx.font = 'bold 200px "Space Grotesk", sans-serif';
        logoCtx.textAlign = 'center';
        logoCtx.fillText('F', 256, 320);
      } else if (d.presetName === 'nexus') {
        logoCtx.beginPath();
        logoCtx.arc(256, 256, 90, 0, Math.PI * 2);
        logoCtx.stroke();
        logoCtx.strokeStyle = accentColor;
        logoCtx.beginPath();
        logoCtx.arc(256, 256, 50, 0, Math.PI * 2);
        logoCtx.stroke();
        logoCtx.fillStyle = defaultColor;
        [0, Math.PI * 0.66, Math.PI * 1.33].forEach((angle) => {
          const x = 256 + Math.cos(angle) * 90;
          const y = 256 + Math.sin(angle) * 90;
          logoCtx.beginPath();
          logoCtx.arc(x, y, 20, 0, Math.PI * 2);
          logoCtx.fill();
        });
      } else if (d.presetName === 'quantum') {
        logoCtx.save();
        logoCtx.translate(256, 256);
        logoCtx.lineWidth = 12;
        logoCtx.beginPath();
        logoCtx.ellipse(0, 0, 100, 32, Math.PI / 4, 0, Math.PI * 2);
        logoCtx.stroke();
        logoCtx.beginPath();
        logoCtx.ellipse(0, 0, 100, 32, -Math.PI / 4, 0, Math.PI * 2);
        logoCtx.stroke();
        logoCtx.fillStyle = accentColor;
        logoCtx.beginPath();
        logoCtx.arc(0, 0, 28, 0, Math.PI * 2);
        logoCtx.fill();
        logoCtx.restore();
      } else if (d.presetName === 'apex') {
        logoCtx.beginPath();
        logoCtx.moveTo(256, 130);
        logoCtx.lineTo(136, 350);
        logoCtx.lineTo(376, 350);
        logoCtx.closePath();
        logoCtx.stroke();
        logoCtx.fillStyle = accentColor;
        logoCtx.beginPath();
        logoCtx.moveTo(256, 195);
        logoCtx.lineTo(186, 330);
        logoCtx.lineTo(326, 330);
        logoCtx.closePath();
        logoCtx.fill();
      }
      logoCtx.restore();
      finalizeLogoTexture();
    }

    if (d.type === 'preset') {
      drawLogoPreset();
    } else if (d.type === 'custom' && d.customImage) {
      if (logoCtx) logoCtx.clearRect(0, 0, 512, 512);
      const tempImg = new Image();
      tempImg.crossOrigin = 'anonymous';
      tempImg.onload = () => {
        if (!logoCtx) return;
        const maxWidth = 320;
        const maxHeight = 320;
        let w = tempImg.width;
        let h = tempImg.height;
        if (w > maxWidth) { h *= maxWidth / w; w = maxWidth; }
        if (h > maxHeight) { w *= maxHeight / h; h = maxHeight; }
        const x = 256 - w / 2;
        const y = 256 - h / 2;
        logoCtx.drawImage(tempImg, x, y, w, h);
        finalizeLogoTexture();
      };
      tempImg.src = d.customImage;
    } else {
      if (eng.activeLogoTexture) {
        eng.activeLogoTexture.dispose();
        eng.activeLogoTexture = null;
      }
      if (eng.logoMesh && eng.logoMesh.material instanceof THREE.MeshStandardMaterial) {
        eng.logoMesh.material.map = null;
        eng.logoMesh.material.needsUpdate = true;
      }
    }

    function finalizeLogoTexture() {
      const texture = new THREE.CanvasTexture(logoCanvas);
      texture.minFilter = THREE.LinearFilter;
      if (eng.renderer) texture.anisotropy = eng.renderer.capabilities.getMaxAnisotropy();

      if (eng.activeLogoTexture) eng.activeLogoTexture.dispose();
      eng.activeLogoTexture = texture;

      if (eng.logoMesh) {
        if (eng.logoMesh.material instanceof THREE.MeshStandardMaterial) {
          eng.logoMesh.material.map = texture;
          eng.logoMesh.material.needsUpdate = true;
        }
      }
      rebuildBadgePlane();
    }

    // 2. Draw Text Canvas
    if (d.text && d.text.trim() !== '') {
      const textCanvas = document.createElement('canvas');
      textCanvas.width = 512;
      textCanvas.height = 512;
      const textCtx = textCanvas.getContext('2d');
      if (textCtx) {
        textCtx.clearRect(0, 0, 512, 512);
        const font = d.textFont || 'Space Grotesk';
        textCtx.font = `800 64px "${font}", sans-serif`;
        textCtx.textAlign = 'center';
        textCtx.textBaseline = 'middle';
        let txtColor = defaultColor;
        if (d.textColor && d.textColor !== 'match') txtColor = d.textColor;
        textCtx.fillStyle = txtColor;
        textCtx.fillText(d.text.toUpperCase(), 256, 256);

        const texture = new THREE.CanvasTexture(textCanvas);
        texture.minFilter = THREE.LinearFilter;
        if (eng.renderer) texture.anisotropy = eng.renderer.capabilities.getMaxAnisotropy();

        if (eng.activeTextTexture) eng.activeTextTexture.dispose();
        eng.activeTextTexture = texture;

        if (eng.textMesh) {
          if (eng.textMesh.material instanceof THREE.MeshStandardMaterial) {
            eng.textMesh.material.map = texture;
            eng.textMesh.material.needsUpdate = true;
          }
        }
      }
    } else {
      if (eng.activeTextTexture) {
        eng.activeTextTexture.dispose();
        eng.activeTextTexture = null;
      }
      if (eng.textMesh && eng.textMesh.material instanceof THREE.MeshStandardMaterial) {
        eng.textMesh.material.map = null;
        eng.textMesh.material.needsUpdate = true;
      }
    }

    rebuildBadgePlane();
  }

  function buildProceduralGarment(type: string) {
    const eng = engineRef.current;
    let bodyGeom: THREE.CylinderGeometry, collarGeom: THREE.TorusGeometry, lSleeveGeom: THREE.CylinderGeometry, rSleeveGeom: THREE.CylinderGeometry;
    let hemGeom: THREE.CylinderGeometry | null = null;
    let hoodGeom: THREE.SphereGeometry | null = null;
    let lCuffGeom: THREE.CylinderGeometry | null = null;
    let rCuffGeom: THREE.CylinderGeometry | null = null;

    if (type === 'hoodie') {
      bodyGeom = new THREE.CylinderGeometry(1.2, 1.35, 2.7, 32, 1);
      hemGeom = new THREE.CylinderGeometry(1.36, 1.36, 0.3, 32);
      lSleeveGeom = new THREE.CylinderGeometry(0.44, 0.34, 2.2, 16);
      rSleeveGeom = new THREE.CylinderGeometry(0.44, 0.34, 2.2, 16);
      lCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      rCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      collarGeom = new THREE.TorusGeometry(0.55, 0.08, 16, 32);
      hoodGeom = new THREE.SphereGeometry(0.78, 32, 16, 0, Math.PI * 1.55);
    } else if (type === 'sweater') {
      bodyGeom = new THREE.CylinderGeometry(1.22, 1.33, 2.7, 32, 1);
      hemGeom = new THREE.CylinderGeometry(1.34, 1.34, 0.3, 32);
      lSleeveGeom = new THREE.CylinderGeometry(0.42, 0.34, 2.2, 16);
      rSleeveGeom = new THREE.CylinderGeometry(0.42, 0.34, 2.2, 16);
      lCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      rCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      collarGeom = new THREE.TorusGeometry(0.54, 0.1, 16, 32);
    } else {
      bodyGeom = new THREE.CylinderGeometry(1.18, 1.22, 2.7, 32, 1);
      lSleeveGeom = new THREE.CylinderGeometry(0.42, 0.38, 0.85, 16);
      rSleeveGeom = new THREE.CylinderGeometry(0.42, 0.38, 0.85, 16);
      collarGeom = new THREE.TorusGeometry(0.52, 0.05, 16, 32);
    }

    const bodyMesh = new THREE.Mesh(bodyGeom, eng.garmentMaterial!);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    eng.garmentGroup?.add(bodyMesh);
    eng.bodyMesh = bodyMesh;

    if (hemGeom) {
      const hemMesh = new THREE.Mesh(hemGeom, eng.garmentMaterial!);
      hemMesh.position.y = -1.45;
      hemMesh.castShadow = true;
      hemMesh.receiveShadow = true;
      eng.garmentGroup?.add(hemMesh);
    }

    const lSleeveMesh = new THREE.Mesh(lSleeveGeom, eng.sleevesMaterial!);
    lSleeveMesh.position.set(-1.45, 0.3, 0);
    lSleeveMesh.rotation.z = -0.45;
    lSleeveMesh.rotation.y = 0.25;
    lSleeveMesh.castShadow = true;
    lSleeveMesh.receiveShadow = true;
    eng.garmentGroup?.add(lSleeveMesh);

    const rSleeveMesh = new THREE.Mesh(rSleeveGeom, eng.sleevesMaterial!);
    rSleeveMesh.position.set(1.45, 0.3, 0);
    rSleeveMesh.rotation.z = 0.45;
    rSleeveMesh.rotation.y = -0.25;
    rSleeveMesh.castShadow = true;
    rSleeveMesh.receiveShadow = true;
    eng.garmentGroup?.add(rSleeveMesh);

    if (lCuffGeom) {
      const lCuffMesh = new THREE.Mesh(lCuffGeom, eng.sleevesMaterial!);
      lCuffMesh.position.set(-1.95, -0.68, 0.25);
      lCuffMesh.rotation.z = -0.45;
      lCuffMesh.rotation.y = 0.25;
      lCuffMesh.castShadow = true;
      lCuffMesh.receiveShadow = true;
      eng.garmentGroup?.add(lCuffMesh);
    }

    if (rCuffGeom) {
      const rCuffMesh = new THREE.Mesh(rCuffGeom, eng.sleevesMaterial!);
      rCuffMesh.position.set(1.95, -0.68, -0.25);
      rCuffMesh.rotation.z = 0.45;
      rCuffMesh.rotation.y = -0.25;
      rCuffMesh.castShadow = true;
      rCuffMesh.receiveShadow = true;
      eng.garmentGroup?.add(rCuffMesh);
    }

    const collarMesh = new THREE.Mesh(collarGeom, eng.collarMaterial!);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 1.34;
    collarMesh.castShadow = true;
    eng.garmentGroup?.add(collarMesh);

    if (hoodGeom) {
      const hoodMesh = new THREE.Mesh(hoodGeom, eng.garmentMaterial!);
      hoodMesh.position.set(0, 1.7, -0.12);
      hoodMesh.rotation.x = -0.15;
      hoodMesh.rotation.y = -0.78;
      hoodMesh.rotation.z = -0.15;
      hoodMesh.castShadow = true;
      eng.garmentGroup?.add(hoodMesh);
    }

    eng.garmentGroup!.position.y = -0.2;
    rebuildBadgePlane();
  }

  return (
    <div ref={containerRef} className="relative w-full h-full">
      <canvas ref={canvasRef} className="w-full h-full block" />

      {loading && (
        <div className="absolute inset-0 bg-[#08090a]/90 backdrop-blur-sm flex flex-col items-center justify-center gap-3 z-10 animate-fade-in">
          <div className="w-8 h-8 border-2 border-[#2de295]/20 border-t-[#2de295] rounded-full animate-spin" />
          <p className="text-xs text-[#9ba3af] font-medium">Memuat model 3D PBR...</p>
        </div>
      )}
    </div>
  );
}

import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

// Helper to convert a dark/black baseColorTexture to a light-gray colorable texture
function processTshirtTexture(texture) {
  if (!texture || !texture.image) return texture;
  const img = texture.image;

  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.width || 1024;
    canvas.height = img.height || 1024;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

    const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imgData.data;

    for (let i = 0; i < data.length; i += 4) {
      const r = data[i];
      const g = data[i + 1];
      const b = data[i + 2];

      const luma = 0.299 * r + 0.587 * g + 0.114 * b;
      
      // Remap the dark range [0, 50] to light-gray [180, 255] to allow standard multiply coloring
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
  } catch (err) {
    console.error('Failed to process t-shirt texture:', err);
    return texture;
  }
}

export default function StudioVisualizer({
  garmentType,
  colors,          // { body, sleeves, collar }
  fabric,          // 'cotton' | 'fleece'
  size,            // 'S' | 'M' | 'L' | 'XL' | 'XXL'
  lightingPreset,  // 'studio' | 'sunset' | 'industrial'
  decal,           // { type, presetName, customImage, text, textFont, textColor, scale, vertical, horizontal, opacity }
  autoRotate,
  isScaleView,
  onDecalDrag,     // Callback to update parent sliders when dragged: ({ horizontal, vertical })
  onFpsUpdate,     // Callback to update parent FPS text
  exportTrigger,   // Numeric counter to trigger PNG capture
  onExportComplete, // Callback when PNG export finishes
  onReady,         // Callback when the 3D model is fully loaded and ready
  onProgress       // Callback to report loading progress (0-100)
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const [loading, setLoading] = useState(true);

  // Core Three.js object references stored inside a ref to survive renders
  const engineRef = useRef({
    scene: null,
    camera: null,
    renderer: null,
    controls: null,
    garmentGroup: null,
    lightsGroup: null,
    bodyMesh: null,
    badgeMesh: null,
    decalOutline: null,
    garmentMaterial: null,
    sleevesMaterial: null,
    collarMaterial: null,
    fabricBumpTextures: {},
    activeDecalTexture: null,
    isDraggingDecal: false,
    isPointerDown: false,
    autoRotateActive: true
  });

  // Keep callback and variables inside a ref to prevent closure staleness in loop
  const stateRef = useRef({
    colors,
    decal,
    garmentType,
    onDecalDrag,
    exportTrigger,
    onExportComplete
  });

  useEffect(() => {
    stateRef.current = { colors, decal, garmentType, onDecalDrag, exportTrigger, onExportComplete };
  }, [colors, decal, garmentType, onDecalDrag, exportTrigger, onExportComplete]);

  // 1. Inisialisasi Canvas Three.js (Sekali saja saat Mount)
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // A. Scene & Camera
    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    // B. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;

    // C. Controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0, 0);

    // D. Groups
    const garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    const lightsGroup = new THREE.Group();
    scene.add(lightsGroup);

    // E. Soft ground contact shadow plane
    const shadowCanvas = document.createElement('canvas');
    shadowCanvas.width = 128;
    shadowCanvas.height = 128;
    const shadowCtx = shadowCanvas.getContext('2d');
    const gradient = shadowCtx.createRadialGradient(64, 64, 5, 64, 64, 60);
    gradient.addColorStop(0, 'rgba(0, 0, 0, 0.45)');
    gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
    shadowCtx.fillStyle = gradient;
    shadowCtx.fillRect(0, 0, 128, 128);

    const shadowTexture = new THREE.CanvasTexture(shadowCanvas);
    const shadowPlaneGeom = new THREE.PlaneGeometry(4, 4);
    const shadowPlaneMat = new THREE.MeshBasicMaterial({
      map: shadowTexture,
      transparent: true,
      depthWrite: false
    });
    const shadowPlane = new THREE.Mesh(shadowPlaneGeom, shadowPlaneMat);
    shadowPlane.rotation.x = -Math.PI / 2;
    shadowPlane.position.y = -2.0;
    scene.add(shadowPlane);

    // F. Procedural Bump Textures
    const fabricBumpTextures = {};

    // 1. Premium Cotton Texture
    const cottonCanvas = document.createElement('canvas');
    cottonCanvas.width = 256;
    cottonCanvas.height = 256;
    const ctxCotton = cottonCanvas.getContext('2d');
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
      ctxCotton.fillStyle = `rgb(${val}, ${val}, ${val})`;
      ctxCotton.fillRect(x, y, 1, 1);
    }
    const cottonTexture = new THREE.CanvasTexture(cottonCanvas);
    cottonTexture.wrapS = THREE.RepeatWrapping;
    cottonTexture.wrapT = THREE.RepeatWrapping;
    cottonTexture.repeat.set(16, 16);
    fabricBumpTextures['cotton'] = cottonTexture;

    // 2. Heavy fleece texture
    const fleeceCanvas = document.createElement('canvas');
    fleeceCanvas.width = 256;
    fleeceCanvas.height = 256;
    const ctxFleece = fleeceCanvas.getContext('2d');
    ctxFleece.fillStyle = '#808080';
    ctxFleece.fillRect(0, 0, 256, 256);
    for (let i = 0; i < 4000; i++) {
      const x = Math.random() * 256;
      const y = Math.random() * 256;
      const radius = 1 + Math.random() * 3;
      const val = 110 + Math.random() * 35;
      ctxFleece.fillStyle = `rgb(${val}, ${val}, ${val})`;
      ctxFleece.beginPath();
      ctxFleece.arc(x, y, radius, 0, Math.PI * 2);
      ctxFleece.fill();
    }
    const fleeceTexture = new THREE.CanvasTexture(fleeceCanvas);
    fleeceTexture.wrapS = THREE.RepeatWrapping;
    fleeceTexture.wrapT = THREE.RepeatWrapping;
    fleeceTexture.repeat.set(10, 10);
    fabricBumpTextures['fleece'] = fleeceTexture;

    // G. Create materials
    const garmentMaterial = new THREE.MeshStandardMaterial({
      color: new THREE.Color(stateRef.current.colors.body),
      roughness: 0.85,
      metalness: 0.05,
      bumpMap: fabricBumpTextures['cotton'],
      bumpScale: 0.035,
      side: THREE.DoubleSide
    });
    const sleevesMaterial = garmentMaterial.clone();
    const collarMaterial = garmentMaterial.clone();

    // Store references in ref
    engineRef.current = {
      scene,
      camera,
      renderer,
      controls,
      garmentGroup,
      lightsGroup,
      garmentMaterial,
      sleevesMaterial,
      collarMaterial,
      fabricBumpTextures,
      bodyMesh: null,
      badgeMesh: null,
      decalOutline: null,
      activeDecalTexture: null,
      isDraggingDecal: false,
      isPointerDown: false,
      autoRotateActive: autoRotate
    };

    // H. Event listeners for Drag & Drop Decals
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onPointerDown = (e) => {
      const { badgeMesh: badge, renderer: rend, camera: cam } = engineRef.current;
      if (!badge || !rend) return;
      engineRef.current.isPointerDown = true;

      const rect = rend.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      raycaster.setFromCamera(mouse, cam);
      const intersects = raycaster.intersectObject(badge);

      if (intersects.length > 0) {
        engineRef.current.isDraggingDecal = true;
        engineRef.current.controls.enabled = false;
        rend.domElement.style.cursor = 'grabbing';
        if (engineRef.current.decalOutline) {
          engineRef.current.decalOutline.visible = true;
        }
        e.stopPropagation();
      }
    };

    const onPointerMove = (e) => {
      const { renderer: rend, camera: cam, isDraggingDecal: isDragging, garmentGroup: gg } = engineRef.current;
      if (!rend) return;

      const rect = rend.domElement.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;

      if (isDragging && gg) {
        raycaster.setFromCamera(mouse, cam);
        
        // Intersect all children recursively
        const allIntersects = raycaster.intersectObjects(gg.children, true);
        const intersects = allIntersects.filter(item => 
          item.object !== engineRef.current.badgeMesh && 
          item.object !== engineRef.current.decalOutline
        );

        if (intersects.length > 0) {
          const hit = intersects[0];
          
          // Get the world position and normal
          const worldPoint = hit.point.clone();
          const worldNormal = hit.face ? hit.face.normal.clone() : new THREE.Vector3(0, 0, 1);
          
          // Apply normal matrix of the intersected mesh to compute world normal
          const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
          worldNormal.applyMatrix3(normalMatrix).normalize();
          
          // Convert world coordinates to local space of garmentGroup
          const localPoint = gg.worldToLocal(worldPoint.clone());
          
          // Convert world normal to local space of garmentGroup
          const ggWorldQuat = new THREE.Quaternion();
          gg.getWorldQuaternion(ggWorldQuat);
          const localNormal = worldNormal.clone().applyQuaternion(ggWorldQuat.invert()).normalize();

          const currentGarment = stateRef.current.garmentType;
          let baseY = currentGarment === 'tshirt' ? 0.40 : 0.45;
          
          let verticalOffset = localPoint.y - baseY;
          let horizontalOffset = localPoint.x;

          // Call parent state callback with 3D coordinate context
          if (stateRef.current.onDecalDrag) {
            stateRef.current.onDecalDrag({
              horizontal: Number(horizontalOffset.toFixed(2)),
              vertical: Number(verticalOffset.toFixed(2)),
              localPos: { x: localPoint.x, y: localPoint.y, z: localPoint.z },
              localNormal: { x: localNormal.x, y: localNormal.y, z: localNormal.z }
            });
          }
        }
      } else if (engineRef.current.badgeMesh) {
        raycaster.setFromCamera(mouse, cam);
        const intersects = raycaster.intersectObject(engineRef.current.badgeMesh);
        if (intersects.length > 0) {
          rend.domElement.style.cursor = 'grab';
          if (engineRef.current.decalOutline) engineRef.current.decalOutline.visible = true;
        } else {
          rend.domElement.style.cursor = 'default';
          if (engineRef.current.decalOutline) engineRef.current.decalOutline.visible = false;
        }
      }
    };

    const onPointerUp = () => {
      engineRef.current.isPointerDown = false;
      if (engineRef.current.isDraggingDecal) {
        engineRef.current.isDraggingDecal = false;
        engineRef.current.controls.enabled = true;
        if (engineRef.current.renderer) {
          engineRef.current.renderer.domElement.style.cursor = 'default';
        }
      }
      if (engineRef.current.decalOutline) {
        engineRef.current.decalOutline.visible = false;
      }
    };

    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);

    // I. FPS and Render Animation Loop
    let frameCount = 0;
    let lastFpsUpdate = performance.now();
    let animationFrameId;

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      // Track FPS
      const time = performance.now();
      frameCount++;
      if (time > lastFpsUpdate + 500) {
        const actualFps = Math.round((frameCount * 1000) / (time - lastFpsUpdate));
        if (onFpsUpdate) onFpsUpdate(actualFps);
        frameCount = 0;
        lastFpsUpdate = time;
      }

      const eng = engineRef.current;
      // Auto rotate
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

    // J. Resize observer
    const resizeObserver = new ResizeObserver(() => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    });
    resizeObserver.observe(container);

    // Cleanup on unmount
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      dom.removeEventListener('pointerdown', onPointerDown);
      dom.removeEventListener('pointermove', onPointerMove);
      window.removeEventListener('pointerup', onPointerUp);

      // Dispose resources
      scene.clear();
      renderer.dispose();
      garmentMaterial.dispose();
      sleevesMaterial.dispose();
      collarMaterial.dispose();
      Object.values(fabricBumpTextures).forEach(t => t.dispose());
      if (engineRef.current.activeDecalTexture) {
        engineRef.current.activeDecalTexture.dispose();
      }
    };
  }, []);

  // 2. React to AutoRotate prop
  useEffect(() => {
    engineRef.current.autoRotateActive = autoRotate;
  }, [autoRotate]);

  // 3. React to Lighting Preset prop
  useEffect(() => {
    const { lightsGroup } = engineRef.current;
    if (!lightsGroup) return;

    // Clear old lights
    while (lightsGroup.children.length > 0) {
      lightsGroup.remove(lightsGroup.children[0]);
    }

    let ambientLight, mainLight, fillLight, rimLight;

    if (lightingPreset === 'studio') {
      ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
      mainLight = new THREE.DirectionalLight(0xffffff, 0.85);
      mainLight.position.set(3, 4, 5);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(2048, 2048);
      mainLight.shadow.bias = -0.001;
      mainLight.shadow.camera.left = -2.2;
      mainLight.shadow.camera.right = 2.2;
      mainLight.shadow.camera.top = 2.2;
      mainLight.shadow.camera.bottom = -2.2;

      fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
      fillLight.position.set(-4, 2, 2);

      rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
      rimLight.position.set(0, 5, -5);
    } else if (lightingPreset === 'sunset') {
      ambientLight = new THREE.AmbientLight(0xfdcba8, 0.35);
      mainLight = new THREE.DirectionalLight(0xf97316, 1.4);
      mainLight.position.set(4, 3, 4);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(2048, 2048);
      mainLight.shadow.bias = -0.001;
      mainLight.shadow.camera.left = -2.2;
      mainLight.shadow.camera.right = 2.2;
      mainLight.shadow.camera.top = 2.2;
      mainLight.shadow.camera.bottom = -2.2;

      fillLight = new THREE.DirectionalLight(0x8b5cf6, 0.95);
      fillLight.position.set(-4, 1, 3);

      rimLight = new THREE.DirectionalLight(0xfdba74, 0.8);
      rimLight.position.set(-1, 4, -4);
    } else if (lightingPreset === 'industrial') {
      ambientLight = new THREE.AmbientLight(0xe0f2fe, 0.4);
      mainLight = new THREE.DirectionalLight(0x38bdf8, 1.25);
      mainLight.position.set(-2, 5, 4);
      mainLight.castShadow = true;
      mainLight.shadow.mapSize.set(2048, 2048);
      mainLight.shadow.bias = -0.001;
      mainLight.shadow.camera.left = -2.2;
      mainLight.shadow.camera.right = 2.2;
      mainLight.shadow.camera.top = 2.2;
      mainLight.shadow.camera.bottom = -2.2;

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

  // 4. React to Fabric type changes
  useEffect(() => {
    const { garmentMaterial, sleevesMaterial, collarMaterial, fabricBumpTextures, garmentGroup } = engineRef.current;
    
    const bumpMap = fabricBumpTextures[fabric];
    const bumpScale = fabric === 'fleece' ? 0.055 : 0.035;
    const roughness = fabric === 'fleece' ? 0.92 : 0.85;

    if ((garmentType === 'hoodie' || garmentType === 'tshirt') && garmentGroup) {
      garmentGroup.traverse((child) => {
        if (child.isMesh && child.material && child !== engineRef.current.badgeMesh && child !== engineRef.current.decalOutline) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => {
            mat.bumpMap = bumpMap;
            mat.bumpScale = bumpScale;
            mat.roughness = roughness;
            mat.needsUpdate = true;
          });
        }
      });
    } else if (garmentMaterial) {
      const materials = [garmentMaterial, sleevesMaterial, collarMaterial];
      materials.forEach((mat) => {
        if (mat && bumpMap) {
          mat.bumpMap = bumpMap;
          mat.bumpScale = bumpScale;
          mat.roughness = roughness;
          mat.needsUpdate = true;
        }
      });
    }
  }, [fabric]);

  // 5. React to Colors changes
  useEffect(() => {
    const { garmentMaterial, sleevesMaterial, collarMaterial, garmentGroup } = engineRef.current;
    
    if ((garmentType === 'hoodie' || garmentType === 'tshirt') && garmentGroup) {
      garmentGroup.traverse((child) => {
        if (child.isMesh && child.material && child !== engineRef.current.badgeMesh && child !== engineRef.current.decalOutline) {
          const mats = Array.isArray(child.material) ? child.material : [child.material];
          mats.forEach(mat => {
            const name = (child.name || mat.name || '').toLowerCase();
            let targetColor = colors.body;
            if (name.includes('sleeve') || name.includes('lengan') || name.includes('arm') || name.includes('hand') || name.includes('cuff')) {
              targetColor = colors.sleeves;
            } else if (name.includes('collar') || name.includes('kerah') || name.includes('rib') || name.includes('neck') || name.includes('detail') || name.includes('drawstring') || name.includes('pocket')) {
              targetColor = colors.collar;
            }
            mat.color.set(new THREE.Color(targetColor));
          });
        }
      });
    } else {
      if (garmentMaterial) garmentMaterial.color.set(new THREE.Color(colors.body));
      if (sleevesMaterial) sleevesMaterial.color.set(new THREE.Color(colors.sleeves));
      if (collarMaterial) collarMaterial.color.set(new THREE.Color(colors.collar));
    }

    // Redraw decal to auto-adapt preset color contrast based on light/dark body color
    redrawDecal();
  }, [colors]);

  // 6. React to Size changes (halus lerping scale)
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
    const targetScale = targetScaleValue;
    const startTime = performance.now();
    const duration = 400;

    const animateScale = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
      const currentVal = startScale + (targetScale - startScale) * ease;

      garmentGroup.scale.set(currentVal, currentVal, currentVal);

      if (progress < 1) {
        requestAnimationFrame(animateScale);
      }
    };
    animateScale();
  }, [size]);

  // 7. React to Zoom/Scale View triggers
  useEffect(() => {
    const { camera, controls } = engineRef.current;
    if (!camera || !controls) return;

    let targetZ = isScaleView ? 4.5 : 8.0;
    let targetY = isScaleView ? 0.35 : 0;

    controls.enabled = false;
    const startTime = performance.now();
    const duration = 600;
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();

    const zoomCam = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      controls.target.x = startTarget.x + (0 - startTarget.x) * ease;
      controls.target.y = startTarget.y + (targetY - startTarget.y) * ease;
      controls.target.z = startTarget.z + (0 - startTarget.z) * ease;

      camera.position.y = startPos.y + (targetY - startPos.y) * ease;
      camera.position.z = startPos.z + (targetZ - startPos.z) * ease;

      controls.update();

      if (progress < 1) {
        requestAnimationFrame(zoomCam);
      } else {
        controls.enabled = true;
      }
    };
    zoomCam();
  }, [isScaleView]);

  // 8. Rebuild Garment model (GLB or Procedural) when Garment Type changes
  useEffect(() => {
    setTimeout(() => {
      setLoading(true);
    }, 0);
    const eng = engineRef.current;
    if (!eng.garmentGroup) return;

    // Clear existing meshes
    while (eng.garmentGroup.children.length > 0) {
      eng.garmentGroup.remove(eng.garmentGroup.children[0]);
    }
    eng.bodyMesh = null;

    if (garmentType === 'hoodie' || garmentType === 'tshirt' || garmentType === 'sweater') {
      let glbPath = '';
      if (garmentType === 'hoodie') {
        glbPath = './assets/models/black hoodie 3d model.glb';
      } else if (garmentType === 'tshirt') {
        glbPath = './assets/models/black t shirt 3d model.glb';
      } else if (garmentType === 'sweater') {
        glbPath = './assets/models/knitted crewneck sweater 3d model.glb';
      }
        
      const gltfLoader = new GLTFLoader();
      gltfLoader.load(
        glbPath,
        (gltf) => {
          const model = gltf.scene;

          // Compute box sizes and normalize scale
          const box = new THREE.Box3().setFromObject(model);
          const sizeVec = box.getSize(new THREE.Vector3());
          const centerVec = box.getCenter(new THREE.Vector3());

          // Center bounding box
          model.position.x += (model.position.x - centerVec.x);
          model.position.y += (model.position.y - centerVec.y);
          model.position.z += (model.position.z - centerVec.z);

          // Standardize height to 2.7
          const targetHeight = 2.7;
          const scaleFactor = targetHeight / sizeVec.y;
          model.scale.set(scaleFactor, scaleFactor, scaleFactor);

          // Rotate GLB models to face the camera (Tripo AI models face sideways by default)
          if (glbPath.includes('t shirt') || glbPath.includes('hoodie') || glbPath.includes('sweater')) {
            model.rotation.y = -Math.PI / 2;
            model.updateMatrixWorld(true);
          }

          model.traverse((child) => {
            if (child.isMesh) {
              child.castShadow = true;
              child.receiveShadow = true;
              
              if (child.material) {
                // Clone the original material to keep its baked normal maps/wrinkles/AO maps,
                // but customize its standard properties to allow interactive coloring
                const originalMaterial = child.material.clone();
                
                // Determine target color based on mesh or material name
                const name = (child.name || child.material.name || '').toLowerCase();
                let targetColor = stateRef.current.colors.body;
                if (name.includes('sleeve') || name.includes('lengan') || name.includes('arm') || name.includes('hand') || name.includes('cuff')) {
                  targetColor = stateRef.current.colors.sleeves;
                  eng.sleevesMaterial = originalMaterial;
                } else if (name.includes('collar') || name.includes('kerah') || name.includes('rib') || name.includes('neck') || name.includes('detail') || name.includes('drawstring') || name.includes('pocket')) {
                  targetColor = stateRef.current.colors.collar;
                  eng.collarMaterial = originalMaterial;
                } else {
                  eng.garmentMaterial = originalMaterial;
                }

                originalMaterial.color.set(new THREE.Color(targetColor));
                originalMaterial.roughness = 0.85;
                originalMaterial.metalness = 0.05;
                originalMaterial.bumpMap = eng.fabricBumpTextures['cotton'];
                originalMaterial.bumpScale = 0.035;
                originalMaterial.side = THREE.DoubleSide;
                
                // If it is a black model GLB, convert its black baseColorTexture to a colorable gray/white texture
                if ((glbPath.includes('t shirt') || glbPath.includes('hoodie') || glbPath.includes('sweater')) && originalMaterial.map) {
                  originalMaterial.map = processTshirtTexture(originalMaterial.map);
                }
                
                child.material = originalMaterial;
                if (!eng.garmentMaterial) {
                  eng.garmentMaterial = originalMaterial; // fallback
                }
              }
              
              if (!eng.bodyMesh) {
                eng.bodyMesh = child; // Used for dragging raycasts fallback
              }
            }
          });

          eng.garmentGroup.add(model);
          eng.garmentGroup.position.y = -0.2;

          // Re-create chest decal plane adapted to GLB depth
          const modelFrontZ = (sizeVec.z / 2) * scaleFactor;
          eng.modelFrontZ = modelFrontZ; // Store in ref
          console.log("GLB Bounding Box:", sizeVec.x, sizeVec.y, sizeVec.z, "scaleFactor:", scaleFactor, "computedFrontZ:", modelFrontZ);
          
          rebuildBadgePlane(modelFrontZ);
          setTimeout(() => {
            setLoading(false);
            animateCameraFocus();
            if (onReady) onReady();
          }, 100);
        },
        (xhr) => {
          if (onProgress && xhr.total > 0) {
            const progress = (xhr.loaded / xhr.total) * 100;
            onProgress(Math.min(95, progress));
          }
        },
        (error) => {
          console.error(`Failed to load GLB for ${garmentType}, falling back to procedural construction`, error);
          eng.modelFrontZ = 1.34;
          buildProceduralGarment(garmentType);
          setLoading(false);
          if (onReady) onReady();
        }
      );
    } else {
      eng.modelFrontZ = 1.34;
      buildProceduralGarment(garmentType);
      setTimeout(() => {
        setLoading(false);
      }, 0);
    }
  }, [garmentType]);

  // Redraw decal whenever its texture properties change
  useEffect(() => {
    redrawDecal();
  }, [
    decal.type,
    decal.presetName,
    decal.customImage,
    decal.text,
    decal.textFont,
    decal.textColor,
    decal.scale,
    decal.vertical,
    decal.horizontal,
    decal.opacity,
    colors.body
  ]);

  // Capture image when export trigger changes
  useEffect(() => {
    if (exportTrigger > 0 && engineRef.current.renderer) {
      setTimeout(() => {
        try {
          const canvas = canvasRef.current;
          const dataUrl = canvas.toDataURL('image/png');
          if (onExportComplete) onExportComplete(dataUrl);
        } catch (err) {
          console.error('PNG Capture failed:', err);
          if (onExportComplete) onExportComplete(null);
        }
      }, 100);
    }
  }, [exportTrigger]);

  // Direct 3D Decal outline drawing & coordinates repositioning
  function rebuildBadgePlane(modelFrontZ = null) {
    const eng = engineRef.current;
    if (eng.badgeMesh) {
      eng.garmentGroup.remove(eng.badgeMesh);
      if (eng.badgeMesh.geometry) eng.badgeMesh.geometry.dispose();
      if (eng.badgeMesh.material) eng.badgeMesh.material.dispose();
      eng.badgeMesh = null;
      eng.decalOutline = null;
    }

    const decalMat = new THREE.MeshStandardMaterial({
      transparent: true,
      roughness: 0.7,
      metalness: 0.1,
      depthWrite: false,
      side: THREE.DoubleSide
    });

    if (eng.activeDecalTexture) {
      decalMat.map = eng.activeDecalTexture;
    }

    const badgeSize = 0.58;
    const badgeGeom = new THREE.PlaneGeometry(badgeSize, badgeSize);
    const badgeMesh = new THREE.Mesh(badgeGeom, decalMat);

    const actualFrontZ = modelFrontZ !== null ? modelFrontZ : eng.modelFrontZ;

    // Initial chest coordinates conform to garment
    let baseY = 0.45;
    let baseZ = (actualFrontZ !== null && actualFrontZ !== undefined) ? actualFrontZ : 1.29;

    if (garmentType === 'sweater') {
      baseY = 0.45;
      if (actualFrontZ === null && !eng.modelFrontZ) {
        baseZ = 1.28;
      }
    } else if (garmentType === 'tshirt') {
      baseY = 0.40;
      if (actualFrontZ === null && !eng.modelFrontZ) {
        baseZ = 1.18;
      }
    }

    badgeMesh.position.set(0, baseY, baseZ);
    badgeMesh.rotation.x = -0.05;

    // Green helper outline box
    const borderGeom = new THREE.EdgesGeometry(badgeGeom);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x528c66, linewidth: 2 });
    const decalOutline = new THREE.LineSegments(borderGeom, borderMat);
    decalOutline.visible = false;
    badgeMesh.add(decalOutline);

    eng.badgeMesh = badgeMesh;
    eng.decalOutline = decalOutline;

    eng.garmentGroup.add(badgeMesh);
    applyDecalAdjustments(actualFrontZ);
  };

  function applyDecalAdjustments(modelFrontZ = null) {
    const eng = engineRef.current;
    const { badgeMesh: badge, garmentGroup: gg } = eng;
    if (!badge || !gg) return;

    const d = stateRef.current.decal;
    badge.scale.set(d.scale, d.scale, 1);

    const safetyOffset = 0.015;

    // 1. If 3D coordinates were dragged directly on the surface, use them to orient the badge
    if (d.localPos && d.localNormal) {
      const pos = new THREE.Vector3(d.localPos.x, d.localPos.y, d.localPos.z);
      const normal = new THREE.Vector3(d.localNormal.x, d.localNormal.y, d.localNormal.z);
      
      badge.position.copy(pos);
      
      // Orient badge to face the normal in world space (necessary if parent garmentGroup is rotated)
      const lookAtTarget = pos.clone().add(normal);
      gg.updateMatrixWorld(true);
      const worldTarget = lookAtTarget.clone().applyMatrix4(gg.matrixWorld);
      badge.lookAt(worldTarget);
      
      // Push slightly along normal to prevent clipping
      badge.position.addScaledVector(normal, safetyOffset);
      
      badge.material.opacity = d.opacity;
      badge.material.needsUpdate = true;
      return;
    }

    // 2. Fallback projection for sliders
    const actualFrontZ = modelFrontZ !== null ? modelFrontZ : (eng.modelFrontZ || 1.29);
    let baseY = 0.45;
    let baseZ = actualFrontZ;

    if (garmentType === 'sweater') {
      baseY = 0.45;
      if (modelFrontZ === null && !eng.modelFrontZ) {
        baseZ = 1.28;
      }
    } else if (garmentType === 'tshirt') {
      baseY = 0.40;
      if (modelFrontZ === null && !eng.modelFrontZ) {
        baseZ = 1.18;
      }
    }

    const posX = d.horizontal;
    const posY = baseY + d.vertical;
    badge.position.x = posX;
    badge.position.y = posY;

    let finalZ = baseZ;
    let rotated = false;

    // Raycast from local origin front-to-back to find mesh surface dynamically
    const raycaster = new THREE.Raycaster();
    const localOrigin = new THREE.Vector3(posX, posY, 5);
    
    gg.updateMatrixWorld(true);
    const worldOrigin = localOrigin.clone().applyMatrix4(gg.matrixWorld);
    const worldDir = new THREE.Vector3(0, 0, -1).applyQuaternion(gg.getWorldQuaternion(new THREE.Quaternion())).normalize();
    
    raycaster.set(worldOrigin, worldDir);
    const allIntersects = raycaster.intersectObjects(gg.children, true);
    const intersects = allIntersects.filter(item => 
      item.object !== badge && 
      item.object !== eng.decalOutline
    );
    
    if (intersects.length > 0) {
      const hit = intersects[0];
      const localHit = hit.point.clone().applyMatrix4(gg.matrixWorld.clone().invert());
      finalZ = localHit.z;
      
      // Orient decal plane along the surface normal
      if (hit.face) {
        const normal = hit.face.normal.clone();
        const normalMatrix = new THREE.Matrix3().getNormalMatrix(hit.object.matrixWorld);
        normal.applyMatrix3(normalMatrix).normalize();
        
        const worldQuat = new THREE.Quaternion();
        gg.getWorldQuaternion(worldQuat);
        normal.applyQuaternion(worldQuat.invert()).normalize();
        
        const lookAtTarget = badge.position.clone().add(normal);
        const worldTarget = lookAtTarget.clone().applyMatrix4(gg.matrixWorld);
        badge.lookAt(worldTarget);
        rotated = true;
      }
    }

    if (!rotated) {
      if (garmentType === 'hoodie') {
        badge.rotation.y = posX * -0.55;
        badge.rotation.x = -0.05;
      } else {
        const bodyRadius = garmentType === 'tshirt' ? 1.20 : 1.34;
        const computedArcZ = Math.sqrt(Math.max(0, (bodyRadius * bodyRadius) - (posX * posX)));
        finalZ = computedArcZ;
        badge.rotation.y = posX * -0.55;
        badge.rotation.x = -0.05;
      }
    }

    badge.position.z = finalZ + safetyOffset;
    badge.material.opacity = d.opacity;
    badge.material.needsUpdate = true;
  };

  // Drawing Decal Canvas combining graphic elements and slogan text
  function redrawDecal() {
    const eng = engineRef.current;
    const { decal: d, colors: c } = stateRef.current;

    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 512, 512);

    // Dynamic contrast color based on backdrop luminance
    const checkDark = (col) => {
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
    const accentColor = '#528c66';

    // 1. Draw Graphic Image
    if (d.type === 'preset') {
      ctx.strokeStyle = defaultColor;
      ctx.fillStyle = defaultColor;
      ctx.lineWidth = 16;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.save();
      ctx.translate(0, -30);

      if (d.presetName === 'fitcraft') {
        ctx.beginPath();
        ctx.arc(256, 170, 36, 0, Math.PI, true);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(256, 206);
        ctx.lineTo(256, 250);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(256, 250);
        ctx.lineTo(120, 310);
        ctx.lineTo(392, 310);
        ctx.closePath();
        ctx.stroke();
      } else if (d.presetName === 'nexus') {
        ctx.beginPath();
        ctx.arc(256, 220, 70, 0, Math.PI * 2);
        ctx.stroke();
        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.arc(256, 220, 40, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = defaultColor;
        const nodes = [0, Math.PI * 0.66, Math.PI * 1.33];
        nodes.forEach((angle) => {
          const x = 256 + Math.cos(angle) * 70;
          const y = 220 + Math.sin(angle) * 70;
          ctx.beginPath();
          ctx.arc(x, y, 16, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (d.presetName === 'quantum') {
        ctx.save();
        ctx.translate(256, 210);
        ctx.lineWidth = 10;
        ctx.beginPath();
        ctx.ellipse(0, 0, 80, 26, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.ellipse(0, 0, 80, 26, -Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      } else if (d.presetName === 'apex') {
        ctx.beginPath();
        ctx.moveTo(256, 120);
        ctx.lineTo(156, 280);
        ctx.lineTo(356, 280);
        ctx.closePath();
        ctx.stroke();
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(256, 170);
        ctx.lineTo(196, 266);
        ctx.lineTo(316, 266);
        ctx.closePath();
        ctx.fill();
      }
      ctx.restore();
    } else if (d.type === 'custom' && d.customImage) {
      // Custom logo file drawing (centered)
      const drawCustom = (img) => {
        const maxWidth = 200;
        const maxHeight = 200;
        let w = img.width;
        let h = img.height;

        if (w > maxWidth) {
          h *= maxWidth / w;
          w = maxWidth;
        }
        if (h > maxHeight) {
          w *= maxHeight / h;
          h = maxHeight;
        }

        const x = 256 - w / 2;
        const y = 180 - h / 2;
        ctx.drawImage(img, x, y, w, h);
      };

      if (d.customImage instanceof HTMLImageElement) {
        drawCustom(d.customImage);
      } else {
        const tempImg = new Image();
        tempImg.onload = () => {
          drawCustom(tempImg);
          // Redraw texture mapping once loaded asynchronously
          const finalTex = new THREE.CanvasTexture(canvas);
          finalTex.minFilter = THREE.LinearFilter;
          if (eng.renderer) finalTex.anisotropy = eng.renderer.capabilities.getMaxAnisotropy();
          if (eng.activeDecalTexture) eng.activeDecalTexture.dispose();
          eng.activeDecalTexture = finalTex;
          if (eng.badgeMesh) {
            eng.badgeMesh.material.map = finalTex;
            eng.badgeMesh.material.needsUpdate = true;
          }
        };
        tempImg.src = d.customImage;
      }
    }

    // 2. Custom text slogan painting
    if (d.text && d.text.trim() !== '') {
      const font = d.textFont || 'Space Grotesk';
      ctx.font = `800 36px "${font}", sans-serif`;
      ctx.textAlign = 'center';

      let txtColor = defaultColor;
      if (d.textColor && d.textColor !== 'match') {
        txtColor = d.textColor;
      }
      ctx.fillStyle = txtColor;

      const textY = d.type === 'none' ? 270 : 380;
      ctx.fillText(d.text.toUpperCase(), 256, textY);
    }

    // 3. Canvas mapping to texture
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    if (eng.renderer) {
      texture.anisotropy = eng.renderer.capabilities.getMaxAnisotropy();
    }

    if (eng.activeDecalTexture) eng.activeDecalTexture.dispose();
    eng.activeDecalTexture = texture;

    if (eng.badgeMesh) {
      eng.badgeMesh.material.map = texture;
      eng.badgeMesh.material.needsUpdate = true;
      applyDecalAdjustments();
    }
  };

  // Build procedural mesh geometries
  function buildProceduralGarment(type) {
    const eng = engineRef.current;

    let bodyGeom, collarGeom, lSleeveGeom, rSleeveGeom;
    let hemGeom = null;
    let hoodGeom = null;
    let pocketGeom = null;
    let lCuffGeom = null;
    let rCuffGeom = null;
    let drawstringsGeom = null;

    if (type === 'hoodie') {
      bodyGeom = new THREE.CylinderGeometry(1.2, 1.35, 2.7, 32, 1);
      hemGeom = new THREE.CylinderGeometry(1.36, 1.36, 0.3, 32);
      lSleeveGeom = new THREE.CylinderGeometry(0.44, 0.34, 2.2, 16);
      rSleeveGeom = new THREE.CylinderGeometry(0.44, 0.34, 2.2, 16);
      lCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      rCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      collarGeom = new THREE.TorusGeometry(0.55, 0.08, 16, 32);
      hoodGeom = new THREE.SphereGeometry(0.78, 32, 16, 0, Math.PI * 1.55);
      pocketGeom = new THREE.CylinderGeometry(1.36, 1.37, 0.58, 16, 1, false, Math.PI * 0.83, Math.PI * 0.34);
      drawstringsGeom = {
        left: new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8),
        right: new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8)
      };
    } else if (type === 'sweater') {
      bodyGeom = new THREE.CylinderGeometry(1.22, 1.33, 2.7, 32, 1);
      hemGeom = new THREE.CylinderGeometry(1.34, 1.34, 0.3, 32);
      lSleeveGeom = new THREE.CylinderGeometry(0.42, 0.34, 2.2, 16);
      rSleeveGeom = new THREE.CylinderGeometry(0.42, 0.34, 2.2, 16);
      lCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      rCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
      collarGeom = new THREE.TorusGeometry(0.54, 0.1, 16, 32);
    } else if (type === 'tshirt') {
      bodyGeom = new THREE.CylinderGeometry(1.18, 1.22, 2.7, 32, 1);
      lSleeveGeom = new THREE.CylinderGeometry(0.42, 0.38, 0.85, 16);
      rSleeveGeom = new THREE.CylinderGeometry(0.42, 0.38, 0.85, 16);
      collarGeom = new THREE.TorusGeometry(0.52, 0.05, 16, 32);
    }

    // Instantiate and mesh
    const bodyMesh = new THREE.Mesh(bodyGeom, eng.garmentMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    eng.garmentGroup.add(bodyMesh);
    eng.bodyMesh = bodyMesh; // Drag raycast bounding mesh reference

    if (hemGeom) {
      const hemMesh = new THREE.Mesh(hemGeom, eng.garmentMaterial);
      hemMesh.position.y = -1.45;
      hemMesh.castShadow = true;
      hemMesh.receiveShadow = true;
      eng.garmentGroup.add(hemMesh);
    }

    const lSleeveMesh = new THREE.Mesh(lSleeveGeom, eng.sleevesMaterial);
    lSleeveMesh.position.set(-1.45, 0.3, 0);
    lSleeveMesh.rotation.z = -0.45;
    lSleeveMesh.rotation.y = 0.25;
    lSleeveMesh.castShadow = true;
    lSleeveMesh.receiveShadow = true;
    eng.garmentGroup.add(lSleeveMesh);

    const rSleeveMesh = new THREE.Mesh(rSleeveGeom, eng.sleevesMaterial);
    rSleeveMesh.position.set(1.45, 0.3, 0);
    rSleeveMesh.rotation.z = 0.45;
    rSleeveMesh.rotation.y = -0.25;
    rSleeveMesh.castShadow = true;
    rSleeveMesh.receiveShadow = true;
    eng.garmentGroup.add(rSleeveMesh);

    if (lCuffGeom) {
      const lCuffMesh = new THREE.Mesh(lCuffGeom, eng.sleevesMaterial);
      lCuffMesh.position.set(-1.95, -0.68, 0.25);
      lCuffMesh.rotation.z = -0.45;
      lCuffMesh.rotation.y = 0.25;
      lCuffMesh.castShadow = true;
      lCuffMesh.receiveShadow = true;
      eng.garmentGroup.add(lCuffMesh);
    }

    if (rCuffGeom) {
      const rCuffMesh = new THREE.Mesh(rCuffGeom, eng.sleevesMaterial);
      rCuffMesh.position.set(1.95, -0.68, -0.25);
      rCuffMesh.rotation.z = 0.45;
      rCuffMesh.rotation.y = -0.25;
      rCuffMesh.castShadow = true;
      rCuffMesh.receiveShadow = true;
      eng.garmentGroup.add(rCuffMesh);
    }

    const collarMesh = new THREE.Mesh(collarGeom, eng.collarMaterial);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 1.34;
    collarMesh.castShadow = true;
    eng.garmentGroup.add(collarMesh);

    if (hoodGeom) {
      const hoodMesh = new THREE.Mesh(hoodGeom, eng.garmentMaterial);
      hoodMesh.position.set(0, 1.7, -0.12);
      hoodMesh.rotation.x = -0.15;
      hoodMesh.rotation.y = -0.78;
      hoodMesh.rotation.z = -0.15;
      hoodMesh.castShadow = true;
      eng.garmentGroup.add(hoodMesh);
    }

    if (pocketGeom) {
      const pocketMesh = new THREE.Mesh(pocketGeom, eng.garmentMaterial);
      pocketMesh.position.set(0, -0.5, 0);
      pocketMesh.castShadow = true;
      pocketMesh.receiveShadow = true;
      eng.garmentGroup.add(pocketMesh);
    }

    if (drawstringsGeom) {
      const lString = new THREE.Mesh(drawstringsGeom.left, eng.collarMaterial);
      lString.position.set(-0.16, 0.7, 0.65);
      lString.rotation.z = 0.08;
      lString.castShadow = true;
      eng.garmentGroup.add(lString);

      const rString = new THREE.Mesh(drawstringsGeom.right, eng.collarMaterial);
      rString.position.set(0.16, 0.7, 0.65);
      rString.rotation.z = -0.08;
      rString.castShadow = true;
      eng.garmentGroup.add(rString);
    }

    eng.garmentGroup.position.y = -0.2;
    rebuildBadgePlane();
    animateCameraFocus();
  };

  function animateCameraFocus() {
    const { camera } = engineRef.current;
    if (!camera) return;

    let targetZ = 8;
    if (garmentType === 'tshirt') targetZ = 7.5;
    else if (garmentType === 'hoodie') targetZ = 8.2;

    const duration = 800;
    const startX = camera.position.x;
    const startY = camera.position.y;
    const startZ = camera.position.z;
    const startTime = performance.now();

    const updateCam = () => {
      const elapsed = performance.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

      camera.position.x = startX + (0 - startX) * ease;
      camera.position.y = startY + (0 - startY) * ease;
      camera.position.z = startZ + (targetZ - startZ) * ease;

      if (progress < 1) {
        requestAnimationFrame(updateCam);
      }
    };
    updateCam();
  };

  return (
    <div ref={containerRef} className="canvas-container" style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas ref={canvasRef} style={{ width: '100%', height: '100%', display: 'block' }} />
      
      {loading && (
        <div className="loader-overlay">
          <div className="spinner"></div>
          <p>Memuat model 3D PBR...</p>
        </div>
      )}
    </div>
  );
}

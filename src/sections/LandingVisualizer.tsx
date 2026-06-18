import { useRef, useEffect, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

interface LandingVisualizerProps {
  colors?: {
    body: string;
    sleeve: string;
    collar: string;
  };
  onReady?: () => void;
  onProgress?: (progress: number) => void;
  introFinished?: boolean;
}

function processTshirtTexture(texture: THREE.Texture): THREE.Texture {
  if (!texture?.image) return texture;
  const img = texture.image as HTMLImageElement;
  try {
    const canvas = document.createElement('canvas');
    canvas.width = img.naturalWidth || img.width || 1024;
    canvas.height = img.naturalHeight || img.height || 1024;
    const ctx = canvas.getContext('2d')!;
    ctx.drawImage(img as CanvasImageSource, 0, 0, canvas.width, canvas.height);
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

const defaultColors = { body: '#1b2e3c', sleeve: '#1b2e3c', collar: '#2a4050' };

export default function LandingVisualizer({
  colors = defaultColors,
  onReady,
  onProgress,
  introFinished = false,
}: LandingVisualizerProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [loading, setLoading] = useState(true);
  const modelRef = useRef<THREE.Group | null>(null);
  const colorsRef = useRef(colors);
  const loadingRef = useRef(true);
  const rafRef = useRef(0);
  const introFinishedRef = useRef(introFinished);

  useEffect(() => { colorsRef.current = colors; }, [colors]);
  useEffect(() => { loadingRef.current = loading; }, [loading]);
  useEffect(() => { introFinishedRef.current = introFinished; }, [introFinished]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const scene = new THREE.Scene();
    scene.background = null;

    const camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0.3, 5.5);

    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current!,
      antialias: true,
      alpha: true,
    });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.enableZoom = false;
    controls.minDistance = 3.5;
    controls.maxDistance = 8;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0, 0);
    controls.enablePan = false;

    // Enhanced lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.2);
    mainLight.position.set(3, 5, 5);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.set(2048, 2048);
    mainLight.shadow.bias = -0.0005;
    scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0xa8d5ff, 0.5);
    fillLight.position.set(-4, 2, 3);
    scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0x00e5a0, 0.8);
    rimLight.position.set(0, 4, -5);
    scene.add(rimLight);

    const bottomLight = new THREE.PointLight(0x00e5a0, 0.3, 10);
    bottomLight.position.set(0, -2, 2);
    scene.add(bottomLight);

    // Ground reflection
    const groundGeo = new THREE.PlaneGeometry(10, 10);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0x000000,
      roughness: 0.1,
      metalness: 0.8,
      transparent: true,
      opacity: 0.3,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Particle system
    const particleCount = 80;
    const particleGeo = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount; i++) {
      positions[i * 3] = (Math.random() - 0.5) * 8;
      positions[i * 3 + 1] = Math.random() * 6 - 1;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 6;
    }
    particleGeo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const particleMat = new THREE.PointsMaterial({
      color: 0x00e5a0,
      size: 0.02,
      transparent: true,
      opacity: 0.4,
      blending: THREE.AdditiveBlending,
    });
    const particles = new THREE.Points(particleGeo, particleMat);
    scene.add(particles);

    const garmentGroup = new THREE.Group();
    // Start garment group slightly lower and pushed back for the fly-in transition
    garmentGroup.position.set(0, -0.5, -1.5);
    scene.add(garmentGroup);

    // Variables to track smooth fly-in animation
    let currentY = -0.5;
    let currentZ = -1.5;
    const targetY = -0.2;
    const targetZ = 0.0;
    const interpolationFactor = 0.06; // Easing speed

    setLoading(true);
    const gltfLoader = new GLTFLoader();
    gltfLoader.load(
      './assets/models/black t shirt 3d model.glb',
      (gltf) => {
        const model = gltf.scene;
        const box = new THREE.Box3().setFromObject(model);
        const sizeVec = box.getSize(new THREE.Vector3());
        const centerVec = box.getCenter(new THREE.Vector3());

        model.position.x += (model.position.x - centerVec.x);
        model.position.y += (model.position.y - centerVec.y);
        model.position.z += (model.position.z - centerVec.z);

        const targetHeight = 2.15;
        const scaleFactor = targetHeight / sizeVec.y;
        model.scale.set(scaleFactor, scaleFactor, scaleFactor);
        model.rotation.y = -Math.PI / 2;
        model.updateMatrixWorld(true);

        model.traverse((child) => {
          if ((child as THREE.Mesh).isMesh) {
            const mesh = child as THREE.Mesh;
            mesh.castShadow = true;
            mesh.receiveShadow = true;
            if (mesh.material) {
              const assignMaterial = (mat: THREE.Material) => {
                const orig = (mat as THREE.MeshStandardMaterial).clone();
                const name = (mesh.name || (orig as any).name || '').toLowerCase();
                let targetColor = colorsRef.current.body;
                if (name.includes('sleeve') || name.includes('lengan') || name.includes('arm') || name.includes('hand') || name.includes('cuff')) {
                  targetColor = colorsRef.current.sleeve;
                } else if (name.includes('collar') || name.includes('kerah') || name.includes('rib') || name.includes('neck') || name.includes('detail') || name.includes('drawstring') || name.includes('pocket')) {
                  targetColor = colorsRef.current.collar;
                }
                (orig as THREE.MeshStandardMaterial).color.set(new THREE.Color(targetColor));
                (orig as THREE.MeshStandardMaterial).roughness = 0.85;
                (orig as THREE.MeshStandardMaterial).metalness = 0.05;
                (orig as THREE.MeshStandardMaterial).side = THREE.DoubleSide;
                if ((orig as THREE.MeshStandardMaterial).map) {
                  (orig as THREE.MeshStandardMaterial).map = processTshirtTexture((orig as THREE.MeshStandardMaterial).map!);
                }
                return orig;
              };
              if (Array.isArray(mesh.material)) {
                mesh.material = mesh.material.map(assignMaterial);
              } else {
                mesh.material = assignMaterial(mesh.material);
              }
            }
          }
        });

        modelRef.current = model;
        garmentGroup.add(model);
        setTimeout(() => {
          setLoading(false);
          if (onReady) onReady();
        }, 200);
      },
      (xhr) => {
        if (onProgress && xhr.total > 0) {
          const progress = (xhr.loaded / xhr.total) * 100;
          onProgress(Math.min(95, progress));
        }
      },
      () => {
        setLoading(false);
        if (onReady) onReady();
      }
    );

    let isInteracting = false;
    const canvasDom = renderer.domElement;
    const handlePointerDown = () => { isInteracting = true; };
    const handlePointerUp = () => { isInteracting = false; };
    canvasDom.addEventListener('pointerdown', handlePointerDown);
    window.addEventListener('pointerup', handlePointerUp);

    const clock = new THREE.Clock();
    const animate = () => {
      rafRef.current = requestAnimationFrame(animate);
      const elapsed = clock.getElapsedTime();

      // Perform smooth entry zoom/fly-in after loading is complete and intro is finished
      if (!loadingRef.current && introFinishedRef.current) {
        if (Math.abs(garmentGroup.position.y - targetY) > 0.001) {
          currentY += (targetY - currentY) * interpolationFactor;
          garmentGroup.position.y = currentY;
        }
        if (Math.abs(garmentGroup.position.z - targetZ) > 0.001) {
          currentZ += (targetZ - currentZ) * interpolationFactor;
          garmentGroup.position.z = currentZ;
        }
      }

      if (garmentGroup && !loadingRef.current && !isInteracting) {
        garmentGroup.rotation.y += 0.003;
      }

      // Animate particles
      const posArray = particles.geometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        posArray[i * 3 + 1] += Math.sin(elapsed * 0.5 + i) * 0.002;
        posArray[i * 3] += Math.cos(elapsed * 0.3 + i) * 0.001;
      }
      particles.geometry.attributes.position.needsUpdate = true;
      particles.rotation.y = elapsed * 0.05;

      // Pulsing rim light
      rimLight.intensity = 0.6 + Math.sin(elapsed * 2) * 0.2;

      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    const resizeObserver = new ResizeObserver(() => {
      if (!container.clientWidth || !container.clientHeight) return;
      camera.aspect = container.clientWidth / container.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(container.clientWidth, container.clientHeight);
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(rafRef.current);
      resizeObserver.disconnect();
      canvasDom.removeEventListener('pointerdown', handlePointerDown);
      window.removeEventListener('pointerup', handlePointerUp);
      scene.clear();
      renderer.dispose();
    };
  }, []);

  return (
    <div ref={containerRef} style={{ width: '100%', height: '100%', position: 'relative' }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: '100%',
          height: '100%',
          opacity: loading ? 0 : 1,
          transition: 'opacity 1s cubic-bezier(0.25, 1, 0.5, 1)',
        }}
      />
    </div>
  );
}

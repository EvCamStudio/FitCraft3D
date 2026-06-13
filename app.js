/**
 * FitCraft 3D - Three.js Visualizer Engine
 */

// Global state variables
let scene, camera, renderer, controls;
let currentGarment = 'hoodie';
let currentFabric = 'cotton';
let currentColor = '#1b2e3c';
let currentLighting = 'studio';

// Group containing all parts of the garment
let garmentGroup;
let badgeMesh; // Mesh for chest decal
let bodyMesh; // Torso mesh reference for drag raycast
let decalOutline; // Local selection helper outline for the decal

// Global state for text and logo customizer (Holy Trinity)
let activeLogoType = 'preset'; // 'preset', 'custom', or 'none'
let activePresetLogo = 'fitcraft'; // 'fitcraft', 'nexus', 'quantum', 'apex'
let activeCustomImage = null; // HTML Image element when custom logo uploaded
let customText = ''; // Slogan/initials typed by the user
let customTextFont = 'Space Grotesk'; // 'Space Grotesk', 'Outfit', or 'Playfair Display'
let customTextColor = 'match'; // 'match' or HEX value

// Studio is always active on studio.html — no SPA state needed

let isDraggingDecal = false;
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Material and textures
let garmentMaterial; // Body material
let sleevesMaterial; // Sleeves material
let collarMaterial;  // Collar/detail material
let fabricBumpTextures = {};
let activeDecalTexture = null;

// Controls values
let autoRotate = true;
let isScaleView = false;
let isPointerDown = false; // Tracks if user is actively interacting with the 3D viewport

// FPS tracking
let lastFrameTime = performance.now();
let frameCount = 0;
let fpsInterval = 500; // Update FPS display every 500ms
let lastFpsUpdate = performance.now();

// Initializer function
function init3D() {
    const container = document.getElementById('canvas-container');
    if (!container) return;

    // Create Scene
    scene = new THREE.Scene();
    scene.background = null; // Transparent so CSS handles background gradient

    // Create Camera — studio mode always
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8);

    // Create Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Create Controls — always enabled in studio
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI / 2 + 0.1;
    controls.target.set(0, 0, 0);
    controls.enabled = true;

    // Create main clothing group
    garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

    // Create soft ground shadow texture using canvas (adds contact depth)
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
    shadowPlane.position.y = -2.0; // Place it right under the garment
    scene.add(shadowPlane);

    // Initialize Fabric Textures
    initFabricTextures();

    // Create base material
    garmentMaterial = new THREE.MeshStandardMaterial({
        color: new THREE.Color(currentColor),
        roughness: 0.85,
        metalness: 0.05,
        bumpMap: fabricBumpTextures['cotton'],
        bumpScale: 0.035,
        side: THREE.DoubleSide
    });

    // Create clones for multi-zone coloring
    sleevesMaterial = garmentMaterial.clone();
    collarMaterial = garmentMaterial.clone();

    // Build the initial garment geometry
    buildGarment();

    // Initialize lighting
    setupLighting();

    // Hide loader overlay once loaded
    const loader = document.getElementById('loader');
    if (loader) {
        loader.classList.add('hidden');
    }

    // Start rendering loop
    animate();

    // Handle container resize automatically (handles CSS transitions smoothly)
    const viewportSec = document.querySelector('.viewport-section');
    if (viewportSec) {
        const resizeObserver = new ResizeObserver(() => {
            onWindowResize();
        });
        resizeObserver.observe(viewportSec);
    } else {
        window.addEventListener('resize', onWindowResize);
    }

    // Pointer events for direct 3D decal dragging and auto-rotate pausing
    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', (e) => {
        isPointerDown = true;
        onPointerDown(e);
    });
    dom.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', (e) => {
        isPointerDown = false;
        onPointerUp(e);
    });
    window.addEventListener('pointercancel', () => {
        isPointerDown = false;
    });
}

// Generate procedural fabric bump textures on HTML5 canvases
function initFabricTextures() {
    // 1. Premium Cotton Texture (fine ribbed woven pattern)
    const cottonCanvas = document.createElement('canvas');
    cottonCanvas.width = 256;
    cottonCanvas.height = 256;
    const ctxCotton = cottonCanvas.getContext('2d');
    ctxCotton.fillStyle = '#808080'; // Neutral bump height
    ctxCotton.fillRect(0, 0, 256, 256);
    
    // Draw micro ribs
    ctxCotton.fillStyle = '#909090'; // High point
    for (let i = 0; i < 256; i += 4) {
        ctxCotton.fillRect(i, 0, 2, 256);
        ctxCotton.fillRect(0, i, 256, 2);
    }
    
    // Add soft noise
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

    // 2. Heavyweight Fleece Texture (fluffy, thicker brushed fiber texture)
    const fleeceCanvas = document.createElement('canvas');
    fleeceCanvas.width = 256;
    fleeceCanvas.height = 256;
    const ctxFleece = fleeceCanvas.getContext('2d');
    ctxFleece.fillStyle = '#808080';
    ctxFleece.fillRect(0, 0, 256, 256);

    // Draw organic wooly/brushed patterns
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
}

// Lighting Setup according to presets
const lightsGroup = new THREE.Group();
function setupLighting() {
    scene.add(lightsGroup);
    updateLighting(currentLighting);
}

function updateLighting(type) {
    currentLighting = type;
    
    // Clear existing lights
    while(lightsGroup.children.length > 0) {
        lightsGroup.remove(lightsGroup.children[0]);
    }

    let ambientLight, mainLight, fillLight, rimLight;

    if (type === 'studio') {
        // Studio: Clean neutral soft shadows
        ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        
        mainLight = new THREE.DirectionalLight(0xffffff, 0.85);
        mainLight.position.set(3, 4, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.bias = -0.001;
        // Tight shadow camera frustum for sharp rendering on garment
        mainLight.shadow.camera.left = -2.2;
        mainLight.shadow.camera.right = 2.2;
        mainLight.shadow.camera.top = 2.2;
        mainLight.shadow.camera.bottom = -2.2;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 15;

        fillLight = new THREE.DirectionalLight(0xffffff, 0.4);
        fillLight.position.set(-4, 2, 2);

        rimLight = new THREE.DirectionalLight(0xffffff, 0.7);
        rimLight.position.set(0, 5, -5);
        
    } else if (type === 'sunset') {
        // Sunset: Warm dramatic orange key and purple fill
        ambientLight = new THREE.AmbientLight(0xfdcba8, 0.35); // Warm ambient
        
        mainLight = new THREE.DirectionalLight(0xf97316, 1.4); // Orange sun
        mainLight.position.set(4, 3, 4);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048; // Increased for crispness
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.bias = -0.001;
        // Tight shadow camera frustum for sharp rendering on garment
        mainLight.shadow.camera.left = -2.2;
        mainLight.shadow.camera.right = 2.2;
        mainLight.shadow.camera.top = 2.2;
        mainLight.shadow.camera.bottom = -2.2;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 15;

        fillLight = new THREE.DirectionalLight(0x8b5cf6, 0.95); // Deep purple shadow fill
        fillLight.position.set(-4, 1, 3);

        rimLight = new THREE.DirectionalLight(0xfdba74, 0.8); // Golden highlights from rear
        rimLight.position.set(-1, 4, -4);
        
    } else if (type === 'industrial') {
        // Industrial: Cool stark neon lights
        ambientLight = new THREE.AmbientLight(0xe0f2fe, 0.4);
        
        mainLight = new THREE.DirectionalLight(0x38bdf8, 1.25); // Cool cyan spotlight
        mainLight.position.set(-2, 5, 4);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048; // Set map size explicitly for high-quality shadows
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.bias = -0.001;
        // Tight shadow camera frustum for sharp rendering on garment
        mainLight.shadow.camera.left = -2.2;
        mainLight.shadow.camera.right = 2.2;
        mainLight.shadow.camera.top = 2.2;
        mainLight.shadow.camera.bottom = -2.2;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 15;

        fillLight = new THREE.DirectionalLight(0x475569, 0.7); // Neutral grey fill
        fillLight.position.set(4, 2, 2);

        rimLight = new THREE.DirectionalLight(0xffffff, 1.1); // Bright back rim light
        rimLight.position.set(0, 4, -5);
    }

    lightsGroup.add(ambientLight);
    lightsGroup.add(mainLight);
    lightsGroup.add(fillLight);
    lightsGroup.add(rimLight);
}

// Procedural Geometry Construction for hoodie, sweater, tshirt
function buildGarment() {
    // Clear existing meshes inside the group
    while(garmentGroup.children.length > 0) {
        garmentGroup.remove(garmentGroup.children[0]);
    }

    let bodyGeom, collarGeom, lSleeveGeom, rSleeveGeom;
    let hemGeom = null;
    let hoodGeom = null;
    let pocketGeom = null;
    let lCuffGeom = null;
    let rCuffGeom = null;
    let drawstringsGeom = null;

    if (currentGarment === 'hoodie') {
        // Body (slanted cylinder for comfy crop look)
        bodyGeom = new THREE.CylinderGeometry(1.2, 1.35, 2.7, 32, 1);
        
        // Ribbed Hem at bottom
        hemGeom = new THREE.CylinderGeometry(1.36, 1.36, 0.3, 32);
        
        // Long Sleeves (angled down)
        lSleeveGeom = new THREE.CylinderGeometry(0.44, 0.34, 2.2, 16);
        rSleeveGeom = new THREE.CylinderGeometry(0.44, 0.34, 2.2, 16);
        
        // Sleeve Cuffs
        lCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
        rCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);

        // Collar ring
        collarGeom = new THREE.TorusGeometry(0.55, 0.08, 16, 32);
        
        // Procedural Hood (open sphere)
        hoodGeom = new THREE.SphereGeometry(0.78, 32, 16, 0, Math.PI * 1.55);
        
        // Front kangaroo pocket (ribbed cylinder overlay)
        pocketGeom = new THREE.CylinderGeometry(1.36, 1.37, 0.58, 16, 1, false, Math.PI * 0.83, Math.PI * 0.34);
        
        // Drawstrings
        drawstringsGeom = {
            left: new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8),
            right: new THREE.CylinderGeometry(0.02, 0.02, 1.1, 8)
        };

    } else if (currentGarment === 'sweater') {
        // Sweater Body
        bodyGeom = new THREE.CylinderGeometry(1.22, 1.33, 2.7, 32, 1);
        
        // Ribbed Hem
        hemGeom = new THREE.CylinderGeometry(1.34, 1.34, 0.3, 32);
        
        // Long Sleeves
        lSleeveGeom = new THREE.CylinderGeometry(0.42, 0.34, 2.2, 16);
        rSleeveGeom = new THREE.CylinderGeometry(0.42, 0.34, 2.2, 16);
        
        // Sleeve Cuffs
        lCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
        rCuffGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.25, 16);
        
        // Crewneck collar
        collarGeom = new THREE.TorusGeometry(0.54, 0.1, 16, 32);

    } else if (currentGarment === 'tshirt') {
        // Slimmer body
        bodyGeom = new THREE.CylinderGeometry(1.18, 1.22, 2.7, 32, 1);
        
        // Short angled sleeves
        lSleeveGeom = new THREE.CylinderGeometry(0.42, 0.38, 0.85, 16);
        rSleeveGeom = new THREE.CylinderGeometry(0.42, 0.38, 0.85, 16);
        
        // Crewneck collar
        collarGeom = new THREE.TorusGeometry(0.52, 0.05, 16, 32);
    }

    // --- INSTANTIATE MESHES & ASSIGN MATERIALS ---

    // Body
    bodyMesh = new THREE.Mesh(bodyGeom, garmentMaterial);
    bodyMesh.castShadow = true;
    bodyMesh.receiveShadow = true;
    garmentGroup.add(bodyMesh);

    // Hem
    if (hemGeom) {
        const hemMesh = new THREE.Mesh(hemGeom, garmentMaterial);
        hemMesh.position.y = -1.45;
        hemMesh.castShadow = true;
        hemMesh.receiveShadow = true;
        garmentGroup.add(hemMesh);
    }

    // Left Sleeve
    const lSleeveMesh = new THREE.Mesh(lSleeveGeom, sleevesMaterial);
    lSleeveMesh.position.set(-1.45, 0.3, 0);
    lSleeveMesh.rotation.z = -0.45; // angle sleeve downwards
    lSleeveMesh.rotation.y = 0.25;  // angle slightly forward
    lSleeveMesh.castShadow = true;
    lSleeveMesh.receiveShadow = true;
    garmentGroup.add(lSleeveMesh);

    // Right Sleeve
    const rSleeveMesh = new THREE.Mesh(rSleeveGeom, sleevesMaterial);
    rSleeveMesh.position.set(1.45, 0.3, 0);
    rSleeveMesh.rotation.z = 0.45;
    rSleeveMesh.rotation.y = -0.25;
    rSleeveMesh.castShadow = true;
    rSleeveMesh.receiveShadow = true;
    garmentGroup.add(rSleeveMesh);

    // Left Cuff
    if (lCuffGeom) {
        const lCuffMesh = new THREE.Mesh(lCuffGeom, sleevesMaterial);
        lCuffMesh.position.set(-1.95, -0.68, 0.25);
        lCuffMesh.rotation.z = -0.45;
        lCuffMesh.rotation.y = 0.25;
        lCuffMesh.castShadow = true;
        lCuffMesh.receiveShadow = true;
        garmentGroup.add(lCuffMesh);
    }

    // Right Cuff
    if (rCuffGeom) {
        const rCuffMesh = new THREE.Mesh(rCuffGeom, sleevesMaterial);
        rCuffMesh.position.set(1.95, -0.68, -0.25);
        rCuffMesh.rotation.z = 0.45;
        rCuffMesh.rotation.y = -0.25;
        rCuffMesh.castShadow = true;
        rCuffMesh.receiveShadow = true;
        garmentGroup.add(rCuffMesh);
    }

    // Collar
    const collarMesh = new THREE.Mesh(collarGeom, collarMaterial);
    collarMesh.rotation.x = Math.PI / 2;
    collarMesh.position.y = 1.34;
    collarMesh.castShadow = true;
    garmentGroup.add(collarMesh);

    // Hood
    if (hoodGeom) {
        const hoodMesh = new THREE.Mesh(hoodGeom, garmentMaterial);
        // Position on shoulders and rotate opening facing forward
        hoodMesh.position.set(0, 1.7, -0.12);
        hoodMesh.rotation.x = -0.15;
        hoodMesh.rotation.y = -0.78; // Turn opening center
        hoodMesh.rotation.z = -0.15;
        hoodMesh.castShadow = true;
        garmentGroup.add(hoodMesh);
    }

    // Pocket
    if (pocketGeom) {
        const pocketMesh = new THREE.Mesh(pocketGeom, garmentMaterial);
        pocketMesh.position.set(0, -0.5, 0); // Fits outline of body cylinder segment
        pocketMesh.castShadow = true;
        pocketMesh.receiveShadow = true;
        garmentGroup.add(pocketMesh);
    }

    // Drawstrings
    if (drawstringsGeom) {
        const stringMat = collarMaterial;
        
        const lString = new THREE.Mesh(drawstringsGeom.left, stringMat);
        lString.position.set(-0.16, 0.7, 0.65);
        lString.rotation.z = 0.08;
        lString.castShadow = true;
        garmentGroup.add(lString);

        const rString = new THREE.Mesh(drawstringsGeom.right, stringMat);
        rString.position.set(0.16, 0.7, 0.65);
        rString.rotation.z = -0.08;
        rString.castShadow = true;
        garmentGroup.add(rString);
    }

    // Center pivot adjustment
    garmentGroup.position.y = -0.2;

    // --- RE-INITIALIZE BADGE FOR BRANDING DECAL ---
    rebuildBadgePlane();
}

// Separate curved/aligned plane on body for chest decals
function rebuildBadgePlane() {
    // Clean up existing badge mesh and free WebGL resources
    if (badgeMesh) {
        if (garmentGroup) garmentGroup.remove(badgeMesh);
        if (badgeMesh.geometry) badgeMesh.geometry.dispose();
        if (badgeMesh.material) {
            if (badgeMesh.material.map) badgeMesh.material.map.dispose();
            badgeMesh.material.dispose();
        }
        badgeMesh = null;
        decalOutline = null;
    }

    // Decal material setup
    const decalMat = new THREE.MeshStandardMaterial({
        transparent: true,
        roughness: 0.7,
        metalness: 0.1,
        depthWrite: false, // Prevents z-fighting and card clipping issues
        side: THREE.DoubleSide
    });

    if (activeDecalTexture) {
        decalMat.map = activeDecalTexture;
    } else {
        // Load default preset logo
        updateDecalPreset('fitcraft');
        return;
    }

    // Create a thin plane that wraps flatly on the body cylinder chest area
    // Chest of Hoodie is around body center-top (z=1.28, y=0.5)
    // We adjust position dynamically.
    const size = 0.58;
    const badgeGeom = new THREE.PlaneGeometry(size, size);
    
    badgeMesh = new THREE.Mesh(badgeGeom, decalMat);
    badgeMesh.position.set(0, 0.45, 1.29); // Directly on Hoodie's front chest
    badgeMesh.rotation.x = -0.05; // Lean slightly back conforming to body geometry

    // Create local outline border helper for design visual feedback
    const borderGeom = new THREE.EdgesGeometry(badgeGeom);
    const borderMat = new THREE.LineBasicMaterial({ color: 0x528c66, linewidth: 2 });
    decalOutline = new THREE.LineSegments(borderGeom, borderMat);
    decalOutline.visible = false;
    badgeMesh.add(decalOutline);
    
    // Add to group so it spins with garment
    garmentGroup.add(badgeMesh);
    
    // Apply UI adjustments directly
    updateDecalUIAdjustments();
}

// Function to update color
function updateGarmentColor(hexString, zone = 'body') {
    if (zone === 'body') {
        currentColor = hexString; // Maintain base color for logo contrast check
        if (garmentMaterial) {
            garmentMaterial.color.set(new THREE.Color(hexString));
        }
    } else if (zone === 'sleeves') {
        if (sleevesMaterial) {
            sleevesMaterial.color.set(new THREE.Color(hexString));
        }
    } else if (zone === 'collar') {
        if (collarMaterial) {
            collarMaterial.color.set(new THREE.Color(hexString));
        }
    }
    
    // Re-draw current preset logo to adjust colors dynamically
    // (We paint black logo on light clothes and white on dark clothes based on body color)
    const activePresetBtn = document.querySelector('.btn-decal-preset.active');
    if (activePresetBtn) {
        updateDecalPreset(activePresetBtn.dataset.preset);
    }
}

// Function to update silhouette
function updateGarmentSilhouette(type) {
    currentGarment = type;
    buildGarment();
    
    // Smooth camera refocus animation
    animateCameraFocus();
}

// Function to update fabric type
function updateGarmentFabric(type) {
    currentFabric = type;
    const materials = [garmentMaterial, sleevesMaterial, collarMaterial];
    
    materials.forEach(mat => {
        if (mat && fabricBumpTextures[type]) {
            mat.bumpMap = fabricBumpTextures[type];
            // Heavy fleece texture is more prominent
            mat.bumpScale = (type === 'fleece') ? 0.055 : 0.035;
            mat.roughness = (type === 'fleece') ? 0.92 : 0.85;
            mat.needsUpdate = true;
        }
    });
}

// Composite decal drawer (Combines Logo Graphic + Custom Slogan Text dynamically on a 512x512 Canvas)
function redrawDecal() {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, 512, 512);

    // Determine branding color based on garment color luminance
    const isDark = isColorDark(currentColor);
    const defaultBrandColor = isDark ? '#ffffff' : '#121212';
    const accentColor = '#528c66'; // Premium Green

    // 1. DRAW LOGO (PRESET OR CUSTOM)
    if (activeLogoType === 'preset') {
        ctx.strokeStyle = defaultBrandColor;
        ctx.fillStyle = defaultBrandColor;
        ctx.lineWidth = 16;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';

        // Draw preset paths inside upper half (centered horizontally, Y-centered around 180)
        // Offset Y slightly upwards to leave room for text below it
        ctx.save();
        ctx.translate(0, -30);
        
        if (activePresetLogo === 'fitcraft') {
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
        } else if (activePresetLogo === 'nexus') {
            ctx.beginPath();
            ctx.arc(256, 220, 70, 0, Math.PI * 2);
            ctx.stroke();

            ctx.strokeStyle = accentColor;
            ctx.beginPath();
            ctx.arc(256, 220, 40, 0, Math.PI * 2);
            ctx.stroke();

            ctx.fillStyle = defaultBrandColor;
            const nodes = [0, Math.PI * 0.66, Math.PI * 1.33];
            nodes.forEach(angle => {
                const x = 256 + Math.cos(angle) * 70;
                const y = 220 + Math.sin(angle) * 70;
                ctx.beginPath();
                ctx.arc(x, y, 16, 0, Math.PI * 2);
                ctx.fill();
            });
        } else if (activePresetLogo === 'quantum') {
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
        } else if (activePresetLogo === 'apex') {
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
    } else if (activeLogoType === 'custom' && activeCustomImage) {
        // Draw uploaded custom logo centered on the upper-middle canvas (max 200x200)
        const maxWidth = 200;
        const maxHeight = 200;
        let width = activeCustomImage.width;
        let height = activeCustomImage.height;

        if (width > maxWidth) {
            height *= maxWidth / width;
            width = maxWidth;
        }
        if (height > maxHeight) {
            width *= maxHeight / height;
            height = maxHeight;
        }

        const x = 256 - width / 2;
        const y = 180 - height / 2;
        ctx.drawImage(activeCustomImage, x, y, width, height);
    }

    // 2. DRAW CUSTOM TEXT below logo (Y-centered around 380, or centered vertically at 270 if no logo)
    if (customText.trim() !== '') {
        const fontName = customTextFont;
        ctx.font = `800 36px "${fontName}", sans-serif`;
        ctx.textAlign = 'center';
        
        let textColor = defaultBrandColor;
        if (customTextColor !== 'match') {
            textColor = customTextColor;
        }
        ctx.fillStyle = textColor;
        
        const textY = (activeLogoType === 'none' || (activeLogoType === 'custom' && !activeCustomImage)) ? 270 : 380;
        ctx.fillText(customText.toUpperCase(), 256, textY);
    }

    // 3. GENERATE AND UPDATE TEXTURE
    const texture = new THREE.CanvasTexture(canvas);
    texture.minFilter = THREE.LinearFilter;
    if (renderer) {
        texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    }
    
    activeDecalTexture = texture;

    if (badgeMesh) {
        badgeMesh.material.map = activeDecalTexture;
        badgeMesh.material.needsUpdate = true;
    } else {
        rebuildBadgePlane();
    }
}

// Check background luminance to invert decal graphics colors
function isColorDark(colorHex) {
    const c = colorHex.substring(1);      // strip #
    const rgb = parseInt(c, 16);          // convert to integer
    const r = (rgb >> 16) & 0xff;         // extract red
    const g = (rgb >> 8) & 0xff;          // extract green
    const b = (rgb >> 0) & 0xff;          // extract blue
    const luma = 0.2126 * r + 0.7152 * g + 0.0722 * b; // ITU-R BT.709
    return luma < 128; // returns true if dark color
}

// Function to update preset logo
function updateDecalPreset(presetName) {
    activeLogoType = 'preset';
    activePresetLogo = presetName;
    redrawDecal();
}

// Function to set custom uploaded logo image
function updateCustomUploadedLogo(imgElement) {
    activeLogoType = 'custom';
    activeCustomImage = imgElement;
    redrawDecal();
}

// Read inputs from sliders and apply directly to Badge Mesh
function updateDecalUIAdjustments() {
    if (!badgeMesh) return;

    const scale = parseFloat(document.getElementById('rangeScale').value);
    const vertical = parseFloat(document.getElementById('rangeVertical').value);
    const horizontal = parseFloat(document.getElementById('rangeHorizontal').value);
    const opacity = parseFloat(document.getElementById('rangeOpacity').value);

    // Apply scale multiplier to original dimensions
    badgeMesh.scale.set(scale, scale, 1);

    // Adjust positional coordinates relative to chest base (X: 0, Y: 0.45, Z: 1.29)
    // Sweater and T-Shirt might have slightly different chest curves
    let baseY = 0.45;
    let baseZ = 1.29;

    if (currentGarment === 'sweater') {
        baseY = 0.45;
        baseZ = 1.28;
    } else if (currentGarment === 'tshirt') {
        baseY = 0.40;
        baseZ = 1.18;
    }

    badgeMesh.position.x = horizontal;
    badgeMesh.position.y = baseY + vertical;
    
    // We adjust Z based on horizontal displacement too, since the body is round (cylinder).
    // Radius of Hoodie body is ~1.3. Cylindrical arc equation: Z = sqrt(R^2 - X^2)
    const bodyRadius = currentGarment === 'tshirt' ? 1.20 : 1.34;
    const displacementX = horizontal;
    const computedArcZ = Math.sqrt(Math.max(0, (bodyRadius * bodyRadius) - (displacementX * displacementX)));
    
    // Offset slightly outward from fabric layer to prevent clipping
    const safetyOffset = 0.015;
    badgeMesh.position.z = computedArcZ + safetyOffset;

    // Apply Z rotation if horizontal offset is large (angling the decal)
    badgeMesh.rotation.y = horizontal * -0.55;

    // Opacity
    badgeMesh.material.opacity = opacity;
    badgeMesh.material.needsUpdate = true;
}

// Smooth Camera Focus Refocus Animation
function animateCameraFocus() {
    let targetX = 0, targetY = 0, targetZ = 8;
    
    if (currentGarment === 'tshirt') {
        targetZ = 7.5;
    } else if (currentGarment === 'hoodie') {
        targetZ = 8.2;
    }
    
    const duration = 800; // ms
    const startX = camera.position.x;
    const startY = camera.position.y;
    const startZ = camera.position.z;
    const startTime = performance.now();

    function updateCam() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing curve (ease-out cubic)
        const ease = 1 - Math.pow(1 - progress, 3);
        
        camera.position.x = startX + (targetX - startX) * ease;
        camera.position.y = startY + (targetY - startY) * ease;
        camera.position.z = startZ + (targetZ - startZ) * ease;
        
        if (progress < 1) {
            requestAnimationFrame(updateCam);
        }
    }
    
    updateCam();
}

// Reset camera view to default
function resetView() {
    controls.reset();
    camera.position.set(0, 0, 8);
    controls.target.set(0, 0, 0);
    isScaleView = false;
    document.getElementById('scaleViewBtn').classList.remove('active');
}

// Toggle Zoom/Scale View
function toggleScaleView() {
    isScaleView = !isScaleView;
    const btn = document.getElementById('scaleViewBtn');
    
    let targetZ = isScaleView ? 4.5 : 8.0;
    let targetY = isScaleView ? 0.35 : 0;
    
    const startTime = performance.now();
    const duration = 600;
    const startZ = camera.position.z;
    const startY = camera.position.y;

    if (isScaleView) {
        btn.classList.add('active');
    } else {
        btn.classList.remove('active');
    }

    function zoomCam() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3);
        
        camera.position.z = startZ + (targetZ - startZ) * ease;
        camera.position.y = startY + (targetY - startY) * ease;
        
        if (progress < 1) {
            requestAnimationFrame(zoomCam);
        } else {
            // Sync OrbitControls target coordinate when zoom completes to prevent snapping back
            if (controls) {
                controls.target.set(0, targetY, 0);
            }
        }
    }
    zoomCam();
}

// Canvas size resize handler
function onWindowResize() {
    const container = document.getElementById('canvas-container');
    if (!container) return;
    
    camera.aspect = container.clientWidth / container.clientHeight;
    camera.updateProjectionMatrix();
    
    renderer.setSize(container.clientWidth, container.clientHeight);
}

// Rendering Tick Loop
function animate() {
    requestAnimationFrame(animate);

    // Track FPS
    const time = performance.now();
    frameCount++;
    
    if (time > lastFpsUpdate + fpsInterval) {
        const actualFps = Math.round((frameCount * 1000) / (time - lastFpsUpdate));
        const fpsEl = document.getElementById('fpsCounter');
        if (fpsEl) fpsEl.textContent = actualFps;
        
        frameCount = 0;
        lastFpsUpdate = time;
    }

    // Auto rotate garment group (pause during dragging or camera rotation)
    if (autoRotate && garmentGroup && !isDraggingDecal && !isPointerDown) {
        garmentGroup.rotation.y += 0.007;
        garmentGroup.rotation.x += (0 - garmentGroup.rotation.x) * 0.05;
    } else if (garmentGroup) {
        garmentGroup.rotation.x += (0 - garmentGroup.rotation.x) * 0.05;
    }

    if (controls) {
        controls.update();
    }

    if (renderer && scene && camera) {
        renderer.render(scene, camera);
    }
}

// Direct 3D Decal Dragging Event Handlers
function onPointerDown(event) {
    if (!badgeMesh || !renderer) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObject(badgeMesh);

    if (intersects.length > 0) {
        isDraggingDecal = true;
        if (controls) controls.enabled = false;
        renderer.domElement.style.cursor = 'grabbing';
        if (decalOutline) decalOutline.visible = true;
        event.stopPropagation();
    }
}

function onPointerMove(event) {
    if (!renderer) return;

    const rect = renderer.domElement.getBoundingClientRect();
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;


    if (isDraggingDecal && bodyMesh) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(bodyMesh);

        if (intersects.length > 0) {
            const localPoint = garmentGroup.worldToLocal(intersects[0].point.clone());
            
            let baseY = currentGarment === 'tshirt' ? 0.40 : 0.45;
            let verticalOffset = localPoint.y - baseY;
            let horizontalOffset = localPoint.x;

            verticalOffset = Math.max(-0.6, Math.min(0.6, verticalOffset));
            horizontalOffset = Math.max(-0.5, Math.min(0.5, horizontalOffset));

            const sliderV = document.getElementById('rangeVertical');
            const sliderH = document.getElementById('rangeHorizontal');
            const valV = document.getElementById('valVertical');
            const valH = document.getElementById('valHorizontal');

            if (sliderV && sliderH && valV && valH) {
                sliderV.value = verticalOffset;
                sliderH.value = horizontalOffset;
                valV.textContent = verticalOffset.toFixed(2);
                valH.textContent = horizontalOffset.toFixed(2);
            }

            updateDecalUIAdjustments();
        }
        if (decalOutline) decalOutline.visible = true;
    } else if (badgeMesh) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(badgeMesh);
        if (intersects.length > 0) {
            renderer.domElement.style.cursor = 'grab';
            if (decalOutline) decalOutline.visible = true;
        } else {
            renderer.domElement.style.cursor = 'default';
            if (decalOutline) decalOutline.visible = false;
        }
    }
}

function onPointerUp(event) {
    if (isDraggingDecal) {
        isDraggingDecal = false;
        if (controls) controls.enabled = true;
        if (renderer) renderer.domElement.style.cursor = 'default';
    }
    if (decalOutline) decalOutline.visible = false;
}

// Initialize Three.js visualizer when page contents are loaded
window.addEventListener('DOMContentLoaded', () => {
    init3D();
});

// Interpolate color changes for a smooth visual transition (lerp)
function lerpGarmentColor(targetHex, zone = 'body', duration = 400) {
    let mat = garmentMaterial;
    if (zone === 'sleeves') mat = sleevesMaterial;
    else if (zone === 'collar') mat = collarMaterial;
    if (!mat) return;

    const startColor = mat.color.clone();
    const targetColor = new THREE.Color(targetHex);
    const startTime = performance.now();

    function step() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic

        mat.color.copy(startColor).lerp(targetColor, ease);

        if (progress < 1) {
            requestAnimationFrame(step);
        } else {
            if (zone === 'body') {
                currentColor = targetHex;
                redrawDecal(); // Update decal text/graphic contrast if needed
            }
        }
    }
    step();
}

// Awwwards cinematic transition from Landing Page View to Studio View
function transitionToStudio() {
    activeViewState = 'studio';
    
    // Enable controls
    if (controls) {
        controls.enabled = true;
    }
    
    // Smoothly turn off autoRotate
    autoRotate = false;
    const rotateToggle = document.getElementById('rotateToggle');
    const rotateStatusText = document.getElementById('rotateStatus');
    if (rotateToggle && rotateStatusText) {
        rotateToggle.checked = false;
        rotateStatusText.textContent = 'OFF';
    }

    const duration = 1200; // ms
    const startTime = performance.now();
    
    const startX = camera.position.x;
    const startY = camera.position.y;
    const startZ = camera.position.z;
    
    const targetCamX = 0.0;
    const targetCamY = 0.0;
    const targetCamZ = 8.0;

    function animateTransition() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 4); // ease-out quartic
        
        camera.position.x = startX + (targetCamX - startX) * ease;
        camera.position.y = startY + (targetCamY - startY) * ease;
        camera.position.z = startZ + (targetCamZ - startZ) * ease;
        
        if (controls) {
            controls.target.set(0, 0, 0);
            controls.update();
        }

        if (progress < 1) {
            requestAnimationFrame(animateTransition);
        }
    }
    animateTransition();
}

// Expose camera autofocus transition globally for ui.js tabs
function animateCameraTo(targetY, targetZ, targetLookAtY, duration = 800) {
    if (!camera || !controls) return;
    
    // Disable controls during camera auto-movement to prevent fighting
    controls.enabled = false;
    
    const startTime = performance.now();
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    
    // Obtain current spherical angles relative to start target to preserve rotation state
    const relativePos = new THREE.Vector3().subVectors(camera.position, startTarget);
    const spherical = new THREE.Spherical().setFromVector3(relativePos);
    
    const startRadius = spherical.radius;
    const targetRadius = targetZ;
    
    function updateCam() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        const ease = 1 - Math.pow(1 - progress, 3); // ease-out cubic
        
        // Lerp lookAt target height
        controls.target.y = startTarget.y + (targetLookAtY - startTarget.y) * ease;
        
        // Lerp spherical radius (zoom)
        spherical.radius = startRadius + (targetRadius - startRadius) * ease;
        
        // Recalculate camera position preserving current angles
        const offset = new THREE.Vector3().setFromSpherical(spherical);
        camera.position.copy(controls.target).add(offset);
        
        // Lerp absolute camera height offset
        camera.position.y = startPos.y + (targetY - startPos.y) * ease;
        
        controls.update();
        
        if (progress < 1) {
            requestAnimationFrame(updateCam);
        } else {
            // Re-enable controls when done
            controls.enabled = true;
        }
    }
    
    updateCam();
}
window.animateCameraTo = animateCameraTo;



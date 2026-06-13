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

    // Create Camera
    camera = new THREE.PerspectiveCamera(40, container.clientWidth / container.clientHeight, 0.1, 100);
    camera.position.set(0, 0, 8); // Look straight at the garment

    // Create Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    container.appendChild(renderer.domElement);

    // Create Controls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 4;
    controls.maxDistance = 12;
    controls.maxPolarAngle = Math.PI / 2 + 0.1; // Don't go too far below floor
    controls.target.set(0, 0, 0);

    // Create main clothing group
    garmentGroup = new THREE.Group();
    scene.add(garmentGroup);

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

    // Handle Window Resize
    window.addEventListener('resize', onWindowResize);

    // Pointer events for direct 3D decal dragging
    const dom = renderer.domElement;
    dom.addEventListener('pointerdown', onPointerDown);
    dom.addEventListener('pointermove', onPointerMove);
    window.addEventListener('pointerup', onPointerUp);
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
        mainLight.shadow.mapSize.width = 1024;
        mainLight.shadow.mapSize.height = 1024;
        mainLight.shadow.bias = -0.001;

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
        mainLight.shadow.bias = -0.001;

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

// Generate Preset Logo text dynamically via Canvas 2D
function generateLogoTexture(presetName) {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Transparent background
    ctx.clearRect(0, 0, 512, 512);

    // Determine branding color based on garment color luminance
    const isDark = isColorDark(currentColor);
    const brandColor = isDark ? '#ffffff' : '#121212';
    const accentColor = '#528c66'; // Premium Green

    ctx.strokeStyle = brandColor;
    ctx.fillStyle = brandColor;
    ctx.lineWidth = 16;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    if (presetName === 'fitcraft') {
        // FitCraft logo: stylized hanger shape + text
        ctx.beginPath();
        // Hook
        ctx.arc(256, 120, 36, 0, Math.PI, true);
        ctx.stroke();
        
        // Hanger bars
        ctx.beginPath();
        ctx.moveTo(256, 156);
        ctx.lineTo(256, 200);
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(256, 200);
        ctx.lineTo(120, 260);
        ctx.lineTo(392, 260);
        ctx.closePath();
        ctx.stroke();
        
        // Text
        ctx.font = '800 38px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('FITCRAFT', 256, 360);
        
        ctx.font = '500 20px "Outfit", sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText('DIVISI KREATIF', 256, 396);

    } else if (presetName === 'nexus') {
        // Nexus AI logo: Double connected orbital rings
        ctx.beginPath();
        ctx.arc(256, 200, 70, 0, Math.PI * 2);
        ctx.stroke();

        ctx.strokeStyle = accentColor;
        ctx.beginPath();
        ctx.arc(256, 200, 40, 0, Math.PI * 2);
        ctx.stroke();

        // Node connections
        ctx.fillStyle = brandColor;
        const nodes = [0, Math.PI*0.66, Math.PI*1.33];
        nodes.forEach(angle => {
            const x = 256 + Math.cos(angle) * 70;
            const y = 200 + Math.sin(angle) * 70;
            ctx.beginPath();
            ctx.arc(x, y, 16, 0, Math.PI*2);
            ctx.fill();
        });

        // Text
        ctx.font = '800 42px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = brandColor;
        ctx.fillText('NEXUS A.I.', 256, 350);

        ctx.font = '600 20px "Outfit", sans-serif';
        ctx.fillText('• LAB STARTUP •', 256, 390);

    } else if (presetName === 'quantum') {
        // Quantum: atom orbital paths
        ctx.save();
        ctx.translate(256, 190);
        ctx.lineWidth = 10;
        
        // Ring 1
        ctx.beginPath();
        ctx.ellipse(0, 0, 80, 26, Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();
        
        // Ring 2
        ctx.beginPath();
        ctx.ellipse(0, 0, 80, 26, -Math.PI / 4, 0, Math.PI * 2);
        ctx.stroke();

        // Core nucleus
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(0, 0, 22, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();

        // Text
        ctx.font = '800 40px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = brandColor;
        ctx.fillText('QUANTUM', 256, 345);

        ctx.font = '500 22px "Outfit", sans-serif';
        ctx.fillStyle = accentColor;
        ctx.fillText('SISTEM INOVATIF', 256, 385);

    } else if (presetName === 'apex') {
        // Apex Tech: minimal delta triangle
        ctx.beginPath();
        ctx.moveTo(256, 100);
        ctx.lineTo(156, 260);
        ctx.lineTo(356, 260);
        ctx.closePath();
        ctx.stroke();

        // Inner core
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.moveTo(256, 150);
        ctx.lineTo(196, 246);
        ctx.lineTo(316, 246);
        ctx.closePath();
        ctx.fill();

        // Text
        ctx.font = '800 44px "Space Grotesk", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillStyle = brandColor;
        ctx.fillText('APEX TECH', 256, 350);

        ctx.font = '500 20px "Outfit", sans-serif';
        ctx.fillText('PAKAIAN MASA DEPAN', 256, 390);
    }

    const texture = new THREE.CanvasTexture(canvas);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy();
    return texture;
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
    activeDecalTexture = generateLogoTexture(presetName);
    
    // If badge mesh already exists, update its material texture
    if (badgeMesh) {
        badgeMesh.material.map = activeDecalTexture;
        badgeMesh.material.needsUpdate = true;
    } else {
        rebuildBadgePlane();
    }
}

// Function to set custom uploaded logo image
function updateCustomUploadedLogo(imgElement) {
    const texture = new THREE.Texture(imgElement);
    texture.needsUpdate = true;
    activeDecalTexture = texture;
    
    if (badgeMesh) {
        badgeMesh.material.map = activeDecalTexture;
        badgeMesh.material.needsUpdate = true;
    } else {
        rebuildBadgePlane();
    }
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

    // Auto rotate garment group
    if (autoRotate && garmentGroup) {
        garmentGroup.rotation.y += 0.007;
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
    } else if (badgeMesh) {
        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObject(badgeMesh);
        if (intersects.length > 0) {
            renderer.domElement.style.cursor = 'grab';
        } else {
            renderer.domElement.style.cursor = 'default';
        }
    }
}

function onPointerUp(event) {
    if (isDraggingDecal) {
        isDraggingDecal = false;
        if (controls) controls.enabled = true;
        if (renderer) renderer.domElement.style.cursor = 'default';
    }
}

// Initialize Three.js visualizer when page contents are loaded
window.addEventListener('DOMContentLoaded', () => {
    init3D();
});

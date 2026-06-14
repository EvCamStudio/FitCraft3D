/**
 * FitCraft 3D - User Interface Interaction Controls
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- STATE TRACKING ---
    let activeGarmentType = 'hoodie';
    let activeGarmentPrice = 349000;
    
    let activeFabricType = 'cotton';
    let activeFabricPriceAdd = 0;
    
    let activeColorZone = 'body'; // 'body', 'sleeves', or 'collar'
    let colorBodyHex = '#1b2e3c';
    let colorSleevesHex = '#1b2e3c';
    let colorCollarHex = '#1b2e3c';
    let colorBodyName = 'Tech Navy (Tren SaaS)';
    let colorSleevesName = 'Tech Navy (Tren SaaS)';
    let colorCollarName = 'Tech Navy (Tren SaaS)';
    
    let activeDecalName = 'Preset FitCraft';
    let activeGarmentSize = 'M'; // 'S', 'M', 'L', 'XL', 'XXL'

    // --- DOM REFERENCES ---
    const sidebarTabs = document.querySelectorAll('.tab-btn');
    const tabPanes = document.querySelectorAll('.tab-pane');
    
    // Carousel Model Selector DOM references
    const prevModelBtn = document.getElementById('prevModelBtn');
    const nextModelBtn = document.getElementById('nextModelBtn');
    const carouselModelCategory = document.getElementById('carouselModelCategory');
    const carouselModelTitle = document.getElementById('carouselModelTitle');
    const carouselModelPrice = document.getElementById('carouselModelPrice');
    
    const fabricCards = document.querySelectorAll('.fabric-card');
    const colorDots = document.querySelectorAll('.color-dot-wrapper');
    const selectedColorDisplay = document.getElementById('selectedColorName');
    const canvasGarmentTitle = document.getElementById('activeGarmentName');
    
    const lightingButtons = document.querySelectorAll('#lightingGroup .btn-toggle');
    const rotateToggle = document.getElementById('rotateToggle');
    const rotateStatusText = document.getElementById('rotateStatus');
    const resetViewBtn = document.getElementById('resetViewBtn');
    const scaleViewBtn = document.getElementById('scaleViewBtn');
    
    // Color Zone and Export DOM references
    const zonePills = document.querySelectorAll('.btn-zone-pill');
    const exportPngBtn = document.getElementById('exportPngBtn');
    
    const presetDecalBtns = document.querySelectorAll('.btn-decal-preset');
    const logoUploadInput = document.getElementById('logoUpload');
    const browseLogoBtn = document.getElementById('browseLogoBtn');
    const uploadZone = document.getElementById('uploadZone');
    const uploadPreviewContainer = document.getElementById('uploadPreviewContainer');
    const uploadedFileName = document.getElementById('uploadedFileName');
    const removeLogoBtn = document.getElementById('removeLogoBtn');
    
    // Sliders
    const rangeScale = document.getElementById('rangeScale');
    const rangeVertical = document.getElementById('rangeVertical');
    const rangeHorizontal = document.getElementById('rangeHorizontal');
    const rangeOpacity = document.getElementById('rangeOpacity');
    
    const valScale = document.getElementById('valScale');
    const valVertical = document.getElementById('valVertical');
    const valHorizontal = document.getElementById('valHorizontal');
    const valOpacity = document.getElementById('valOpacity');
    
    // Size customizer references
    const sizePills = document.querySelectorAll('.btn-size-pill');
    const sizeChartBtn = document.getElementById('sizeChartBtn');
    const sizeChartModal = document.getElementById('sizeChartModal');
    const closeSizeChartBtn = document.getElementById('closeSizeChartBtn');
    const closeSizeChartBtnOk = document.getElementById('closeSizeChartBtnOk');
    const summarySize = document.getElementById('summarySize');
    
    // Pricing
    const sidebarTotalPrice = document.getElementById('sidebarTotalPrice');
    const themeToggleBtn = document.getElementById('themeToggleBtn');
    
    // Modal
    const checkoutBtn = document.getElementById('checkoutBtn');
    const checkoutBtnPrimary = document.getElementById('checkoutBtnPrimary');
    const checkoutModal = document.getElementById('checkoutModal');
    const closeModalBtn = document.getElementById('closeModalBtn');
    const checkoutForm = document.getElementById('checkoutForm');
    
    const modalOrderSummary = document.getElementById('modalOrderSummary');
    const modalSuccess = document.getElementById('modalSuccess');
    const successCloseBtn = document.getElementById('successCloseBtn');
    const successEmailDisplay = document.getElementById('successEmailDisplay');
    
    // Summary Fields
    const summaryGarment = document.getElementById('summaryGarment');
    const summaryFabric = document.getElementById('summaryFabric');
    const summaryColor = document.getElementById('summaryColor');
    const summaryDecal = document.getElementById('summaryDecal');
    const summaryPrice = document.getElementById('summaryPrice');

    // --- TAB NAVIGATION ---
    sidebarTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            // Remove active classes
            sidebarTabs.forEach(t => t.classList.remove('active'));
            tabPanes.forEach(p => p.classList.remove('active'));
            
            // Add active classes
            tab.classList.add('active');
            const targetPane = document.getElementById(tab.dataset.tab);
            if (targetPane) {
                targetPane.classList.add('active');
            }

            // Camera autofocus based on tab
            if (typeof window.animateCameraTo === 'function') {
                if (tab.dataset.tab === 'tab-decals') {
                    window.animateCameraTo(0.4, 3.6, 0.4, 800);
                    // Also turn off auto-rotate for decal editing focus
                    autoRotate = false;
                    if (rotateToggle) rotateToggle.checked = false;
                    if (rotateStatusText) rotateStatusText.textContent = 'OFF';
                } else {
                    window.animateCameraTo(0, 8.0, 0, 800);
                }
            }
        });
    });

    // --- MODELS DATA (3 MODELS: HOODIE, TSHIRT, SWEATER) ---
    const modelOptions = [
        {
            id: 'hoodie',
            name: 'Hoodie Kustom Cozy',
            category: 'Outerwear',
            price: 349000,
            garmentType: 'hoodie'
        },
        {
            id: 'tshirt',
            name: 'Kaos Kinerja Pas Badan',
            category: 'Atasan',
            price: 199000,
            garmentType: 'tshirt'
        },
        {
            id: 'sweater',
            name: 'Sweater Crewneck Klasik',
            category: 'Outerwear',
            price: 299000,
            garmentType: 'sweater'
        }
    ];

    let currentModelIndex = 0; // Starts with Hoodie (index 0)

    function updateCarouselDisplay() {
        const model = modelOptions[currentModelIndex];
        
        // Update active state variables
        activeGarmentType = model.garmentType;
        activeGarmentPrice = model.price;

        // Update carousel text elements
        carouselModelTitle.textContent = model.name;
        carouselModelCategory.textContent = model.category;
        carouselModelPrice.textContent = 'Rp ' + model.price.toLocaleString('id-ID');

        // Update canvas garment display name
        canvasGarmentTitle.textContent = model.name;

        // Update sidebar thumbnail SVG
        const sidebarProductThumbnail = document.getElementById('sidebarProductThumbnail');
        if (sidebarProductThumbnail) {
            if (model.garmentType === 'hoodie') {
                sidebarProductThumbnail.innerHTML = `
                    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                        <path d="M45 85 L30 210 L170 210 L155 85 L130 75 C125 95 115 105 100 105 C85 105 75 95 70 75 Z" fill="var(--primary)"/>
                        <path d="M72 72 C72 45 82 25 100 22 C118 25 128 45 128 72 C120 68 115 60 100 58 C85 60 80 68 72 72Z" fill="var(--primary)"/>
                    </svg>`;
            } else if (model.garmentType === 'tshirt') {
                sidebarProductThumbnail.innerHTML = `
                    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                        <path d="M45 75 L40 210 L160 210 L155 75 L130 70 C125 85 115 90 100 90 C85 90 75 85 70 70 Z" fill="var(--primary)"/>
                        <path d="M45 75 L70 70 L65 100 L30 118 L22 98 Z" fill="var(--primary)"/>
                        <path d="M155 75 L130 70 L135 100 L170 118 L178 98 Z" fill="var(--primary)"/>
                    </svg>`;
            } else if (model.garmentType === 'sweater') {
                sidebarProductThumbnail.innerHTML = `
                    <svg viewBox="0 0 200 240" fill="none" xmlns="http://www.w3.org/2000/svg" style="width: 100%; height: 100%;">
                        <path d="M45 75 L32 205 L168 205 L155 75 L130 70 C125 88 115 95 100 95 C85 95 75 88 70 70 Z" fill="var(--primary)"/>
                        <path d="M45 75 L70 70 L65 100 L24 135 L18 160 L34 165 Z" fill="var(--primary)"/>
                        <path d="M155 75 L130 70 L135 100 L176 135 L182 160 L166 165 Z" fill="var(--primary)"/>
                    </svg>`;
            }
        }

        // Update 3D visualizer garment model
        if (typeof updateGarmentSilhouette === 'function') {
            updateGarmentSilhouette(model.garmentType);
        }

        // Re-calculate pricing
        updatePrice();
    }

    // Prev Button click handler
    if (prevModelBtn) {
        prevModelBtn.addEventListener('click', () => {
            currentModelIndex = (currentModelIndex - 1 + modelOptions.length) % modelOptions.length;
            updateCarouselDisplay();
        });
    }

    // Next Button click handler
    if (nextModelBtn) {
        nextModelBtn.addEventListener('click', () => {
            currentModelIndex = (currentModelIndex + 1) % modelOptions.length;
            updateCarouselDisplay();
        });
    }


    // --- FABRIC SELECTOR ---
    fabricCards.forEach(card => {
        card.addEventListener('click', () => {
            fabricCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
            
            const fabric = card.dataset.fabric;
            activeFabricType = fabric;
            activeFabricPriceAdd = parseFloat(card.dataset.priceAdd);
            
            // Update 3D visualizer fabric bump map
            if (typeof updateGarmentFabric === 'function') {
                updateGarmentFabric(fabric);
            }
            
            updatePrice();
        });
    });

    // --- SIMULTANEOUS COLOR SELECTION LOGIC ---
    const colorRows = document.querySelectorAll('.color-row');

    function updateZoneColor(zone, hex, name) {
        if (zone === 'body') {
            colorBodyHex = hex;
            colorBodyName = name;
            const label = document.getElementById('bodyColorName');
            if (label) label.textContent = name;
        } else if (zone === 'sleeves') {
            colorSleevesHex = hex;
            colorSleevesName = name;
            const label = document.getElementById('sleevesColorName');
            if (label) label.textContent = name;
        } else if (zone === 'collar') {
            colorCollarHex = hex;
            colorCollarName = name;
            const label = document.getElementById('collarColorName');
            if (label) label.textContent = name;
        }

        // Update Three.js visualizer color
        if (typeof updateGarmentColor === 'function') {
            updateGarmentColor(hex, zone);
        }

        // Re-calculate pricing/summary
        updatePrice();
    }

    // Bind events for each color row
    colorRows.forEach(row => {
        const zone = row.dataset.zone;
        // Support both old (.color-row-dots .color-dot-wrapper) and new (.color-dots-inline .cdot) selectors
        const dots = row.querySelectorAll('.color-dots-inline .cdot:not(.custom-color-picker), .color-row-dots .color-dot-wrapper:not(.custom-color-picker)');
        const customPickerWrapper = row.querySelector('.custom-color-picker');
        const customPickerInput = row.querySelector('.custom-color-input-field');

        // Preset color dots
        dots.forEach(dot => {
            dot.addEventListener('click', () => {
                // Clear active states
                dots.forEach(d => d.classList.remove('active'));
                if (customPickerWrapper) customPickerWrapper.classList.remove('active');

                // Active this dot
                dot.classList.add('active');

                const hex = dot.dataset.color;
                const name = dot.dataset.colorName;
                updateZoneColor(zone, hex, name);
            });
        });

        // Custom color input picker
        if (customPickerInput) {
            customPickerInput.addEventListener('input', function() {
                const hex = this.value;
                
                // Clear active states
                dots.forEach(d => d.classList.remove('active'));
                if (customPickerWrapper) {
                    customPickerWrapper.classList.add('active');
                    customPickerWrapper.style.setProperty('--dot-color', hex);
                }

                const name = 'Kustom (' + hex.toUpperCase() + ')';
                updateZoneColor(zone, hex, name);
            });

            customPickerInput.addEventListener('change', function() {
                const hex = this.value;
                const name = 'Kustom (' + hex.toUpperCase() + ')';
                updateZoneColor(zone, hex, name);
            });
        }
    });

    const colorTreeMap = {
        '#1b2e3c': 'Tech Navy (Tren SaaS)',
        '#3b6352': 'Eco Sage (Tren Organik)',
        '#695f4e': 'Khaki Zaitun (Tren Lifestyle)',
        '#e27c70': 'Creative Coral (Tren Gen-Z)',
        '#7f1d1d': 'Premium Burgundy (Tren Mewah)',
        '#f7f4eb': 'Aesthetic Cream (Tren Minimalis)',
        '#a8a29e': 'Heather Grey (Tren Atletik)',
        '#121212': 'Obsidian Black (Tren Cyberpunk)'
    };

    // Helper to synchronize dot active classes with state hex values
    function syncColorDotsWithState() {
        const zones = {
            body: { hex: colorBodyHex, name: colorBodyName, nameId: 'bodyColorName' },
            sleeves: { hex: colorSleevesHex, name: colorSleevesName, nameId: 'sleevesColorName' },
            collar: { hex: colorCollarHex, name: colorCollarName, nameId: 'collarColorName' }
        };

        Object.keys(zones).forEach(zone => {
            const row = document.querySelector(`.color-row[data-zone="${zone}"]`);
            if (!row) return;

            const state = zones[zone];
            const label = document.getElementById(state.nameId);
            if (label) label.textContent = state.name;

            const dots = row.querySelectorAll('.color-dots-inline .cdot:not(.custom-color-picker), .color-row-dots .color-dot-wrapper:not(.custom-color-picker)');
            const customPickerWrapper = row.querySelector('.custom-color-picker');
            const customPickerInput = row.querySelector('.custom-color-input-field');

            let matchedPreset = false;
            dots.forEach(d => {
                if (d.dataset.color.toLowerCase() === state.hex.toLowerCase()) {
                    d.classList.add('active');
                    matchedPreset = true;
                } else {
                    d.classList.remove('active');
                }
            });

            if (customPickerWrapper) {
                if (!matchedPreset) {
                    customPickerWrapper.classList.add('active');
                    customPickerWrapper.style.setProperty('--dot-color', state.hex);
                    if (customPickerInput) customPickerInput.value = state.hex;
                } else {
                    customPickerWrapper.classList.remove('active');
                }
            }
        });
    }

    // Run initial sync on load
    syncColorDotsWithState();

    // --- LIGHTING PRESETS ---
    lightingButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            lightingButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const lightType = btn.dataset.light;
            if (typeof updateLighting === 'function') {
                updateLighting(lightType);
            }
        });
    });

    // --- ROTATION SWITCH TOGGLE ---
    rotateToggle.addEventListener('change', function() {
        const isChecked = this.checked;
        rotateStatusText.textContent = isChecked ? 'ON' : 'OFF';
        
        // Update 3D visualizer rotation setting
        autoRotate = isChecked;
    });

    // --- RESET VIEW ---
    resetViewBtn.addEventListener('click', () => {
        if (typeof resetView === 'function') {
            resetView();
        }
    });

    // --- SCALE/ZOOM VIEW ---
    scaleViewBtn.addEventListener('click', () => {
        if (typeof toggleScaleView === 'function') {
            toggleScaleView();
        }
    });

    // --- DECAL PRESETS ---
    presetDecalBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            presetDecalBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            
            const presetName = btn.dataset.preset;
            activeDecalName = btn.querySelector('span').textContent + ' (Preset)';
            
            // Deactivate custom upload preview if active
            logoUploadInput.value = '';
            uploadPreviewContainer.classList.add('hidden');
            
            // Update 3D visualizer decal preset
            if (typeof updateDecalPreset === 'function') {
                updateDecalPreset(presetName);
            }
        });
    });

    // --- DECAL POSITION & SIZE SLIDERS ---
    rangeScale.addEventListener('input', () => {
        valScale.textContent = parseFloat(rangeScale.value).toFixed(1) + 'x';
        triggerDecalUpdate();
    });
    
    rangeVertical.addEventListener('input', () => {
        valVertical.textContent = parseFloat(rangeVertical.value).toFixed(2);
        triggerDecalUpdate();
    });
    
    rangeHorizontal.addEventListener('input', () => {
        valHorizontal.textContent = parseFloat(rangeHorizontal.value).toFixed(2);
        triggerDecalUpdate();
    });
    
    rangeOpacity.addEventListener('input', () => {
        valOpacity.textContent = Math.round(parseFloat(rangeOpacity.value) * 100) + '%';
        triggerDecalUpdate();
    });

    function triggerDecalUpdate() {
        if (typeof updateDecalUIAdjustments === 'function') {
            updateDecalUIAdjustments();
        }
    }

    // --- CUSTOM LOGO UPLOAD & DRAG/DROP ZONE ---
    
    // Open file selector when clicking button
    browseLogoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        logoUploadInput.click();
    });
    
    // Open file selector when clicking the whole zone
    uploadZone.addEventListener('click', () => {
        logoUploadInput.click();
    });

    // Drag events
    ['dragenter', 'dragover'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.style.borderColor = 'var(--primary)';
            uploadZone.style.backgroundColor = 'rgba(82, 140, 102, 0.05)';
        }, false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        uploadZone.addEventListener(eventName, (e) => {
            e.preventDefault();
            e.stopPropagation();
            uploadZone.style.borderColor = 'var(--border-color)';
            uploadZone.style.backgroundColor = 'var(--bg-card)';
        }, false);
    });

    // Drop file handler
    uploadZone.addEventListener('drop', (e) => {
        const dt = e.dataTransfer;
        const files = dt.files;
        if (files.length > 0) {
            handleUploadedFile(files[0]);
        }
    });

    // Select file handler
    logoUploadInput.addEventListener('change', function() {
        if (this.files.length > 0) {
            handleUploadedFile(this.files[0]);
        }
    });

    // Handle the uploaded image file
    function handleUploadedFile(file) {
        if (!file.type.match('image.*')) {
            alert('File yang diunggah harus berupa gambar (PNG, JPG, atau WEBP).');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            const img = new Image();
            img.onload = function() {
                // Update 3D visualizer texture
                if (typeof updateCustomUploadedLogo === 'function') {
                    updateCustomUploadedLogo(img);
                }
                
                // Show logo preview panel
                uploadedFileName.textContent = file.name;
                uploadPreviewContainer.classList.remove('hidden');
                
                // Update active decal name tracking
                activeDecalName = file.name + ' (Kustom)';
                
                // Remove active styling from preset buttons
                presetDecalBtns.forEach(b => b.classList.remove('active'));
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }

    // Remove custom uploaded logo
    removeLogoBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        logoUploadInput.value = '';
        uploadPreviewContainer.classList.add('hidden');
        
        // Reset to first preset decal (FitCraft)
        const fitcraftPresetBtn = document.querySelector('[data-preset="fitcraft"]');
        if (fitcraftPresetBtn) {
            fitcraftPresetBtn.click();
        }
    });

    // --- PRICE CALCULATION SYSTEM ---
    function updatePrice() {
        const total = activeGarmentPrice + activeFabricPriceAdd;
        const formattedPrice = 'Rp ' + total.toLocaleString('id-ID');
        
        // Update sidebar price indicator
        sidebarTotalPrice.textContent = formattedPrice;
    }

    // --- CHECKOUT MODAL FLOW ---
    
    // Open checkout modal
    function openCheckoutModal() {
        // Calculate totals
        const total = activeGarmentPrice + activeFabricPriceAdd;
        const formattedPrice = 'Rp ' + total.toLocaleString('id-ID');
        
        // Update summary text
        summaryGarment.textContent = canvasGarmentTitle.textContent;
        summaryFabric.textContent = activeFabricType === 'cotton' ? 'Katun Premium (Termasuk)' : 'Fleece Tebal (+Rp 75.000)';
        summaryColor.textContent = `Badan: ${colorBodyName} | Lengan: ${colorSleevesName} | Detail: ${colorCollarName}`;
        summaryDecal.textContent = activeDecalName;
        if (summarySize) {
            summarySize.textContent = activeGarmentSize;
        }
        summaryPrice.textContent = formattedPrice;

        // Open modal overlay
        checkoutModal.classList.remove('hidden');
    }

    checkoutBtn.addEventListener('click', openCheckoutModal);
    checkoutBtnPrimary.addEventListener('click', openCheckoutModal);

    // Export Design Snapshot (PNG)
    if (exportPngBtn) {
        exportPngBtn.addEventListener('click', () => {
            const canvas3d = document.querySelector('#canvas-container canvas');
            if (!canvas3d) return;

            const garmentName = canvasGarmentTitle.textContent.toLowerCase().replace(/\s+/g, '-');
            const filename = `fitcraft-desain-${garmentName}.png`;

            try {
                // Get data URL from WebGL canvas drawing buffer
                const dataUrl = canvas3d.toDataURL('image/png');

                // Create a temporary link
                const downloadLink = document.createElement('a');
                downloadLink.href = dataUrl;
                downloadLink.download = filename;

                // Trigger click to download
                document.body.appendChild(downloadLink);
                downloadLink.click();
                document.body.removeChild(downloadLink);
            } catch (err) {
                console.error('Gagal mengambil gambar dari kanvas 3D:', err);
                alert('Gagal mengunduh gambar desain. Silakan coba kembali.');
            }
        });
    }

    // Close modal
    function closeModal() {
        checkoutModal.classList.add('hidden');
        // Reset form & screen states
        checkoutForm.reset();
        modalOrderSummary.classList.remove('hidden');
        modalSuccess.classList.add('hidden');
    }

    closeModalBtn.addEventListener('click', closeModal);
    
    // Close modal on clicking overlay background
    checkoutModal.addEventListener('click', (e) => {
        if (e.target === checkoutModal) {
            closeModal();
        }
    });

    // Submit Checkout Form
    checkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        // Get user details
        const email = document.getElementById('custEmail').value;
        successEmailDisplay.textContent = email;

        // Hide summary panel & display success card
        modalOrderSummary.classList.add('hidden');
        modalSuccess.classList.remove('hidden');
    });

    // Success close button
    successCloseBtn.addEventListener('click', closeModal);

    // --- INSTANT COLOR THEMES ---
    const themeCards = document.querySelectorAll('.btn-theme-card');
    themeCards.forEach(card => {
        card.addEventListener('click', () => {
            const body = card.dataset.body;
            const sleeves = card.dataset.sleeves;
            const collar = card.dataset.collar;
            const name = card.dataset.name;

            // Smoothly lerp colors for all 3 zones in Three.js
            if (typeof lerpGarmentColor === 'function') {
                lerpGarmentColor(body, 'body', 500);
                lerpGarmentColor(sleeves, 'sleeves', 500);
                lerpGarmentColor(collar, 'collar', 500);
            } else if (typeof updateGarmentColor === 'function') {
                updateGarmentColor(body, 'body');
                updateGarmentColor(sleeves, 'sleeves');
                updateGarmentColor(collar, 'collar');
            }

            // Update local state variables
            colorBodyHex = body;
            colorBodyName = `Preset: ${name} (Badan)`;
            colorSleevesHex = sleeves;
            colorSleevesName = `Preset: ${name} (Lengan)`;
            colorCollarHex = collar;
            colorCollarName = `Preset: ${name} (Detail)`;

            // Sync all color dots in the 3 rows with the new state colors
            syncColorDotsWithState();
        });
    });

    // --- CUSTOM TEXT CONTROLS ---
    const customTextInput = document.getElementById('customTextInput');
    const fontSelector = document.getElementById('fontSelector');
    const textColorBtns = document.querySelectorAll('.btn-text-color');

    if (customTextInput) {
        customTextInput.addEventListener('input', function() {
            customText = this.value;
            if (typeof redrawDecal === 'function') redrawDecal();
            activeDecalName = customText ? `Teks: "${customText}"` : (activeLogoType === 'preset' ? `Preset: ${activePresetLogo}` : 'Kustom');
        });
    }

    if (fontSelector) {
        fontSelector.addEventListener('change', function() {
            customTextFont = this.value;
            if (typeof redrawDecal === 'function') redrawDecal();
        });
    }

    textColorBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            textColorBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            customTextColor = btn.dataset.color;
            if (typeof redrawDecal === 'function') redrawDecal();
        });
    });

    // --- SAVED DESIGNS GALLERY SYSTEM ---
    const saveDesignBtn = document.getElementById('saveDesignBtn');
    
    if (saveDesignBtn) {
        saveDesignBtn.addEventListener('click', saveCurrentDesign);
    }

    function renderSavedDesigns() {
        const savedDesignsGrid = document.getElementById('savedDesignsGrid');
        const galleryEmptyState = document.getElementById('galleryEmptyState');
        if (!savedDesignsGrid) return;

        let designs = [];
        try {
            designs = JSON.parse(localStorage.getItem('fitcraft_saved_designs')) || [];
        } catch (e) {
            designs = [];
        }

        // Clear existing cards
        savedDesignsGrid.querySelectorAll('.saved-design-card').forEach(c => c.remove());

        if (designs.length === 0) {
            if (galleryEmptyState) galleryEmptyState.classList.remove('hidden');
            return;
        }

        if (galleryEmptyState) galleryEmptyState.classList.add('hidden');

        designs.forEach(design => {
            const card = document.createElement('div');
            card.className = 'saved-design-card';
            card.dataset.id = design.id;

            card.innerHTML = `
                <button class="btn-delete-saved-design" title="Hapus Desain">&times;</button>
                <img src="${design.thumbnail}" alt="Desain" class="saved-design-thumbnail">
                <div class="saved-design-info">
                    <span class="saved-design-title">${design.decal.text ? design.decal.text.toUpperCase() : design.garment.toUpperCase()}</span>
                    <span class="saved-design-meta">${design.timestamp} • Rp ${design.price.toLocaleString('id-ID')}</span>
                </div>
            `;

            // Delete handler
            card.querySelector('.btn-delete-saved-design').addEventListener('click', (e) => {
                e.stopPropagation();
                deleteDesign(design.id);
            });

            // Load handler
            card.addEventListener('click', () => {
                loadDesignConfig(design);
            });

            savedDesignsGrid.appendChild(card);
        });
    }

    function deleteDesign(id) {
        let designs = [];
        try {
            designs = JSON.parse(localStorage.getItem('fitcraft_saved_designs')) || [];
        } catch (e) {
            designs = [];
        }
        designs = designs.filter(d => d.id !== id);
        localStorage.setItem('fitcraft_saved_designs', JSON.stringify(designs));
        renderSavedDesigns();
    }

    function saveCurrentDesign() {
        const canvas3d = document.querySelector('#canvas-container canvas');
        if (!canvas3d) return;

        let screenshotDataUrl = '';
        try {
            screenshotDataUrl = canvas3d.toDataURL('image/png');
        } catch (err) {
            console.error('Gagal snapshot canvas:', err);
            alert('Gagal mengambil gambar kustomisasi.');
            return;
        }

        const newDesign = {
            id: 'design_' + Date.now(),
            timestamp: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }),
            garment: activeGarmentType,
            fabric: activeFabricType,
            size: activeGarmentSize,
            colors: {
                body: { hex: colorBodyHex, name: colorBodyName },
                sleeves: { hex: colorSleevesHex, name: colorSleevesName },
                collar: { hex: colorCollarHex, name: colorCollarName }
            },
            decal: {
                name: activeDecalName,
                logoType: activeLogoType,
                presetLogo: activePresetLogo,
                customImageSrc: activeLogoType === 'custom' && activeCustomImage ? activeCustomImage.src : null,
                text: customText,
                textFont: customTextFont,
                textColor: customTextColor,
                adjustments: {
                    scale: parseFloat(rangeScale.value),
                    vertical: parseFloat(rangeVertical.value),
                    horizontal: parseFloat(rangeHorizontal.value),
                    opacity: parseFloat(rangeOpacity.value)
                }
            },
            price: activeGarmentPrice + activeFabricPriceAdd,
            thumbnail: screenshotDataUrl
        };

        let designs = [];
        try {
            designs = JSON.parse(localStorage.getItem('fitcraft_saved_designs')) || [];
        } catch (e) {
            designs = [];
        }
        designs.push(newDesign);
        localStorage.setItem('fitcraft_saved_designs', JSON.stringify(designs));

        renderSavedDesigns();
    }

    function loadDesignConfig(design) {
        // Load garment type
        activeGarmentType = design.garment;
        const gIndex = modelOptions.findIndex(m => m.garmentType === design.garment);
        if (gIndex > -1) {
            currentModelIndex = gIndex;
            const model = modelOptions[currentModelIndex];
            activeGarmentPrice = model.price;
            carouselModelTitle.textContent = model.name;
            carouselModelCategory.textContent = model.category;
            carouselModelPrice.textContent = 'Rp ' + model.price.toLocaleString('id-ID');
            canvasGarmentTitle.textContent = model.name;
            
            if (typeof updateGarmentSilhouette === 'function') {
                updateGarmentSilhouette(model.garmentType);
            }
        }

        // Load fabric
        activeFabricType = design.fabric;
        fabricCards.forEach(c => {
            if (c.dataset.fabric === design.fabric) {
                c.classList.add('active');
                activeFabricPriceAdd = parseFloat(c.dataset.priceAdd);
            } else {
                c.classList.remove('active');
            }
        });
        if (typeof updateGarmentFabric === 'function') {
            updateGarmentFabric(design.fabric);
        }

        // Load size and trigger smooth scale transitions
        const designSize = design.size || 'M';
        activeGarmentSize = designSize;
        sizePills.forEach(pill => {
            if (pill.dataset.size === designSize.toLowerCase()) {
                pill.classList.add('active');
            } else {
                pill.classList.remove('active');
            }
        });
        if (typeof window.updateGarmentSize === 'function') {
            window.updateGarmentSize(designSize.toLowerCase());
        }

        // Load colors
        colorBodyHex = design.colors.body.hex;
        colorBodyName = design.colors.body.name;
        colorSleevesHex = design.colors.sleeves.hex;
        colorSleevesName = design.colors.sleeves.name;
        colorCollarHex = design.colors.collar.hex;
        colorCollarName = design.colors.collar.name;

        if (typeof updateGarmentColor === 'function') {
            updateGarmentColor(colorBodyHex, 'body');
            updateGarmentColor(colorSleevesHex, 'sleeves');
            updateGarmentColor(colorCollarHex, 'collar');
        }

        // Sync all color dots in the 3 rows with loaded state colors
        syncColorDotsWithState();

        // Load decal config
        activeDecalName = design.decal.name;
        activeLogoType = design.decal.logoType;
        activePresetLogo = design.decal.presetLogo;
        
        customText = design.decal.text || '';
        customTextFont = design.decal.textFont || 'Space Grotesk';
        customTextColor = design.decal.textColor || 'match';

        if (customTextInput) customTextInput.value = customText;
        if (fontSelector) fontSelector.value = customTextFont;

        textColorBtns.forEach(btn => {
            if (btn.dataset.color === customTextColor) {
                btn.classList.add('active');
            } else {
                btn.classList.remove('active');
            }
        });

        // Sliders
        rangeScale.value = design.decal.adjustments.scale;
        rangeVertical.value = design.decal.adjustments.vertical;
        rangeHorizontal.value = design.decal.adjustments.horizontal;
        rangeOpacity.value = design.decal.adjustments.opacity;

        valScale.textContent = design.decal.adjustments.scale.toFixed(1) + 'x';
        valVertical.textContent = design.decal.adjustments.vertical.toFixed(2);
        valHorizontal.textContent = design.decal.adjustments.horizontal.toFixed(2);
        valOpacity.textContent = Math.round(design.decal.adjustments.opacity * 100) + '%';

        // Load custom image base64 if it exists
        if (activeLogoType === 'custom' && design.decal.customImageSrc) {
            const img = new Image();
            img.onload = function() {
                activeCustomImage = img;
                if (typeof redrawDecal === 'function') redrawDecal();
                presetDecalBtns.forEach(b => b.classList.remove('active'));
                uploadedFileName.textContent = 'desain_muat.png';
                uploadPreviewContainer.classList.remove('hidden');
            };
            img.src = design.decal.customImageSrc;
        } else {
            logoUploadInput.value = '';
            uploadPreviewContainer.classList.add('hidden');
            presetDecalBtns.forEach(btn => {
                if (activeLogoType === 'preset' && btn.dataset.preset === activePresetLogo) {
                    btn.classList.add('active');
                } else {
                    btn.classList.remove('active');
                }
            });

            if (typeof redrawDecal === 'function') redrawDecal();
        }

        updatePrice();
    }

    // Initialize gallery on startup
    renderSavedDesigns();

    // --- STUDIO PAGE INIT: Restore user session from localStorage ---
    const storedUser = (() => {
        try { return JSON.parse(localStorage.getItem('fitcraft_user')); } catch(e) { return null; }
    })();
    
    if (storedUser && storedUser.name) {
        const nameEl = document.getElementById('studioUserName');
        if (nameEl) nameEl.textContent = storedUser.name;
        
        // Update avatar seed with username for personalization
        const avatarEl = document.getElementById('userAvatar');
        if (avatarEl) avatarEl.src = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(storedUser.name)}`;
    }

    // --- MAGNETIC BUTTONS INTERACTION ---
    const startCustomBtn = document.getElementById('startCustomBtn');
    if (startCustomBtn) {
        startCustomBtn.addEventListener('mousemove', (e) => {
            const rect = startCustomBtn.getBoundingClientRect();
            const x = e.clientX - rect.left - rect.width / 2;
            const y = e.clientY - rect.top - rect.height / 2;
            
            // Pull button slightly towards cursor (magnetic effect)
            startCustomBtn.style.transform = `translate(${x * 0.35}px, ${y * 0.35}px)`;
            startCustomBtn.style.transition = 'none';
        });
        
        startCustomBtn.addEventListener('mouseleave', () => {
            startCustomBtn.style.transform = 'translate(0px, 0px)';
            startCustomBtn.style.transition = 'transform 0.5s cubic-bezier(0.16, 1, 0.3, 1)';
        });
    }

    // --- SIZE SELECTOR BINDINGS ---
    sizePills.forEach(pill => {
        pill.addEventListener('click', () => {
            sizePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            
            const size = pill.dataset.size;
            activeGarmentSize = size.toUpperCase();
            
            if (typeof window.updateGarmentSize === 'function') {
                window.updateGarmentSize(size);
            }
        });
    });

    // --- SIZE CHART MODAL BINDINGS ---
    if (sizeChartBtn && sizeChartModal) {
        sizeChartBtn.addEventListener('click', () => {
            sizeChartModal.classList.remove('hidden');
        });
    }
    
    if (closeSizeChartBtn && sizeChartModal) {
        closeSizeChartBtn.addEventListener('click', () => {
            sizeChartModal.classList.add('hidden');
        });
    }
    
    if (closeSizeChartBtnOk && sizeChartModal) {
        closeSizeChartBtnOk.addEventListener('click', () => {
            sizeChartModal.classList.add('hidden');
        });
    }
    
    if (sizeChartModal) {
        sizeChartModal.addEventListener('click', (e) => {
            if (e.target === sizeChartModal) {
                sizeChartModal.classList.add('hidden');
            }
        });
    }

    // --- THEME TOGGLE LOGIC ---
    if (themeToggleBtn) {
        // Apply saved theme state on load (in case of delay)
        const savedTheme = localStorage.getItem('fitcraft_theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
        } else if (savedTheme === 'light') {
            document.body.classList.remove('dark-theme');
        }

        themeToggleBtn.addEventListener('click', () => {
            const isDark = document.body.classList.toggle('dark-theme');
            localStorage.setItem('fitcraft_theme', isDark ? 'dark' : 'light');
        });
    }

    // --- CAMERA PRESET CONTROLS ---
    const camDepan = document.getElementById('camDepan');
    const camBelakang = document.getElementById('camBelakang');
    const camSamping = document.getElementById('camSamping');
    const camDetail = document.getElementById('camDetail');
    const camPresetBtns = document.querySelectorAll('.btn-cam-preset');

    function setActiveCamPreset(activeBtn) {
        if (camPresetBtns) {
            camPresetBtns.forEach(btn => btn.classList.remove('active'));
        }
        if (activeBtn) activeBtn.classList.add('active');
    }

    if (camDepan) {
        camDepan.addEventListener('click', () => {
            setActiveCamPreset(camDepan);
            if (typeof window.transitionCameraTo === 'function') {
                window.transitionCameraTo(0, 0, 8.2, 0, 800);
            }
        });
    }

    if (camBelakang) {
        camBelakang.addEventListener('click', () => {
            setActiveCamPreset(camBelakang);
            if (typeof window.transitionCameraTo === 'function') {
                window.transitionCameraTo(0, 0, -8.2, 0, 800);
            }
        });
    }

    if (camSamping) {
        camSamping.addEventListener('click', () => {
            setActiveCamPreset(camSamping);
            if (typeof window.transitionCameraTo === 'function') {
                window.transitionCameraTo(-8.2, 0, 0, 0, 800);
            }
        });
    }

    if (camDetail) {
        camDetail.addEventListener('click', () => {
            setActiveCamPreset(camDetail);
            if (typeof window.transitionCameraTo === 'function') {
                window.transitionCameraTo(0, 0.4, 3.6, 0.4, 800);
            }
        });
    }

    const canvasContainer = document.getElementById('canvas-container');
    if (canvasContainer) {
        ['mousedown', 'touchstart', 'wheel'].forEach(evtType => {
            canvasContainer.addEventListener(evtType, () => {
                setActiveCamPreset(null);
            });
        });
    }

    // Parse URL parameter on load to set initial model
    const urlParams = new URLSearchParams(window.location.search);
    const modelParam = urlParams.get('model');
    if (modelParam) {
        const foundIndex = modelOptions.findIndex(m => m.garmentType === modelParam.toLowerCase() || m.id === modelParam.toLowerCase());
        if (foundIndex !== -1) {
            currentModelIndex = foundIndex;
        }
    }

    // Initialize display on startup
    updateCarouselDisplay();

    // --- RIGHT SIDEBAR TABS ---
    const rightTabBtns = document.querySelectorAll('.sidebar-tab-btn');
    const rightTabPanes = document.querySelectorAll('.sidebar-tab-pane');
    
    rightTabBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            rightTabBtns.forEach(b => b.classList.remove('active'));
            rightTabPanes.forEach(p => p.classList.remove('active'));
            
            btn.classList.add('active');
            const targetPane = document.getElementById(btn.dataset.sidebarTab);
            if (targetPane) {
                targetPane.classList.add('active');
            }
        });
    });

    // --- LEFT SIDEBAR SHORTCUTS ---
    const shortcutBtns = document.querySelectorAll('.btn-shortcut-action');
    shortcutBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const targetTab = btn.dataset.shortcutTab;
            const correspondingTabBtn = document.querySelector(`.sidebar-tab-btn[data-sidebar-tab="${targetTab}"]`);
            if (correspondingTabBtn) {
                correspondingTabBtn.click();
            }
        });
    });
});

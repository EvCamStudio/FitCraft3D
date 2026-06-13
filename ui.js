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

    // --- COLOR PALETTE SELECTOR ---
    const customColorDot = document.getElementById('customColorDot');
    const customColorInput = document.getElementById('customColorInput');
    const hexColorInput = document.getElementById('hexColorInput');
    const recentColorsContainer = document.getElementById('recentColorsContainer');
    const recentColorsGrid = document.getElementById('recentColorsGrid');

    let recentColors = []; // Stores up to 4 custom colors

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

    // Helper to update color for the active zone
    function updateActiveZoneColor(hex, name) {
        if (activeColorZone === 'body') {
            colorBodyHex = hex;
            colorBodyName = name;
        } else if (activeColorZone === 'sleeves') {
            colorSleevesHex = hex;
            colorSleevesName = name;
        } else if (activeColorZone === 'collar') {
            colorCollarHex = hex;
            colorCollarName = name;
        }

        // Update color name text display
        selectedColorDisplay.textContent = name;

        // Sync with hex text input
        hexColorInput.value = hex.substring(1).toUpperCase();

        // Update 3D visualizer garment color for this specific zone
        if (typeof updateGarmentColor === 'function') {
            updateGarmentColor(hex, activeColorZone);
        }
    }

    // Switch between color zones
    zonePills.forEach(pill => {
        pill.addEventListener('click', () => {
            zonePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeColorZone = pill.dataset.zone;
            
            // Sync UI controls with the colors of the newly active zone
            let hex, name;
            if (activeColorZone === 'body') {
                hex = colorBodyHex;
                name = colorBodyName;
            } else if (activeColorZone === 'sleeves') {
                hex = colorSleevesHex;
                name = colorSleevesName;
            } else if (activeColorZone === 'collar') {
                hex = colorCollarHex;
                name = colorCollarName;
            }
            
            selectedColorDisplay.textContent = name;
            hexColorInput.value = hex.substring(1).toUpperCase();
            
            // Highlight matching color dot on grid
            colorDots.forEach(d => {
                if (d.id === 'customColorDot') return;
                if (d.dataset.color.toLowerCase() === hex.toLowerCase()) {
                    d.classList.add('active');
                } else {
                    d.classList.remove('active');
                }
            });
            
            // Sync custom color picker dot background color
            if (colorTreeMap.hasOwnProperty(hex.toLowerCase())) {
                customColorDot.classList.remove('active');
            } else {
                customColorDot.classList.add('active');
                customColorDot.style.setProperty('--dot-color', hex);
                customColorInput.value = hex;
            }
            
            // Re-highlight matching recent color dot
            const recentDots = recentColorsGrid.querySelectorAll('.recent-color-dot');
            recentDots.forEach(rd => {
                if (rd.dataset.color.toLowerCase() === hex.toLowerCase()) {
                    rd.classList.add('active');
                } else {
                    rd.classList.remove('active');
                }
            });
        });
    });

    function addRecentColor(hex) {
        const lowerHex = hex.toLowerCase();
        
        // Skip if this color is one of the default preset colors
        if (colorTreeMap.hasOwnProperty(lowerHex)) {
            // Deactivate active indicators on recent colors
            const dots = recentColorsGrid.querySelectorAll('.recent-color-dot');
            dots.forEach(d => d.classList.remove('active'));
            return;
        }

        // Remove from current index if it already exists (to push to front)
        const index = recentColors.indexOf(lowerHex);
        if (index > -1) {
            recentColors.splice(index, 1);
        }

        // Prepend to list
        recentColors.unshift(lowerHex);

        // Keep maximum of 4 custom colors in history
        if (recentColors.length > 4) {
            recentColors.pop();
        }

        // Re-render recent colors
        renderRecentColors();
    }

    function renderRecentColors() {
        recentColorsGrid.innerHTML = '';
        
        if (recentColors.length === 0) {
            recentColorsContainer.classList.add('hidden');
            return;
        }

        recentColorsContainer.classList.remove('hidden');

        recentColors.forEach(color => {
            const dot = document.createElement('button');
            dot.className = 'recent-color-dot';
            dot.style.setProperty('--recent-color', color);
            dot.dataset.color = color;
            
            // Highlight active if current hex matches
            const currentHex = '#' + hexColorInput.value.toLowerCase();
            if (currentHex === color) {
                dot.classList.add('active');
            }

            dot.addEventListener('click', () => {
                // Clear active states from presets and custom picker
                colorDots.forEach(d => d.classList.remove('active'));
                customColorDot.classList.remove('active');
                
                // Set this dot as active
                const dots = recentColorsGrid.querySelectorAll('.recent-color-dot');
                dots.forEach(d => d.classList.remove('active'));
                dot.classList.add('active');

                // Update active zone color
                const name = 'Kustom (' + color.toUpperCase() + ')';
                updateActiveZoneColor(color, name);
            });

            recentColorsGrid.appendChild(dot);
        });
    }

    colorDots.forEach(dot => {
        if (dot.id === 'customColorDot') return;
        
        dot.addEventListener('click', () => {
            colorDots.forEach(d => d.classList.remove('active'));
            customColorDot.classList.remove('active');
            dot.classList.add('active');
            
            // Deactivate any active recent color dot
            const recentDots = recentColorsGrid.querySelectorAll('.recent-color-dot');
            recentDots.forEach(rd => rd.classList.remove('active'));
            
            const hex = dot.dataset.color;
            const name = dot.dataset.colorName;
            updateActiveZoneColor(hex, name);
        });
    });

    // Custom Color Picker Click Trigger
    customColorDot.addEventListener('click', () => {
        customColorInput.click();
    });

    // Custom Color Picker Input Event (Real-time update)
    customColorInput.addEventListener('input', function() {
        const hex = this.value;
        
        // Remove active class from presets and add to custom dot
        colorDots.forEach(d => d.classList.remove('active'));
        customColorDot.classList.add('active');
        
        // Deactivate active indicators on recent colors
        const recentDots = recentColorsGrid.querySelectorAll('.recent-color-dot');
        recentDots.forEach(rd => rd.classList.remove('active'));
        
        // Set CSS variable to update the dot background color
        customColorDot.style.setProperty('--dot-color', hex);
        
        const name = 'Kustom (' + hex.toUpperCase() + ')';
        updateActiveZoneColor(hex, name);
    });

    // Custom Color Picker Change Event (Dialog closed/color selected)
    customColorInput.addEventListener('change', function() {
        const hex = this.value;
        const name = 'Kustom (' + hex.toUpperCase() + ')';
        updateActiveZoneColor(hex, name);
        // Add to recent color history
        addRecentColor(hex);
    });

    // Hex Code Manual Text Entry
    hexColorInput.addEventListener('input', function() {
        // Remove non-hex characters and convert to uppercase in text box
        let cleanHex = this.value.replace(/[^0-9A-Fa-f]/g, '');
        this.value = cleanHex.toUpperCase();

        if (cleanHex.length === 6) {
            const hex = '#' + cleanHex.toLowerCase();
            
            // Detect if hex matches one of the preset trends
            const trendName = colorTreeMap[hex];
            
            if (trendName) {
                // Select preset color dot
                customColorDot.classList.remove('active');
                colorDots.forEach(d => {
                    if (d.dataset.color === hex) {
                        d.classList.add('active');
                    } else {
                        d.classList.remove('active');
                    }
                });
                
                // Deactivate active indicators on recent colors
                const recentDots = recentColorsGrid.querySelectorAll('.recent-color-dot');
                recentDots.forEach(rd => rd.classList.remove('active'));

                updateActiveZoneColor(hex, trendName);
            } else {
                // Select custom color dot
                colorDots.forEach(d => d.classList.remove('active'));
                customColorDot.classList.add('active');
                
                customColorDot.style.setProperty('--dot-color', hex);
                customColorInput.value = hex;
                
                const name = 'Kustom (' + hex.toUpperCase() + ')';
                updateActiveZoneColor(hex, name);

                // Add to recent color history
                addRecentColor(hex);
            }
        }
    });

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

            // Sync the hex input and tooltip if active zone matches
            let activeHex = body;
            let activeName = colorBodyName;
            if (activeColorZone === 'sleeves') {
                activeHex = sleeves;
                activeName = colorSleevesName;
            } else if (activeColorZone === 'collar') {
                activeHex = collar;
                activeName = colorCollarName;
            }
            selectedColorDisplay.textContent = activeName;
            hexColorInput.value = activeHex.substring(1).toUpperCase();

            // Remove active style from normal color dots
            colorDots.forEach(d => d.classList.remove('active'));
            customColorDot.classList.remove('active');
            const recentDots = recentColorsGrid.querySelectorAll('.recent-color-dot');
            recentDots.forEach(rd => rd.classList.remove('active'));
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

        let activeHex = colorBodyHex;
        let activeName = colorBodyName;
        if (activeColorZone === 'sleeves') {
            activeHex = colorSleevesHex;
            activeName = colorSleevesName;
        } else if (activeColorZone === 'collar') {
            activeHex = colorCollarHex;
            activeName = colorCollarName;
        }
        selectedColorDisplay.textContent = activeName;
        hexColorInput.value = activeHex.substring(1).toUpperCase();

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

    // --- CUSTOM CURSOR FOLLOWER ---
    const customCursor = document.getElementById('customCursor');
    let mX = 0, mY = 0;
    let cX = 0, cY = 0;

    if (customCursor) {
        document.addEventListener('mousemove', (e) => {
            mX = e.clientX;
            mY = e.clientY;
            
            // Fade in cursor follower on first mouse move
            if (customCursor.style.opacity === '0' || !customCursor.style.opacity) {
                customCursor.style.opacity = '1';
            }
        });

        // Smooth follow tick loop (lerp)
        function updateCursorFollower() {
            const ease = 0.16; // Lerp weight
            cX += (mX - cX) * ease;
            cY += (mY - cY) * ease;
            
            customCursor.style.left = cX + 'px';
            customCursor.style.top = cY + 'px';
            
            requestAnimationFrame(updateCursorFollower);
        }
        updateCursorFollower();

        // Bind hover expansion triggers on interactive DOM nodes
        function bindCursorHoverEffect() {
            const interactives = document.querySelectorAll('button, a, select, input, .fabric-card, .color-dot-wrapper, .btn-carousel-nav, .recent-color-dot');
            interactives.forEach(el => {
                // Prevent duplicate listeners
                el.removeEventListener('mouseenter', addHoverClass);
                el.removeEventListener('mouseleave', removeHoverClass);
                
                el.addEventListener('mouseenter', addHoverClass);
                el.addEventListener('mouseleave', removeHoverClass);
            });
        }
        
        function addHoverClass() {
            if (customCursor) customCursor.classList.add('hover');
        }
        
        function removeHoverClass() {
            if (customCursor) customCursor.classList.remove('hover');
        }

        // Initialize hovers
        bindCursorHoverEffect();

        // Re-bind when tabs switch or gallery loads new elements dynamically
        const mutationObserver = new MutationObserver(() => {
            bindCursorHoverEffect();
        });
        mutationObserver.observe(document.body, { childList: true, subtree: true });
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

    // Initialize pricing on startup
    updatePrice();
});

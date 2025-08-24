document.addEventListener('DOMContentLoaded', () => {
    // Function to check if Three.js is loaded and start the game
    function initializeGame() {
        // Check if Three.js is loaded
        if (typeof THREE === 'undefined') {
            console.error("Three.js is not loaded! Retrying...");
            // Try again in 1 second, but only for 10 attempts
            if ((window.threeLoadAttempts || 0) < 10) {
                window.threeLoadAttempts = (window.threeLoadAttempts || 0) + 1;
                setTimeout(initializeGame, 1000);
                return;
            } else {
                console.warn("Three.js failed to load after multiple attempts. Running without 3D graphics.");
                window.no3DGraphics = true;
            }
        } else {
            console.log("Three.js loaded successfully, version:", THREE.REVISION);
            window.no3DGraphics = false;
        }
        
        // Start the actual game initialization
        startGameInitialization();
    }
    
    function startGameInitialization() {
        console.log("Starting game initialization...");
        
        // --- STATE MANAGEMENT ---
    let gameState = {};

    const defaultGameState = {
        currentScreen: 'splash',
        companion: null,
        doctor: null,
        budget: 300,
        inventory: [],
        time: {
            minute: 0,
            hour: 8,
            day: 1,
            month: 1,
            season: 1, // 1:Spring, 2:Summer, 3:Autumn, 4:Winter
        },
        player: {
            x: 0,
            y: 0,
            speed: 2,
            hunger: 0, // 0-100
            isRunning: false,
        },
        world: {
            tentPitched: false,
            tentLocation: { x: null, y: null },
            plantedSeeds: [],
        },
        ticks: 0,
        pony: {
            hired: false,
            type: null,
            hireBudget: 200,
        },
        badges: [],
        treasureHunt: {
            clue1Found: false,
            clue2Found: false,
            clue3Found: false,
            treasureFound: false,
        },
    };

    // --- DOM ELEMENTS ---
    const screens = {
        splash: document.getElementById('splash-screen'),
        companion: document.getElementById('companion-screen'),
        doctor: document.getElementById('doctor-screen'),
        shop: document.getElementById('shop-screen'),
        game: document.getElementById('game-world'),
    };
    const companionGrid = document.getElementById('companion-grid');
    const doctorGrid = document.getElementById('doctor-grid');
    const shopItemsContainer = document.getElementById('shop-items');
    const budgetDisplay = document.getElementById('budget');
    const exitShopButton = document.getElementById('exit-shop');

    // Game World UI
    const worldView = document.getElementById('world-view');
    const locationNameDisplay = document.getElementById('location-name');
    const gameTimeDisplay = document.getElementById('game-time-display');
    const hungerBar = document.getElementById('hunger-bar');
    const notification = document.getElementById('notification');

    // Menu Icons
    const menuIcons = {
        bag: document.getElementById('menu-bag'),
        fishing: document.getElementById('menu-fishing'),
        ticks: document.getElementById('menu-ticks'),
        clothes: document.getElementById('menu-clothes'),
        seeds: document.getElementById('menu-seeds'),
        pony: document.getElementById('menu-pony'),
        sleep: document.getElementById('menu-sleep'),
        camp: document.getElementById('menu-camp'),
        recipes: document.getElementById('menu-recipes'),
        phone: document.getElementById('menu-phone'),
        badges: document.getElementById('menu-badges'),
    };

    // Modals
    const modals = {
        bag: document.getElementById('bag-modal'),
        generic: document.getElementById('generic-modal'),
        sentHome: document.getElementById('sent-home-modal'),
    };
    const bagContents = document.getElementById('bag-contents');
    const genericModalTitle = document.getElementById('generic-modal-title');
    const genericModalContent = document.getElementById('generic-modal-content');


    // --- GAME DATA ---
    const COMPANIONS = ['Sally', 'Teresa', 'Josie', 'Alex', 'Charlotte', 'Erica', 'Marta', 'Sophie'];
    const DOCTORS = ['Pam and David', 'Lindsay and Paul'];
    const SHOP_ITEMS = [
        { name: 'Bread', price: 2, type: 'food' }, { name: 'Cheese', price: 4, type: 'food' },
        { name: 'Ham', price: 5, type: 'food' }, { name: 'Ketchup', price: 3, type: 'food' },
        { name: 'Chocolate', price: 2, type: 'food' }, { name: 'Carrot', price: 1, type: 'food' },
        { name: 'Cucumber', price: 1, type: 'food' }, { name: 'Apple', price: 1, type: 'food' },
        { name: 'Cheap Tent', price: 50, type: 'gear' }, { name: 'Expensive Tent', price: 150, type: 'gear' },
        { name: 'Cheap Fishing Rod', price: 20, type: 'gear' }, { name: 'Expensive Fishing Rod', price: 60, type: 'gear' },
    ];
    const WORLD_LOCATIONS = [
        { name: "The Moors", x: 0, y: 0, radius: 500 },
        { name: "The Wood", x: 200, y: -150, radius: 100 },
        { name: "The River", x: -100, y: 200, radius: 300 },
        { name: "A Cave", x: 250, y: -180, radius: 10 },
        { name: "ASDA", x: -200, y: -200, radius: 20 },
        { name: "Pony Farm", x: 100, y: 300, radius: 20 },
    ];
    const SEASONS = { 1: 'Spring', 2: 'Summer', 3: 'Autumn', 4: 'Winter' };

    // --- 3D WORLD SETUP ---
    let scene, camera, renderer, terrain, player3D, controls;
    let terrainSize = 1000;
    let terrainDetail = 64;
    let frameCount = 0;
    
    function init3DWorld() {
        if (window.no3DGraphics) {
            console.log("Skipping 3D world initialization - Three.js not available");
            return;
        }
        
        try {
            console.log("Initializing 3D World...");
            
            // Create scene
            scene = new THREE.Scene();
            console.log("Scene created");
            
            // Create camera
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
            camera.position.set(0, 50, 100);
            console.log("Camera created");
            
            // Create renderer
            const canvas = document.getElementById('three-canvas');
            if (!canvas) {
                console.error("Canvas element not found!");
                return;
            }
            
            renderer = new THREE.WebGLRenderer({ canvas: canvas, antialias: true });
            renderer.setSize(window.innerWidth, window.innerHeight);
            renderer.shadowMap.enabled = true;
            renderer.shadowMap.type = THREE.PCFSoftShadowMap;
            console.log("Renderer created");
            
            // Add lights
            const ambientLight = new THREE.AmbientLight(0x404040, 0.4);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
            directionalLight.position.set(100, 100, 50);
            directionalLight.castShadow = true;
            directionalLight.shadow.mapSize.width = 2048;
            directionalLight.shadow.mapSize.height = 2048;
            directionalLight.shadow.camera.near = 0.1;
            directionalLight.shadow.camera.far = 500;
            directionalLight.shadow.camera.left = -200;
            directionalLight.shadow.camera.right = 200;
            directionalLight.shadow.camera.top = 200;
            directionalLight.shadow.camera.bottom = -200;
            scene.add(directionalLight);
            console.log("Lights added");
            
            // Create terrain
            createTerrain();
            console.log("Terrain created");
            
            // Create player representation
            createPlayer3D();
            console.log("Player created");
            
            // Add a test cube to verify rendering
            const testGeometry = new THREE.BoxGeometry(10, 10, 10);
            const testMaterial = new THREE.MeshLambertMaterial({ color: 0xff0000 });
            const testCube = new THREE.Mesh(testGeometry, testMaterial);
            testCube.position.set(50, 20, 0);
            scene.add(testCube);
            console.log("Test cube added");
            
            // Add some basic landmarks
            createLandmarks();
            console.log("Landmarks created");
            
            // Handle window resize
            window.addEventListener('resize', onWindowResize, false);
            
            console.log("3D World initialization complete!");
            
            // Set initial sky color
            renderer.setClearColor(0x87CEEB); // Day sky
            
            // Test render
            renderer.render(scene, camera);
            console.log("Initial render complete");
            
            // Make sure canvas is visible
            const canvasElement = document.getElementById('three-canvas');
            if (canvasElement) {
                canvasElement.style.visibility = 'visible';
                canvasElement.style.opacity = '1';
                console.log("Canvas visibility set");
            }
            
        } catch (error) {
            console.error("Error initializing 3D world:", error);
        }
    }
    
    function createTerrain() {
        const geometry = new THREE.PlaneGeometry(terrainSize, terrainSize, terrainDetail - 1, terrainDetail - 1);
        
        // Generate height map
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];
            
            // Create varied terrain using noise-like functions
            let height = 0;
            
            // Base rolling hills
            height += Math.sin(x * 0.01) * 20 + Math.cos(z * 0.01) * 15;
            
            // Add some sharper features for The Wood area
            if (x > 150 && x < 250 && z > -200 && z < -100) {
                height += Math.sin(x * 0.02) * 30 + Math.cos(z * 0.02) * 25;
            }
            
            // River valley (lower terrain)
            if (x > -150 && x < -50 && z > 150 && z < 250) {
                height -= 20;
            }
            
            // Cave area (rocky terrain)
            if (x > 200 && x < 300 && z > -230 && z < -130) {
                height += Math.random() * 40 - 20;
            }
            
            vertices[i + 2] = height;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Create material with different colors for different areas
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x90EE90,
            vertexColors: false
        });
        
        terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        scene.add(terrain);
        
        // Add terrain textures/colors for different biomes
        addTerrainVariation();
    }
    
    function addTerrainVariation() {
        // Add trees for The Wood
        const treeGeometry = new THREE.ConeGeometry(5, 20, 8);
        const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        
        for (let i = 0; i < 30; i++) {
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            tree.position.set(
                150 + Math.random() * 100,
                getTerrainHeight(tree.position.x, tree.position.z) + 10,
                -200 + Math.random() * 100
            );
            tree.castShadow = true;
            scene.add(tree);
        }
        
        // Add rocks for cave area
        const rockGeometry = new THREE.SphereGeometry(3, 8, 6);
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        
        for (let i = 0; i < 20; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                200 + Math.random() * 100,
                getTerrainHeight(rock.position.x, rock.position.z) + 2,
                -230 + Math.random() * 100
            );
            rock.scale.set(Math.random() + 0.5, Math.random() + 0.5, Math.random() + 0.5);
            rock.castShadow = true;
            scene.add(rock);
        }
        
        // Add water plane for river
        const waterGeometry = new THREE.PlaneGeometry(100, 100);
        const waterMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4169E1, 
            transparent: true, 
            opacity: 0.7 
        });
        const water = new THREE.Mesh(waterGeometry, waterMaterial);
        water.rotation.x = -Math.PI / 2;
        water.position.set(-100, getTerrainHeight(-100, 200) + 1, 200);
        scene.add(water);
    }
    
    function createPlayer3D() {
        // Use a combination of cylinder and sphere for player representation
        const playerGeometry = new THREE.CylinderGeometry(2, 2, 8, 8);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        player3D = new THREE.Mesh(playerGeometry, playerMaterial);
        player3D.castShadow = true;
        scene.add(player3D);
    }
    
    function createLandmarks() {
        // ASDA building
        const asdaGeometry = new THREE.BoxGeometry(20, 15, 30);
        const asdaMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const asda = new THREE.Mesh(asdaGeometry, asdaMaterial);
        asda.position.set(-200, getTerrainHeight(-200, -200) + 7.5, -200);
        asda.castShadow = true;
        scene.add(asda);
        
        // Pony Farm
        const farmGeometry = new THREE.BoxGeometry(15, 10, 20);
        const farmMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const farm = new THREE.Mesh(farmGeometry, farmMaterial);
        farm.position.set(100, getTerrainHeight(100, 300) + 5, 300);
        farm.castShadow = true;
        scene.add(farm);
    }
    
    function getTerrainHeight(x, z) {
        // Simple height calculation - in a real implementation you'd query the terrain mesh
        let height = 0;
        height += Math.sin(x * 0.01) * 20 + Math.cos(z * 0.01) * 15;
        
        if (x > 150 && x < 250 && z > -200 && z < -100) {
            height += Math.sin(x * 0.02) * 30 + Math.cos(z * 0.02) * 25;
        }
        
        if (x > -150 && x < -50 && z > 150 && z < 250) {
            height -= 20;
        }
        
        if (x > 200 && x < 300 && z > -230 && z < -130) {
            height += Math.random() * 40 - 20;
        }
        
        return height;
    }
    
    function update3DWorld() {
        if (window.no3DGraphics) {
            return; // Skip 3D updates if not available
        }
        
        if (!scene || !camera || !renderer || !player3D) {
            console.warn("3D World components missing:", {
                scene: !!scene,
                camera: !!camera, 
                renderer: !!renderer,
                player3D: !!player3D
            });
            return;
        }
        
        try {
            // Update player 3D position
            player3D.position.x = gameState.player.x;
            player3D.position.z = gameState.player.y; // Note: game Y becomes world Z
            player3D.position.y = getTerrainHeight(gameState.player.x, gameState.player.y) + 5;
            
            // Update camera to follow player (third-person view)
            const cameraOffset = new THREE.Vector3(0, 30, 50);
            const targetPosition = player3D.position.clone().add(cameraOffset);
            camera.position.lerp(targetPosition, 0.1);
            camera.lookAt(player3D.position);
            
            // Update lighting based on time of day
            updateWorldLighting();
            
            // Render the scene
            renderer.render(scene, camera);
            
            // Debug frame counting
            frameCount++;
            if (frameCount % 60 === 0) { // Log every 60 frames (roughly 1 second)
                console.log("3D render frames:", frameCount, "Player pos:", {
                    x: gameState.player.x.toFixed(1), 
                    y: gameState.player.y.toFixed(1)
                });
            }
            
        } catch (error) {
            console.error("Error updating 3D world:", error);
        }
    }
    
    function updateWorldLighting() {
        if (window.no3DGraphics || !renderer) return;
        
        const { hour } = gameState.time;
        let intensity = 0.3; // Night
        let skyColor = 0x23395B; // Night sky
        
        if (hour >= 5 && hour < 12) { // Morning
            intensity = 0.8;
            skyColor = 0xF7B267; // Morning sky color
        } else if (hour >= 12 && hour < 17) { // Afternoon
            intensity = 1.0;
            skyColor = 0x87CEEB; // Afternoon sky (light blue)
        } else if (hour >= 17 && hour < 21) { // Evening
            intensity = 0.6;
            skyColor = 0xFF5A5F; // Evening sky color
        }
        
        // Update directional light
        if (scene && scene.children) {
            const directionalLight = scene.children.find(child => child.type === 'DirectionalLight');
            if (directionalLight) {
                directionalLight.intensity = intensity;
            }
        }
        
        // Update sky color in renderer
        renderer.setClearColor(skyColor);
    }
    
    function onWindowResize() {
        if (camera && renderer) {
            camera.aspect = window.innerWidth / window.innerHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }
    
    // --- TERRAIN MODIFICATION FUNCTIONS ---
    function addTerrainFeature(x, z, type, params = {}) {
        // Function to add new terrain features dynamically
        switch(type) {
            case 'hill':
                addHill(x, z, params.radius || 50, params.height || 30);
                break;
            case 'tree':
                addTree(x, z, params.height || 20);
                break;
            case 'rock':
                addRock(x, z, params.size || 3);
                break;
            case 'building':
                addBuilding(x, z, params.width || 10, params.height || 10, params.depth || 10, params.color || 0x8B4513);
                break;
        }
    }
    
    function addHill(x, z, radius, height) {
        // Add a hill to the terrain (this would modify the terrain geometry in a real implementation)
        // For now, we'll add a visual representation
        const hillGeometry = new THREE.SphereGeometry(radius, 16, 8);
        const hillMaterial = new THREE.MeshLambertMaterial({ color: 0x90EE90, transparent: true, opacity: 0.7 });
        const hill = new THREE.Mesh(hillGeometry, hillMaterial);
        hill.position.set(x, getTerrainHeight(x, z) + height/2, z);
        hill.scale.y = 0.3; // Flatten it to look more like a hill
        scene.add(hill);
        return hill;
    }
    
    function addTree(x, z, height) {
        const trunkGeometry = new THREE.CylinderGeometry(1, 2, height * 0.3);
        const trunkMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const trunk = new THREE.Mesh(trunkGeometry, trunkMaterial);
        
        const foliageGeometry = new THREE.ConeGeometry(height * 0.3, height * 0.7, 8);
        const foliageMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const foliage = new THREE.Mesh(foliageGeometry, foliageMaterial);
        
        const tree = new THREE.Group();
        trunk.position.y = height * 0.15;
        foliage.position.y = height * 0.65;
        
        tree.add(trunk);
        tree.add(foliage);
        tree.position.set(x, getTerrainHeight(x, z), z);
        tree.castShadow = true;
        scene.add(tree);
        return tree;
    }
    
    function addRock(x, z, size) {
        const rockGeometry = new THREE.SphereGeometry(size, 8, 6);
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        const rock = new THREE.Mesh(rockGeometry, rockMaterial);
        rock.position.set(x, getTerrainHeight(x, z) + size/2, z);
        rock.scale.set(
            0.8 + Math.random() * 0.4,
            0.6 + Math.random() * 0.4,
            0.8 + Math.random() * 0.4
        );
        rock.castShadow = true;
        scene.add(rock);
        return rock;
    }
    
    function addBuilding(x, z, width, height, depth, color) {
        const buildingGeometry = new THREE.BoxGeometry(width, height, depth);
        const buildingMaterial = new THREE.MeshLambertMaterial({ color: color });
        const building = new THREE.Mesh(buildingGeometry, buildingMaterial);
        building.position.set(x, getTerrainHeight(x, z) + height/2, z);
        building.castShadow = true;
        scene.add(building);
        return building;
    }
    
    function regenerateTerrain() {
        // Function to regenerate terrain with new parameters
        if (terrain) {
            scene.remove(terrain);
        }
        createTerrain();
    }
    
    function setTerrainDetail(detail) {
        // Change terrain resolution
        terrainDetail = Math.max(16, Math.min(128, detail));
        regenerateTerrain();
    }
    
    function exportTerrainConfig() {
        // Export current terrain configuration for saving/loading
        return {
            size: terrainSize,
            detail: terrainDetail,
            playerPosition: { x: gameState.player.x, y: gameState.player.y }
        };
    }
    
    function importTerrainConfig(config) {
        // Import terrain configuration
        terrainSize = config.size || 1000;
        terrainDetail = config.detail || 64;
        if (config.playerPosition) {
            gameState.player.x = config.playerPosition.x;
            gameState.player.y = config.playerPosition.y;
        }
        regenerateTerrain();
    }

    // --- HELPER FUNCTIONS ---
    function switchScreen(screenName) {
        Object.values(screens).forEach(s => s.classList.remove('active'));
        screens[screenName].classList.add('active');
        gameState.currentScreen = screenName;
    }

    function saveGame() {
        // Simple cookie save without obfuscation
        document.cookie = `groupMoorSurvival=${JSON.stringify(gameState)};path=/;max-age=31536000`;
    }

    function loadGame() {
        const cookie = document.cookie.split('; ').find(row => row.startsWith('groupMoorSurvival='));
        if (cookie) {
            try {
                const loadedState = JSON.parse(cookie.split('=')[1]);
                gameState = { ...defaultGameState, ...loadedState }; // Merge to ensure new properties are added
                return true;
            } catch (e) {
                console.error("Failed to parse saved game:", e);
                gameState = { ...defaultGameState }; // Use a spread to create a new object
                return false;
            }
        }
        gameState = { ...defaultGameState };
        return false;
    }

    function showNotification(message, duration = 3000) {
        notification.textContent = message;
        notification.style.top = '20px';
        setTimeout(() => {
            notification.style.top = '-100px';
        }, duration);
    }

    function earnBadge(badgeName) {
        if (!gameState.badges.includes(badgeName)) {
            gameState.badges.push(badgeName);
            showNotification(`🏅 Badge Earned: ${badgeName}!`);
        }
    }

    // --- INITIALIZATION ---
    function init() {
        // Cookie Consent
        const cookieConsent = document.getElementById('cookie-consent');
        const acceptCookies = document.getElementById('accept-cookies');
        acceptCookies.onclick = () => {
            cookieConsent.style.display = 'none';
        };
        
        if (loadGame() && gameState.currentScreen === 'game') {
            // If game was saved in the main world, load it directly
            setupInitialShop();
            startGame();
        } else {
            gameState = { ...defaultGameState };
            setupScreens();
            switchScreen('splash');
        }

        // Add universal modal close functionality
        document.querySelectorAll('.modal .close-button').forEach(btn => {
            btn.onclick = () => {
                btn.closest('.modal').style.display = 'none';
            }
        });
    }

    function setupScreens() {
        // Splash Screen
        screens.splash.onclick = () => switchScreen('companion');

        // Companion Screen
        companionGrid.innerHTML = '';
        COMPANIONS.forEach(name => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.innerHTML = `<div class="character-image" style="width:100px; height:100px; background: #ccc; margin: auto;"></div><p>${name}</p>`; // Placeholder for child's drawing
            card.onclick = () => {
                gameState.companion = name;
                switchScreen('doctor');
            };
            companionGrid.appendChild(card);
        });

        // Doctor Screen
        doctorGrid.innerHTML = '';
        DOCTORS.forEach(name => {
            const card = document.createElement('div');
            card.className = 'character-card';
            card.innerHTML = `<div class="character-image" style="width:100px; height:100px; background: #aaa; margin: auto;"></div><p>${name}</p>`; // Placeholder for adult drawing
            card.onclick = () => {
                gameState.doctor = name;
                switchScreen('shop');
            };
            doctorGrid.appendChild(card);
        });

        // Shop Screen
        setupInitialShop();
        exitShopButton.onclick = startGame;
    }
    
    function setupInitialShop() {
        shopItemsContainer.innerHTML = '';
        SHOP_ITEMS.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `<span>${item.name} (£${item.price})</span>`;
            const buyButton = document.createElement('button');
            buyButton.textContent = 'Buy';
            buyButton.onclick = () => {
                if (gameState.budget >= item.price) {
                    gameState.budget -= item.price;
                    gameState.inventory.push({name: item.name});
                    updateBudgetDisplay();
                    showNotification(`Bought ${item.name}`);
                } else {
                    showNotification('Not enough money!');
                }
            };
            itemDiv.appendChild(buyButton);
            shopItemsContainer.appendChild(itemDiv);
        });
        updateBudgetDisplay();
    }
    
    function updateBudgetDisplay() {
        budgetDisplay.textContent = gameState.budget.toFixed(2);
    }

    // --- MAIN GAME LOGIC ---
    function startGame() {
        switchScreen('game');
        if (!window.no3DGraphics && !scene) {
            init3DWorld();
        }
        if (!gameLoop.running) {
             gameLoop.start();
        }
    }

    const gameLoop = {
        lastTime: 0,
        running: false,
        start: function() {
            this.running = true;
            this.lastTime = performance.now();
            requestAnimationFrame(this.loop.bind(this));
        },
        loop: function(currentTime) {
            if (!this.running) return;

            const deltaTime = (currentTime - this.lastTime) / 1000; // time in seconds
            
            // Update game state based on deltaTime
            updateGameTime(deltaTime);
            updatePlayerState(deltaTime);
            updateWorld();
            update3DWorld(); // Update 3D world
            updateUI();
            
            this.lastTime = currentTime;
            saveGame(); // Save progress on every frame
            requestAnimationFrame(this.loop.bind(this));
        }
    };
    
    const keysPressed = {};
    let mouseX = 0, mouseY = 0;
    let isMouseDown = false;
    
    document.addEventListener('keydown', (e) => { 
        keysPressed[e.key.toLowerCase()] = true; 
        // Prevent default for game keys to avoid page scrolling
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    });
    document.addEventListener('keyup', (e) => { keysPressed[e.key.toLowerCase()] = false; });
    
    // Mouse controls for camera
    document.addEventListener('mousedown', (e) => {
        if (gameState.currentScreen === 'game') {
            isMouseDown = true;
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    });
    
    document.addEventListener('mouseup', () => {
        isMouseDown = false;
    });
    
    document.addEventListener('mousemove', (e) => {
        if (isMouseDown && gameState.currentScreen === 'game') {
            const deltaX = e.clientX - mouseX;
            const deltaY = e.clientY - mouseY;
            
            // Update camera rotation (you can modify this later for first-person view)
            if (camera) {
                // Simple orbit camera controls
                camera.position.x += deltaX * 0.5;
                camera.position.y -= deltaY * 0.5;
            }
            
            mouseX = e.clientX;
            mouseY = e.clientY;
        }
    });
    
    function updatePlayerState(deltaTime) {
        gameState.player.isRunning = keysPressed['shift'];
        let currentSpeed = gameState.player.speed * (gameState.player.isRunning ? 2 : 1);
        
        // Store previous position for terrain following
        const prevX = gameState.player.x;
        const prevY = gameState.player.y;
        
        // Movement with WASD or arrow keys
        let moved = false;
        if (keysPressed['arrowup'] || keysPressed['w']) { 
            gameState.player.y -= currentSpeed * deltaTime * 60; 
            moved = true;
        }
        if (keysPressed['arrowdown'] || keysPressed['s']) { 
            gameState.player.y += currentSpeed * deltaTime * 60; 
            moved = true;
        }
        if (keysPressed['arrowleft'] || keysPressed['a']) { 
            gameState.player.x -= currentSpeed * deltaTime * 60; 
            moved = true;
        }
        if (keysPressed['arrowright'] || keysPressed['d']) { 
            gameState.player.x += currentSpeed * deltaTime * 60; 
            moved = true;
        }

        // Check if moving uphill for speed penalty
        if (moved) {
            const currentHeight = getTerrainHeight(gameState.player.x, gameState.player.y);
            const prevHeight = getTerrainHeight(prevX, prevY);
            if (currentHeight > prevHeight + 2) { // Going uphill
                currentSpeed *= 0.7; // 30% slower going uphill
                // Recalculate movement with reduced speed
                if (keysPressed['arrowup'] || keysPressed['w']) { 
                    gameState.player.y = prevY - (currentSpeed * deltaTime * 60); 
                }
                if (keysPressed['arrowdown'] || keysPressed['s']) { 
                    gameState.player.y = prevY + (currentSpeed * deltaTime * 60); 
                }
                if (keysPressed['arrowleft'] || keysPressed['a']) { 
                    gameState.player.x = prevX - (currentSpeed * deltaTime * 60); 
                }
                if (keysPressed['arrowright'] || keysPressed['d']) { 
                    gameState.player.x = prevX + (currentSpeed * deltaTime * 60); 
                }
            }
        }

        // Keep player within reasonable bounds
        gameState.player.x = Math.max(-400, Math.min(400, gameState.player.x));
        gameState.player.y = Math.max(-400, Math.min(400, gameState.player.y));

        // Increase hunger
        const hungerIncrease = gameState.player.isRunning ? 0.05 : 0.02;
        gameState.player.hunger += hungerIncrease * deltaTime;
        if (gameState.player.hunger >= 100) {
            gameState.player.hunger = 100;
            sendHome("You were sent home from extreme hunger.");
        }
        
        // Increase tick chance
        if (Math.random() < 0.0001) { // Low chance per frame
            gameState.ticks++;
            showNotification("You feel an itch... you might have a tick!");
        }
        if (gameState.ticks > 5) { // Threshold for getting sick
             sendHome("You got sick from too many tick bites!");
        }
    }

    function updateGameTime(deltaTime) {
        // 1 real second = 2 game minutes
        const gameMinutesPassed = deltaTime * 2;
        gameState.time.minute += gameMinutesPassed;

        if (gameState.time.minute >= 60) {
            gameState.time.hour++;
            gameState.time.minute = 0;
        }
        if (gameState.time.hour >= 24) {
            gameState.time.day++;
            gameState.time.hour = 0;
            gameState.ticks = Math.max(0, gameState.ticks - 1); // One tick might fall off overnight
            if (gameState.time.day % 10 === 0) earnBadge(`${gameState.time.day} Days Survived`);
        }
        if (gameState.time.day > 10) {
            gameState.time.month++;
            gameState.time.day = 1;
        }
        if (gameState.time.month > 3) {
            gameState.time.season++;
            gameState.time.month = 1;
        }
        if (gameState.time.season > 4) {
            gameState.time.season = 1;
        }
    }

    function updateWorld() {
        // Logic for growing seeds, weather changes etc. would go here.
        // For example, grow pumpkins:
        gameState.world.plantedSeeds.forEach(seed => {
            if (seed.type === 'pumpkin' && seed.growth < 100) {
                seed.growth += 0.1; // Growth rate
            }
        });
    }

    function updateUI() {
        // Time of day display
        const { day, month, season, hour } = gameState.time;
        const seasonName = SEASONS[season];
        let timeOfDay = 'Night';
        if (hour >= 5 && hour < 12) timeOfDay = 'Morning';
        if (hour >= 12 && hour < 17) timeOfDay = 'Afternoon';
        if (hour >= 17 && hour < 21) timeOfDay = 'Evening';
        
        gameTimeDisplay.textContent = `Day ${day}, ${seasonName}, ${timeOfDay}`;

        // Light color - don't set background on worldView anymore
        let skyColor = 'var(--bg-sky-night)';
        if (timeOfDay === 'Morning') skyColor = 'var(--bg-sky-day)';
        if (timeOfDay === 'Afternoon') skyColor = 'var(--bg-sky-day)';
        if (timeOfDay === 'Evening') skyColor = 'var(--bg-sky-dusk)';
        
        // Don't override the 3D canvas with background color
        // worldView.style.backgroundColor = skyColor;

        // Hunger bar
        hungerBar.style.width = `${gameState.player.hunger}%`;
        
        // Location display
        const playerLocation = getCurrentLocation();
        locationNameDisplay.textContent = playerLocation.name;
        
        // Update menu icons based on context
        const nearRiver = getDistanceTo('The River') < 50;
        const nearPonyFarm = getDistanceTo('Pony Farm') < 30;
        const atTent = gameState.world.tentPitched && getDistanceToPoint(gameState.world.tentLocation) < 20;

        menuIcons.fishing.classList.toggle('disabled', !nearRiver);
        menuIcons.pony.classList.toggle('disabled', !nearPonyFarm);
        menuIcons.sleep.classList.toggle('disabled', !(atTent && timeOfDay === 'Evening'));
    }
    
    function getCurrentLocation() {
        for (const loc of WORLD_LOCATIONS) {
            const dist = Math.sqrt(Math.pow(gameState.player.x - loc.x, 2) + Math.pow(gameState.player.y - loc.y, 2));
            if (dist < loc.radius) return loc;
        }
        return WORLD_LOCATIONS[0]; // Default to The Moors
    }
    
    function getDistanceTo(locationName) {
        const loc = WORLD_LOCATIONS.find(l => l.name === locationName);
        if (!loc) return Infinity;
        return Math.sqrt(Math.pow(gameState.player.x - loc.x, 2) + Math.pow(gameState.player.y - loc.y, 2));
    }
    
    function getDistanceToPoint(point) {
         return Math.sqrt(Math.pow(gameState.player.x - point.x, 2) + Math.pow(gameState.player.y - point.y, 2));
    }

    function sendHome(reason) {
        gameLoop.running = false;
        modals.sentHome.style.display = 'flex';
        document.getElementById('sent-home-reason').textContent = reason;
    }
    
    document.getElementById('return-to-shop').onclick = () => {
        // Reset player state but keep inventory, badges etc.
        const prevState = { ...gameState };
        gameState = {
            ...defaultGameState,
            companion: prevState.companion,
            doctor: prevState.doctor,
            budget: 100, // Extra budget
            inventory: prevState.inventory,
            badges: prevState.badges
        };
        modals.sentHome.style.display = 'none';
        setupInitialShop();
        switchScreen('shop');
    };

    // --- MENU FUNCTIONALITY ---
    function openModal(modal) {
        modal.style.display = 'flex';
    }

    menuIcons.bag.onclick = () => {
        bagContents.innerHTML = '';
        if (gameState.inventory.length === 0) {
            bagContents.innerHTML = '<p>Your bag is empty.</p>';
        }
        gameState.inventory.forEach((item, index) => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'inventory-item';
            itemDiv.textContent = item.name;
            itemDiv.onclick = () => {
                // Consume food
                if (SHOP_ITEMS.find(shopItem => shopItem.name === item.name && shopItem.type === 'food')) {
                    gameState.player.hunger = Math.max(0, gameState.player.hunger - 15); // Food reduces hunger
                    gameState.inventory.splice(index, 1);
                    openModal(modals.bag); // Refresh bag view
                    showNotification(`You ate the ${item.name}.`);
                }
            };
            bagContents.appendChild(itemDiv);
        });
        openModal(modals.bag);
    };
    
    menuIcons.ticks.onclick = () => {
        genericModalTitle.textContent = "Tick Check Minigame";
        let content = `<p>Searching for ticks... You have ${gameState.ticks} attached.</p>`;
        content += `<div style="width:200px; height:200px; background:#f0e0d0; border:1px solid #000; position:relative; margin:auto;" id="tick-area"></div>`; // armpit
        genericModalContent.innerHTML = content;
        
        const tickArea = document.getElementById('tick-area');
        for(let i=0; i<gameState.ticks; i++) {
            const tickEl = document.createElement('div');
            tickEl.textContent = '*'; // simple tick representation
            tickEl.style.position = 'absolute';
            tickEl.style.left = `${Math.random() * 90}%`;
            tickEl.style.top = `${Math.random() * 90}%`;
            tickEl.style.cursor = 'pointer';
            tickEl.onclick = () => {
                gameState.ticks--;
                tickEl.remove();
                showNotification("Removed a tick!");
                // refresh the minigame view
                menuIcons.ticks.onclick();
            };
            tickArea.appendChild(tickEl);
        }
        openModal(modals.generic);
    };
    
    menuIcons.camp.onclick = () => {
        const hasTent = gameState.inventory.some(item => item.name.includes('Tent'));
        if (gameState.world.tentPitched) {
            // Pack up tent
            gameState.world.tentPitched = false;
            gameState.inventory.push({name: 'Packed Tent'}); // Simplified
            showNotification("Tent packed up.");
        } else if (hasTent) {
            // Pitch tent
            const tentIndex = gameState.inventory.findIndex(item => item.name.includes('Tent'));
            gameState.inventory.splice(tentIndex, 1);
            gameState.world.tentPitched = true;
            gameState.world.tentLocation = { x: gameState.player.x, y: gameState.player.y };
            earnBadge("First Camp");
            showNotification("Tent pitched.");
        } else {
            showNotification("You don't have a tent to pitch.");
        }
    };

    menuIcons.sleep.onclick = () => {
        if (!menuIcons.sleep.classList.contains('disabled')) {
            // Fast forward time to 7 AM next day
            const hoursToSkip = (24 - gameState.time.hour) + 7;
            gameState.time.hour = 7;
            gameState.time.minute = 0;
            gameState.time.day++;
             if (gameState.time.day > 10) {
                gameState.time.month++;
                gameState.time.day = 1;
            }
             if (gameState.time.month > 3) {
                gameState.time.season++;
                gameState.time.month = 1;
            }
            showNotification(`You sleep soundly and wake up on a new day.`);
        }
    };
    
    menuIcons.badges.onclick = () => {
         genericModalTitle.textContent = "Your Badges";
         if (gameState.badges.length === 0) {
             genericModalContent.innerHTML = "<p>You haven't earned any badges yet.</p>";
         } else {
             genericModalContent.innerHTML = gameState.badges.map(b => `<div>🏅 ${b}</div>`).join('');
         }
         openModal(modals.generic);
    };

    menuIcons.phone.onclick = () => {
        genericModalTitle.textContent = "Smartphone";
        const content = `
            <button id="phone-photo">Take Photo</button>
            <button id="phone-send">Send Photo to Scientist</button>
            <button id="phone-comic">Entertainment</button>
            <div id="phone-display" style="margin-top:15px; background: #333; padding:10px; min-height: 100px;"></div>
        `;
        genericModalContent.innerHTML = content;

        document.getElementById('phone-photo').onclick = () => {
            const location = getCurrentLocation().name;
            document.getElementById('phone-display').innerHTML = `<p><em>Photo taken at: ${location}</em></p>`;
             earnBadge("Photographer");
        };

        document.getElementById('phone-send').onclick = () => {
             document.getElementById('phone-display').innerHTML = `<p>Photo sent... waiting for reply.</p>
             <p><em>Reply: "Interesting sample! Looks like a common moorland specimen."</em></p>`;
        };
        
        document.getElementById('phone-comic').onclick = () => {
             document.getElementById('phone-display').innerHTML = `
                <div style="text-align:left; font-size: 12px; line-height: 1.4;">
                    <p><strong>Pingu and Seal-Friend's AI Adventure</strong></p>
                    <p>One day Pingu and Seal-Friend were designing a game. They had heard that you could give an AI some instructions and it would build a game for you. The game they designed was one where you flew a spaceship between different worlds... <em>[full story text here]</em> ...What they could see on the screen of their spaceship was the same game the Pingu and Seal-Friend had made!</p>
                </div>
             `;
        };

        openModal(modals.generic);
    };
    
    // Placeholder for other mini-games
    menuIcons.fishing.onclick = () => { if (!menuIcons.fishing.classList.contains('disabled')) showNotification("Fishing mini-game would start here!"); };


    // And so on for all other menu items...

    // --- DEVELOPMENT/DEBUG FUNCTIONS ---
    // Make these available globally for console access
    window.gameDevTools = {
        addHill: (x, z, radius, height) => addTerrainFeature(x, z, 'hill', { radius, height }),
        addTree: (x, z, height) => addTerrainFeature(x, z, 'tree', { height }),
        addRock: (x, z, size) => addTerrainFeature(x, z, 'rock', { size }),
        addBuilding: (x, z, w, h, d, color) => addTerrainFeature(x, z, 'building', { width: w, height: h, depth: d, color }),
        setTerrainDetail: (detail) => setTerrainDetail(detail),
        regenerateTerrain: () => regenerateTerrain(),
        exportTerrain: () => exportTerrainConfig(),
        importTerrain: (config) => importTerrainConfig(config),
        teleportPlayer: (x, y) => {
            gameState.player.x = x;
            gameState.player.y = y;
        },
        getPlayerPosition: () => ({ x: gameState.player.x, y: gameState.player.y }),
        toggleWireframe: () => {
            if (terrain) {
                terrain.material.wireframe = !terrain.material.wireframe;
            }
        },
        setCameraMode: (mode) => {
            // Future: Switch between third-person, first-person, top-down
            console.log(`Camera mode: ${mode} (not yet implemented)`);
        }
    };
    
    // Show development commands in console
    console.log("🎮 Game Development Tools Available:");
    console.log("gameDevTools.addHill(x, z, radius, height) - Add a hill");
    console.log("gameDevTools.addTree(x, z, height) - Add a tree");
    console.log("gameDevTools.addRock(x, z, size) - Add a rock");
    console.log("gameDevTools.addBuilding(x, z, w, h, d, color) - Add a building");
    console.log("gameDevTools.setTerrainDetail(detail) - Change terrain resolution (16-128)");
    console.log("gameDevTools.regenerateTerrain() - Regenerate terrain");
    console.log("gameDevTools.teleportPlayer(x, y) - Move player to position");
    console.log("gameDevTools.getPlayerPosition() - Get current player position");
    console.log("gameDevTools.toggleWireframe() - Toggle terrain wireframe");
    console.log("Example: gameDevTools.addTree(100, 100, 25)");

    // --- Start the game ---
    init();
    
    } // Close startGameInitialization function
    
    // Start the initialization process
    initializeGame();
});
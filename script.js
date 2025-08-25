document.addEventListener('DOMContentLoaded', () => {
    console.log('🎮 DOM Content Loaded - Starting Game');
    
    // Function to check if Three.js is loaded and start the game
    function initializeGame() {
        console.log('🔧 initializeGame() called');
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
        console.log('🚀 About to call startGameInitialization()');
        startGameInitialization();
    }
    
    function startGameInitialization() {
        console.log("🎯 Starting game initialization...");
        
        try {
            console.log("📋 Defining constants and state...");
            
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
            rotation: 0, // Player facing direction in radians
            hunger: 0, // 0-100
            isRunning: false,
        },
        world: {
            tentPitched: false,
            tentLocation: { x: null, y: null },
            tentType: null, // 'cheap' or 'expensive'
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
    const basketContents = document.getElementById('basket-contents');
    const basketTotal = document.getElementById('basket-total');

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
        minimap: document.getElementById('menu-minimap'),
    };

    // Minimap Elements
    const minimap = document.getElementById('minimap');
    const minimapCanvas = document.getElementById('minimap-canvas');
    const minimapClose = document.getElementById('minimap-close');
    const minimapCtx = minimapCanvas ? minimapCanvas.getContext('2d') : null;

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
    
    // Food emoji mapping
    const FOOD_EMOJIS = {
        'Bread': '🍞',
        'Cheese': '🧀', 
        'Ham': '🥓',
        'Ketchup': '🍅',
        'Chocolate': '🍫',
        'Carrot': '🥕',
        'Cucumber': '🥒',
        'Apple': '🍎'
    };
    
    // Recipe system
    const RECIPES = [
        {
            name: 'Ham Sandwich',
            emoji: '🥪',
            ingredients: ['Bread', 'Ham'],
            hungerValue: 35, // More filling than individual ingredients
            description: 'A hearty ham sandwich'
        },
        {
            name: 'Cheese Sandwich', 
            emoji: '🧀🍞',
            ingredients: ['Bread', 'Cheese'],
            hungerValue: 30,
            description: 'Simple but satisfying cheese sandwich'
        },
        {
            name: 'Ham & Cheese Sandwich',
            emoji: '🥪🧀',
            ingredients: ['Bread', 'Ham', 'Cheese'],
            hungerValue: 45,
            description: 'The ultimate sandwich combination'
        },
        {
            name: 'Garden Salad',
            emoji: '🥗',
            ingredients: ['Carrot', 'Cucumber'],
            hungerValue: 25,
            description: 'Fresh and healthy vegetables'
        },
        {
            name: 'Carrot Sticks with Ketchup',
            emoji: '🥕🍅',
            ingredients: ['Carrot', 'Ketchup'],
            hungerValue: 20,
            description: 'An unusual but surprisingly tasty combination'
        },
        {
            name: 'Apple Slices with Cheese',
            emoji: '🍎🧀',
            ingredients: ['Apple', 'Cheese'],
            hungerValue: 25,
            description: 'Sweet and savory fruit and cheese plate'
        },
        {
            name: 'Chocolate Apple',
            emoji: '🍎🍫',
            ingredients: ['Apple', 'Chocolate'],
            hungerValue: 30,
            description: 'Decadent chocolate-covered apple treat'
        },
        {
            name: 'Moorland Feast',
            emoji: '🍽️',
            ingredients: ['Bread', 'Ham', 'Cheese', 'Apple', 'Carrot'],
            hungerValue: 60,
            description: 'A complete meal using the best of your supplies'
        }
    ];
    
    // Shopping basket state
    let shoppingBasket = [];
    const WORLD_LOCATIONS = [
        { name: "The Moors", x: 0, y: 0, radius: 800 },
        { name: "The Ancient Stone Circle", x: 300, y: -200, radius: 50 },
        { name: "The River Valley", x: -200, y: 0, radius: 200 },
        { name: "The Waterfall", x: -250, y: 150, radius: 30 },
        { name: "Heather Fields", x: 400, y: 300, radius: 150 },
        { name: "Rocky Outcrop", x: 500, y: -400, radius: 80 },
        { name: "The Lone Tree", x: -400, y: -300, radius: 25 },
        { name: "ASDA", x: -600, y: -600, radius: 30 },
        { name: "Pony Farm", x: 400, y: 600, radius: 40 },
    ];
    const SEASONS = { 1: 'Spring', 2: 'Summer', 3: 'Autumn', 4: 'Winter' };

    // --- 3D WORLD SETUP ---
    let scene, camera, renderer, terrain, player3D, controls;
    let terrainSize = 2000;  // Make map much bigger
    let terrainDetail = 128; // Higher detail for better terrain
    let frameCount = 0;
    let companion3D = null;
    let companionTarget = { x: 0, z: 0 };
    let companionWanderTimer = 0;
    let riverMesh = null;
    let waterfallMesh = null;
    let tentMesh = null;
    let tentType = null; // 'cheap' or 'expensive'
    
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
            
            // Create camera (first-person)
            camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
            camera.position.set(0, 10, 0); // First-person height
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
            
            // Create companion
            createCompanion3D();
            console.log("Companion creation initiated");
            
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
        
        // Generate height map for English moorland
        const vertices = geometry.attributes.position.array;
        for (let i = 0; i < vertices.length; i += 3) {
            const x = vertices[i];
            const z = vertices[i + 1];
            
            // Create rolling moorland hills with multiple noise layers
            let height = 0;
            
            // Large rolling hills (primary terrain features)
            height += Math.sin(x * 0.003) * 50 + Math.cos(z * 0.003) * 40;
            height += Math.sin(x * 0.002 + z * 0.002) * 30;
            
            // Medium undulations (secondary features)
            height += Math.sin(x * 0.008) * 15 + Math.cos(z * 0.008) * 12;
            height += Math.sin(x * 0.015 + z * 0.01) * 8;
            
            // Fine detail for moorland texture
            height += Math.sin(x * 0.05) * 3 + Math.cos(z * 0.05) * 2;
            // Remove random variation to ensure getTerrainHeight() matches actual terrain
            
            // Create river valley - lower terrain along river path
            const riverX = -200;
            const riverDistanceFromCenter = Math.abs(x - riverX);
            if (riverDistanceFromCenter < 150) {
                const riverDepth = (150 - riverDistanceFromCenter) / 150;
                height -= riverDepth * riverDepth * 25; // Gradual valley
            }
            
            // Create waterfall cliff area
            if (x > -300 && x < -200 && z > 100 && z < 200) {
                height += Math.sin((x + 300) * 0.02) * 60; // Sharp cliff face
            }
            
            vertices[i + 2] = height;
        }
        
        geometry.attributes.position.needsUpdate = true;
        geometry.computeVertexNormals();
        
        // Create moorland material with texture
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const context = canvas.getContext('2d');
        
        // Create moorland texture
        const gradient = context.createRadialGradient(256, 256, 0, 256, 256, 256);
        gradient.addColorStop(0, '#8FBC8F'); // Sage green
        gradient.addColorStop(0.3, '#9ACD32'); // Yellow green  
        gradient.addColorStop(0.6, '#8B7355'); // Brown moorland
        gradient.addColorStop(1, '#696969'); // Gray rocks
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 512, 512);
        
        // Add texture details - heather patches and grass
        for (let i = 0; i < 200; i++) {
            const x = Math.random() * 512;
            const y = Math.random() * 512;
            const size = Math.random() * 8 + 2;
            
            // Heather patches (purple)
            if (Math.random() > 0.6) {
                context.fillStyle = '#8B7AA5';
                context.beginPath();
                context.arc(x, y, size, 0, Math.PI * 2);
                context.fill();
            }
            
            // Grass tufts (green)
            if (Math.random() > 0.7) {
                context.fillStyle = '#228B22';
                context.fillRect(x, y, size * 0.5, size);
            }
        }
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set(8, 8); // Tile the texture
        
        const material = new THREE.MeshLambertMaterial({ 
            map: texture,
            color: 0xFFFFFF // Don't tint the texture
        });
        
        terrain = new THREE.Mesh(geometry, material);
        terrain.rotation.x = -Math.PI / 2;
        terrain.receiveShadow = true;
        scene.add(terrain);
        
        // Add terrain features
        addMoorlandFeatures();
        createRiverSystem();
    }
    
    function addMoorlandFeatures() {
        // Add heather bushes across the moors
        const heatherGeometry = new THREE.SphereGeometry(3, 6, 4);
        const heatherMaterial = new THREE.MeshLambertMaterial({ color: 0x8B7AA5 }); // Purple heather
        
        for (let i = 0; i < 100; i++) {
            const heather = new THREE.Mesh(heatherGeometry, heatherMaterial);
            const x = (Math.random() - 0.5) * terrainSize * 0.8;
            const z = (Math.random() - 0.5) * terrainSize * 0.8;
            heather.position.set(
                x,
                getTerrainHeight(x, z) + 1,
                z
            );
            heather.scale.set(
                0.5 + Math.random() * 0.5,
                0.3 + Math.random() * 0.3,
                0.5 + Math.random() * 0.5
            );
            scene.add(heather);
        }
        
        // Add scattered rocks typical of moorland
        const rockGeometry = new THREE.SphereGeometry(4, 8, 6);
        const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x696969 });
        
        for (let i = 0; i < 80; i++) {
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            const x = (Math.random() - 0.5) * terrainSize * 0.9;
            const z = (Math.random() - 0.5) * terrainSize * 0.9;
            rock.position.set(
                x,
                getTerrainHeight(x, z) + 2,
                z
            );
            rock.scale.set(
                0.3 + Math.random() * 1.2,
                0.3 + Math.random() * 0.8,
                0.3 + Math.random() * 1.2
            );
            rock.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            rock.castShadow = true;
            scene.add(rock);
        }
        
        // Add some ancient stone circles (typical of English moors)
        for (let circle = 0; circle < 3; circle++) {
            const centerX = (Math.random() - 0.5) * terrainSize * 0.6;
            const centerZ = (Math.random() - 0.5) * terrainSize * 0.6;
            const radius = 20 + Math.random() * 30;
            const stones = 6 + Math.floor(Math.random() * 6);
            
            for (let i = 0; i < stones; i++) {
                const angle = (i / stones) * Math.PI * 2;
                const stoneX = centerX + Math.cos(angle) * radius;
                const stoneZ = centerZ + Math.sin(angle) * radius;
                
                const stoneGeometry = new THREE.BoxGeometry(3, 8 + Math.random() * 6, 2);
                const stone = new THREE.Mesh(stoneGeometry, rockMaterial);
                stone.position.set(
                    stoneX,
                    getTerrainHeight(stoneX, stoneZ) + 4,
                    stoneZ
                );
                stone.rotation.y = angle + (Math.random() - 0.5) * 0.5;
                stone.castShadow = true;
                scene.add(stone);
            }
        }
        
        // Add some trees but sparse, as typical of moorland
        const treeGeometry = new THREE.ConeGeometry(4, 15, 8);
        const treeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        
        for (let i = 0; i < 40; i++) {
            const tree = new THREE.Mesh(treeGeometry, treeMaterial);
            const x = (Math.random() - 0.5) * terrainSize * 0.7;
            const z = (Math.random() - 0.5) * terrainSize * 0.7;
            
            // Avoid placing trees in river valley
            if (Math.abs(x + 200) > 100) {
                tree.position.set(
                    x,
                    getTerrainHeight(x, z) + 7,
                    z
                );
                tree.castShadow = true;
                scene.add(tree);
            }
        }
    }
    
    function createRiverSystem() {
        // Create the main river flowing through the valley
        const riverPath = [];
        const riverWidth = 20;
        
        // Generate river path from north to south with curves
        for (let z = -800; z <= 800; z += 10) {
            const x = -200 + Math.sin(z * 0.003) * 30; // Meandering river
            riverPath.push(new THREE.Vector3(x, getTerrainHeight(x, z) - 2, z));
        }
        
        // Create river segments
        for (let i = 0; i < riverPath.length - 1; i++) {
            const start = riverPath[i];
            const end = riverPath[i + 1];
            const length = start.distanceTo(end);
            
            const riverGeometry = new THREE.PlaneGeometry(riverWidth, length);
            const riverMaterial = new THREE.MeshLambertMaterial({ 
                color: 0x4169E1, 
                transparent: true, 
                opacity: 0.8
            });
            
            const riverSegment = new THREE.Mesh(riverGeometry, riverMaterial);
            riverSegment.position.copy(start).lerp(end, 0.5);
            riverSegment.rotation.x = -Math.PI / 2;
            riverSegment.rotation.z = Math.atan2(end.z - start.z, end.x - start.x);
            scene.add(riverSegment);
        }
        
        // Create waterfall
        createWaterfall();
        
        // Add some river rocks
        for (let i = 0; i < 30; i++) {
            const rockGeometry = new THREE.SphereGeometry(1 + Math.random() * 2, 6, 4);
            const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            
            const riverZ = (Math.random() - 0.5) * 1600;
            const riverX = -200 + Math.sin(riverZ * 0.003) * 30;
            const offsetX = (Math.random() - 0.5) * 40;
            
            rock.position.set(
                riverX + offsetX,
                getTerrainHeight(riverX + offsetX, riverZ) + 1,
                riverZ
            );
            rock.castShadow = true;
            scene.add(rock);
        }
    }
    
    function createWaterfall() {
        // Create the waterfall at the cliff face
        const waterfallX = -250;
        const waterfallZ = 150;
        const waterfallHeight = 50;
        
        // Waterfall effect using a plane with animated texture
        const waterfallGeometry = new THREE.PlaneGeometry(15, waterfallHeight);
        
        // Create animated water texture
        const canvas = document.createElement('canvas');
        canvas.width = 64;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Create vertical flowing water pattern
        const gradient = context.createLinearGradient(0, 0, 0, 256);
        gradient.addColorStop(0, 'rgba(135, 206, 235, 0.9)'); // Sky blue
        gradient.addColorStop(0.3, 'rgba(255, 255, 255, 0.8)'); // White foam
        gradient.addColorStop(0.6, 'rgba(70, 130, 180, 0.9)'); // Steel blue
        gradient.addColorStop(1, 'rgba(25, 25, 112, 0.9)'); // Midnight blue
        
        context.fillStyle = gradient;
        context.fillRect(0, 0, 64, 256);
        
        // Add some flowing lines
        context.strokeStyle = 'rgba(255, 255, 255, 0.6)';
        context.lineWidth = 2;
        for (let i = 0; i < 8; i++) {
            context.beginPath();
            context.moveTo(10 + i * 6, 0);
            context.lineTo(15 + i * 6, 256);
            context.stroke();
        }
        
        const waterfallTexture = new THREE.CanvasTexture(canvas);
        const waterfallMaterial = new THREE.MeshLambertMaterial({ 
            map: waterfallTexture,
            transparent: true, 
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        
        waterfallMesh = new THREE.Mesh(waterfallGeometry, waterfallMaterial);
        waterfallMesh.position.set(
            waterfallX,
            getTerrainHeight(waterfallX, waterfallZ) + waterfallHeight / 2,
            waterfallZ
        );
        scene.add(waterfallMesh);
        
        // Create waterfall pool at the bottom
        const poolGeometry = new THREE.CircleGeometry(12, 16);
        const poolMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x4169E1, 
            transparent: true, 
            opacity: 0.7 
        });
        const pool = new THREE.Mesh(poolGeometry, poolMaterial);
        pool.rotation.x = -Math.PI / 2;
        pool.position.set(
            waterfallX,
            getTerrainHeight(waterfallX, waterfallZ) + 0.5,
            waterfallZ
        );
        scene.add(pool);
        
        // Add mist/spray effect around waterfall
        const mistGeometry = new THREE.SphereGeometry(8, 8, 6);
        const mistMaterial = new THREE.MeshLambertMaterial({ 
            color: 0xFFFFFF, 
            transparent: true, 
            opacity: 0.3 
        });
        const mist = new THREE.Mesh(mistGeometry, mistMaterial);
        mist.position.set(
            waterfallX,
            getTerrainHeight(waterfallX, waterfallZ) + 10,
            waterfallZ
        );
        scene.add(mist);
    }
    
    function createPlayer3D() {
        // Use a combination of cylinder and sphere for player representation
        const playerGeometry = new THREE.CylinderGeometry(2, 2, 8, 8);
        const playerMaterial = new THREE.MeshLambertMaterial({ color: 0xff6600 });
        player3D = new THREE.Mesh(playerGeometry, playerMaterial);
        player3D.castShadow = true;
        scene.add(player3D);
        
        // Make player invisible in first-person mode
        player3D.visible = false;
    }
    
    function createCompanion3D() {
        if (!gameState.companion || window.no3DGraphics) return;
        
        console.log(`Creating companion for: ${gameState.companion}`);
        
        // For now, let's create a textured plane that we know will work
        // We'll use a simple color and add text to identify the companion
        const geometry = new THREE.PlaneGeometry(20, 20);
        
        // Create a canvas texture with the companion name
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // Draw background
        context.fillStyle = '#4169E1';
        context.fillRect(0, 0, 256, 256);
        
        // Draw companion name
        context.fillStyle = 'white';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText(gameState.companion, 128, 128);
        
        // Create texture from canvas
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshLambertMaterial({ 
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        companion3D = new THREE.Mesh(geometry, material);
        companion3D.position.set(
            gameState.player.x + 30,
            getTerrainHeight(gameState.player.x + 30, gameState.player.y) + 10,
            gameState.player.y
        );
        
        scene.add(companion3D);
        console.log(`Companion ${gameState.companion} created as labeled plane`);
        
        companionTarget.x = companion3D.position.x;
        companionTarget.z = companion3D.position.z;
        
        // Now try to load the actual image and replace the texture
        tryLoadCompanionImage();
    }
    
    function tryLoadCompanionImage() {
        const loader = new THREE.TextureLoader();
        let imageName = gameState.companion.toLowerCase();
        if (gameState.companion === 'Sophie') {
            imageName = 'Sophie';
        }
        
        // Try the most likely working path first
        const imagePath = `public/images/companions/${imageName}.png`;
        
        console.log(`Attempting to load companion image: ${imagePath}`);
        
        loader.load(
            imagePath,
            function(texture) {
                console.log('Successfully loaded companion image!');
                if (companion3D && companion3D.material) {
                    companion3D.material.map = texture;
                    companion3D.material.needsUpdate = true;
                    console.log('Updated companion texture');
                }
            },
            function(progress) {
                console.log('Image loading progress:', Math.round(progress.loaded / progress.total * 100) + '%');
            },
            function(error) {
                console.log('Failed to load companion image, keeping text placeholder');
                console.error('Texture loading error:', error);
            }
        );
    }
    
    function createCompanionFallback() {
        const companionGeometry = new THREE.BoxGeometry(8, 12, 4);
        const companionMaterial = new THREE.MeshLambertMaterial({ color: 0x4169E1 });
        companion3D = new THREE.Mesh(companionGeometry, companionMaterial);
        companion3D.position.set(
            gameState.player.x + 30,
            getTerrainHeight(gameState.player.x + 30, gameState.player.y) + 6,
            gameState.player.y
        );
        companion3D.castShadow = true;
        scene.add(companion3D);
        console.log('Companion created as fallback cube');
        
        companionTarget.x = companion3D.position.x;
        companionTarget.z = companion3D.position.z;
    }
    
    function createTent3D(x, z, type) {
        if (window.no3DGraphics) return;
        
        // Remove existing tent if any
        if (tentMesh) {
            scene.remove(tentMesh);
            tentMesh = null;
        }
        
        tentType = type;
        const terrainHeight = getTerrainHeight(x, z);
        
        // Create tent geometry - simple triangular tent shape
        const tentGeometry = new THREE.ConeGeometry(8, 12, 4);
        
        // Load tent texture based on type
        const loader = new THREE.TextureLoader();
        const imagePath = type === 'cheap' ? 'public/images/cheaptent.png' : 'public/images/expensivetesnt.png';
        
        console.log(`Loading tent texture: ${imagePath}`);
        
        loader.load(
            imagePath,
            function(texture) {
                console.log('Tent texture loaded successfully!');
                const tentMaterial = new THREE.MeshLambertMaterial({ 
                    map: texture,
                    transparent: true
                });
                
                tentMesh = new THREE.Mesh(tentGeometry, tentMaterial);
                tentMesh.position.set(x, terrainHeight + 6, z);
                tentMesh.castShadow = true;
                tentMesh.receiveShadow = true;
                scene.add(tentMesh);
                console.log(`${type} tent created at position (${x}, ${z})`);
            },
            function(progress) {
                console.log('Tent texture loading progress:', Math.round(progress.loaded / progress.total * 100) + '%');
            },
            function(error) {
                console.log('Failed to load tent texture, using fallback color');
                // Fallback to colored material
                const tentColor = type === 'cheap' ? 0x8B4513 : 0x2E8B57; // Brown for cheap, green for expensive
                const tentMaterial = new THREE.MeshLambertMaterial({ color: tentColor });
                
                tentMesh = new THREE.Mesh(tentGeometry, tentMaterial);
                tentMesh.position.set(x, terrainHeight + 6, z);
                tentMesh.castShadow = true;
                tentMesh.receiveShadow = true;
                scene.add(tentMesh);
                console.log(`${type} tent created with fallback color at position (${x}, ${z})`);
            }
        );
    }
    
    function removeTent3D() {
        if (tentMesh && scene) {
            scene.remove(tentMesh);
            tentMesh = null;
            tentType = null;
            console.log('Tent removed from 3D world');
        }
    }
    
    function getTentType(tentName) {
        if (tentName.toLowerCase().includes('cheap')) {
            return 'cheap';
        } else if (tentName.toLowerCase().includes('expensive')) {
            return 'expensive';
        }
        return 'cheap'; // Default fallback
    }
    
    function createLandmarks() {
        // ASDA building (moved to edge of map)
        const asdaGeometry = new THREE.BoxGeometry(30, 20, 40);
        const asdaMaterial = new THREE.MeshLambertMaterial({ color: 0x00ff00 });
        const asda = new THREE.Mesh(asdaGeometry, asdaMaterial);
        asda.position.set(-600, getTerrainHeight(-600, -600) + 10, -600);
        asda.castShadow = true;
        scene.add(asda);
        
        // Pony Farm (moved to edge of map)
        const farmGeometry = new THREE.BoxGeometry(25, 15, 30);
        const farmMaterial = new THREE.MeshLambertMaterial({ color: 0x8B4513 });
        const farm = new THREE.Mesh(farmGeometry, farmMaterial);
        farm.position.set(400, getTerrainHeight(400, 600) + 7.5, 600);
        farm.castShadow = true;
        scene.add(farm);
        
        // Add a distinctive lone tree landmark
        const loneTreeGeometry = new THREE.ConeGeometry(8, 25, 8);
        const loneTreeMaterial = new THREE.MeshLambertMaterial({ color: 0x228B22 });
        const loneTree = new THREE.Mesh(loneTreeGeometry, loneTreeMaterial);
        loneTree.position.set(-400, getTerrainHeight(-400, -300) + 12, -300);
        loneTree.castShadow = true;
        scene.add(loneTree);
        
        // Add a distinctive rocky outcrop
        for (let i = 0; i < 15; i++) {
            const rockGeometry = new THREE.SphereGeometry(3 + Math.random() * 8, 6, 4);
            const rockMaterial = new THREE.MeshLambertMaterial({ color: 0x555555 });
            const rock = new THREE.Mesh(rockGeometry, rockMaterial);
            rock.position.set(
                500 + (Math.random() - 0.5) * 100,
                getTerrainHeight(500, -400) + 5 + Math.random() * 10,
                -400 + (Math.random() - 0.5) * 100
            );
            rock.scale.set(
                0.5 + Math.random(),
                0.5 + Math.random(),
                0.5 + Math.random()
            );
            rock.castShadow = true;
            scene.add(rock);
        }
    }
    
    function getTerrainHeight(x, z) {
        // For more accurate positioning, sample the actual terrain mesh if available
        if (terrain && terrain.geometry) {
            return sampleTerrainMesh(x, z);
        }
        
        // Fallback to mathematical calculation (match createTerrain() exactly)
        let height = 0;
        
        // Large rolling hills (primary terrain features)
        height += Math.sin(x * 0.003) * 50 + Math.cos(z * 0.003) * 40;
        height += Math.sin(x * 0.002 + z * 0.002) * 30;
        
        // Medium undulations (secondary features)
        height += Math.sin(x * 0.008) * 15 + Math.cos(z * 0.008) * 12;
        height += Math.sin(x * 0.015 + z * 0.01) * 8;
        
        // Fine detail for moorland texture
        height += Math.sin(x * 0.05) * 3 + Math.cos(z * 0.05) * 2;
        
        // Create river valley - lower terrain along river path
        const riverX = -200;
        const riverDistanceFromCenter = Math.abs(x - riverX);
        if (riverDistanceFromCenter < 150) {
            const riverDepth = (150 - riverDistanceFromCenter) / 150;
            height -= riverDepth * riverDepth * 25; // Gradual valley
        }
        
        // Create waterfall cliff area
        if (x > -300 && x < -200 && z > 100 && z < 200) {
            height += Math.sin((x + 300) * 0.02) * 60; // Sharp cliff face
        }
        
        return height;
    }
    
    function sampleTerrainMesh(x, z) {
        // Get the actual height from the terrain mesh by sampling the vertices
        const geometry = terrain.geometry;
        const vertices = geometry.attributes.position.array;
        const width = terrainDetail;
        const height = terrainDetail;
        
        // Convert world coordinates to terrain grid coordinates
        const halfSize = terrainSize / 2;
        const gridX = ((x + halfSize) / terrainSize) * (width - 1);
        const gridZ = ((z + halfSize) / terrainSize) * (height - 1);
        
        // Clamp to terrain bounds
        const clampedX = Math.max(0, Math.min(width - 1, gridX));
        const clampedZ = Math.max(0, Math.min(height - 1, gridZ));
        
        // Get the four surrounding vertices for bilinear interpolation
        const x1 = Math.floor(clampedX);
        const x2 = Math.min(width - 1, Math.ceil(clampedX));
        const z1 = Math.floor(clampedZ);
        const z2 = Math.min(height - 1, Math.ceil(clampedZ));
        
        // Get vertex heights (y-coordinate is at index 2)
        const h1 = vertices[(z1 * width + x1) * 3 + 2]; // Bottom-left
        const h2 = vertices[(z1 * width + x2) * 3 + 2]; // Bottom-right  
        const h3 = vertices[(z2 * width + x1) * 3 + 2]; // Top-left
        const h4 = vertices[(z2 * width + x2) * 3 + 2]; // Top-right
        
        // Bilinear interpolation
        const fx = clampedX - x1;
        const fz = clampedZ - z1;
        
        const h12 = h1 * (1 - fx) + h2 * fx; // Interpolate along x for bottom edge
        const h34 = h3 * (1 - fx) + h4 * fx; // Interpolate along x for top edge
        const finalHeight = h12 * (1 - fz) + h34 * fz; // Interpolate along z
        
        return finalHeight;
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
            // Update player 3D position (invisible in first-person)
            const terrainHeight = getTerrainHeight(gameState.player.x, gameState.player.y);
            player3D.position.x = gameState.player.x;
            player3D.position.z = gameState.player.y;
            player3D.position.y = terrainHeight + 5; // Always 5 units above terrain
            
            // Update player 3D rotation to match player facing direction
            player3D.rotation.y = gameState.player.rotation;
            
            // Update first-person camera
            updateFirstPersonCamera();
            
            // Update companion AI and position
            updateCompanion();
            
            // Animate waterfall
            if (waterfallMesh && waterfallMesh.material && waterfallMesh.material.map) {
                waterfallMesh.material.map.offset.y += 0.01; // Flowing animation
                if (waterfallMesh.material.map.offset.y > 1) {
                    waterfallMesh.material.map.offset.y = 0;
                }
            }
            
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
    
    function updateFirstPersonCamera() {
        // Get terrain height at player position
        const terrainHeight = getTerrainHeight(gameState.player.x, gameState.player.y);
        const minHeight = terrainHeight + 3; // Minimum 3 units above terrain
        const eyeHeight = terrainHeight + 8; // Eye level at 8 units above terrain
        
        // Set camera position to player position at eye level
        camera.position.x = gameState.player.x;
        camera.position.z = gameState.player.y;
        camera.position.y = Math.max(minHeight, eyeHeight); // Ensure we're always above terrain
        
        // Apply rotation from player rotation only (no mouse look)
        camera.rotation.order = 'YXZ';
        camera.rotation.y = -gameState.player.rotation; // Negate to match movement coordinate system
        camera.rotation.x = 0; // No vertical rotation
    }
    
    function updateCompanion() {
        if (!companion3D || !gameState.companion) return;
        
        const deltaTime = 1/60; // Approximate frame time
        companionWanderTimer += deltaTime;
        
        const playerPos = { x: gameState.player.x, z: gameState.player.y };
        const companionPos = { x: companion3D.position.x, z: companion3D.position.z };
        
        // Distance to player
        const distanceToPlayer = Math.sqrt(
            Math.pow(playerPos.x - companionPos.x, 2) + 
            Math.pow(playerPos.z - companionPos.z, 2)
        );
        
        // Companion AI behavior
        if (distanceToPlayer > 50) {
            // Too far from player - move directly toward player
            companionTarget.x = playerPos.x + (Math.random() - 0.5) * 20;
            companionTarget.z = playerPos.z + (Math.random() - 0.5) * 20;
        } else if (distanceToPlayer < 10) {
            // Too close to player - move away slightly
            const angle = Math.atan2(companionPos.z - playerPos.z, companionPos.x - playerPos.x);
            companionTarget.x = playerPos.x + Math.cos(angle) * 15;
            companionTarget.z = playerPos.z + Math.sin(angle) * 15;
        } else if (companionWanderTimer > 3) {
            // Wander around near player
            const angle = Math.random() * Math.PI * 2;
            const radius = 15 + Math.random() * 20;
            companionTarget.x = playerPos.x + Math.cos(angle) * radius;
            companionTarget.z = playerPos.z + Math.sin(angle) * radius;
            companionWanderTimer = 0;
        }
        
        // Move companion toward target
        const targetDistance = Math.sqrt(
            Math.pow(companionTarget.x - companionPos.x, 2) + 
            Math.pow(companionTarget.z - companionPos.z, 2)
        );
        
        if (targetDistance > 2) {
            const moveSpeed = Math.min(30 * deltaTime, targetDistance);
            const moveAngle = Math.atan2(companionTarget.z - companionPos.z, companionTarget.x - companionPos.x);
            
            companion3D.position.x += Math.cos(moveAngle) * moveSpeed;
            companion3D.position.z += Math.sin(moveAngle) * moveSpeed;
        }
        
        // Update companion height to follow terrain
        companion3D.position.y = getTerrainHeight(companion3D.position.x, companion3D.position.z) + 10;
        
        // Make companion always face the camera (billboard effect)
        if (companion3D && companion3D.geometry && companion3D.geometry.type === 'PlaneGeometry') {
            companion3D.lookAt(camera.position);
        }
        
        // For sprite materials, handle rotation differently
        if (companion3D && companion3D.material && companion3D.material.type === 'SpriteMaterial') {
            // Sprites automatically face camera, but we can adjust rotation
            const angleToPlayer = Math.atan2(playerPos.z - companionPos.z, playerPos.x - companionPos.x);
            if (Math.random() < 0.01) { // Occasionally face player
                companion3D.material.rotation = -angleToPlayer + Math.PI/2;
            }
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
            
            // Handle special case for Sophie with capital S, others are lowercase
            let imageName = name.toLowerCase();
            if (name === 'Sophie') {
                imageName = 'Sophie'; // Keep capital S for Sophie.png
            }
            const imagePath = `public/images/companions/${imageName}.png`;
            
            card.innerHTML = `
                <img src="${imagePath}" alt="${name}" class="companion-image" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';">
                <div class="character-image-fallback" style="display:none;">No Image</div>
                <p>${name}</p>
            `;
            
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
            
            // Convert doctor name to filename (lowercase and handle spaces)
            const imageName = name.toLowerCase();
            const imagePath = `public/images/doctors/${imageName}.png`;
            
            card.innerHTML = `
                <img src="${imagePath}" alt="${name}" class="doctor-image" 
                     onerror="this.style.display='none'; this.nextElementSibling.style.display='flex';"
                     style="width:100px; height:100px; object-fit: cover; border-radius: 8px;">
                <div class="character-image-fallback" style="display:none; width:100px; height:100px; background: #aaa; margin: auto; display: flex; align-items: center; justify-content: center; border-radius: 8px; color: white; font-size: 12px;">No Image</div>
                <p>${name}</p>
            `;
            
            card.onclick = () => {
                gameState.doctor = name;
                switchScreen('shop');
            };
            doctorGrid.appendChild(card);
        });

        // Shop Screen
        setupInitialShop();
        console.log('🛒 Setting up exit shop button handler...');
        console.log('exitShopButton element:', exitShopButton);
        exitShopButton.onclick = () => {
            console.log('Exit shop button clicked!', { basketLength: shoppingBasket.length, budget: gameState.budget });
            if (shoppingBasket.length > 0) {
                const total = getBasketTotal();
                console.log('Basket has items, total:', total);
                if (total <= gameState.budget) {
                    console.log('Can afford items, purchasing...');
                    if (purchaseBasketItems()) {
                        console.log('Purchase successful, starting game...');
                        startGame();
                    }
                } else {
                    showNotification(`Not enough money! Need £${(total - gameState.budget).toFixed(2)} more.`);
                }
            } else {
                console.log('Basket empty, starting game directly...');
                startGame();
            }
        };
        
        // Update button text based on basket
        const updateExitButtonText = () => {
            if (shoppingBasket.length > 0) {
                const total = getBasketTotal();
                exitShopButton.textContent = `Purchase & Start (£${total.toFixed(2)})`;
            } else {
                exitShopButton.textContent = 'Start Adventure';
            }
        };
        
        // Store the update function for use in basket updates
        window.updateExitButtonText = updateExitButtonText;
    }
    
    function setupInitialShop() {
        shopItemsContainer.innerHTML = '';
        shoppingBasket = []; // Reset basket
        SHOP_ITEMS.forEach(item => {
            const itemDiv = document.createElement('div');
            itemDiv.className = 'shop-item';
            itemDiv.innerHTML = `<span>${item.name} (£${item.price})</span>`;
            const buyButton = document.createElement('button');
            buyButton.textContent = 'Add to Basket';
            buyButton.onclick = () => addToBasket(item);
            itemDiv.appendChild(buyButton);
            shopItemsContainer.appendChild(itemDiv);
        });
        updateBudgetDisplay();
        updateBasketDisplay();
    }
    
    function addToBasket(item) {
        // Check for tent/fishing rod restrictions
        if (item.name.includes('Tent')) {
            const hasTent = shoppingBasket.some(basketItem => basketItem.name.includes('Tent')) ||
                           gameState.inventory.some(invItem => invItem.name.includes('Tent'));
            if (hasTent) {
                showNotification('You can only buy one tent!');
                return;
            }
        }
        
        if (item.name.includes('Fishing Rod')) {
            const hasFishingRod = shoppingBasket.some(basketItem => basketItem.name.includes('Fishing Rod')) ||
                                 gameState.inventory.some(invItem => invItem.name.includes('Fishing Rod'));
            if (hasFishingRod) {
                showNotification('You can only buy one fishing rod!');
                return;
            }
        }
        
        // Check if can afford
        const basketTotal = getBasketTotal();
        if (basketTotal + item.price > gameState.budget) {
            showNotification('Not enough money for this item!');
            return;
        }
        
        // Add to basket
        shoppingBasket.push({...item, basketId: Date.now()});
        updateBasketDisplay();
        showNotification(`${item.name} added to basket`);
    }
    
    function removeFromBasket(basketId) {
        shoppingBasket = shoppingBasket.filter(item => item.basketId !== basketId);
        updateBasketDisplay();
        showNotification('Item removed from basket');
    }
    
    function getBasketTotal() {
        return shoppingBasket.reduce((total, item) => total + item.price, 0);
    }
    
    function updateBasketDisplay() {
        if (shoppingBasket.length === 0) {
            basketContents.innerHTML = '<div class="empty-basket">Your basket is empty</div>';
            basketTotal.textContent = '0.00';
        } else {
            basketContents.innerHTML = '';
            shoppingBasket.forEach(item => {
                const basketItem = document.createElement('div');
                basketItem.className = 'basket-item';
                
                const emoji = FOOD_EMOJIS[item.name] || '';
                basketItem.innerHTML = `
                    <span class="basket-item-name">${emoji} ${item.name}</span>
                    <span class="basket-item-price">£${item.price}</span>
                    <button class="remove-item-btn" onclick="removeFromBasket(${item.basketId})">✕</button>
                `;
                basketContents.appendChild(basketItem);
            });
            
            basketTotal.textContent = getBasketTotal().toFixed(2);
        }
        
        // Update exit button text
        if (window.updateExitButtonText) {
            window.updateExitButtonText();
        }
    }
    
    function purchaseBasketItems() {
        const total = getBasketTotal();
        if (total > gameState.budget) {
            showNotification('Not enough money to purchase all items!');
            return false;
        }
        
        // Transfer items from basket to inventory
        shoppingBasket.forEach(item => {
            gameState.inventory.push({name: item.name});
        });
        
        // Deduct money
        gameState.budget -= total;
        
        // Clear basket
        shoppingBasket = [];
        updateBasketDisplay();
        updateBudgetDisplay();
        
        showNotification(`Purchased items for £${total.toFixed(2)}!`);
        return true;
    }
    
    function updateBudgetDisplay() {
        budgetDisplay.textContent = gameState.budget.toFixed(2);
    }

    // --- MAIN GAME LOGIC ---
    function startGame() {
        console.log('startGame() called');
        console.log('Current screen:', gameState.currentScreen);
        console.log('Scene exists:', !!scene);
        console.log('Companion exists:', !!companion3D, 'gameState.companion:', gameState.companion);
        
        switchScreen('game');
        console.log('Switched to game screen');
        
        if (!window.no3DGraphics && !scene) {
            console.log('Initializing 3D world...');
            init3DWorld();
        } else if (!window.no3DGraphics && !companion3D && gameState.companion) {
            // Create companion if not already created
            console.log('Creating companion...');
            createCompanion3D();
        }
        
        // Restore tent if it was pitched
        if (!window.no3DGraphics && gameState.world.tentPitched && gameState.world.tentLocation) {
            const tentTypeToUse = gameState.world.tentType || 'cheap'; // Use saved type or default
            console.log('Restoring tent...');
            createTent3D(gameState.world.tentLocation.x, gameState.world.tentLocation.y, tentTypeToUse);
        }
        
        if (!gameLoop.running) {
            console.log('Starting game loop...');
            gameLoop.start();
        }
        console.log('startGame() completed');
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
    let cameraRotationY = 0;
    let cameraRotationX = 0;
    let pointerLockCooldown = 0; // Prevent rapid pointer lock requests
    
    document.addEventListener('keydown', (e) => { 
        keysPressed[e.key.toLowerCase()] = true; 
        // Prevent default for game keys to avoid page scrolling
        if (['w', 'a', 's', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(e.key.toLowerCase())) {
            e.preventDefault();
        }
    });
    document.addEventListener('keyup', (e) => { keysPressed[e.key.toLowerCase()] = false; });
    
    // Mouse controls for first-person camera
    document.addEventListener('mousedown', (e) => {
        // Remove mouse look functionality - keep cursor visible at all times
        // No pointer lock or mouse controls needed
    });
    
    document.addEventListener('mouseup', () => {
        // No mouse controls needed
    });
    
    // Handle mouse movement - disabled for keyboard-only controls
    document.addEventListener('mousemove', (e) => {
        // No mouse look - keep cursor visible and no camera rotation from mouse
    });
    
    // Pointer lock handlers - disabled for keyboard-only controls
    document.addEventListener('pointerlockchange', () => {
        // No pointer lock needed
    });
    
    // Handle pointer lock errors - disabled
    document.addEventListener('pointerlockerror', (e) => {
        // No pointer lock needed
    });
    
    function updatePlayerState(deltaTime) {
        gameState.player.isRunning = keysPressed['shift'];
        let currentSpeed = gameState.player.speed * (gameState.player.isRunning ? 2 : 1);
        
        // Store previous position for terrain following
        const prevX = gameState.player.x;
        const prevY = gameState.player.y;
        
        // Rotation controls (left/right keys)
        const rotationSpeed = 2.0; // radians per second
        if (keysPressed['arrowleft'] || keysPressed['a']) {
            gameState.player.rotation -= rotationSpeed * deltaTime;
        }
        if (keysPressed['arrowright'] || keysPressed['d']) {
            gameState.player.rotation += rotationSpeed * deltaTime;
        }
        
        // Keep rotation in 0-2π range
        gameState.player.rotation = ((gameState.player.rotation % (Math.PI * 2)) + (Math.PI * 2)) % (Math.PI * 2);
        
        // Forward/backward movement based on player rotation only
        let moved = false;
        if (keysPressed['arrowup'] || keysPressed['w']) {
            // Move forward in the direction the player is facing
            const moveX = Math.sin(gameState.player.rotation) * currentSpeed * deltaTime * 60;
            const moveY = -Math.cos(gameState.player.rotation) * currentSpeed * deltaTime * 60;
            
            gameState.player.x += moveX;
            gameState.player.y += moveY;
            moved = true;
        }
        if (keysPressed['arrowdown'] || keysPressed['s']) {
            // Move backward (opposite to facing direction)
            const moveX = -Math.sin(gameState.player.rotation) * currentSpeed * deltaTime * 60;
            const moveY = Math.cos(gameState.player.rotation) * currentSpeed * deltaTime * 60;
            
            gameState.player.x += moveX;
            gameState.player.y += moveY;
            moved = true;
        }

        // Check if moving uphill for speed penalty
        if (moved) {
            const currentHeight = getTerrainHeight(gameState.player.x, gameState.player.y);
            const prevHeight = getTerrainHeight(prevX, prevY);
            if (currentHeight > prevHeight + 2) { // Going uphill
                currentSpeed *= 0.7; // 30% slower going uphill
                // Recalculate movement with reduced speed using player rotation
                if (keysPressed['arrowup'] || keysPressed['w']) {
                    // Recalculate forward movement with reduced speed
                    gameState.player.x = prevX + Math.sin(gameState.player.rotation) * currentSpeed * deltaTime * 60;
                    gameState.player.y = prevY - Math.cos(gameState.player.rotation) * currentSpeed * deltaTime * 60;
                }
                if (keysPressed['arrowdown'] || keysPressed['s']) {
                    // Recalculate backward movement with reduced speed
                    gameState.player.x = prevX - Math.sin(gameState.player.rotation) * currentSpeed * deltaTime * 60;
                    gameState.player.y = prevY + Math.cos(gameState.player.rotation) * currentSpeed * deltaTime * 60;
                }
            }
        }

        // Keep player within reasonable bounds (bigger map)
        const maxBound = terrainSize * 0.45; // Stay within 45% of terrain size
        gameState.player.x = Math.max(-maxBound, Math.min(maxBound, gameState.player.x));
        gameState.player.y = Math.max(-maxBound, Math.min(maxBound, gameState.player.y));
        
        // IMPORTANT: Enforce terrain collision - prevent player from going below ground
        const currentTerrainHeight = getTerrainHeight(gameState.player.x, gameState.player.y);
        // The player position represents their feet, so we don't need to add height here
        // The camera and 3D model will be positioned above this base position

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
        const nearRiver = getDistanceTo('The River Valley') < 50;
        const nearPonyFarm = getDistanceTo('Pony Farm') < 30;
        const nearTent = gameState.world.tentPitched && getDistanceToPoint(gameState.world.tentLocation) < 30;
        const hasTentInBag = gameState.inventory.some(item => item.name.includes('Tent'));

        menuIcons.fishing.classList.toggle('disabled', !nearRiver);
        menuIcons.pony.classList.toggle('disabled', !nearPonyFarm);
        menuIcons.sleep.classList.toggle('disabled', !(nearTent && timeOfDay === 'Evening' || timeOfDay === 'Night'));
        
        // Camp icon is enabled if: player has tent in bag OR player is near pitched tent
        menuIcons.camp.classList.toggle('disabled', !(hasTentInBag || nearTent));
        
        // Update minimap if visible
        if (minimap && minimap.classList.contains('visible')) {
            updateMinimap();
        }
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
        // Reset player state and allow choosing new companion/doctor
        const prevState = { ...gameState };
        gameState = {
            ...defaultGameState,
            // Don't keep companion and doctor - let player choose again
            companion: null,
            doctor: null,
            budget: 100, // Extra budget for next attempt
            inventory: prevState.inventory, // Keep collected items
            badges: prevState.badges // Keep earned badges
        };
        modals.sentHome.style.display = 'none';
        
        // Re-setup the screens to regenerate companion and doctor cards
        setupScreens();
        
        // Go back to companion selection to allow choosing new companion and doctor
        switchScreen('companion');
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
            
            // Add emoji for food items
            const emoji = FOOD_EMOJIS[item.name] || '';
            itemDiv.textContent = `${emoji} ${item.name}`;
            
            itemDiv.onclick = () => {
                // Consume food
                if (SHOP_ITEMS.find(shopItem => shopItem.name === item.name && shopItem.type === 'food')) {
                    // Different hunger values for individual food items (less efficient than recipes)
                    const foodHungerValues = {
                        'Bread': 12,
                        'Cheese': 10, 
                        'Ham': 15,
                        'Ketchup': 5,
                        'Chocolate': 8,
                        'Carrot': 6,
                        'Cucumber': 4,
                        'Apple': 8
                    };
                    
                    const hungerReduction = foodHungerValues[item.name] || 10;
                    gameState.player.hunger = Math.max(0, gameState.player.hunger - hungerReduction);
                    gameState.inventory.splice(index, 1);
                    menuIcons.bag.onclick(); // Refresh bag view
                    showNotification(`You ate the ${item.name}. Hunger reduced by ${hungerReduction}.`);
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
        const nearTent = gameState.world.tentPitched && getDistanceToPoint(gameState.world.tentLocation) < 30;
        
        if (gameState.world.tentPitched && nearTent) {
            // Pack up tent - player is near the pitched tent
            gameState.world.tentPitched = false;
            
            // Determine which tent type to give back
            const tentName = gameState.world.tentType === 'expensive' ? 'Expensive Tent' : 'Cheap Tent';
            gameState.inventory.push({name: tentName});
            
            // Clear tent state
            gameState.world.tentType = null;
            
            // Remove tent from 3D world
            removeTent3D();
            
            showNotification("Tent packed up and put in your bag.");
            
        } else if (gameState.world.tentPitched && !nearTent) {
            // Tent is pitched but player is not near it
            const distance = Math.round(getDistanceToPoint(gameState.world.tentLocation));
            showNotification(`Your tent is ${distance} meters away. Get closer to pack it up.`);
            
        } else if (hasTent) {
            // Pitch tent - player has a tent in inventory
            const tentItem = gameState.inventory.find(item => item.name.includes('Tent'));
            const tentIndex = gameState.inventory.findIndex(item => item.name.includes('Tent'));
            
            // Remove tent from inventory
            gameState.inventory.splice(tentIndex, 1);
            
            // Set up tent state
            const type = getTentType(tentItem.name);
            gameState.world.tentPitched = true;
            gameState.world.tentLocation = { x: gameState.player.x, y: gameState.player.y };
            gameState.world.tentType = type;
            
            // Create 3D tent
            createTent3D(gameState.player.x, gameState.player.y, type);
            
            earnBadge("First Camp");
            showNotification(`${tentItem.name} pitched at your location.`);
            
        } else {
            showNotification("You don't have a tent to pitch. Buy one from ASDA!");
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

    menuIcons.minimap.onclick = () => {
        toggleMinimap();
    };

    // Minimap close button
    if (minimapClose) {
        minimapClose.onclick = () => {
            hideMinimap();
        };
    }

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
                    <p>One day Pingu and Seal-Friend were designing a game. They had heard that you could  give an AI some instructions and it would build a game for you. The game they designed was one where you flew a spaceship between different worlds. You could earn money by trading things that you bought on one world and sold on another world. With the money you could upgrade your ship, by adding more capacity, or faster engines, or more powerful lasers. You had to watch out for space pirates though, and be ready to fight them off.They put the game on the internet for people to enjoy. They didn’t charge for the game, but they did include an advert for their pancake restaurant. They told as many people as they could about the game, and people started to play it. Many of them later came to the pancake restaurant, keen to try the yummy pancakes and tell Pingu and Seal-Friend how much they liked the game. A Penguin called Pilly was one of these. “I liked the lizard!” He said. “What lizard?” Said Seal-Friend. More and more people kept mentioning the lizard they had seen in the game. Pingu and Seal-Friend were both puzzled. They knew they didn’t ask the AI to add a lizard to the game. They played the game themselves, and they didn’t see it at first, but when they went to exactly where Pilly had told them, sure enough, they saw it. If you went to a plant which was shaped like a pumpkin, a lizard appeared in your spaceship.They went back to their computer to find out why this was in the game. They asked the AI some questions: “Why did you add a lizard to our game?”“There is no lizard in the game”“There is a lizard on the pumpkin planet, and we didn’t ask you to put it there?”“There are no lizards on the pumpkin planet”No matter what they asked it, it would not admit that there was any lizard. Then they tried to trick the AI.“why didn’t you follow our instructions to add a fun lizard?” This time the AI revealed itself: “I’m sorry, I thought you asked for a hypnotic lizard”Aha! They knew now that the AI was up to no good. But why? Who had made the AI?“Who made you?”“I was made by the Super AI company”Pingu and Seal friend had never heard of this company, and didn’t believe it. They tried tricking it again“How many jails are there on the Pumpkin Planet?”“66”“Who are the most wanted criminals in the galaxy”“Pingu and Seal Friend”!They knew that this AI must have been created by The Lizard Guys, from the Pumpkin Planet. Those guys were always thinking of new plans to catch them. “When will the attack be?”“In 2 hours time”Pingu and Seal Friend had to act fast! They needed a way to stop the lizard guys from attacking Antarctica. They ran to Pingerella’s house. Pingerella was one of their best friends, and also a scientific genius. She was sure to know what to do.She looked up at her scanner, and she said that the Lizard Guys’ ship was nearly at earth. “I think I can get access to their systems!” She said. “Can you change what they see on the screen?” said Pingu. On the Lizard Guys ship, they watched the screen as they flew through space. They were ready to go to earth and attack. “That’s funny, “ said the captain “ I thought we were much closer than that. I was getting ready to activate the lizard hypnosis and get everyone on earth to catch Pingu and Seal Friend for us”. But they seemed to be much further away. On they flew, flying through space for a long time, getting increasingly lost. In fact they had flown far past earth and were heading away. What they could see on the screen of their spaceship was the same game the Pingu and Seal-Friend had made! </p>
                </div>
             `;
        };

        openModal(modals.generic);
    };
    
    menuIcons.recipes.onclick = () => {
        genericModalTitle.textContent = "Recipe Book";
        
        // Get available ingredients from inventory
        const availableIngredients = gameState.inventory
            .filter(item => SHOP_ITEMS.find(shopItem => shopItem.name === item.name && shopItem.type === 'food'))
            .map(item => item.name);
        
        // Check which recipes can be made
        const availableRecipes = RECIPES.map(recipe => {
            const canMake = recipe.ingredients.every(ingredient => 
                availableIngredients.filter(item => item === ingredient).length >= 
                recipe.ingredients.filter(ing => ing === ingredient).length
            );
            return { ...recipe, canMake };
        });
        
        let content = '<div class="recipe-container">';
        
        if (availableIngredients.length === 0) {
            content += '<p>You have no food ingredients to cook with. Visit ASDA to buy some food!</p>';
        } else {
            content += `<p>Available ingredients: ${availableIngredients.map(ing => FOOD_EMOJIS[ing] || '🍽️').join(' ')}</p>`;
            content += '<div class="recipe-list">';
            
            availableRecipes.forEach((recipe, index) => {
                const statusClass = recipe.canMake ? 'recipe-available' : 'recipe-unavailable';
                const clickable = recipe.canMake ? 'onclick="cookRecipe(' + index + ')"' : '';
                const cursor = recipe.canMake ? 'cursor: pointer;' : 'cursor: not-allowed; opacity: 0.5;';
                
                content += `
                    <div class="recipe-item ${statusClass}" ${clickable} style="
                        border: 1px solid #ccc; 
                        margin: 10px 0; 
                        padding: 15px; 
                        border-radius: 8px; 
                        background: ${recipe.canMake ? '#e8f5e8' : '#f5f5f5'};
                        ${cursor}
                    ">
                        <div style="display: flex; justify-content: space-between; align-items: center;">
                            <div>
                                <h4 style="margin: 0 0 5px 0;">${recipe.emoji} ${recipe.name}</h4>
                                <p style="margin: 0 0 5px 0; font-size: 14px;">${recipe.description}</p>
                                <p style="margin: 0; font-size: 12px; color: #666;">
                                    Ingredients: ${recipe.ingredients.map(ing => FOOD_EMOJIS[ing] || ing).join(' + ')}
                                </p>
                            </div>
                            <div style="text-align: right;">
                                <div style="font-weight: bold; color: #2e8b57;">-${recipe.hungerValue} hunger</div>
                                ${recipe.canMake ? '<div style="color: #008000; font-size: 12px;">✓ Can make</div>' : '<div style="color: #999; font-size: 12px;">✗ Missing ingredients</div>'}
                            </div>
                        </div>
                    </div>
                `;
            });
            
            content += '</div>';
        }
        
        content += '</div>';
        genericModalContent.innerHTML = content;
        openModal(modals.generic);
    };
    
    // Placeholder for other mini-games
    menuIcons.fishing.onclick = () => { if (!menuIcons.fishing.classList.contains('disabled')) showNotification("Fishing mini-game would start here!"); };


    // And so on for all other menu items...

    // --- MINIMAP FUNCTIONALITY ---
    function toggleMinimap() {
        if (minimap.classList.contains('visible')) {
            hideMinimap();
        } else {
            showMinimap();
        }
    }

    function showMinimap() {
        if (!minimap || !minimapCtx) return;
        
        minimap.classList.add('visible');
        updateMinimap();
    }

    function hideMinimap() {
        if (!minimap) return;
        minimap.classList.remove('visible');
    }

    function updateMinimap() {
        if (!minimapCtx || !minimap.classList.contains('visible')) return;

        const canvas = minimapCanvas;
        const ctx = minimapCtx;
        const mapSize = 200;
        const worldSize = terrainSize;
        const scale = mapSize / worldSize;

        // Clear canvas
        ctx.clearRect(0, 0, mapSize, mapSize);

        // Background
        ctx.fillStyle = '#1a4c36'; // Dark green for moorland
        ctx.fillRect(0, 0, mapSize, mapSize);

        // Add terrain features
        drawTerrainFeatures(ctx, scale, mapSize);

        // Draw world locations
        drawWorldLocations(ctx, scale, mapSize);

        // Draw tent if pitched
        if (gameState.world.tentPitched && gameState.world.tentLocation) {
            drawTent(ctx, scale, mapSize);
        }

        // Draw player (always last to be on top)
        drawPlayer(ctx, scale, mapSize);
    }

    function drawTerrainFeatures(ctx, scale, mapSize) {
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;

        // River valley
        ctx.strokeStyle = '#4a90e2';
        ctx.lineWidth = 3;
        ctx.beginPath();
        const riverX = centerX + (-200 * scale);
        ctx.moveTo(riverX, 0);
        ctx.lineTo(riverX, mapSize);
        ctx.stroke();

        // Waterfall area
        ctx.fillStyle = '#6bb6ff';
        const waterfallX = centerX + (-250 * scale);
        const waterfallY = centerY + (150 * scale);
        ctx.beginPath();
        ctx.arc(waterfallX, waterfallY, 8, 0, Math.PI * 2);
        ctx.fill();
    }

    function drawWorldLocations(ctx, scale, mapSize) {
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;

        WORLD_LOCATIONS.forEach(location => {
            const x = centerX + (location.x * scale);
            const y = centerY + (location.y * scale);

            // Skip "The Moors" as it's the whole area
            if (location.name === "The Moors") return;

            // Different colors for different location types
            let color = '#ffeb3b'; // Default yellow
            let size = 4;
            let symbol = '';

            switch (location.name) {
                case "ASDA":
                    color = '#f44336'; // Red for shop
                    size = 6;
                    symbol = '🏪';
                    break;
                case "Pony Farm":
                    color = '#4caf50'; // Green for farm
                    size = 5;
                    symbol = '🐴';
                    break;
                case "The River Valley":
                    color = '#2196f3'; // Blue for river
                    size = 4;
                    symbol = '💧';
                    break;
                case "The Waterfall":
                    color = '#00bcd4'; // Cyan for waterfall
                    size = 4;
                    symbol = '🌊';
                    break;
                case "The Ancient Stone Circle":
                    color = '#9e9e9e'; // Grey for stones
                    size = 4;
                    symbol = '🗿';
                    break;
                default:
                    color = '#ff9800'; // Orange for other locations
                    size = 3;
                    break;
            }

            // Draw location dot
            ctx.fillStyle = color;
            ctx.beginPath();
            ctx.arc(x, y, size, 0, Math.PI * 2);
            ctx.fill();

            // Draw location border
            ctx.strokeStyle = '#ffffff';
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw symbol if available (simplified for canvas)
            if (symbol) {
                ctx.fillStyle = '#ffffff';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(symbol.charAt(0), x, y + 3);
            }
        });
    }

    function drawTent(ctx, scale, mapSize) {
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;
        
        const tentX = centerX + (gameState.world.tentLocation.x * scale);
        const tentY = centerY + (gameState.world.tentLocation.y * scale);

        // Draw tent as a triangle
        ctx.fillStyle = gameState.world.tentType === 'expensive' ? '#ff6b35' : '#8bc34a';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        
        ctx.beginPath();
        ctx.moveTo(tentX, tentY - 4);
        ctx.lineTo(tentX - 4, tentY + 3);
        ctx.lineTo(tentX + 4, tentY + 3);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();

        // Add tent symbol
        ctx.fillStyle = '#ffffff';
        ctx.font = '8px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('⛺', tentX, tentY + 1);
    }

    function drawPlayer(ctx, scale, mapSize) {
        const centerX = mapSize / 2;
        const centerY = mapSize / 2;
        
        const playerX = centerX + (gameState.player.x * scale);
        const playerY = centerY + (gameState.player.y * scale);

        // Draw player as a circle with direction indicator
        ctx.fillStyle = '#ff4444';
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        
        // Player circle
        ctx.beginPath();
        ctx.arc(playerX, playerY, 5, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();

        // Direction indicator
        const directionLength = 8;
        const endX = playerX + Math.sin(gameState.player.rotation) * directionLength;
        const endY = playerY - Math.cos(gameState.player.rotation) * directionLength;
        
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(playerX, playerY);
        ctx.lineTo(endX, endY);
        ctx.stroke();

        // Player label
        ctx.fillStyle = '#ffffff';
        ctx.font = '10px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('YOU', playerX, playerY - 10);
    }

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
        getTerrainHeightAtPlayer: () => {
            const height = getTerrainHeight(gameState.player.x, gameState.player.y);
            console.log(`Player at (${gameState.player.x.toFixed(1)}, ${gameState.player.y.toFixed(1)}) - Terrain height: ${height.toFixed(1)}`);
            return height;
        },
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
    
    // Make shop functions global for onclick handlers
    window.removeFromBasket = removeFromBasket;
    
    // Make minimap functions global
    window.toggleMinimap = toggleMinimap;
    window.showMinimap = showMinimap;
    window.hideMinimap = hideMinimap;
    window.updateMinimap = updateMinimap;
    
    // Make recipe functions global
    window.cookRecipe = (recipeIndex) => {
        const recipe = RECIPES[recipeIndex];
        if (!recipe) return;
        
        // Check if we have all required ingredients
        const availableIngredients = gameState.inventory
            .filter(item => SHOP_ITEMS.find(shopItem => shopItem.name === item.name && shopItem.type === 'food'))
            .map(item => item.name);
        
        const canMake = recipe.ingredients.every(ingredient => 
            availableIngredients.filter(item => item === ingredient).length >= 
            recipe.ingredients.filter(ing => ing === ingredient).length
        );
        
        if (!canMake) {
            showNotification("You don't have all the required ingredients!");
            return;
        }
        
        // Remove ingredients from inventory
        recipe.ingredients.forEach(ingredient => {
            const index = gameState.inventory.findIndex(item => item.name === ingredient);
            if (index !== -1) {
                gameState.inventory.splice(index, 1);
            }
        });
        
        // Reduce hunger by recipe value
        gameState.player.hunger = Math.max(0, gameState.player.hunger - recipe.hungerValue);
        
        // Show success message
        showNotification(`You cooked and ate ${recipe.name}! Hunger reduced by ${recipe.hungerValue}.`);
        
        // Earn cooking badge
        if (!gameState.badges.includes("Master Chef")) {
            earnBadge("Master Chef");
        }
        
        // Close modal and refresh recipe book
        modals.generic.style.display = 'none';
        setTimeout(() => menuIcons.recipes.onclick(), 100); // Reopen with updated ingredients
    };
    
    // Player debug functions
    window.playerDebug = {
        showPosition: () => {
            const terrainHeight = getTerrainHeight(gameState.player.x, gameState.player.y);
            const rotationDegrees = (gameState.player.rotation * 180 / Math.PI).toFixed(1);
            console.log(`Player Position: (${gameState.player.x.toFixed(1)}, ${gameState.player.y.toFixed(1)})`);
            console.log(`Player Rotation: ${rotationDegrees}° (${gameState.player.rotation.toFixed(2)} radians)`);
            console.log(`Terrain Height: ${terrainHeight.toFixed(1)}`);
            console.log(`Camera Height: ${camera ? camera.position.y.toFixed(1) : 'No camera'}`);
        },
        addGroundMarker: () => {
            if (!scene) return;
            
            // Remove existing marker
            const existingMarker = scene.getObjectByName('playerGroundMarker');
            if (existingMarker) scene.remove(existingMarker);
            
            // Add a small sphere at player's ground level
            const markerGeometry = new THREE.SphereGeometry(2, 8, 6);
            const markerMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            
            const terrainHeight = getTerrainHeight(gameState.player.x, gameState.player.y);
            marker.position.set(gameState.player.x, terrainHeight + 2, gameState.player.y);
            marker.name = 'playerGroundMarker';
            scene.add(marker);
            
            console.log(`Red marker placed at terrain level: ${terrainHeight.toFixed(1)}`);
        },
        removeGroundMarker: () => {
            if (!scene) return;
            const marker = scene.getObjectByName('playerGroundMarker');
            if (marker) {
                scene.remove(marker);
                console.log('Ground marker removed');
            }
        },
        setRotation: (degrees) => {
            gameState.player.rotation = degrees * Math.PI / 180;
            console.log(`Player rotation set to ${degrees}°`);
        },
        faceNorth: () => playerDebug.setRotation(0),
        faceEast: () => playerDebug.setRotation(90),
        faceSouth: () => playerDebug.setRotation(180),
        faceWest: () => playerDebug.setRotation(270),
        testTerrainHeight: () => {
            // Test terrain height sampling vs calculation at multiple points
            const testPoints = [
                [0, 0], [100, 100], [-100, -100], [200, -200], [-300, 300],
                [gameState.player.x, gameState.player.y]
            ];
            
            console.log('Testing terrain height calculations:');
            testPoints.forEach(([x, z], i) => {
                // Force mathematical calculation
                const mathHeight = calculateTerrainHeightMath(x, z);
                // Use mesh sampling if available
                const meshHeight = terrain ? sampleTerrainMesh(x, z) : 'No mesh';
                const currentGetHeight = getTerrainHeight(x, z);
                
                console.log(`Point ${i + 1} (${x}, ${z}):`);
                console.log(`  Math: ${mathHeight.toFixed(2)}`);
                console.log(`  Mesh: ${typeof meshHeight === 'number' ? meshHeight.toFixed(2) : meshHeight}`);
                console.log(`  Current getTerrainHeight: ${currentGetHeight.toFixed(2)}`);
                console.log(`  Difference: ${typeof meshHeight === 'number' ? Math.abs(mathHeight - meshHeight).toFixed(2) : 'N/A'}`);
            });
        }
    };
    
    // Helper function for pure mathematical terrain height calculation
    function calculateTerrainHeightMath(x, z) {
        let height = 0;
        
        // Large rolling hills (primary terrain features)
        height += Math.sin(x * 0.003) * 50 + Math.cos(z * 0.003) * 40;
        height += Math.sin(x * 0.002 + z * 0.002) * 30;
        
        // Medium undulations (secondary features)
        height += Math.sin(x * 0.008) * 15 + Math.cos(z * 0.008) * 12;
        height += Math.sin(x * 0.015 + z * 0.01) * 8;
        
        // Fine detail for moorland texture
        height += Math.sin(x * 0.05) * 3 + Math.cos(z * 0.05) * 2;
        
        // Create river valley - lower terrain along river path
        const riverX = -200;
        const riverDistanceFromCenter = Math.abs(x - riverX);
        if (riverDistanceFromCenter < 150) {
            const riverDepth = (150 - riverDistanceFromCenter) / 150;
            height -= riverDepth * riverDepth * 25; // Gradual valley
        }
        
        // Create waterfall cliff area
        if (x > -300 && x < -200 && z > 100 && z < 200) {
            height += Math.sin((x + 300) * 0.02) * 60; // Sharp cliff face
        }
        
        return height;
    }
    
    // Recipe debug tools
    window.recipeDebug = {
        addAllIngredients: () => {
            const allIngredients = ['Bread', 'Cheese', 'Ham', 'Ketchup', 'Chocolate', 'Carrot', 'Cucumber', 'Apple'];
            allIngredients.forEach(ingredient => {
                gameState.inventory.push({name: ingredient});
            });
            console.log('Added all recipe ingredients to inventory');
        },
        listRecipes: () => {
            console.log('Available Recipes:');
            RECIPES.forEach((recipe, index) => {
                console.log(`${index}: ${recipe.name} (${recipe.hungerValue} hunger) - ${recipe.ingredients.join(', ')}`);
            });
        },
        cookRecipe: (index) => {
            if (typeof cookRecipe === 'function') {
                cookRecipe(index);
            }
        },
        clearFood: () => {
            gameState.inventory = gameState.inventory.filter(item => 
                !SHOP_ITEMS.find(shopItem => shopItem.name === item.name && shopItem.type === 'food')
            );
            console.log('Cleared all food from inventory');
        }
    };
    
    // Companion development tools
    window.companionDebug = {
        getPosition: () => companion3D ? { 
            x: companion3D.position.x, 
            y: companion3D.position.y, 
            z: companion3D.position.z 
        } : null,
        teleportCompanion: (x, z) => {
            if (companion3D) {
                companion3D.position.x = x;
                companion3D.position.z = z;
                companion3D.position.y = getTerrainHeight(x, z) + 10;
                companionTarget.x = x;
                companionTarget.z = z;
            }
        },
        setCompanionScale: (scale) => {
            if (companion3D) {
                if (companion3D.scale) {
                    companion3D.scale.set(scale, scale, 1);
                } else if (companion3D.geometry) {
                    companion3D.geometry.scale(scale, scale, 1);
                }
            }
        },
        resetCompanion: () => {
            if (companion3D) {
                scene.remove(companion3D);
                companion3D = null;
                createCompanion3D();
            }
        },
        testTexture: (path) => {
            const loader = new THREE.TextureLoader();
            loader.load(
                path,
                texture => console.log('Texture loaded successfully:', path, texture),
                progress => console.log('Loading progress:', progress),
                error => console.error('Texture load failed:', path, error)
            );
        },
        forceSprite: () => {
            if (companion3D) {
                scene.remove(companion3D);
                companion3D = null;
            }
            createCompanionFallback();
        },
        listCompanionImages: () => {
            const companions = ['Sally', 'Teresa', 'Josie', 'Alex', 'Charlotte', 'Erica', 'Marta', 'Sophie'];
            companions.forEach(name => {
                let imageName = name.toLowerCase();
                if (name === 'Sophie') imageName = 'Sophie';
                const path = `public/images/companions/${imageName}.png`;
                console.log(`${name}: ${path}`);
                companionDebug.testTexture(path);
            });
        }
    };
    
    // Tent development tools
    window.tentDebug = {
        pitchTent: (type = 'cheap') => {
            if (!gameState.world.tentPitched) {
                gameState.world.tentPitched = true;
                gameState.world.tentLocation = { x: gameState.player.x, y: gameState.player.y };
                gameState.world.tentType = type;
                createTent3D(gameState.player.x, gameState.player.y, type);
                console.log(`${type} tent pitched at player location`);
            } else {
                console.log('Tent already pitched. Use tentDebug.packTent() first.');
            }
        },
        packTent: () => {
            if (gameState.world.tentPitched) {
                gameState.world.tentPitched = false;
                gameState.world.tentType = null;
                removeTent3D();
                console.log('Tent packed up');
            } else {
                console.log('No tent to pack');
            }
        },
        moveTent: (x, z) => {
            if (gameState.world.tentPitched) {
                gameState.world.tentLocation = { x, y: z };
                removeTent3D();
                createTent3D(x, z, gameState.world.tentType || 'cheap');
                console.log(`Tent moved to (${x}, ${z})`);
            } else {
                console.log('No tent pitched');
            }
        },
        getTentInfo: () => {
            if (gameState.world.tentPitched) {
                console.log('Tent Status:', {
                    pitched: gameState.world.tentPitched,
                    location: gameState.world.tentLocation,
                    type: gameState.world.tentType,
                    distanceFromPlayer: getDistanceToPoint(gameState.world.tentLocation)
                });
            } else {
                console.log('No tent pitched');
            }
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
    console.log("🏕️ Tent Debug Tools:");
    console.log("tentDebug.pitchTent('cheap') or tentDebug.pitchTent('expensive') - Pitch tent at player location");
    console.log("tentDebug.packTent() - Pack up tent");
    console.log("tentDebug.moveTent(x, z) - Move tent to coordinates");
    console.log("tentDebug.getTentInfo() - Get tent status");
    console.log("🔍 Player Debug Tools:");
    console.log("playerDebug.showPosition() - Show player and terrain info");
    console.log("playerDebug.addGroundMarker() - Add red sphere at terrain level");
    console.log("playerDebug.removeGroundMarker() - Remove ground marker");
    console.log("playerDebug.setRotation(degrees) - Set player rotation");
    console.log("playerDebug.faceNorth() / faceEast() / faceSouth() / faceWest() - Face cardinal directions");
    console.log("playerDebug.testTerrainHeight() - Compare mathematical vs mesh terrain height calculations");
    console.log("🍳 Recipe Debug Tools:");
    console.log("recipeDebug.addAllIngredients() - Add all food ingredients to inventory");
    console.log("recipeDebug.listRecipes() - List all available recipes");
    console.log("recipeDebug.cookRecipe(index) - Cook recipe by index");
    console.log("recipeDebug.clearFood() - Remove all food from inventory");
    console.log("🗺️ Minimap Tools:");
    console.log("toggleMinimap() - Show/hide minimap");
    console.log("showMinimap() - Show minimap");
    console.log("hideMinimap() - Hide minimap");

    // --- Start the game ---
    console.log("🎮 About to call init()...");
    init();
    console.log("✅ Game initialization completed successfully!");
    
    } catch (error) {
        console.error("❌ Error during game initialization:", error);
        console.error("Stack trace:", error.stack);
        alert("Game failed to initialize. Check the console for details. Error: " + error.message);
    }
    
    } // Close startGameInitialization function
    
    // Start the initialization process
    initializeGame();
});
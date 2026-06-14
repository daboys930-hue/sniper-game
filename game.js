// 3D 3v3 Sniper Game - Main Game Logic
// Using Three.js for graphics and Cannon-es for physics

// Game Setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x87ceeb); // Sky blue
scene.fog = new THREE.Fog(0x87ceeb, 500, 1000);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFShadowShadowMap;
document.body.appendChild(renderer.domElement);

// Physics World
const world = new CANNON.World();
world.gravity.set(0, -9.82, 0);
world.defaultContactMaterial.friction = 0.3;

// Lighting
const sunLight = new THREE.DirectionalLight(0xffffff, 0.8);
sunLight.position.set(100, 200, 100);
sunLight.castShadow = true;
sunLight.shadow.mapSize.width = 2048;
sunLight.shadow.mapSize.height = 2048;
sunLight.shadow.camera.left = -500;
sunLight.shadow.camera.right = 500;
sunLight.shadow.camera.top = 500;
sunLight.shadow.camera.bottom = -500;
sunLight.shadow.camera.far = 1000;
scene.add(sunLight);

const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);

// Game State
let gameState = {
    players: [],
    playerIndex: 0,
    teamAlpha: { kills: 0, players: [] },
    teamBeta: { kills: 0, players: [] },
    gameOver: false,
    scoped: false
};

// Player Class
class Player {
    constructor(position, team, index, isAI = true) {
        this.position = position;
        this.team = team;
        this.index = index;
        this.isAI = isAI;
        this.health = 100;
        this.maxHealth = 100;
        this.kills = 0;
        this.deaths = 0;
        this.velocity = new CANNON.Vec3(0, 0, 0);
        this.isJumping = false;
        this.lastShotTime = 0;
        this.scopeLevel = 0;

        // Create player body (capsule-like)
        const shape = new CANNON.Sphere(0.5);
        this.body = new CANNON.Body({ mass: 1 });
        this.body.addShape(shape);
        this.body.linearDamping = 0.3;
        this.body.position.set(position.x, position.y, position.z);
        world.addBody(this.body);

        // Create visual representation
        const geometry = new THREE.CapsuleGeometry(0.4, 1.6, 8, 16);
        const material = new THREE.MeshStandardMaterial({
            color: team === 'ALPHA' ? 0x00ff00 : 0xff0000,
            emissive: team === 'ALPHA' ? 0x00aa00 : 0xaa0000,
            metalness: 0.3,
            roughness: 0.7
        });
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        scene.add(this.mesh);

        // Player head for rotation
        this.headRotation = { x: 0, y: 0 };

        // Sniper rifle
        this.rifle = this.createRifle();
        this.mesh.add(this.rifle);
    }

    createRifle() {
        const group = new THREE.Group();
        
        // Rifle barrel
        const barrelGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 16);
        const barrelMaterial = new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.8 });
        const barrel = new THREE.Mesh(barrelGeometry, barrelMaterial);
        barrel.position.set(0.3, 0.3, -0.8);
        barrel.rotation.z = Math.PI / 2;
        group.add(barrel);

        // Rifle stock
        const stockGeometry = new THREE.BoxGeometry(0.15, 0.1, 1.2);
        const stockMaterial = new THREE.MeshStandardMaterial({ color: 0x8b4513 });
        const stock = new THREE.Mesh(stockGeometry, stockMaterial);
        stock.position.set(0.2, 0.25, -0.5);
        group.add(stock);

        // Scope
        const scopeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.3, 16);
        const scopeMaterial = new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.9 });
        const scope = new THREE.Mesh(scopeGeometry, scopeMaterial);
        scope.position.set(0.35, 0.5, -0.4);
        scope.rotation.z = Math.PI / 2;
        group.add(scope);

        group.position.set(0, 0, -0.5);
        return group;
    }

    update(deltaTime) {
        if (this.health <= 0) return;

        // Update mesh position
        this.mesh.position.copy(this.body.position);
        this.mesh.quaternion.copy(this.body.quaternion);

        if (this.isAI) {
            this.updateAI(deltaTime);
        }

        // Update health display if this is the player
        if (this.index === gameState.playerIndex) {
            document.getElementById('health').textContent = `HEALTH: ${Math.max(0, Math.round(this.health))}`;
        }
    }

    updateAI(deltaTime) {
        // Simple AI: move randomly, look for enemies, shoot
        if (Math.random() < 0.02) {
            const direction = Math.random() * Math.PI * 2;
            const force = 50;
            this.body.velocity.x += Math.cos(direction) * force;
            this.body.velocity.z += Math.sin(direction) * force;
        }

        // Look for enemies
        const enemies = this.team === 'ALPHA' ? gameState.teamBeta.players : gameState.teamAlpha.players;
        for (let enemy of enemies) {
            if (enemy.health <= 0) continue;
            const distance = this.body.position.distanceTo(enemy.body.position);
            if (distance < 200) {
                this.shoot();
                break;
            }
        }
    }

    shoot() {
        const now = Date.now();
        if (now - this.lastShotTime < 1000) return; // 1 second cooldown

        this.lastShotTime = now;

        // Create bullet
        const direction = new THREE.Vector3(0, 0, -1);
        const cameraWorldDir = direction.applyQuaternion(this.mesh.quaternion).normalize();

        const bullet = {
            position: this.mesh.position.clone().add(cameraWorldDir.multiplyScalar(1)),
            velocity: cameraWorldDir.multiplyScalar(300),
            shooter: this,
            createdAt: now
        };

        gameState.bullets = gameState.bullets || [];
        gameState.bullets.push(bullet);

        // Visual feedback
        this.createMuzzleFlash();
    }

    createMuzzleFlash() {
        const geometry = new THREE.SphereGeometry(0.3, 8, 8);
        const material = new THREE.MeshBasicMaterial({ color: 0xffaa00 });
        const flash = new THREE.Mesh(geometry, material);
        
        const barrelPos = new THREE.Vector3(0.3, 0.3, -1.3);
        flash.position.copy(barrelPos).applyQuaternion(this.mesh.quaternion).add(this.mesh.position);
        
        scene.add(flash);
        setTimeout(() => scene.remove(flash), 100);
    }

    takeDamage(amount) {
        this.health -= amount;
        if (this.health <= 0) {
            this.die();
        }
    }

    die() {
        this.health = 0;
        this.deaths++;
        this.mesh.material.opacity = 0.5;
        this.mesh.material.transparent = true;
    }

    respawn(position) {
        this.health = this.maxHealth;
        this.body.position.set(position.x, position.y, position.z);
        this.body.velocity.set(0, 0, 0);
        this.mesh.material.opacity = 1;
    }
}

// Level Setup
function createLevel() {
    // Ground
    const groundGeometry = new THREE.PlaneGeometry(400, 400);
    const groundMaterial = new THREE.MeshStandardMaterial({ 
        color: 0x90ee90,
        metalness: 0,
        roughness: 1
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.receiveShadow = true;
    scene.add(ground);

    // Physics ground
    const groundShape = new CANNON.Plane();
    const groundBody = new CANNON.Body({ mass: 0 });
    groundBody.addShape(groundShape);
    groundBody.quaternion.setFromAxisAngle(new CANNON.Vec3(1, 0, 0), -Math.PI / 2);
    world.addBody(groundBody);

    // Buildings/Cover
    const buildingPositions = [
        { x: 50, y: 0, z: 50 },
        { x: -50, y: 0, z: 50 },
        { x: 50, y: 0, z: -50 },
        { x: -50, y: 0, z: -50 },
        { x: 0, y: 0, z: 100 }
    ];

    buildingPositions.forEach(pos => {
        const size = 30;
        const geometry = new THREE.BoxGeometry(size, size, size);
        const material = new THREE.MeshStandardMaterial({ 
            color: 0x8b7355,
            metalness: 0.1,
            roughness: 0.8
        });
        const building = new THREE.Mesh(geometry, material);
        building.position.set(pos.x, size / 2, pos.z);
        building.castShadow = true;
        building.receiveShadow = true;
        scene.add(building);

        // Physics
        const shape = new CANNON.Box(new CANNON.Vec3(size / 2, size / 2, size / 2));
        const body = new CANNON.Body({ mass: 0 });
        body.addShape(shape);
        body.position.set(pos.x, size / 2, pos.z);
        world.addBody(body);
    });
}

// Initialize Game
function initGame() {
    createLevel();

    // Create players
    const spawnPoints = [
        // Team ALPHA
        { pos: { x: -60, y: 5, z: -60 }, team: 'ALPHA' },
        { pos: { x: -60, y: 5, z: -40 }, team: 'ALPHA' },
        { pos: { x: -60, y: 5, z: -20 }, team: 'ALPHA' },
        // Team BETA
        { pos: { x: 60, y: 5, z: 60 }, team: 'BETA' },
        { pos: { x: 60, y: 5, z: 40 }, team: 'BETA' },
        { pos: { x: 60, y: 5, z: 20 }, team: 'BETA' }
    ];

    spawnPoints.forEach((spawn, index) => {
        const isPlayer = index === 0;
        const player = new Player(spawn.pos, spawn.team, index, !isPlayer);
        gameState.players.push(player);

        if (spawn.team === 'ALPHA') {
            gameState.teamAlpha.players.push(player);
        } else {
            gameState.teamBeta.players.push(player);
        }
    });

    // Set main player
    gameState.playerIndex = 0;
    camera.position.y = 1.6;

    // Initialize bullets array
    gameState.bullets = [];
}

// Input Handling
const keys = {};
const mouse = { x: 0, y: 0, leftClick: false, rightClick: false };

document.addEventListener('keydown', (e) => {
    keys[e.key.toLowerCase()] = true;
});

document.addEventListener('keyup', (e) => {
    keys[e.key.toLowerCase()] = false;
});

document.addEventListener('mousemove', (e) => {
    mouse.x = e.clientX / window.innerWidth * 2 - 1;
    mouse.y = -(e.clientY / window.innerHeight * 2 - 1);

    // Update camera rotation (head look)
    const player = gameState.players[gameState.playerIndex];
    if (player && player.health > 0) {
        player.headRotation.y -= mouse.x * 0.01;
        player.headRotation.x -= mouse.y * 0.01;
        player.headRotation.x = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, player.headRotation.x));
    }
});

document.addEventListener('mousedown', (e) => {
    if (e.button === 0) mouse.leftClick = true;
    if (e.button === 2) mouse.rightClick = true;
});

document.addEventListener('mouseup', (e) => {
    if (e.button === 0) mouse.leftClick = false;
    if (e.button === 2) mouse.rightClick = false;
});

document.addEventListener('contextmenu', (e) => e.preventDefault());

// Update function
function updateGame(deltaTime) {
    const player = gameState.players[gameState.playerIndex];
    if (!player || player.health <= 0) return;

    // Movement
    const moveVector = new CANNON.Vec3(0, 0, 0);
    const moveSpeed = 100;

    if (keys['w']) moveVector.z -= moveSpeed;
    if (keys['s']) moveVector.z += moveSpeed;
    if (keys['a']) moveVector.x -= moveSpeed;
    if (keys['d']) moveVector.x += moveSpeed;

    // Rotate movement based on camera direction
    const angle = player.headRotation.y;
    const rotatedMove = new CANNON.Vec3(
        moveVector.x * Math.cos(angle) - moveVector.z * Math.sin(angle),
        0,
        moveVector.x * Math.sin(angle) + moveVector.z * Math.cos(angle)
    );

    if (moveVector.length() > 0) {
        player.body.velocity.x = rotatedMove.x * deltaTime;
        player.body.velocity.z = rotatedMove.z * deltaTime;
    }

    // Jump
    if (keys[' '] && !player.isJumping) {
        player.body.velocity.y = 150;
        player.isJumping = true;
    }

    // Scope
    gameState.scoped = mouse.rightClick;

    // Shoot
    if (mouse.leftClick) {
        player.shoot();
    }

    // Update bullets
    if (gameState.bullets) {
        for (let i = gameState.bullets.length - 1; i >= 0; i--) {
            const bullet = gameState.bullets[i];
            bullet.position.add(bullet.velocity.clone().multiplyScalar(deltaTime));

            // Check collision with players
            for (let p of gameState.players) {
                if (p === bullet.shooter || p.health <= 0) continue;
                
                const distance = bullet.position.distanceTo(p.mesh.position);
                if (distance < 1) {
                    p.takeDamage(50);
                    if (p.health <= 0) {
                        bullet.shooter.kills++;
                    }
                    gameState.bullets.splice(i, 1);
                    break;
                }
            }

            // Remove old bullets
            if (Date.now() - bullet.createdAt > 10000) {
                gameState.bullets.splice(i, 1);
            }
        }
    }

    // Update all players
    gameState.players.forEach(p => p.update(deltaTime));

    // Check game over condition (one team eliminated)
    const alphaAlive = gameState.teamAlpha.players.filter(p => p.health > 0).length;
    const betaAlive = gameState.teamBeta.players.filter(p => p.health > 0).length;

    if (alphaAlive === 0 || betaAlive === 0) {
        endGame(alphaAlive > 0 ? 'ALPHA' : 'BETA');
    }
}

function endGame(winningTeam) {
    gameState.gameOver = true;
    document.getElementById('gameOverTitle').textContent = `${winningTeam} WINS!`;
    document.getElementById('gameOverMessage').innerHTML = `
        <div>TEAM ALPHA - Kills: ${gameState.teamAlpha.kills}</div>
        <div>TEAM BETA - Kills: ${gameState.teamBeta.kills}</div>
    `;
    document.getElementById('gameOver').style.display = 'block';
}

// Update HUD
function updateHUD() {
    const player = gameState.players[gameState.playerIndex];
    if (!player) return;

    document.getElementById('kills').textContent = `KILLS: ${player.kills}`;

    // Update team status
    let enemyStatus = '';
    let allyStatus = '';

    const enemies = player.team === 'ALPHA' ? gameState.teamBeta.players : gameState.teamAlpha.players;
    const allies = player.team === 'ALPHA' ? gameState.teamAlpha.players : gameState.teamBeta.players;

    enemies.forEach((e, i) => {
        const status = e.health > 0 ? `${Math.round(e.health)}%` : 'DEAD';
        enemyStatus += `<div>Player ${i + 1}: ${status}</div>`;
    });

    allies.forEach((a, i) => {
        const status = a.health > 0 ? `${Math.round(a.health)}%` : 'DEAD';
        allyStatus += `<div>Player ${i + 1}: ${status}</div>`;
    });

    document.getElementById('enemyStatus').innerHTML = enemyStatus;
    document.getElementById('allyStatus').innerHTML = allyStatus;
}

// Animation Loop
const clock = new THREE.Clock();
let frameCount = 0;
let lastTime = Date.now();

function animate() {
    requestAnimationFrame(animate);

    const deltaTime = clock.getDelta();
    world.step(deltaTime);
    
    // Update game logic
    updateGame(deltaTime);
    updateHUD();

    // Update camera
    const player = gameState.players[gameState.playerIndex];
    if (player && player.health > 0) {
        const cameraOffsetDistance = 0;
        
        // Head position
        const headPos = player.mesh.position.clone();
        headPos.y += 0.5;

        // Camera looks from head
        const euler = new THREE.Euler(player.headRotation.x, player.headRotation.y, 0, 'YXZ');
        const direction = new THREE.Vector3(0, 0, -1).applyEuler(euler);

        camera.position.copy(headPos);
        camera.lookAt(headPos.clone().add(direction));

        // Update scope zoom
        if (gameState.scoped) {
            camera.fov = 20;
        } else {
            camera.fov = 75;
        }
        camera.updateProjectionMatrix();
    }

    renderer.render(scene, camera);

    // FPS counter
    frameCount++;
    const now = Date.now();
    if (now - lastTime >= 1000) {
        document.getElementById('fps').textContent = `FPS: ${frameCount}`;
        frameCount = 0;
        lastTime = now;
    }
}

// Handle window resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

// Lock pointer on click
document.addEventListener('click', () => {
    if (document.pointerLockElement !== document.documentElement) {
        document.documentElement.requestPointerLock();
    }
});

// Start game
initGame();
animate();
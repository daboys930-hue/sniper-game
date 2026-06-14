# 3D 3v3 Sniper Game

A real-time multiplayer sniper game built with Three.js and Cannon.js physics engine.

## Features

✅ **3v3 Team-Based Gameplay** - 6 players total split into two teams (Alpha and Beta)
✅ **Sniper-Only Combat** - All players are equipped with sniper rifles
✅ **First-Person Perspective** - Immersive FPS camera view
✅ **Realistic Scoping** - Right-click to zoom in and aim down sight
✅ **Physics-Based Movement** - Players with gravity, jumping, and collision detection
✅ **AI Opponents** - 5 AI-controlled players provide challenge
✅ **Dynamic Environment** - Multiple buildings and cover points for tactical gameplay
✅ **Real-Time HUD** - Health, ammo, kills, FPS counter, and team status
✅ **Win Conditions** - Game ends when one team is completely eliminated

## Controls

| Action | Key |
|--------|-----|
| Move Forward | W |
| Move Backward | S |
| Move Left | A |
| Move Right | D |
| Jump | SPACEBAR |
| Look Around | MOUSE |
| Fire | LEFT CLICK |
| Scope/Zoom | RIGHT CLICK |
| Lock Cursor | Click on screen |

## How to Play

1. Open `index.html` in a web browser
2. Click to lock the mouse cursor
3. Use WASD to move and mouse to look around
4. Right-click to scope in on targets
5. Left-click to fire your sniper rifle
6. Eliminate all opposing team members to win

## Game Mechanics

- **Health**: Each player starts with 100 HP
- **Weapons**: Sniper rifles deal 50 damage per shot (2 shots to kill)
- **Team**: You control the green Team Alpha player
- **Score**: Earn kills by defeating enemy players
- **Respawning**: Players respawn at team spawn points when eliminated
- **Vision**: Can see teammate and enemy health in the HUD

## Technical Stack

- **Graphics**: Three.js (WebGL 3D rendering)
- **Physics**: Cannon-es (realistic collision and gravity)
- **Audio**: Game runs silently (ready for audio implementation)
- **Platform**: Browser-based (Chrome, Firefox, Safari, Edge)

## File Structure

```
sniper-game/
├── index.html      # Main HTML file with UI and styling
├── game.js         # Game logic, physics, and rendering
└── README.md       # This file
```

## Future Enhancements

- 🔊 Sound effects and music
- 🎨 Advanced graphics and textures
- 💾 Player statistics and leaderboard
- 🎮 Controller support
- 🌍 Multiple maps and game modes
- 🎯 Power-ups and special abilities
- 💬 In-game chat system
- 🎥 Replay system
- ⚡ Performance optimizations

## Performance

The game runs at 60 FPS on modern hardware. FPS counter is displayed in the top-left corner.

- **Resolution**: Full screen (responsive to window size)
- **Shadow Quality**: High-resolution directional shadows
- **Physics**: Accurate collision detection and gravity
- **Rendering**: Optimized with mesh instancing and LOD

## License

Free to use and modify

---

**Enjoy your tactical sniper showdown!** 🎯
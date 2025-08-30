# Group Moor Survival Game

A survival game set on the Yorkshire Moors built with vanilla JavaScript and Three.js.

## Features

- 3D world exploration with realistic terrain
- Farming system with realistic growth times
- Shopping at ASDA supermarket and Market Farm
- Pony rental system for faster travel
- Treasure hunting and wild plant foraging
- Dynamic weather and day/night cycle
- Comprehensive tutorial system

## Local Development

1. Clone the repository:
```bash
git clone <your-repo-url>
cd groupMoorSurvival
```

2. Install dependencies (optional, for local server):
```bash
npm install
```

3. Start local development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:3000`

## Deployment to Vercel

### Option 1: Deploy via Vercel CLI

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

### Option 2: Deploy via Git Integration

1. Push your code to a Git repository (GitHub, GitLab, or Bitbucket)
2. Import the project in your [Vercel Dashboard](https://vercel.com/dashboard)
3. Vercel will automatically detect it as a static site and deploy

### Option 3: Drag and Drop

1. Build a zip file of your project (excluding node_modules, .git, etc.)
2. Drag and drop the zip file onto [Vercel Deploy](https://vercel.com/new)

## Project Structure

```
groupMoorSurvival/
├── index.html          # Main HTML file
├── script.js           # Game logic and Three.js code
├── style.css           # Game styling
├── three.min.js        # Three.js library
├── public/
│   └── images/         # Game assets
├── package.json        # Project metadata
├── vercel.json         # Vercel configuration
└── README.md           # This file
```

## Game Controls

- **Movement**: Arrow Keys or WASD
- **Run**: Hold Shift while moving
- **Interact**: E (pick plants), Enter (shops/harvest), C (caves)
- **Menu**: Click icons when available

## Technologies Used

- Vanilla JavaScript
- Three.js for 3D graphics
- HTML5 Canvas
- CSS3 for UI styling

## License

MIT License - See LICENSE file for details

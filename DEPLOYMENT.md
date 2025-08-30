# Vercel Deployment Guide for Group Moor Survival

## Quick Deployment Options

### Option 1: Automated Script
```bash
./deploy.sh
```

### Option 2: Manual Git + Vercel Dashboard
```bash
git add .
git commit -m "Deploy to Vercel"
git push origin main
```
Then import at https://vercel.com/dashboard

### Option 3: Vercel CLI
```bash
npm install -g vercel
vercel
```

### Option 4: Direct Upload
1. Create a zip file of your project
2. Upload at https://vercel.com/new

## Project Configuration

### Files Added for Vercel:
- `vercel.json` - Vercel configuration
- `package.json` - Project metadata
- `.vercelignore` - Files to exclude from deployment
- `README.md` - Project documentation
- `deploy.sh` - Automated deployment script

### Important Notes:
- ✅ All image paths use `public/images/` (Vercel compatible)
- ✅ Static site configuration in `vercel.json`
- ✅ Three.js loaded via CDN with local fallback
- ✅ No server-side dependencies required

## Environment Variables (if needed)
If you need environment variables in the future:
1. Create `.env.local` file (already in .vercelignore)
2. Add variables in Vercel dashboard under Settings → Environment Variables

## Custom Domain (Optional)
1. In Vercel dashboard, go to your project
2. Settings → Domains
3. Add your custom domain

## Build Commands
This is a static site, so no build process is needed. Vercel will automatically:
1. Detect it as a static site
2. Serve `index.html` as the entry point
3. Serve all assets from the root directory

## File Structure After Deployment:
```
https://your-app.vercel.app/
├── index.html (main game)
├── script.js (game logic)
├── style.css (styling)
├── three.min.js (3D library fallback)
└── public/images/ (all game assets)
```

## Troubleshooting

### Images Not Loading:
- Check that all image files are in `public/images/`
- Verify paths in code use `public/images/` prefix
- Ensure image files are committed to git

### 3D Graphics Issues:
- Game includes automatic fallback from CDN to local Three.js
- If issues persist, check browser console for errors

### Performance:
- Vercel automatically optimizes static assets
- Images are served with proper headers
- Global CDN ensures fast loading worldwide

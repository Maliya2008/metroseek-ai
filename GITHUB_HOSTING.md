# GitHub Hosting Instructions for MetroSeek

To host MetroSeek on GitHub, follow these steps:

## Prerequisites
- A GitHub account.
- Git installed on your computer.
- Node.js installed.

## Step-by-Step Guide

### 1. Initialize a Git Repository
Open your terminal in the project folder and run:
```bash
git init
git add .
git commit -m "Initial commit of MetroSeek"
```

### 2. Create a GitHub Repository
1. Go to [github.com/new](https://github.com/new).
2. Name your repository `metroseek`.
3. Do not initialize with a README, .gitignore, or license.
4. Click **Create repository**.

### 3. Push to GitHub
Follow the instructions on the empty repository page:
```bash
git remote add origin https://github.com/YOUR_USERNAME/metroseek.git
git branch -M main
git push -u origin main
```

### 4. Deploying to GitHub Pages (The "Github Web" Way)
GitHub Pages is a free hosting service for static sites. Since MetroSeek's core AI logic runs in the browser, you can host the frontend directly on GitHub.

#### A. Automated Deployment (GitHub Actions) - Recommended
1. In your GitHub repository, go to **Settings > Pages**.
2. Under **Build and deployment > Source**, select **GitHub Actions**.
3. Create a new file in your project at `.github/workflows/deploy.yml` with the following content:

```yml
name: Deploy to GitHub Pages

on:
  push:
    branches: [main]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout
        uses: actions/checkout@v4

      - name: Setup Node
        uses: actions/setup-node@v4
        with:
          node-version: 20
          cache: 'npm'

      - name: Install dependencies
        run: npm install

      - name: Build
        run: npm run build
        env:
          VITE_GEMINI_API_KEY: ${{ secrets.VITE_GEMINI_API_KEY }}

      - name: Setup Pages
        uses: actions/configure-pages@v4

      - name: Upload artifact
        uses: actions/upload-pages-artifact@v3
        with:
          path: './dist'

      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v4
```

#### B. Manual Deployment (gh-pages branch)
1. Install the deployment tool: `npm install -D gh-pages`
2. Add these scripts to your `package.json`:
   ```json
   "predeploy": "npm run build",
   "deploy": "gh-pages -d dist"
   ```
3. Run `npm run deploy`.

### 5. Environment Variables & Security
When hosting on GitHub Pages, the `GEMINI_API_KEY` is sent to the user's browser.
1. Go to your GitHub Repository **Settings > Secrets and variables > Actions**.
2. Add a **New repository secret**:
   - Name: `VITE_GEMINI_API_KEY`
   - Value: Your Gemini API Key from Google AI Studio.

**Note:** For production apps with high traffic, it is safer to use a backend (Vercel/Netlify) to hide your API key.

### 6. Full-Stack Hosting (Alternative)
If you rely on `server.ts` for custom backend logic in the future:
1. Use **Vercel** or **Netlify**.
2. Connect your GitHub repository.
3. They will automatically handle the build and provide a live URL.

## MetroSeek - Built for Sri Lanka 🇱🇰
The application is now live and functional!

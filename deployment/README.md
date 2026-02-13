# BCS Command Center - Deployment Instructions

## 🚀 Quick Deploy to Vercel (Easiest - 5 minutes)

### Option 1: Deploy via Vercel Dashboard (Recommended)

1. **Go to [vercel.com](https://vercel.com)**
   - Click "Sign Up" (free, no credit card needed)
   - Sign up with your email or GitHub

2. **Create New Project**
   - Click "Add New" → "Project"
   - Click "Import Git Repository" or skip and use upload

3. **Upload Your Files**
   - If you have GitHub: Push this folder to GitHub, then import
   - If no GitHub: Use Vercel CLI (see Option 2 below)

4. **Configure Project**
   - Framework Preset: `Vite`
   - Root Directory: `./`
   - Build Command: `npm run build`
   - Output Directory: `dist`

5. **Deploy!**
   - Click "Deploy"
   - Wait 2-3 minutes
   - Get your URL: `https://your-project-name.vercel.app`

### Option 2: Deploy via Vercel CLI (For Tech-Savvy Users)

```bash
# Install Vercel CLI globally
npm install -g vercel

# Navigate to this folder
cd path/to/bcs-command-center

# Login to Vercel
vercel login

# Deploy!
vercel

# Follow the prompts:
# - Set up and deploy? Yes
# - Which scope? Your account
# - Link to existing project? No
# - What's your project name? bcs-command-center
# - In which directory is your code? ./
# - Auto-detected settings (Vite)? Yes

# Done! You'll get a URL like: https://bcs-command-center.vercel.app
```

### Option 3: Test Locally First

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Open browser to http://localhost:3000

# Build for production
npm run build

# Preview production build
npm run preview
```

## 📱 Access Your Live Site

After deployment, you'll get a URL like:
- `https://bcs-command-center.vercel.app`
- Or `https://bcs-command-center-your-name.vercel.app`

**Share this URL with your team!**

## 🔐 Login Credentials

**Manager Access:**
- Name: Any name
- Password: `bcs2026`

**Client Portal:**
- Client ID: `bcs-office`
- Password: `test123`

## 📋 Using the App

### For Managers:
1. Log in with password `bcs2026`
2. Click "+ New Inspection"
3. Upload your Connecteam checklist (or manually add areas)
4. Fill in scores and add photos
5. Submit inspection

### For Clients:
1. Log in with `bcs-office` / `test123`
2. View all inspections
3. See scores and photos
4. Click photos to view full-size

## 🎨 Customization

### Add Your Clients

Edit `src/App.jsx`, find this section:

```javascript
const DEMO_CLIENTS = [
  { id: 'bcs-office', name: 'BCS Headquarters', password: 'test123', sites: ['Main Office', 'Conference Floor'] },
];
```

Add your real clients:

```javascript
const DEMO_CLIENTS = [
  { id: 'bcs-office', name: 'BCS Headquarters', password: 'test123', sites: ['Main Office'] },
  { id: 'acme-corp', name: 'Acme Corporation', password: 'secure123', sites: ['Building A', 'Building B'] },
  { id: 'tech-plaza', name: 'Tech Plaza', password: 'tech456', sites: ['Main Tower'] },
];
```

### Change Manager Password

Find this line in `src/App.jsx`:

```javascript
if (credentials.password === 'bcs2026') {
```

Change `'bcs2026'` to your preferred password.

## 🔄 Updating Your Live Site

After making changes:

```bash
# Using Vercel CLI
vercel --prod

# Or: Push to GitHub and Vercel auto-deploys
git add .
git commit -m "Update clients"
git push
```

## 🌐 Custom Domain (Optional)

1. Go to your Vercel dashboard
2. Click your project
3. Go to "Settings" → "Domains"
4. Add your domain: `portal.bcsfacilities.com`
5. Follow DNS instructions

## 📞 Need Help?

If you run into issues:
1. Check the Vercel deployment logs
2. Make sure all files are uploaded
3. Try `npm install` and `npm run build` locally first
4. Contact me for help!

## ✅ Deployment Checklist

- [ ] Signed up for Vercel
- [ ] Uploaded/imported project
- [ ] Deployment successful
- [ ] Can access live URL
- [ ] Manager login works
- [ ] Client login works
- [ ] Can create inspection
- [ ] Can upload photos
- [ ] Data persists after refresh
- [ ] Works on mobile

---

**Your live URL will be:** `https://your-project-name.vercel.app`

**Share this with your team and start testing!** 🎉

# Netlify Deployment Guide for Document Signing Application

This guide will help you deploy your full-stack application (frontend + backend) to Netlify.

## Prerequisites

1. **Netlify Account**: Sign up at [netlify.com](https://netlify.com)
2. **GitHub Account**: Your code should be pushed to GitHub
3. **MongoDB Atlas Account**: You'll need a cloud MongoDB database

---

## Step 1: Prepare Your Code

### 1.1 Update Environment Variables

Create/update `backend/.env`:
```
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_super_secret_jwt_key
NODE_ENV=production
NETLIFY=true
```

### 1.2 Update server.js for Netlify

Ensure `backend/server.js` has Netlify support:

```
javascript
const PORT = process.env.PORT || 5000;

// For local development, Vercel, Render, and Netlify
if (process.env.VERCEL !== '1' && process.env.RENDER !== 'true' && process.env.NETLIFY !== 'true') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
```

### 1.3 Check netlify.toml

The backend already has a `netlify.toml` file configured. It should look like this:

```
toml
[build]
  command = "npm run build:frontend"
  publish = "public"
  functions = "."

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/server.js/:splat"
  status = 200

[[redirects]]
  from = "/uploads/*"
  to = "/server.js/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "."
```

---

## Step 2: Push Code to GitHub

```
bash
git init
git add .
git commit -m "Prepare for Netlify deployment"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

---

## Step 3: Deploy to Netlify

### 3.1 Connect to Netlify

1. Go to [Netlify Dashboard](https://app.netlify.com)
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub and select your repository

### 3.2 Configure Build Settings

| Setting | Value |
|---------|-------|
| Base directory | `backend` |
| Build command | `npm run build:frontend` |
| Publish directory | `public` |
| Functions directory | `.` |

### 3.3 Add Environment Variables

Click "Show advanced" → "New variable" and add:

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Any random string (e.g., `abc123xyz`) |
| `NODE_ENV` | `production` |
| `NETLIFY` | `true` |

### 3.4 Deploy

Click "Deploy Site". The deployment will:
1. Install backend dependencies
2. Build the frontend
3. Deploy both frontend and backend functions

---

## Step 4: Get Your URL

After deployment, Netlify will give you a URL like:
```
https://your-site-name.netlify.app
```

---

## Step 5: Configure MongoDB Atlas

Ensure your MongoDB Atlas allows connections from Netlify:

1. Go to MongoDB Atlas → Network Access
2. Click "Add IP Address"
3. Add: `0.0.0.0/0` (allows all IPs)

---

## Important Notes

### File Upload Limitation
- Netlify has a **4.5MB function payload limit** for file uploads
- For larger files, you need to upgrade to Netlify Pro or use external storage (AWS S3, Cloudinary)

### Serverless Functions
- Netlify Functions are serverless (they sleep when not in use)
- First request after sleep may be slower
- For persistent file storage, consider using Netlify Blob or external storage

### Environment Variables
- Go to Site settings → Environment Variables
- Add/update variables as needed
- Trigger a new deploy to apply changes

---

## Troubleshooting

### "Connection refused" errors
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check that your `MONGODB_URI` is correct
- Encode special characters in password (e.g., `@` → `%40`)

### 404 errors on API calls
- Verify the functions are deployed correctly
- Check Netlify function logs
- Ensure redirect rules in `netlify.toml` are correct

### File upload fails
- Check Netlify function logs
- File size may exceed 4.5MB limit
- Consider using external file storage

### Build fails
- Check build logs in Netlify dashboard
- Ensure Node version is correct (18 recommended)
- Verify all dependencies are in package.json

---

## Testing Your Deployment

1. Open your Netlify URL: `https://your-site.netlify.app`
2. Register a new user
3. Upload a PDF document
4. Add signature fields and sign
5. Generate and download the signed PDF

---

## Alternative: Separate Frontend/Backend on Netlify

If you want to deploy frontend and backend separately:

### Frontend (Netlify)
- Connect frontend repo
- Build command: `npm run build`
- Publish directory: `dist`
- Environment: `VITE_API_URL=https://your-backend.netlify.app`

### Backend (Render or Netlify Functions)
- Use the backend with Netlify Functions
- Or deploy backend separately on Render

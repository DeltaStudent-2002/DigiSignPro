# Render Deployment Guide for Document Signing Application (Backend)

This guide will help you deploy your backend to Render. Render is a cloud platform that supports Node.js applications with persistent disks for file storage.

## Prerequisites

1. **Render Account**: Sign up at [render.com](https://render.com)
2. **GitHub Account**: Your code should be pushed to GitHub
3. **MongoDB Atlas Account**: You'll need a cloud MongoDB database

---

## Step 1: Prepare Your Code for Render

### 1.1 Update server.js for Render

Ensure your `backend/server.js` has the correct port handling:

```
javascript
const PORT = process.env.PORT || 5000;

// For local development - start server
// For Render - export app (Render handles listening)
if (process.env.RENDER !== 'true') {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
```

### 1.2 Create Render Specification File

Create a file named `backend/render.yaml` (or you can configure in Render dashboard):

```
yaml
services:
  - type: web
    name: document-signing-backend
    env: node
    region: oregon
    buildCommand: npm install
    startCommand: npm start
    envVars:
      - key: MONGODB_URI
        sync: false
      - key: JWT_SECRET
        sync: false
      - key: NODE_ENV
        value: production
      - key: RENDER
        value: true
```

---

## Step 2: Push Code to GitHub

```
bash
cd backend
git init
git add .
git commit -m "Prepare for Render deployment"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

---

## Step 3: Deploy Backend to Render

### 3.1 Create New Web Service

1. Go to [Render Dashboard](https://dashboard.render.com)
2. Click "New" → "Web Service"
3. Connect your GitHub repository
4. Select the repository containing your backend

### 3.2 Configure the Service

Fill in the following settings:

| Setting | Value |
|---------|-------|
| Name | `document-signing-backend` |
| Region | `Oregon` (or closest to you) |
| Environment | `Node` |
| Build Command | `npm install` |
| Start Command | `npm start` |

### 3.3 Add Environment Variables

Click "Advanced" → "Add Environment Variables":

| Key | Value |
|-----|-------|
| `MONGODB_URI` | Your MongoDB Atlas connection string |
| `JWT_SECRET` | Any random string (e.g., `abc123xyz`) |
| `NODE_ENV` | `production` |
| `RENDER` | `true` |

### 3.4 Create Static Disk (for file uploads)

1. In the same service page, scroll to "Disks"
2. Click "Add Disk"
3. Configure:
   - Name: `uploads`
   - Mount Path: `/app/uploads`
   - Size: `1GB` (or more as needed)

**Important**: Update your multer storage configuration in `backend/routes/documents.js` to use this path:

```
javascript
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = process.env.RENDER ? '/app/uploads' : 'uploads/';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  // ... rest of config
});
```

### 3.5 Deploy

1. Click "Create Web Service"
2. Wait for the build to complete (may take 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://document-signing-backend.onrender.com`

---

## Step 4: Get Your Backend URL

After deployment, your backend will be available at:
```
https://document-signing-backend.onrender.com
```

Copy this URL - you'll need it for the frontend configuration.

---

## Step 5: Update Frontend for Production

### 5.1 Update API URL

Create or update `frontend/.env.production`:

```
env
VITE_API_URL=https://document-signing-backend.onrender.com
```

### 5.2 Deploy Frontend to Vercel

Follow the existing VERCEL_DEPLOYMENT_GUIDE.md for frontend deployment.

---

## Important Notes

### File Storage on Render
- Render's free tier includes 1GB of disk space
- Files uploaded are persistent but not backed up
- For production, consider using AWS S3 or Cloudinary

### Sleep on Free Tier
- Free Render services sleep after 15 minutes of inactivity
- First request after sleep may take 10-30 seconds
- To prevent sleep, upgrade to a paid plan (~$7/month)

### Environment Variables on Render
- Go to your service dashboard → "Environment"
- Add/update variables as needed
- Click "Deploy" to apply changes

---

## Troubleshooting

### "Connection refused" errors
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check that your `MONGODB_URI` is correct (no special characters - encode password if needed)

### 404 errors on API calls
- Verify the backend is deployed and running
- Check the logs in Render dashboard
- Ensure `VITE_API_URL` in frontend matches your Render URL

### File upload fails
- Check if the uploads directory exists on the disk
- Verify disk is properly mounted
- Check file size limits (default 10MB)

### Service not starting
- Check "Logs" in Render dashboard
- Ensure all environment variables are set
- Verify `package.json` has correct scripts

---

## Testing Your Deployed Backend

Test your backend health:

```
bash
curl https://document-signing-backend.onrender.com/api/auth/register
```

Should return a response (even if it's an error about missing data, it means the server is running).

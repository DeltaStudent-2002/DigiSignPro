# Vercel Deployment Guide for Document Signing Application

This guide will help you deploy your document signing application (frontend + backend) to Vercel.

## Prerequisites

1. **Vercel Account**: Sign up at [vercel.com](https://vercel.com)
2. **GitHub/GitLab/Bitbucket**: Your code should be pushed to a Git repository
3. **MongoDB Atlas Account**: You'll need a cloud MongoDB database (Vercel doesn't support local MongoDB)

---

## Step 1: Set Up MongoDB Atlas (Cloud Database)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) and sign up
2. Create a free cluster (选择免费套餐)
3. Create a database user (用户名和密码)
4. Network Access: Add IP address `0.0.0.0/0` (允许所有IP)
5. Get your connection string:
   - Click "Connect" → "Connect your application"
   - Copy the connection string like:
   
```
   mongodb+srv://<username>:<password>@cluster0.xxx.mongodb.net/document-signing?retryWrites=true&w=majority
   
```

---

## Step 2: Deploy Backend to Vercel

### 2.1 Update Environment Variables

Create a `.env` file in the `backend` folder:
```
env
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_super_secret_jwt_key_here
PORT=5000
```

### 2.2 Push Code to Git

```
bash
cd backend
git init
git add .
git commit -m "Prepare for Vercel deployment"
git branch -M main
git remote add origin https://github.com/yourusername/your-repo.git
git push -u origin main
```

### 2.3 Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import your Git repository
4. Select the `backend` folder as the project root
5. Configure:
   - Framework Preset: **Other**
   - Build Command: (leave empty)
   - Output Directory: (leave empty)
6. Add Environment Variables:
   - `MONGODB_URI`: Your MongoDB Atlas connection string
   - `JWT_SECRET`: Any random string (e.g., `abc123xyz`)
7. Click "Deploy"

### 2.4 Get Backend URL

After deployment, you'll get a URL like: `https://your-backend.vercel.app`

---

## Step 3: Deploy Frontend to Vercel

### 3.1 Update API URL

Update `frontend/.env.production`:
```
env
VITE_API_URL=https://your-backend.vercel.app
```

### 3.2 Deploy on Vercel

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → "Project"
3. Import the same Git repository
4. Select the `frontend` folder as the project root
5. Configure:
   - Framework Preset: **Vite**
   - Build Command: `npm run build`
   - Output Directory: `dist`
6. Add Environment Variables:
   - `VITE_API_URL`: `https://your-backend.vercel.app`
7. Click "Deploy"

---

## Step 4: Update CORS Settings

After deploying, you need to allow your frontend domain to access the backend.

### Option A: Allow All (Development)

In `backend/server.js`, update CORS:
```
javascript
app.use(cors({
  origin: '*', // For production, replace with your frontend URL
  credentials: true
}));
```

### Option B: Specific Domain (Production)

```
javascript
app.use(cors({
  origin: 'https://your-frontend.vercel.app',
  credentials: true
}));
```

---

## Step 5: Test Your Deployed Application

1. Open your frontend URL: `https://your-frontend.vercel.app`
2. Register a new user
3. Upload a PDF document
4. Add signature fields and sign
5. Generate and download the signed PDF

---

## Important Notes

### File Upload Limitation
Vercel's serverless functions have a **4.5MB file size limit** for uploads. If you need larger files, consider:
- Using cloud storage (AWS S3, Cloudinary, etc.)
- Upgrading to Vercel Pro for larger limits

### For Production Use
1. Add your custom domain in Vercel settings
2. Enable HTTPS (automatic on Vercel)
3. Set up proper CORS origins
4. Use environment variables for all secrets

---

## Troubleshooting

### "Connection refused" errors
- Ensure MongoDB Atlas IP whitelist includes `0.0.0.0/0`
- Check that your `MONGODB_URI` is correct

### 404 errors on API calls
- Verify the backend is deployed and running
- Check that `VITE_API_URL` in frontend matches your backend URL

### File upload fails
- Check Vercel function size limits
- Consider using external file storage service

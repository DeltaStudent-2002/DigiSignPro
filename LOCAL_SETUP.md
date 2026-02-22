# Local Development Setup Guide

This guide will help you run the Document Signature App locally on your machine.

## Prerequisites

1. **Node.js** - Download and install from https://nodejs.org (LTS version recommended)
2. **MongoDB** - You have two options:
   - **Option A**: Install MongoDB locally (https://www.mongodb.com/try/download/community)
   - **Option B**: Use MongoDB Atlas (free cloud tier) - https://www.mongodb.com/cloud/atlas

## Step 1: Install Dependencies

Open a terminal and run:

```
bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies (in a new terminal)
cd ../frontend
npm install
```

## Step 2: Configure MongoDB

### Option A: Local MongoDB
If you installed MongoDB locally, the default connection string in `backend/.env` should work:
```
MONGODB_URI=mongodb://localhost:27017/document-signature-app
```

Make sure MongoDB is running:
```
bash
# On Windows (run as Administrator)
net start MongoDB

# On Mac
brew services start mongodb-community

# On Linux
sudo systemctl start mongod
```

### Option B: MongoDB Atlas
1. Create a free account at https://www.mongodb.com/cloud/atlas
2. Create a free cluster
3. Create a database user
4. Get your connection string (should look like: mongodb+srv://username:password@cluster.mongodb.net/document-signature-app)
5. Update `backend/.env` with your Atlas connection string

## Step 3: Run the Application

You need to run both backend and frontend in separate terminals:

**Terminal 1 - Backend:**
```
bash
cd backend
npm run dev
```
The backend will start on http://localhost:5001

**Terminal 2 - Frontend:**
```
bash
cd frontend
npm run dev
```
The frontend will start on http://localhost:5173

## Step 4: Access the Application

Open your browser and navigate to:
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:5001/api

## Troubleshooting

### Error: "MONGODB_URI not found"
- Make sure you've created the `backend/.env` file with the correct MongoDB URI
- Restart the backend server after creating the .env file

### Error: "Cannot connect to MongoDB"
- Check if MongoDB is running
- Verify your connection string is correct
- If using MongoDB Atlas, check your network access settings (allow IP 0.0.0.0/0)

### Error: "Port already in use"
- Change the port in `backend/.env` to a different value (e.g., 5002)
- Or kill the process using the port: `npx kill-port 5001`

### Frontend shows blank page
- Make sure the frontend is running (npm run dev in frontend folder)
- Check that `frontend/.env` has the correct VITE_API_URL

## API Endpoints

- **POST /api/auth/register** - Register new user
- **POST /api/auth/login** - Login user
- **GET /api/auth/me** - Get current user (protected)
- **POST /api/docs** - Upload document (protected)
- **GET /api/docs** - Get all documents (protected)
- **POST /api/signatures** - Create signature request
- **GET /api/audit** - Get audit logs (protected)

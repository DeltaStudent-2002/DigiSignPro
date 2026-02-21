# Project Restructuring Plan

## Information Gathered:

### Current Structure:
- **Backend**: Express.js + MongoDB (Mongoose) - deployed separately on Vercel
- **Frontend**: React + Vite - deployed separately on Vercel  
- **Database**: MongoDB Atlas with connection issues in serverless environment

### Key Files Analyzed:
- `backend/server.js`: Express server with API routes, static file serving
- `backend/config/db.js`: MongoDB connection with retry logic
- `frontend/vite.config.js`: Vite config with proxy for dev
- `frontend/src/axios.js`: Axios with hardcoded Vercel URL
- `backend/routes/auth.js`: Auth routes with DB connection checks
- `backend/vercel.json`: Vercel config for serverless functions
- `frontend/vercel.json`: Vercel config for frontend

### Issues Identified:
1. **Separate Deployments**: Frontend and backend deployed separately
2. **Database Connectivity**: MongoDB connection fails in serverless environment
3. **Hardcoded URLs**: Frontend has hardcoded backend URL in axios.js
4. **CORS Issues**: CORS configured for specific origins only

## Plan:

### Phase 1: Restructure Project for Single Deployment
- [ ] 1. Create new `public` folder in backend for frontend build files
- [ ] 2. Update backend/server.js to serve frontend static files
- [ ] 3. Configure Vite for production build output to backend/public
- [ ] 4. Update backend/package.json with frontend build script

### Phase 2: Fix API and Database Issues
- [ ] 5. Update axios.js to use relative API paths
- [ ] 6. Fix CORS configuration to work with single deployment
- [ ] 7. Improve database connectivity for serverless environment
- [ ] 8. Update vite.config.js for production proxy

### Phase 3: Deployment Configuration
- [ ] 9. Update vercel.json for combined deployment
- [ ] 10. Create .env.example for environment variables

## Dependent Files to be Edited:
- `backend/server.js` - Add static file serving for frontend
- `backend/package.json` - Add build script
- `frontend/vite.config.js` - Update output path
- `frontend/src/axios.js` - Use relative API paths
- `backend/vercel.json` - Update for combined deployment

## Followup Steps:
1. Run local test with combined server
2. Deploy to Vercel and verify
3. Test all functionality

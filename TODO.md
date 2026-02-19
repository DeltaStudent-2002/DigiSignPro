# Document Signing Application - 2-Week Build Plan

## Project Overview
Build a full-featured MERN stack document signing application with PDF upload, signature placement, and audit trail functionality.

## Week 1: Core Features, Backend & Frontend Setup

### Day 1: Project Setup & Repo Initialization
- [x] Create GitHub repo structure (if needed)
- [x] Initialize MERN folder structure (backend/, frontend/)
- [x] Setup Node.js + Express server
- [x] Initialize React app with Tailwind CSS
- [x] Setup MongoDB connection with Mongoose
- [x] Install dependencies: multer, pdf-lib, bcrypt, jwt, cors, dotenv

### Day 2: Auth System (JWT)
- [x] Create User model (name, email, password)
- [x] Create auth routes: /register, /login
- [x] Implement JWT authentication
- [x] Implement bcrypt password hashing
- [x] Create auth middleware for protected routes

### Day 3: File Upload API
- [x] Setup Multer for PDF uploads
- [x] Create Document model (filename, filepath, userId, uploadDate)
- [x] Create upload route: POST /api/docs/upload
- [x] Create get documents route: GET /api/docs

### Day 4: View & List Documents
- [x] Create API to fetch user's uploaded files
- [x] Create document dashboard UI
- [x] Implement PDF preview using react-pdf
- [x] Add file listing with metadata

### Day 5: Signature Schema & Logic
- [x] Create Signature model (fileId, coordinates, signer, status)
- [x] Create route to save signature positions (x, y)
- [x] Implement signature placeholder rendering on PDF

### Day 6: PDF Editor Integration
- [x] Add drag-and-drop signature field (HTML overlay)
- [x] Save coordinates relative to PDF page
- [x] Create route: POST /api/signatures

### Day 7: Buffer / Testing
- [x] Debug UI and backend integration
- [x] Write Postman tests for API endpoints

## Week 2: Signature Rendering, Sharing & Polish

### Day 8: Generate Final Signed PDF
- [x] Use PDF-Lib to embed signature text/image
- [x] Create signed PDF generation route
- [x] Export signed version to disk

### Day 9: Email + Public Signature Links
- [x] Generate tokenized URL for external signature
- [x] Implement email link sending (nodemailer or mock)
- [x] Create public signing page for external users

### Day 10: Audit Trail
- [x] Implement audit logging middleware
- [x] Log who signed, when, and IP address
- [x] Create route: GET /api/audit/:fileId

## Project Structure
```
Project intern/
├── backend/
│   ├── config/
│   │   └── db.js
│   ├── middleware/
│   │   ├── auth.js
│   │   └── audit.js
│   ├── models/
│   │   ├── User.js
│   │   ├── Document.js
│   │   └── Signature.js
│   ├── routes/
│   │   ├── auth.js
│   │   ├── documents.js
│   │   ├── signatures.js
│   │   └── audit.js
│   ├── uploads/
│   ├── server.js
│   └── package.json
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── pages/
│   │   │   ├── Login.jsx
│   │   │   ├── Register.jsx
│   │   │   ├── Dashboard.jsx
│   │   │   ├── DocumentUpload.jsx
│   │   │   ├── DocumentViewer.jsx
│   │   │   └── PublicSign.jsx
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── tailwind.config.js
│   └── package.json
├── TODO.md
└── README.md
```

## Dependencies

### Backend
- express
- mongoose
- multer
- pdf-lib
- bcryptjs
- jsonwebtoken
- cors
- dotenv
- nodemailer

### Frontend
- react
- react-dom
- react-router-dom
- react-pdf
- axios
- tailwindcss
- postcss
- autoprefixer
- pdfjs-dist

## All Tasks Completed! ✅

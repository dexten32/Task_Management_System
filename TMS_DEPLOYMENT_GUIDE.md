# **TMS Project – Development & Deployment Documentation**

## **Overview**
The **Task Management System (TMS)** is a full-stack web application built using **Next.js** (frontend) and a **Node.js/Express** backend API.  
It provides internal team management features with role-based access (Admin/Employee) and approval workflows.

---

## **1. Project Structure**

```
tms/
├── backend/
│   ├── src/
│   ├── package.json
│   ├── .env
│   └── ...
└── frontend/
    ├── pages/
    ├── components/
    ├── package.json
    ├── .env.local
    └── ...
```

---

## **2. Setup Guide**

### **Backend Setup**
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update `.env` with your environment variables:
   ```env
   PORT=5000
   DATABASE_URL="your_database_url"
   JWT_SECRET="your_secret_key"
   ```
4. Start the backend:
   ```bash
   npm run start
   ```

---

### **Frontend Setup**
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Update `.env.local` with your values:
   ```env
   NEXT_PUBLIC_API_URL="https://your-backend-domain.com"
   ```
4. Start the frontend:
   ```bash
   npm run start
   ```

---

## **3. Environment Variables**

| Variable | Description | Example |
|-----------|--------------|----------|
| `DATABASE_URL` | Connection string for database | `postgresql://user:password@localhost:5432/tms` |
| `JWT_SECRET` | Secret for JWT token signing | `your_secret_key` |
| `NEXT_PUBLIC_API_URL` | API base URL used in frontend | `https://api.tmsync.in` |
| `PORT` | Backend port | `5000` |

---

## **4. Directory Structure (Server)**

Example Ubuntu server setup:

```
/var/www/tms/
├── backend/
│   ├── logs/
│   ├── node_modules/
│   └── ...
└── frontend/
    ├── .next/
    └── ...
```

Use **PM2** to keep the backend process running:

```bash
pm2 start npm --name "tms-backend" -- run start
pm2 startup
pm2 save
```

---

## **5. Common Issues & Quick Fixes**

### **Issue 1: CORS Error**
**Cause:** Frontend and backend are on different domains without proper headers.  
**Fix:**
```js
app.use(cors({ origin: "*" }));
```

---

### **Issue 2: Build Fails on Frontend**
**Cause:** Missing `.env` variables or stale `.next` build.  
**Fix:**
```bash
rm -rf .next && npm run build
```

---

### **Issue 3: API Not Responding After Deployment**
**Cause:** Backend not running or wrong proxy/port setup.  
**Fix:**
```bash
pm2 restart tms-backend
```
Check `.env` and Nginx proxy config if it persists.

---

## **6. Nginx Configuration Example**

**File:** `/etc/nginx/sites-available/tms`

```nginx
server {
    listen 80;
    server_name tmsync.in www.tmsync.in;

    location /api {
        proxy_pass http://localhost:5000;
    }

    location / {
        proxy_pass http://localhost:3000;
    }
}
```

Reload Nginx:
```bash
sudo nginx -t
sudo systemctl reload nginx
```

---

## **7. Deployment Checklist**

 Environment variables updated  
 Backend running with PM2  
 Frontend build completed  
 Nginx reverse proxy configured  
 SSL certificate installed (optional via Certbot)  
 Logs monitored (`pm2 logs tms-backend`)  

---

## **8. Useful Commands**

| Purpose | Command |
|----------|----------|
| Start backend | `cd backend && npm run start` |
| Start frontend | `cd frontend && npm run start` |
| Rebuild frontend | `npm run build` |
| Restart backend (PM2) | `pm2 restart tms-backend` |
| View backend logs | `pm2 logs tms-backend` |
| Stop backend (PM2) | `pm2 stop tms-backend` |

---

## **9. Future Improvements**

- Dockerize backend & frontend for simplified CI/CD  
- Add staging environment for pre-deployment testing  
- Create `.env.example` templates for easier onboarding  

---

**Author:** Harsh Bajaj  
**Last Updated:** November 2025  
**Project:** TMS (Task Management System)

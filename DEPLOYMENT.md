# Production Deployment Guide — Standalone Inventory Management System

This guide provides instructions for deploying the **Inventory Management System** to production across popular cloud providers and container platforms.

---

## 1. Cloud Architecture Options

You can deploy this application in two primary configurations:

### Configuration A: Decoupled Cloud (Recommended for SaaS)
* **Frontend**: Deployed to [Vercel](https://vercel.com) or [Netlify](https://netlify.com) (Global CDN edge)
* **Backend API**: Deployed to [Render](https://render.com), [Railway](https://railway.app), or [AWS](https://aws.amazon.com)
* **Database**: Managed MySQL 8.0 on Railway, Render, PlanetScale, or AWS RDS

### Configuration B: All-in-One Container (Docker / VPS)
* Single Linux VPS (Ubuntu on DigitalOcean, AWS EC2, Linode, or Hetzner)
* Runs `docker compose up -d` with MySQL, Backend, and Nginx/Frontend orchestrated together.

---

## 2. Required Production Environment Variables

Never commit real production credentials to Git. Set these in your hosting provider's **Environment Settings** dashboard:

### Backend API Variables

| Variable | Description | Example / Recommendation |
| :--- | :--- | :--- |
| `NODE_ENV` | Runtime environment | `production` |
| `PORT` | Listening port (often set automatically by host) | `5000` |
| `DATABASE_URL` | Complete MySQL connection string | `mysql://user:pass@mysql-host:3306/inventory_db` |
| *or* `DB_HOST` | MySQL hostname (if not using DATABASE_URL) | `db.provider.com` |
| *or* `DB_PORT` | MySQL port | `3306` |
| *or* `DB_NAME` | Database name | `inventory_db` |
| *or* `DB_USER` | MySQL user | `prod_user` |
| *or* `DB_PASSWORD` | Strong MySQL password | `mY$ecur3P@ssw0rd!` |
| `JWT_SECRET` | 64+ char random string for signing JWTs | `generate with: openssl rand -hex 32` |
| `JWT_EXPIRES_IN` | Session token lifetime | `24h` or `8h` |
| `CORS_ORIGIN` | Allowed frontend URLs (comma-separated or wildcard) | `https://your-inventory-app.vercel.app` |
| `RATE_LIMIT_MAX` | Max requests per 15 minutes per IP | `500` |
| `AUTH_RATE_LIMIT_MAX` | Max login attempts per 15 minutes per IP | `10` |

### Frontend Variables

| Variable | Description | Example / Recommendation |
| :--- | :--- | :--- |
| `VITE_API_URL` | Public URL of your deployed backend API | `https://api.your-domain.com/api` (Leave empty if using same-domain proxy) |

---

## 3. Deployment Option 1: Railway / Render (Quickest)

### Step 1: Create a Managed MySQL Database
1. Create an account on [Railway.app](https://railway.app) or [Render.com](https://render.com).
2. Click **New** &rarr; **Database** &rarr; **MySQL**.
3. Copy the provided `DATABASE_URL` or credentials.

### Step 2: Initialize Database Schema
Connect to your remote MySQL instance using MySQL Workbench, DBeaver, or command line:
1. Run [backend/database/schema.sql](file:///backend/database/schema.sql) to create tables and constraints.
2. (Optional for fresh installations) Run [backend/database/seed.sql](file:///backend/database/seed.sql) to seed baseline categories and roles.

### Step 3: Deploy Backend API
1. On Railway/Render, create a **New Web Service** connected to your GitHub repo: `https://github.com/Dhrumil124/Inventory-Management-System`.
2. Set **Root Directory**: `backend`
3. Set **Build Command**: `npm ci`
4. Set **Start Command**: `node server.js`
5. Add the environment variables from Section 2 (`DATABASE_URL`, `JWT_SECRET`, `CORS_ORIGIN`).

### Step 4: Deploy Frontend (Vercel or Render)
1. On [Vercel](https://vercel.com), click **Add New** &rarr; **Project** &rarr; import your repo.
2. Set **Root Directory**: `frontend`
3. Set **Framework Preset**: `Vite`
4. Under **Environment Variables**, add:
   * `VITE_API_URL` = `https://your-deployed-backend.up.railway.app/api`
5. Click **Deploy**.

---

## 4. Deployment Option 2: Docker Compose (VPS / Self-Hosted)

If deploying to an Ubuntu/Debian Linux VPS:

1. **Install Docker & Docker Compose on your server**:
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose-v2
   ```

2. **Clone your repository**:
   ```bash
   git clone https://github.com/Dhrumil124/Inventory-Management-System.git
   cd Inventory-Management-System
   ```

3. **Configure Production Secrets in a `.env` file**:
   ```bash
   nano .env
   ```
   Add:
   ```env
   DB_ROOT_PASSWORD=ChooseAStrongRootPassword123!
   JWT_SECRET=ReplaceWithAStrongSecretKey64CharsLong
   ```

4. **Start the containers in detached mode**:
   ```bash
   docker compose up --build -d
   ```
   *This automatically starts MySQL 8 with persistent storage, seeds the schema, builds the backend, and runs the Nginx frontend on port 80.*

5. **Verify containers are healthy**:
   ```bash
   docker compose ps
   ```

---

## 5. Production Security Checklist

Before public launch:
- [ ] Ensure `NODE_ENV` is set to `production`.
- [ ] Generate a cryptographically secure `JWT_SECRET` (`openssl rand -hex 32`).
- [ ] Configure `CORS_ORIGIN` to your exact frontend domain name (do not leave `*` in production).
- [ ] Ensure all communication uses **HTTPS / SSL** (handled automatically by Vercel/Render/Cloudflare).
- [ ] If using pre-seeded accounts, immediately change default passwords upon first login via **Settings &rarr; Security**.

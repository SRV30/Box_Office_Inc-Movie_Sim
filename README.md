# 🎬 Box Office Inc - Movie Studio Simulator

A full-stack **Movie Studio Tycoon** simulation game where you build a cinematic empire, hire talent, produce blockbuster movies, and dominate the global box office.

![License](https://img.shields.io/badge/License-MIT-green)
![Open Source](https://img.shields.io/badge/Open%20Source-Welcome-brightgreen)
![ECSOC](https://img.shields.io/badge/ECSOC-2026-blue)
![ELUSOC](https://img.shields.io/badge/ELUSOC-2026-orange)

---

## 🚀 Open Source Programs

This repository is an official participating project in:

- 🌟 **ECSOC 2026**
- 🚀 **ELUSOC 2026**

Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** before submitting any contribution.

---

## 🎬 Overview

Become the head of your own movie studio and experience every stage of filmmaking—from discovering scripts and hiring actors to managing production, marketing, and worldwide theatrical releases.

Every decision affects your studio's reputation, finances, and long-term success.

---

## ✨ Features

### 🏢 Studio Management
- Financial management
- Studio reputation system
- Weekly payroll
- Revenue & expense tracking

### 🎭 Talent Management
- Hire Writers
- Hire Directors
- Recruit Actors
- Manage Production Crews
- Talent progression

### 🎥 Movie Production
- Script marketplace
- Multi-stage production pipeline
- Marketing campaigns
- Movie release management

### 📊 Simulation
- Weekly simulation engine
- Dynamic box office
- Audience & critic ratings
- Financial analytics

---

## 🛠 Tech Stack

| Layer | Technologies |
|--------|--------------|
| Frontend | React, Vite, Redux Toolkit, TailwindCSS |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas |
| Deployment | Vercel |

---

## 💻 Local Setup

### Prerequisites

- Node.js v18+
- MongoDB

### Backend

```bash
cd backend
npm install
npm run dev
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Create `.env` files using the provided examples before running the project.

### Seeding the V1 Market
To seed the simulation with 99 AI competitor studios, 1,000 actors, 300 directors, 500 writers, and 300 composers:
```bash
cd backend
node src/scripts/seedIndustryMarket.js
```

### Documentation & Architecture Guides
- 📖 [V1 Release Architecture & Quality Gate](docs/V1_RELEASE_ARCHITECTURE_AND_QUALITY_GATE.md)
- 🧪 [V1 Simulation Acceptance Report](docs/V1_SIMULATION_ACCEPTANCE_REPORT.md)
- 🏗️ [System Architecture](ARCHITECTURE.md)
- 🤝 [Contributing Guidelines](CONTRIBUTING.md)

### Environment Variables

#### Backend (`backend/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `MONGO_URI` | ✅ Yes | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/dbname` |
| `JWT_ACCESS_SECRET` | ✅ Yes | Secret key for signing access tokens | `your-64-char-random-string` |
| `JWT_REFRESH_SECRET` | ✅ Yes | Secret key for signing refresh tokens | `your-64-char-random-string` |
| `CLIENT_URL` | ✅ Yes | Frontend URL used for CORS | `http://localhost:5173` |
| `PORT` | ❌ No | Port the backend server listens on | `5000` |
| `NODE_ENV` | ❌ No | Environment mode | `development` |
| `JWT_ACCESS_EXPIRE` | ❌ No | Access token expiry duration | `15m` |
| `JWT_REFRESH_EXPIRE` | ❌ No | Refresh token expiry duration | `30d` |

#### Frontend (`frontend/.env`)

| Variable | Required | Description | Example |
|---|---|---|---|
| `VITE_BACKEND_API_URL` | ✅ Yes | Backend API base URL | `http://localhost:5000/api` |

> **Tip:** Copy `backend/.env.example` to `backend/.env` and `frontend/.env.example` to `frontend/.env`, then fill in your values.

---

## 🌍 Deployment

Deploy using **Vercel** and **MongoDB Atlas**.

Required environment variables include:

- `MONGO_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `CLIENT_URL`
- `NODE_ENV`
- `VITE_BACKEND_API_URL`

---

## 📁 Project Structure

```text
backend/
 ├── api/
 ├── src/
 │   ├── config/
 │   ├── controllers/
 │   ├── models/
 │   ├── routes/
 │   ├── services/
 │   └── utils/

frontend/
 ├── src/
 │   ├── api/
 │   ├── app/
 │   ├── components/
 │   ├── features/
 │   └── pages/
```

---

## 🛠 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Run development server |
| `npm run build` | Build frontend |
| `npm start` | Start backend |

---

## 🤝 Contribution Guide

We welcome contributors from both open-source programs.

Please read **[CONTRIBUTING.md](CONTRIBUTING.md)** before contributing.

### 🌟 ECSOC 2026

- Request issue assignment before starting work.
- If you create an issue, add the **`ECSOC2026`** label.
- If you create a PR, mention it is for **ECSOC 2026** and request the appropriate labels.
- During review, project admins will apply the **`ECSoC26`** label **before merging** so ECSOC Sentinel can automatically process your contribution.

---

## 🌿 Branch Rules

| Branch | Purpose |
|---------|---------|
| `main` | Stable production branch |

---

## 🏷 Labels

### General

- `bug`
- `enhancement`
- `documentation`
- `frontend`
- `backend`
- `performance`
- `security`
- `testing`
- `refactor`
- `good first issue`
- `help wanted`

### ECSOC

- `ECSOC2026`
- `ECSoC26`
- `good-issue`
- `good-pr`
- `good-ui`
- `good-backend`

---

## 🛣 Roadmap

- AI Studios
- Awards System
- Franchise & Sequels
- Seasonal Events
- Dynamic Industry Trends
- Multiplayer Mode

---

## ❤️ Open Source

Box Office Inc - Movie Studio Simulator is licensed under the **MIT License**.

We welcome contributions from developers worldwide through **ECSOC 2026**, **ELUSOC 2026**, and the open-source community.

If you're interested in contributing, please read **[CONTRIBUTING.md](CONTRIBUTING.md)** before getting started.

---

## ⭐ Support

If you find this project useful:

- ⭐ Star the repository
- 🍴 Fork the project
- 🐛 Report bugs
- 💡 Suggest new features
- 🚀 Contribute through ECSOC 2026 or ELUSOC 2026

Happy Coding! 🎬
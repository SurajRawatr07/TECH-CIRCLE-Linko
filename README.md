<div align="center">

# ⚡ Linko

### Shorten smarter. Share safer.

**A modern, high-performance URL shortening and link-security platform.**

[![TypeScript](https://img.shields.io/badge/TypeScript-Project-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React 19](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-6-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)

**Create. Protect. Analyze. Control.**

</div>

---

## 📌 Overview

**Linko** is a next-generation URL shortening and link-security platform engineered for individuals, creators, and modern teams.

Beyond conventional shorteners, Linko incorporates explainable safety heuristics, redirection integrity tracking, traffic velocity anomaly detection, and granular redirect policies.

### 🎯 Core Capabilities

- **Guest Shorten without Signup**: Instant Base62 short links and QR codes at `/shorten`.
- **Shared Authentication**: Unified `/auth/login` and `/auth/signup` entry point for both users and platform administrators.
- **The Five Differentiating Features**:
  1. **Link Risk Radar**: Local heuristic safety evaluation analyzing raw IP hosts, suspicious TLDs, deep nesting, credential keywords, and safety blocklists.
  2. **Destination Change Guardian**: Immutable destination baselines that audit and track every redirect change made to short links.
  3. **Click Anomaly Watch**: Deterministic velocity spike and rapid replay burst detection.
  4. **Privacy Controls**: Granular local browser data inspection, retention controls, and complete JSON export.
  5. **Redirect Policy Simulator**: In-browser testing of link expiration, click quotas, password challenges, and safety invariants.
- **Backend-Ready Architecture**: Runs 100% client-side in local demo mode, with a clean repository pattern ready to connect to a future Node.js + Fastify + PostgreSQL REST API.

---

## 🛠️ Architecture & Data Modes

Linko supports two operational modes via environment variables:

1. **Local Mode (`VITE_DATA_MODE=local`, default)**:
   - Operates 100% in-browser with zero external database dependencies.
   - Persistence is managed through `LocalStorageRepository` and `LocalStore`.
   - All guest shortening, link CRUD, QR generation, analytics simulation, and admin previews are fully interactive.
   - Clearly disclaims local demo limitations without pretending client-side quotas are server security.

2. **API Mode (`VITE_DATA_MODE=api`)**:
   - Delegates operations through `HttpApiRepository` to the configured `VITE_API_BASE_URL`.
   - Designed for the future backend stack: **Node.js + Fastify + PostgreSQL + Redis + BullMQ**.

---

## 🚀 Getting Started

### Prerequisites

- Node.js 20+ or 22
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/SurajRawatr07/TECH-CIRCLE-Linko.git
cd TECH-CIRCLE-Linko

# Install dependencies
npm install
```

### Development

```bash
npm run dev
```

The application will start on `http://localhost:3000`.

### Production Build

```bash
npm run build
```

Build outputs are generated in the `dist/` directory.

### Type Checking & Linting

```bash
npm run lint
```

---

## 🌐 Routes Overview

### Public Routes
- `/`: Homepage with hero shortener, 5 feature cards, how it works, and FAQ.
- `/shorten`: Guest Shortener with custom alias, expiration, click limits, QR code, and Link Risk Radar.
- `/auth/login`: Shared login entry point for users and administrators.
- `/auth/signup`: Account registration.
- `/r/:code`: Public redirect engine with client-side policy evaluation.
- `/bio/:slug`: Public link-in-bio page.

### User Workspace (`/app`)
- `/app/dashboard`: Saved links overview, velocity anomalies, and click analytics.
- `/app/links`: Complete links directory with search, filter, pause/resume, and CSV export.
- `/app/links/new`: Multi-step link creation wizard with Link Risk Radar.
- `/app/qr`: QR Studio for vector SVG and high-resolution PNG generation.
- `/app/bio`: Link-in-Bio profile builder with theme customization.
- `/app/policy-lab`: Redirect Policy Simulator for testing routing invariants.
- `/app/lifecycle`: Expiration and click-quota lifecycle management.
- `/app/campaigns`: Campaign grouping and UTM parameter tags.
- `/app/tags`: Tag management.
- `/app/settings`: Privacy controls, local data export, and storage inspection.

### Admin Portal (`/admin`)
- `/admin`: Platform Overview layout with system metrics and flagged links.
- `/admin/links`: Link moderation and inspection directory.
- `/admin/security`: Security Hub combining abuse queue, blocklist management, destination change alerts, and anomaly watch.
- `/admin/activity`: System-wide audit event trail and active policy inspection.

---

## 🔮 Future Fastify + PostgreSQL Integration

The frontend architecture includes typed contracts in `src/types/apiContracts.ts` and route configurations in `src/config/api.ts` ready for the backend endpoints:

- `POST /api/v1/auth/login`
- `POST /api/v1/auth/signup`
- `GET /api/v1/auth/me`
- `GET /api/v1/links`
- `POST /api/v1/links`
- `GET /api/v1/links/:id`
- `PATCH /api/v1/links/:id`
- `DELETE /api/v1/links/:id`
- `GET /api/v1/analytics`
- `GET /api/v1/admin/overview`
- `GET /api/v1/admin/links`
- `PATCH /api/v1/admin/links/:id/status`

To connect:
Set `VITE_DATA_MODE=api` and `VITE_API_BASE_URL=https://your-api-domain.com/api/v1` in `.env`.

---

## 📄 License

MIT © Linko

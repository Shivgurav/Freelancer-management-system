# TalentFlow — Freelancer Management System (Frontend)

A production-ready Vite + React + JavaScript single-page app that integrates with the **shiv-backend** microservices.

---

## Tech Stack

| Layer | Choice |
|---|---|
| Bundler | Vite 8 |
| UI Library | React 18 |
| Language | JavaScript (JSX) |
| Routing | React Router v6 |
| State | Zustand |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |

---

## Project Structure

```
src/
├── api/                  # One file per backend service
│   ├── config.js         # apiFetch(), token management, 401 auto-refresh
│   ├── auth.js           # login, register, logout, refresh
│   ├── jobs.js           # create/list/search/cancel jobs
│   ├── bids.js           # submit/accept/reject/withdraw bids
│   ├── contracts.js      # contracts + milestones + progress reports
│   ├── profile.js        # freelancer & client profiles + skills
│   ├── reviews.js        # submit & fetch reviews
│   └── notifications.js  # fetch notifications
│
├── hooks/
│   ├── use-projects.js   # useProjects, useMyJobs, useProject
│   ├── use-bids.js       # useBids, useBidsForJob
│   └── use-contracts.js  # useContracts, useMilestones
│
├── store/
│   └── use-app-store.js  # Zustand store: auth, user, profile, notifications
│
├── components/
│   ├── layout/
│   │   ├── auth-layout.jsx       # Centered card layout for login/register
│   │   └── dashboard-layout.jsx  # Sidebar + header shell for all app pages
│   └── ui/
│       └── skill-tag.jsx         # Pill tag with optional remove button
│
└── pages/
    ├── landing.jsx               # Public marketing page
    ├── login.jsx                 # Email/password login
    ├── register.jsx              # Register as CLIENT or FREELANCER
    ├── dashboard-client.jsx      # Client dashboard: jobs, contracts, stats
    ├── dashboard-freelancer.jsx  # Freelancer dashboard: bids, contracts, stats
    ├── post-project.jsx          # Client: create a new job posting
    ├── browse-projects.jsx       # Freelancer: search & filter open jobs
    ├── submit-proposal.jsx       # Freelancer: submit a bid on a job
    ├── bids.jsx                  # Client: view & manage bids | Freelancer: view & withdraw
    ├── project-tracking.jsx      # Both: contracts, milestones, progress reports
    ├── profile.jsx               # Both: view & edit own profile, manage skills
    ├── reviews.jsx               # Both: submit & view sent/received reviews
    ├── messages.jsx              # Coming soon placeholder
    └── not-found.jsx             # 404 page
```

---

## Backend Services Integrated

| Service | Status | Endpoints Used |
|---|---|---|
| **Auth Service** | ✅ Fully integrated | `/auth/register`, `/auth/login`, `/auth/logout`, `/auth/refresh` |
| **Job Service** | ✅ Fully integrated | `/jobs`, `/jobs/my-jobs`, `/jobs/{id}`, `/jobs/search`, `/jobs/{id}/cancel` |
| **Bid Service** | ✅ Fully integrated | `/bids/job/{jobId}/client/{clientId}`, `/bids/my-bids`, `/bids/{id}/accept`, `/bids/{id}/reject`, `/bids/{id}/withdraw` |
| **Contract Service** | ✅ Fully integrated | `/contracts`, `/contracts/my-contracts`, `/contracts/{id}/cancel` |
| **Milestone Service** | ✅ Fully integrated | `/milestones/contract/{id}`, `/milestones/{id}/start`, `/milestones/{id}/approve`, `/milestones/{id}/revision` |
| **Progress Reports** | ✅ Fully integrated | `/reports/milestone/{id}`, `/reports/{id}/approve`, `/reports/{id}/revision` |
| **Profile Service** | ✅ Fully integrated | `/profiles/freelancer/me`, `/profiles/client/me`, `/profiles/*/skills` |
| **Review Service** | ✅ Fully integrated | `/reviews`, `/reviews/my-reviews`, `/reviews/user/{id}` |
| **Notification Service** | ✅ Fully integrated | `/notifications/my-notifications` |
| **Message Service** | 🚧 Under development | Placeholder UI shown |

---

## Getting Started

### Prerequisites

- Node.js 18+
- All backend microservices running (Eureka + API Gateway on `:8080` + service instances)

### Install & Run

```bash
# 1. Install dependencies
npm install

# 2. (Optional) Set API URL if gateway is not on localhost:8080
cp .env.example .env

# 3. Start the dev server
npm run dev
# → http://localhost:5000
```

### Production Build

```bash
npm run build
# Output in dist/
```

---

## Authentication Flow

1. User registers or logs in → receives `accessToken` + `refreshToken` stored in `localStorage`
2. All requests include `Authorization: Bearer <accessToken>`
3. On 401, `apiFetch` auto-calls `/auth/refresh` and retries the original request once
4. On refresh failure → tokens cleared → user redirected to `/login`
5. On app load → JWT decoded **locally** (no `/auth/me` call) → profile fetched to hydrate the store

---

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_URL` | `http://localhost:8080/api` | API Gateway base URL |

---

## Known Limitations

- **Message Service** — backend routes not yet available; UI shows a "Coming Soon" placeholder
- **Contract creation after bid accept** is also triggered from the frontend as a guaranteed fallback, because the Eureka inter-service hostname can fail in local dev

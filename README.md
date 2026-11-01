# StreakBoard ⚡

> **A daily task manager & consistency tracker designed to build genuine momentum.**  
> Users plan high-impact tasks each day, complete them, earn weighted points, advance through XP levels, and visualize their consistency on a GitHub-style contribution heatmap.

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Vercel-success?style=for-the-badge&logo=vercel)](https://streak-board-black.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-Repository-181717?style=for-the-badge&logo=github)](https://github.com/ShaanGit05/Streak-Board---A-task-manager-app)
[![React](https://img.shields.io/badge/React-19.3-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-8.x-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Database%20%26%20Auth-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)

---

## 🌐 Live Application

- **Live URL**: **[https://streak-board-black.vercel.app/](https://streak-board-black.vercel.app/)**
- **Repository**: **[ShaanGit05/Streak-Board---A-task-manager-app](https://github.com/ShaanGit05/Streak-Board---A-task-manager-app)**

---

## 🌟 Core Highlights

### 1. Scoring & Point System
- **Points per completed task**: $\text{Difficulty (1–5)} \times \text{Priority Weight}$
  - **Low Priority**: $1.0\times$
  - **Medium Priority**: $1.5\times$
  - **High Priority**: $2.0\times$
- **Daily Completion %**: $\frac{\text{Earned Points}}{\text{Planned Points}} \times 100\%$
- **Daily Goal Badge**: When daily completion meets or exceeds your target percentage (default: 70%, customizable in Settings), a celebratory **🎯 Goal Met** badge and confetti celebration are awarded.

### 2. GitHub-Style Contribution Heatmap
- **Reusable Pure SVG/CSS Component**: No external charting libraries; lightweight and fast.
- **53-Week Grid**: 53 columns (weeks) $\times$ 7 rows (days: Sun–Sat), with month labels along the top and `Mon`/`Wed`/`Fri` axis markers along the left.
- **Color-Coded Contribution Tiers**:
  - `0%` / No activity: Dark gray (`#161b22`)
  - `1–25%`: Tier 1 Green (`#0e4429`)
  - `26–50%`: Tier 2 Green (`#006d32`)
  - `51–75%`: Tier 3 Green (`#26a641`)
  - `76–100%`: Tier 4 Green (`#39d353`)
  - **Rest Days**: Distinctive Blue-Gray (`#204068`) with accent borders.
- **Interactive Tooltip**: Hovering any square reveals formatted date, completion %, points earned, tasks done, and goal status (`Goal met` vs `Goal missed` or `Rest Day`).
- **Year Selector & Navigation**: Select any calendar year (e.g. 2026, 2025) and click any square to instantly jump to that day's task list.

### 3. Rest Days & Streak Engine
- **Streak Preservation**: Mark any day as a **Rest Day** to protect your consistency streak without breaking momentum.
- **Weekly Rest Day Quota**: Limit configurable in Settings (default: 2 days per calendar week, Mon–Sun).
- **Stat Cards**:
  - **Current Streak**: Active consecutive days meeting goal (bridged across rest days).
  - **Longest Streak**: All-time personal best record.
  - **Total Completed Tasks**: Lifetime count of tasks finished.
  - **Average Daily Score**: Mean points earned across active days.
  - **Best Day**: Peak points earned and date achieved.

### 4. Levels & XP Progression
- Every point earned is permanently accumulated as XP.
- **Rising Threshold Formula**: Level $N$ requires $100 \times N$ XP to complete (total XP for level $L = 50 \times L \times (L - 1)$).
- **Titles by Level**:
  - *Level 1–2*: Novice Planner
  - *Level 3–4*: Habit Builder
  - *Level 5–7*: Momentum Master
  - *Level 8–10*: Consistency Champion
  - *Level 11–14*: Focus Grandmaster
  - *Level 15+*: Streak Titan
- Live progress bar displayed in both the sidebar and user profile.

### 5. High-Impact Task Management
- **Task Attributes**: Title, optional description, category (*Study*, *Work*, *Health*, *Personal*, *Other*), priority (*Low*, *Med*, *High*), and difficulty (*1 to 5*).
- **Recurring Tasks**:
  - Recurrence types: `daily`, `weekdays` (Mon–Fri), `weekly` (select custom days).
  - Auto-generates matching instances when a date is opened with zero duplicates.
- **Task Templates**: Save any day's task set as a named template and populate any future day in 1 click.
- **Carry Over**: Copies incomplete tasks from the previous day to today in 1 click.
- **Category Breakdown**: Pure SVG donut chart on Profile page showing point distribution, percentage, and task counts across categories over the last 30 days.

---

## 🛠️ Tech Stack

| Category | Technology |
| :--- | :--- |
| **Frontend Framework** | React 19 + TypeScript |
| **Build Tool & Bundler** | Vite 8 |
| **Routing** | React Router v7 |
| **Date & Time** | date-fns (local timezone-safe) |
| **Icons & Effects** | Lucide React, canvas-confetti |
| **Styling** | Plain CSS with GitHub-dark design tokens |
| **Database & Auth** | Supabase (PostgreSQL, Triggers, Row Level Security) |
| **Testing** | Vitest (22 unit & E2E integration tests) |
| **Deployment** | Vercel (with `vercel.json` SPA rewrite rules) |

---

## 📁 Repository Structure

```
StreakBoard/
├── supabase/
│   └── schema.sql              # PostgreSQL schema, triggers, RLS, indexes
├── src/
│   ├── components/
│   │   ├── Heatmap.tsx          # 53-week pure SVG contribution graph
│   │   ├── CategoryDonut.tsx    # 30-day pure SVG donut breakdown
│   │   ├── Layout.tsx           # Sidebar, XP progress bar, mobile nav
│   │   ├── TaskModal.tsx        # Add / edit task dialog with live points
│   │   ├── RecurringTasksModal.tsx # Repeating cadence management
│   │   ├── TemplateModal.tsx    # Save & apply daily templates
│   │   └── SettingsModal.tsx    # Goal %, rest day rules, demo seeder
│   ├── pages/
│   │   ├── AuthPage.tsx         # Login, sign up, password recovery
│   │   ├── TodayPage.tsx        # Date navigation, tasks, score card
│   │   ├── HistoryPage.tsx      # Past days list with monthly filter
│   │   └── ProfilePage.tsx      # Stats, heatmap, category donut, XP
│   ├── lib/
│   │   ├── types.ts             # Domain interfaces & TypeScript types
│   │   ├── scoring.ts           # Points, completion %, weights
│   │   ├── streaks.ts           # Streak calculation & rest day bridging
│   │   ├── xp.ts                # Rising threshold level formula & titles
│   │   ├── recurrence.ts        # Idempotent recurring task generator
│   │   ├── dates.ts             # Timezone-safe local date utilities
│   │   ├── seedDemoData.ts      # 180-day demo history generator
│   │   ├── supabase.ts          # Client initializer with URL sanitization
│   │   └── api.ts               # Unified data access layer (Supabase + local)
│   ├── context/
│   │   ├── AuthContext.tsx      # Authentication & session state
│   │   ├── DataContext.tsx      # Reactive task, score & settings store
│   │   └── ToastContext.tsx     # Toast notification system
│   ├── styles/
│   │   └── globals.css          # GitHub-dark variables & responsive layout
│   └── tests/
│       ├── scoring.test.ts      # Unit tests for scoring logic
│       ├── streaks.test.ts      # Unit tests for streak & rest days
│       ├── xp.test.ts           # Unit tests for level calculations
│       ├── recurrence.test.ts   # Unit tests for cadence generation
│       └── e2e_flow.test.ts     # End-to-end integration test
├── vercel.json                  # Vercel SPA routing configuration
├── .env.example                 # Environment variables template
├── package.json
└── README.md
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- **Node.js**: v18 or higher (v22 recommended)
- **npm**: v9 or higher

### 2. Clone and Install
```bash
git clone https://github.com/ShaanGit05/Streak-Board---A-task-manager-app.git
cd Streak-Board---A-task-manager-app
npm install
```

### 3. Environment Variables
Create a local `.env` file:
```bash
cp .env.example .env
```
Add your Supabase credentials (optional — if omitted, the app runs in zero-config offline mode with persistent local storage):
```env
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

### 4. Supabase Database Setup
1. Log into your [Supabase Dashboard](https://supabase.com/dashboard).
2. Go to **SQL Editor** -> **New query**.
3. Copy and run the entire script from [`supabase/schema.sql`](supabase/schema.sql).

### 5. Run Development Server
```bash
npm run dev
```
Open **[http://localhost:5173](http://localhost:5173)** in your browser.

---

## 🧪 Testing & Production Build

### Run Unit & Integration Tests
```bash
npm test
```
All 22 tests verify scoring weights, streak bridging across rest days, level thresholds, duplicate-free recurring generation, and the full end-to-end user flow.

### Build for Production
```bash
npm run build
```

---

## ☁️ Deployment on Vercel

The repository includes [`vercel.json`](vercel.json) to configure client-side SPA routing rewrites.

1. Import the repository in [vercel.com/new](https://vercel.com/new).
2. Set Environment Variables:
   - `VITE_SUPABASE_URL`: Your Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: Your Supabase Anon Key
3. Deploy!

Live production link: **[https://streak-board-black.vercel.app/](https://streak-board-black.vercel.app/)**

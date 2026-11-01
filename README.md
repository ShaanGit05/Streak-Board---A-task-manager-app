# StreakBoard ⚡

**StreakBoard** is a daily task manager and progress tracker designed to foster genuine consistency. Instead of a plain to-do list, StreakBoard transforms daily task completion into points, levels, and a GitHub-style green contribution heatmap.

---

## 🌟 Key Features

### 1. Scoring & Difficulty System
- **Points per completed task**: `Difficulty (1–5) × Priority Weight`
  - **Low**: 1×
  - **Med**: 1.5×
  - **High**: 2×
- **Daily Completion %**: `Earned Points / Planned Points`
- **Daily Goal Badge**: When completion reaches the target percentage (default: 70%, customizable in Settings), a **🎯 Goal Met** badge is awarded and recorded.

### 2. GitHub-Style Contribution Heatmap
- Pure SVG/CSS contribution grid (53 weeks × 7 days).
- Month labels at the top, `Mon`/`Wed`/`Fri` axis labels on the left.
- 5 Green intensity tiers based on daily completion:
  - `0%`: Dark gray `#161b22`
  - `1–25%`: Tier 1 Green `#0e4429`
  - `26–50%`: Tier 2 Green `#006d32`
  - `51–75%`: Tier 3 Green `#26a641`
  - `76–100%`: Tier 4 Green `#39d353`
- **Rest Days**: Highlighted in distinctive blue-gray (`#204068`) with a border accent.
- Hover tooltip showing formatted date, completion %, points earned, tasks done, and goal status.
- Year selector (e.g. 2026, 2025).
- Click any cell to jump directly into that day's task list.

### 3. Rest Days & Streak Engine
- **Streak Preservation**: Marking a day as a "Rest Day" bridges your streak without breaking it.
- **Weekly Rest Day Quota**: Limit configurable in Settings (default: 2 days per calendar week, Mon–Sun).
- **Stat Cards**:
  - Current Streak (days)
  - Longest Streak (all-time personal best)
  - Total Completed Tasks
  - Average Daily Score
  - Best Day (date and peak points)

### 4. Levels & XP Progression
- Every point earned is added to total XP.
- Rising threshold level formula: Level $N$ requires $100 \times N$ XP to complete.
- Level progression titles:
  - *Level 1–2*: Novice Planner
  - *Level 3–4*: Habit Builder
  - *Level 5–7*: Momentum Master
  - *Level 8–10*: Consistency Champion
  - *Level 11–14*: Focus Grandmaster
  - *Level 15+*: Streak Titan
- Live progress bar displayed in both sidebar and profile.

### 5. Recurring Tasks & Templates
- **Recurring Task Cadence**:
  - `Daily`: Generates every day.
  - `Weekdays`: Generates Monday through Friday.
  - `Weekly`: Select specific days (e.g., Mon, Wed, Fri).
- **Idempotent Generation**: Auto-generates matching tasks when a date is opened with zero duplicates.
- **Task Templates**: Save any day's task set as a named template and apply it to any date in one click.
- **Carry Over**: Copies incomplete tasks from the previous day to today in one click.

### 6. Category Breakdown
- Categories: **Study**, **Work**, **Health**, **Personal**, **Other**.
- Profile page features a pure SVG donut chart showing the point distribution, percentage, and task count across the last 30 days.

---

## 🛠️ Stack

- **Frontend**: React 19, TypeScript, Vite, React Router v7, date-fns, Lucide icons, canvas-confetti.
- **Styling**: Plain CSS with GitHub-dark design system variables (`#0d1117`, `#161b22`, `#30363d`, `#c9d1d9`).
- **Database & Auth**: PostgreSQL via Supabase with Row Level Security (RLS) and triggers.
- **Offline / Zero-Config Engine**: Seamless fallback to persistent browser storage when Supabase environment variables are omitted, allowing full evaluation out-of-the-box.
- **Testing**: Vitest with unit and end-to-end integration test coverage.

---

## 📁 Project Structure

```
StreakBoard/
├── supabase/
│   └── schema.sql         # Tables, triggers, RLS policies, indexes
├── src/
│   ├── components/
│   │   ├── Heatmap.tsx             # 53-week pure SVG contribution graph
│   │   ├── CategoryDonut.tsx       # 30-day pure SVG donut breakdown
│   │   ├── Layout.tsx              # Sidebar, XP bar, mobile bottom nav
│   │   ├── TaskModal.tsx           # Add / edit task dialog
│   │   ├── RecurringTasksModal.tsx # Manage repeating schedules
│   │   ├── TemplateModal.tsx       # Save & apply daily templates
│   │   └── SettingsModal.tsx       # Goal %, rest day rules, demo seeder
│   ├── pages/
│   │   ├── AuthPage.tsx            # Login, signup, password reset
│   │   ├── TodayPage.tsx           # Task list, score card, rest day toggle
│   │   ├── HistoryPage.tsx         # Filterable past days list
│   │   └── ProfilePage.tsx         # Stats, heatmap, category donut, XP
│   ├── lib/
│   │   ├── types.ts                # TypeScript domain models
│   │   ├── scoring.ts              # Points & daily score formulas
│   │   ├── streaks.ts              # Streak engine & rest day bridge
│   │   ├── xp.ts                   # Rising threshold level calculations
│   │   ├── recurrence.ts           # Cadence matcher & duplicate prevention
│   │   ├── dates.ts                # Timezone-safe local date utilities
│   │   ├── seedDemoData.ts         # 6-month historical demo generator
│   │   ├── supabase.ts             # Supabase client initializer
│   │   └── api.ts                  # Unified data & persistence layer
│   ├── context/
│   │   ├── AuthContext.tsx         # Authentication & profile state
│   │   ├── DataContext.tsx         # Reactive task, score & settings store
│   │   └── ToastContext.tsx        # Toast notification system
│   ├── styles/
│   │   └── globals.css             # GitHub-dark variables & components
│   └── tests/
│       ├── scoring.test.ts         # Unit tests for scoring logic
│       ├── streaks.test.ts         # Unit tests for streaks & rest days
│       ├── xp.test.ts              # Unit tests for level calculations
│       ├── recurrence.test.ts      # Unit tests for recurring rules
│       └── e2e_flow.test.ts        # End-to-end user journey test
├── .env.example
├── package.json
└── README.md
```

---

## 🚀 Getting Started

### 1. Installation
Clone the repository and install dependencies:
```bash
git clone <repo-url>
cd StreakBoard
npm install
```

### 2. Environment Configuration (Optional Supabase Setup)
Copy the example environment file:
```bash
cp .env.example .env
```

If connecting to a Supabase project:
1. Create a new project at [supabase.com](https://supabase.com).
2. Navigate to **SQL Editor** and execute the entire content of [`supabase/schema.sql`](file:///D:/StreakBoard/supabase/schema.sql).
3. Set your project credentials in `.env`:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key-here
   ```

> **Note**: If you run without `.env` or leave placeholders, StreakBoard will automatically run in local mode with persistent browser storage so you can test all features immediately!

### 3. Running Development Server
Start the development server:
```bash
npm run dev
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 4. Running Unit & Integration Tests
Execute the test suite using Vitest:
```bash
npm test
```

### 5. Production Build
Build for production:
```bash
npm run build
```

---

## 🧪 Verification Walkthrough

You can test the entire workflow with the following steps:
1. **Sign Up**: Open the app, switch to "Create account", enter a display name, email, and password. (Or click **⚡ Quick Demo Sign In** for 1-click access).
2. **Create a Recurring Task**: Click **Recurring Rules** in the toolbar and add a daily routine (e.g., "Morning Workout", High priority, difficulty 4). Notice it populates the day automatically.
3. **Add Tasks & Check Scoring**: Add custom tasks with different difficulty and priority weights. Observe live earned vs. planned points.
4. **Complete Tasks**: Mark tasks done to achieve $\ge 70\%$ completion. A **🎯 Goal Met** badge and confetti celebration will trigger.
5. **Save & Apply Templates**: Click **Templates** -> "Save Day as Template". Switch to tomorrow and click "Apply Template" to verify single-click population.
6. **Rest Day & Streak Protection**: Toggle **Mark Rest Day**. Notice the blue-gray styling and rest day banner. The streak holds without breaking.
7. **Profile & Heatmap**: Navigate to Profile to see the 53-week green contribution heatmap, active days count, current/longest streak, and the 30-day category breakdown donut chart.
8. **Demo Seeder**: Click **Settings** (gear icon) -> **🌱 Generate 6 Months Demo Data** to populate 180 days of realistic history and view your full heatmap tiers immediately.

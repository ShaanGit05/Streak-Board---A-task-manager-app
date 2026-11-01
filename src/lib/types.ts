export type TaskCategory = 'Study' | 'Work' | 'Health' | 'Personal' | 'Other';

export type TaskPriority = 'Low' | 'Med' | 'High';

export type RepeatType = 'none' | 'daily' | 'weekdays' | 'weekly';

export interface Profile {
  id: string;
  email: string;
  display_name: string;
  avatar_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface Task {
  id: string;
  user_id: string;
  task_date: string; // YYYY-MM-DD local format
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  difficulty: number; // 1 to 5
  is_completed: boolean;
  recurring_rule_id?: string;
  created_at?: string;
  updated_at?: string;
}

export interface RecurringRule {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  difficulty: number;
  repeat_type: RepeatType;
  repeat_days?: number[]; // 0=Sun, 1=Mon, ..., 6=Sat
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface TaskTemplate {
  id: string;
  user_id: string;
  name: string;
  description?: string;
  created_at?: string;
  items?: TemplateItem[];
}

export interface TemplateItem {
  id: string;
  template_id: string;
  title: string;
  description?: string;
  category: TaskCategory;
  priority: TaskPriority;
  difficulty: number;
}

export interface DailyScore {
  id?: string;
  user_id: string;
  score_date: string; // YYYY-MM-DD
  points_earned: number;
  points_total: number;
  completion_pct: number;
  tasks_completed: number;
  tasks_total: number;
  is_rest_day: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface UserSettings {
  user_id: string;
  target_completion_pct: number; // default 70
  max_rest_days_per_week: number; // default 2
  created_at?: string;
  updated_at?: string;
}

export interface DailyScoreSummary {
  points_earned: number;
  points_total: number;
  completion_pct: number;
  tasks_completed: number;
  tasks_total: number;
  is_rest_day: boolean;
  goal_met: boolean;
}

export interface StreakStats {
  currentStreak: number;
  longestStreak: number;
  totalCompletedTasks: number;
  averageDailyScore: number;
  bestDay: {
    date: string;
    points: number;
  } | null;
  activeDaysCount: number;
}

export interface LevelInfo {
  level: number;
  title: string;
  totalXP: number;
  currentLevelXP: number;
  xpNeededForNextLevel: number;
  progressPct: number;
}

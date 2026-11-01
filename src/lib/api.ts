import { supabase, isSupabaseConfigured } from './supabase';
import type {
  Profile,
  Task,
  DailyScore,
  UserSettings,
  RecurringRule,
  TaskTemplate,
  TemplateItem,
} from './types';
import { generateDemoSeedData } from './seedDemoData';
import { calculateDailyScore } from './scoring';

const LOCAL_STORAGE_KEYS = {
  SESSION: 'streakboard_session',
  USERS: 'streakboard_users',
  PROFILES: 'streakboard_profiles',
  SETTINGS: 'streakboard_settings',
  TASKS: 'streakboard_tasks',
  SCORES: 'streakboard_scores',
  RULES: 'streakboard_recurring_rules',
  TEMPLATES: 'streakboard_templates',
};

// --- Mock / Local Storage Helpers ---

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : defaultValue;
  } catch {
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error('Failed to save to localStorage', e);
  }
}

// --- Auth Service ---

export interface AuthSession {
  user: {
    id: string;
    email: string;
    display_name: string;
  };
}

export const api = {
  // Auth
  async signUp(email: string, password: string, displayName: string): Promise<AuthSession> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { display_name: displayName },
        },
      });
      if (error) throw error;
      if (!data.user) throw new Error('Sign up failed: no user returned');

      // Ensure profile exists in table
      await supabase.from('profiles').upsert({
        id: data.user.id,
        email,
        display_name: displayName,
      });

      // Ensure settings exist
      await supabase.from('user_settings').upsert({
        user_id: data.user.id,
        target_completion_pct: 70,
        max_rest_days_per_week: 2,
      });

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          display_name: displayName,
        },
      };
    } else {
      // Local persistent storage
      const users = getFromStorage<Record<string, { email: string; password: string; id: string; display_name: string }>>(
        LOCAL_STORAGE_KEYS.USERS,
        {}
      );

      const normalizedEmail = email.toLowerCase().trim();
      if (users[normalizedEmail]) {
        throw new Error('An account with this email already exists.');
      }

      const id = 'user_' + Math.random().toString(36).substring(2, 11);
      users[normalizedEmail] = { id, email: normalizedEmail, password, display_name: displayName };
      saveToStorage(LOCAL_STORAGE_KEYS.USERS, users);

      // Save profile
      const profiles = getFromStorage<Record<string, Profile>>(LOCAL_STORAGE_KEYS.PROFILES, {});
      profiles[id] = {
        id,
        email: normalizedEmail,
        display_name: displayName,
        created_at: new Date().toISOString(),
      };
      saveToStorage(LOCAL_STORAGE_KEYS.PROFILES, profiles);

      // Save settings
      const settings = getFromStorage<Record<string, UserSettings>>(LOCAL_STORAGE_KEYS.SETTINGS, {});
      settings[id] = {
        user_id: id,
        target_completion_pct: 70,
        max_rest_days_per_week: 2,
        created_at: new Date().toISOString(),
      };
      saveToStorage(LOCAL_STORAGE_KEYS.SETTINGS, settings);

      const session: AuthSession = {
        user: { id, email: normalizedEmail, display_name: displayName },
      };
      saveToStorage(LOCAL_STORAGE_KEYS.SESSION, session);
      return session;
    }
  },

  async signIn(email: string, password: string): Promise<AuthSession> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      if (!data.user) throw new Error('Invalid login credentials');

      // Fetch profile display name
      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.user.id)
        .single();

      return {
        user: {
          id: data.user.id,
          email: data.user.email || email,
          display_name: profile?.display_name || data.user.user_metadata?.display_name || email.split('@')[0],
        },
      };
    } else {
      const users = getFromStorage<Record<string, { email: string; password: string; id: string; display_name: string }>>(
        LOCAL_STORAGE_KEYS.USERS,
        {}
      );
      const normalizedEmail = email.toLowerCase().trim();
      const existing = users[normalizedEmail];

      if (!existing || existing.password !== password) {
        throw new Error('Invalid email or password.');
      }

      const session: AuthSession = {
        user: {
          id: existing.id,
          email: existing.email,
          display_name: existing.display_name,
        },
      };
      saveToStorage(LOCAL_STORAGE_KEYS.SESSION, session);
      return session;
    }
  },

  async signOut(): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.auth.signOut();
    }
    localStorage.removeItem(LOCAL_STORAGE_KEYS.SESSION);
  },

  async getSession(): Promise<AuthSession | null> {
    if (isSupabaseConfigured() && supabase) {
      const { data } = await supabase.auth.getSession();
      if (!data.session?.user) return null;

      const { data: profile } = await supabase
        .from('profiles')
        .select('display_name')
        .eq('id', data.session.user.id)
        .single();

      return {
        user: {
          id: data.session.user.id,
          email: data.session.user.email || '',
          display_name:
            profile?.display_name ||
            data.session.user.user_metadata?.display_name ||
            (data.session.user.email ? data.session.user.email.split('@')[0] : 'User'),
        },
      };
    } else {
      return getFromStorage<AuthSession | null>(LOCAL_STORAGE_KEYS.SESSION, null);
    }
  },

  async resetPassword(email: string): Promise<string> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.auth.resetPasswordForEmail(email);
      if (error) throw error;
      return 'Password reset link sent to your email!';
    } else {
      return `Password reset simulation: Instructions sent to ${email}. In offline/demo mode, you can log in directly or create a new account.`;
    }
  },

  // Profiles
  async getProfile(userId: string): Promise<Profile> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error) throw error;
      return data;
    } else {
      const profiles = getFromStorage<Record<string, Profile>>(LOCAL_STORAGE_KEYS.PROFILES, {});
      return (
        profiles[userId] || {
          id: userId,
          email: 'user@example.com',
          display_name: 'Productive Maker',
          created_at: new Date().toISOString(),
        }
      );
    }
  },

  async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const profiles = getFromStorage<Record<string, Profile>>(LOCAL_STORAGE_KEYS.PROFILES, {});
      const updated = { ...profiles[userId], ...updates, updated_at: new Date().toISOString() };
      profiles[userId] = updated;
      saveToStorage(LOCAL_STORAGE_KEYS.PROFILES, profiles);

      // Also update session display_name if applicable
      const session = getFromStorage<AuthSession | null>(LOCAL_STORAGE_KEYS.SESSION, null);
      if (session && session.user.id === userId && updates.display_name) {
        session.user.display_name = updates.display_name;
        saveToStorage(LOCAL_STORAGE_KEYS.SESSION, session);
      }
      return updated;
    }
  },

  // User Settings
  async getSettings(userId: string): Promise<UserSettings> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('user_settings')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();
      if (error) throw error;
      if (data) return data;
      // Default insert if missing
      const defaultSettings = {
        user_id: userId,
        target_completion_pct: 70,
        max_rest_days_per_week: 2,
      };
      await supabase.from('user_settings').insert(defaultSettings);
      return defaultSettings;
    } else {
      const settings = getFromStorage<Record<string, UserSettings>>(LOCAL_STORAGE_KEYS.SETTINGS, {});
      if (!settings[userId]) {
        settings[userId] = {
          user_id: userId,
          target_completion_pct: 70,
          max_rest_days_per_week: 2,
          created_at: new Date().toISOString(),
        };
        saveToStorage(LOCAL_STORAGE_KEYS.SETTINGS, settings);
      }
      return settings[userId];
    }
  },

  async updateSettings(userId: string, updates: Partial<UserSettings>): Promise<UserSettings> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('user_settings')
        .upsert({ user_id: userId, ...updates, updated_at: new Date().toISOString() })
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const settings = getFromStorage<Record<string, UserSettings>>(LOCAL_STORAGE_KEYS.SETTINGS, {});
      const updated = {
        ...settings[userId],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      settings[userId] = updated;
      saveToStorage(LOCAL_STORAGE_KEYS.SETTINGS, settings);
      return updated;
    }
  },

  // Tasks
  async getTasks(userId: string, dateStr?: string): Promise<Task[]> {
    if (isSupabaseConfigured() && supabase) {
      let query = supabase.from('tasks').select('*').eq('user_id', userId);
      if (dateStr) {
        query = query.eq('task_date', dateStr);
      }
      const { data, error } = await query.order('created_at', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const allTasks = getFromStorage<Task[]>(LOCAL_STORAGE_KEYS.TASKS, []);
      const userTasks = allTasks.filter((t) => t.user_id === userId);
      if (dateStr) {
        return userTasks.filter((t) => t.task_date === dateStr);
      }
      return userTasks;
    }
  },

  async createTask(taskData: Omit<Task, 'id'>): Promise<Task> {
    const newTask: Task = {
      ...taskData,
      id: 'task_' + Math.random().toString(36).substring(2, 11),
      created_at: taskData.created_at || new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('tasks').insert(taskData).select().single();
      if (error) throw error;
      await this.syncDailyScore(data.user_id, data.task_date);
      return data;
    } else {
      const allTasks = getFromStorage<Task[]>(LOCAL_STORAGE_KEYS.TASKS, []);
      allTasks.push(newTask);
      saveToStorage(LOCAL_STORAGE_KEYS.TASKS, allTasks);
      await this.syncDailyScore(newTask.user_id, newTask.task_date);
      return newTask;
    }
  },

  async createMultipleTasks(tasksData: Omit<Task, 'id'>[]): Promise<Task[]> {
    if (tasksData.length === 0) return [];

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase.from('tasks').insert(tasksData).select();
      if (error) throw error;
      const date = tasksData[0].task_date;
      await this.syncDailyScore(tasksData[0].user_id, date);
      return data || [];
    } else {
      const allTasks = getFromStorage<Task[]>(LOCAL_STORAGE_KEYS.TASKS, []);
      const created: Task[] = tasksData.map((t) => ({
        ...t,
        id: 'task_' + Math.random().toString(36).substring(2, 11),
        created_at: t.created_at || new Date().toISOString(),
      }));
      allTasks.push(...created);
      saveToStorage(LOCAL_STORAGE_KEYS.TASKS, allTasks);
      await this.syncDailyScore(tasksData[0].user_id, tasksData[0].task_date);
      return created;
    }
  },

  async updateTask(taskId: string, updates: Partial<Task>): Promise<Task> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('tasks')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', taskId)
        .select()
        .single();
      if (error) throw error;
      await this.syncDailyScore(data.user_id, data.task_date);
      return data;
    } else {
      const allTasks = getFromStorage<Task[]>(LOCAL_STORAGE_KEYS.TASKS, []);
      const index = allTasks.findIndex((t) => t.id === taskId);
      if (index === -1) throw new Error('Task not found');
      const updated = {
        ...allTasks[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      allTasks[index] = updated;
      saveToStorage(LOCAL_STORAGE_KEYS.TASKS, allTasks);
      await this.syncDailyScore(updated.user_id, updated.task_date);
      return updated;
    }
  },

  async deleteTask(taskId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { data: existing } = await supabase
        .from('tasks')
        .select('user_id, task_date')
        .eq('id', taskId)
        .single();
      const { error } = await supabase.from('tasks').delete().eq('id', taskId);
      if (error) throw error;
      if (existing) {
        await this.syncDailyScore(existing.user_id, existing.task_date);
      }
    } else {
      const allTasks = getFromStorage<Task[]>(LOCAL_STORAGE_KEYS.TASKS, []);
      const task = allTasks.find((t) => t.id === taskId);
      if (task) {
        const filtered = allTasks.filter((t) => t.id !== taskId);
        saveToStorage(LOCAL_STORAGE_KEYS.TASKS, filtered);
        await this.syncDailyScore(task.user_id, task.task_date);
      }
    }
  },

  async carryOverTasks(userId: string, fromDate: string, toDate: string): Promise<number> {
    const fromTasks = await this.getTasks(userId, fromDate);
    const incomplete = fromTasks.filter((t) => !t.is_completed);

    if (incomplete.length === 0) return 0;

    const toTasks = await this.getTasks(userId, toDate);
    const existingTitles = new Set(toTasks.map((t) => t.title.toLowerCase().trim()));

    const newTasksToCreate: Omit<Task, 'id'>[] = [];
    for (const task of incomplete) {
      if (!existingTitles.has(task.title.toLowerCase().trim())) {
        newTasksToCreate.push({
          user_id: userId,
          task_date: toDate,
          title: task.title,
          description: task.description,
          category: task.category,
          priority: task.priority,
          difficulty: task.difficulty,
          is_completed: false,
          created_at: new Date().toISOString(),
        });
        existingTitles.add(task.title.toLowerCase().trim());
      }
    }

    if (newTasksToCreate.length > 0) {
      await this.createMultipleTasks(newTasksToCreate);
    }
    return newTasksToCreate.length;
  },

  // Daily Scores
  async getDailyScores(userId: string): Promise<DailyScore[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('daily_scores')
        .select('*')
        .eq('user_id', userId)
        .order('score_date', { ascending: true });
      if (error) throw error;
      return data || [];
    } else {
      const allScores = getFromStorage<DailyScore[]>(LOCAL_STORAGE_KEYS.SCORES, []);
      return allScores.filter((s) => s.user_id === userId);
    }
  },

  async syncDailyScore(userId: string, dateStr: string): Promise<DailyScore> {
    const tasks = await this.getTasks(userId, dateStr);
    const scores = await this.getDailyScores(userId);
    const existing = scores.find((s) => s.score_date === dateStr);
    const isRestDay = existing ? existing.is_rest_day : false;

    const summary = calculateDailyScore(tasks, isRestDay, 70);

    const scoreData: DailyScore = {
      id: existing?.id || 'score_' + Math.random().toString(36).substring(2, 11),
      user_id: userId,
      score_date: dateStr,
      points_earned: summary.points_earned,
      points_total: summary.points_total,
      completion_pct: summary.completion_pct,
      tasks_completed: summary.tasks_completed,
      tasks_total: summary.tasks_total,
      is_rest_day: isRestDay,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('daily_scores')
        .upsert(
          {
            user_id: userId,
            score_date: dateStr,
            points_earned: summary.points_earned,
            points_total: summary.points_total,
            completion_pct: summary.completion_pct,
            tasks_completed: summary.tasks_completed,
            tasks_total: summary.tasks_total,
            is_rest_day: isRestDay,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,score_date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const allScores = getFromStorage<DailyScore[]>(LOCAL_STORAGE_KEYS.SCORES, []);
      const index = allScores.findIndex((s) => s.user_id === userId && s.score_date === dateStr);
      if (index >= 0) {
        allScores[index] = { ...allScores[index], ...scoreData };
      } else {
        allScores.push(scoreData);
      }
      saveToStorage(LOCAL_STORAGE_KEYS.SCORES, allScores);
      return scoreData;
    }
  },

  async toggleRestDay(userId: string, dateStr: string, isRestDay: boolean): Promise<DailyScore> {
    const scores = await this.getDailyScores(userId);
    const existing = scores.find((s) => s.score_date === dateStr);
    const tasks = await this.getTasks(userId, dateStr);
    const summary = calculateDailyScore(tasks, isRestDay, 70);

    const updatedScore: DailyScore = {
      id: existing?.id || 'score_' + Math.random().toString(36).substring(2, 11),
      user_id: userId,
      score_date: dateStr,
      points_earned: summary.points_earned,
      points_total: summary.points_total,
      completion_pct: summary.completion_pct,
      tasks_completed: summary.tasks_completed,
      tasks_total: summary.tasks_total,
      is_rest_day: isRestDay,
      updated_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('daily_scores')
        .upsert(
          {
            user_id: userId,
            score_date: dateStr,
            points_earned: summary.points_earned,
            points_total: summary.points_total,
            completion_pct: summary.completion_pct,
            tasks_completed: summary.tasks_completed,
            tasks_total: summary.tasks_total,
            is_rest_day: isRestDay,
            updated_at: new Date().toISOString(),
          },
          { onConflict: 'user_id,score_date' }
        )
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const allScores = getFromStorage<DailyScore[]>(LOCAL_STORAGE_KEYS.SCORES, []);
      const index = allScores.findIndex((s) => s.user_id === userId && s.score_date === dateStr);
      if (index >= 0) {
        allScores[index] = { ...allScores[index], ...updatedScore };
      } else {
        allScores.push(updatedScore);
      }
      saveToStorage(LOCAL_STORAGE_KEYS.SCORES, allScores);
      return updatedScore;
    }
  },

  // Recurring Rules
  async getRecurringRules(userId: string): Promise<RecurringRule[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('recurring_rules')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } else {
      const rules = getFromStorage<RecurringRule[]>(LOCAL_STORAGE_KEYS.RULES, []);
      return rules.filter((r) => r.user_id === userId);
    }
  },

  async createRecurringRule(ruleData: Omit<RecurringRule, 'id'>): Promise<RecurringRule> {
    const newRule: RecurringRule = {
      ...ruleData,
      id: 'rule_' + Math.random().toString(36).substring(2, 11),
      created_at: new Date().toISOString(),
    };

    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('recurring_rules')
        .insert(ruleData)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const rules = getFromStorage<RecurringRule[]>(LOCAL_STORAGE_KEYS.RULES, []);
      rules.push(newRule);
      saveToStorage(LOCAL_STORAGE_KEYS.RULES, rules);
      return newRule;
    }
  },

  async updateRecurringRule(ruleId: string, updates: Partial<RecurringRule>): Promise<RecurringRule> {
    if (isSupabaseConfigured() && supabase) {
      const { data, error } = await supabase
        .from('recurring_rules')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', ruleId)
        .select()
        .single();
      if (error) throw error;
      return data;
    } else {
      const rules = getFromStorage<RecurringRule[]>(LOCAL_STORAGE_KEYS.RULES, []);
      const index = rules.findIndex((r) => r.id === ruleId);
      if (index === -1) throw new Error('Rule not found');
      const updated = {
        ...rules[index],
        ...updates,
        updated_at: new Date().toISOString(),
      };
      rules[index] = updated;
      saveToStorage(LOCAL_STORAGE_KEYS.RULES, rules);
      return updated;
    }
  },

  async deleteRecurringRule(ruleId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('recurring_rules').delete().eq('id', ruleId);
      if (error) throw error;
    } else {
      const rules = getFromStorage<RecurringRule[]>(LOCAL_STORAGE_KEYS.RULES, []);
      saveToStorage(
        LOCAL_STORAGE_KEYS.RULES,
        rules.filter((r) => r.id !== ruleId)
      );
    }
  },

  // Templates
  async getTemplates(userId: string): Promise<TaskTemplate[]> {
    if (isSupabaseConfigured() && supabase) {
      const { data: templates, error: tErr } = await supabase
        .from('task_templates')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });
      if (tErr) throw tErr;

      if (!templates || templates.length === 0) return [];

      const { data: items, error: iErr } = await supabase
        .from('template_items')
        .select('*')
        .in('template_id', templates.map((t) => t.id));
      if (iErr) throw iErr;

      return templates.map((t) => ({
        ...t,
        items: items?.filter((item) => item.template_id === t.id) || [],
      }));
    } else {
      const templates = getFromStorage<TaskTemplate[]>(LOCAL_STORAGE_KEYS.TEMPLATES, []);
      return templates.filter((t) => t.user_id === userId);
    }
  },

  async createTemplate(
    userId: string,
    name: string,
    description: string,
    items: Omit<TemplateItem, 'id' | 'template_id'>[]
  ): Promise<TaskTemplate> {
    if (isSupabaseConfigured() && supabase) {
      const { data: template, error: tErr } = await supabase
        .from('task_templates')
        .insert({ user_id: userId, name, description })
        .select()
        .single();
      if (tErr) throw tErr;

      if (items.length > 0) {
        const itemRows = items.map((item) => ({
          template_id: template.id,
          ...item,
        }));
        const { data: insertedItems, error: iErr } = await supabase
          .from('template_items')
          .insert(itemRows)
          .select();
        if (iErr) throw iErr;
        return { ...template, items: insertedItems || [] };
      }

      return { ...template, items: [] };
    } else {
      const templates = getFromStorage<TaskTemplate[]>(LOCAL_STORAGE_KEYS.TEMPLATES, []);
      const templateId = 'template_' + Math.random().toString(36).substring(2, 11);
      const fullItems: TemplateItem[] = items.map((item) => ({
        ...item,
        id: 'item_' + Math.random().toString(36).substring(2, 11),
        template_id: templateId,
      }));

      const newTemplate: TaskTemplate = {
        id: templateId,
        user_id: userId,
        name,
        description,
        created_at: new Date().toISOString(),
        items: fullItems,
      };

      templates.push(newTemplate);
      saveToStorage(LOCAL_STORAGE_KEYS.TEMPLATES, templates);
      return newTemplate;
    }
  },

  async deleteTemplate(templateId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      const { error } = await supabase.from('task_templates').delete().eq('id', templateId);
      if (error) throw error;
    } else {
      const templates = getFromStorage<TaskTemplate[]>(LOCAL_STORAGE_KEYS.TEMPLATES, []);
      saveToStorage(
        LOCAL_STORAGE_KEYS.TEMPLATES,
        templates.filter((t) => t.id !== templateId)
      );
    }
  },

  async applyTemplateToDate(userId: string, templateId: string, dateStr: string): Promise<Task[]> {
    const templates = await this.getTemplates(userId);
    const target = templates.find((t) => t.id === templateId);
    if (!target || !target.items || target.items.length === 0) {
      return [];
    }

    const currentTasks = await this.getTasks(userId, dateStr);
    const existingTitles = new Set(currentTasks.map((t) => t.title.toLowerCase().trim()));

    const newTasks: Omit<Task, 'id'>[] = [];
    for (const item of target.items) {
      if (!existingTitles.has(item.title.toLowerCase().trim())) {
        newTasks.push({
          user_id: userId,
          task_date: dateStr,
          title: item.title,
          description: item.description,
          category: item.category,
          priority: item.priority,
          difficulty: item.difficulty,
          is_completed: false,
          created_at: new Date().toISOString(),
        });
        existingTitles.add(item.title.toLowerCase().trim());
      }
    }

    if (newTasks.length > 0) {
      return await this.createMultipleTasks(newTasks);
    }
    return [];
  },

  // Demo Seed Data
  async seedDemoData(userId: string): Promise<{ tasksCount: number; scoresCount: number }> {
    const { tasks, dailyScores } = generateDemoSeedData(userId);

    if (isSupabaseConfigured() && supabase) {
      // Chunked insert to prevent payload limits
      const chunkSize = 100;
      for (let i = 0; i < tasks.length; i += chunkSize) {
        const chunk = tasks.slice(i, i + chunkSize);
        await supabase.from('tasks').upsert(chunk);
      }
      for (let i = 0; i < dailyScores.length; i += chunkSize) {
        const chunk = dailyScores.slice(i, i + chunkSize);
        await supabase.from('daily_scores').upsert(chunk, { onConflict: 'user_id,score_date' });
      }
    } else {
      const allTasks = getFromStorage<Task[]>(LOCAL_STORAGE_KEYS.TASKS, []).filter(
        (t) => t.user_id !== userId
      );
      allTasks.push(...tasks);
      saveToStorage(LOCAL_STORAGE_KEYS.TASKS, allTasks);

      const allScores = getFromStorage<DailyScore[]>(LOCAL_STORAGE_KEYS.SCORES, []).filter(
        (s) => s.user_id !== userId
      );
      allScores.push(...dailyScores);
      saveToStorage(LOCAL_STORAGE_KEYS.SCORES, allScores);
    }

    return { tasksCount: tasks.length, scoresCount: dailyScores.length };
  },

  async clearUserData(userId: string): Promise<void> {
    if (isSupabaseConfigured() && supabase) {
      await supabase.from('tasks').delete().eq('user_id', userId);
      await supabase.from('daily_scores').delete().eq('user_id', userId);
      await supabase.from('recurring_rules').delete().eq('user_id', userId);
      await supabase.from('task_templates').delete().eq('user_id', userId);
    } else {
      const tasks = getFromStorage<Task[]>(LOCAL_STORAGE_KEYS.TASKS, []).filter(
        (t) => t.user_id !== userId
      );
      saveToStorage(LOCAL_STORAGE_KEYS.TASKS, tasks);

      const scores = getFromStorage<DailyScore[]>(LOCAL_STORAGE_KEYS.SCORES, []).filter(
        (s) => s.user_id !== userId
      );
      saveToStorage(LOCAL_STORAGE_KEYS.SCORES, scores);

      const rules = getFromStorage<RecurringRule[]>(LOCAL_STORAGE_KEYS.RULES, []).filter(
        (r) => r.user_id !== userId
      );
      saveToStorage(LOCAL_STORAGE_KEYS.RULES, rules);

      const templates = getFromStorage<TaskTemplate[]>(LOCAL_STORAGE_KEYS.TEMPLATES, []).filter(
        (t) => t.user_id !== userId
      );
      saveToStorage(LOCAL_STORAGE_KEYS.TEMPLATES, templates);
    }
  },
};

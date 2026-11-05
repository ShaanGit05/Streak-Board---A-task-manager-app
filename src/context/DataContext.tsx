import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from './AuthContext';
import { useToast } from './ToastContext';
import { api } from '../lib/api';
import type {
  Task,
  DailyScore,
  UserSettings,
  RecurringRule,
  TaskTemplate,
  TemplateItem,
  DailyScoreSummary,
  StreakStats,
  LevelInfo,
} from '../lib/types';
import {
  getTodayDateStr,
  addDaysToDateStr,
  getDatesInWeek,
  formatLocalDate,
} from '../lib/dates';
import { calculateDailyScore } from '../lib/scoring';
import { calculateStreakStats } from '../lib/streaks';
import { calculateLevel } from '../lib/xp';
import { generateTasksForDate } from '../lib/recurrence';
import confetti from 'canvas-confetti';

interface DataContextType {
  selectedDate: string;
  setSelectedDate: (date: string) => void;
  goToPrevDay: () => void;
  goToNextDay: () => void;
  goToToday: () => void;
  
  tasks: Task[];
  allTasks: Task[];
  allScores: DailyScore[];
  settings: UserSettings;
  recurringRules: RecurringRule[];
  templates: TaskTemplate[];
  loading: boolean;

  // Computed state
  dailySummary: DailyScoreSummary;
  streakStats: StreakStats;
  levelInfo: LevelInfo;
  restDaysInCurrentWeek: number;
  canAddRestDay: boolean;

  // Actions
  createTask: (data: Omit<Task, 'id' | 'user_id' | 'task_date' | 'is_completed'> & { is_completed?: boolean }) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  toggleTask: (task: Task) => Promise<void>;
  toggleRestDay: (dateStr?: string) => Promise<boolean>;
  carryOverIncompleteTasks: (fromDateStr?: string) => Promise<number>;
  
  // Recurring rules
  createRecurringRule: (rule: Omit<RecurringRule, 'id' | 'user_id'>) => Promise<void>;
  updateRecurringRule: (id: string, updates: Partial<RecurringRule>) => Promise<void>;
  deleteRecurringRule: (id: string) => Promise<void>;
  
  // Templates
  saveDayAsTemplate: (name: string, description?: string) => Promise<void>;
  applyTemplate: (templateId: string) => Promise<number>;
  deleteTemplate: (templateId: string) => Promise<void>;
  
  // Settings & Demo
  updateSettings: (updates: Partial<UserSettings>) => Promise<void>;
  loadDemoData: () => Promise<void>;
  clearAllData: () => Promise<void>;
  refreshAll: () => Promise<void>;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export const DataProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const { addToast } = useToast();

  const [selectedDate, setSelectedDateState] = useState<string>(getTodayDateStr());
  const [tasks, setTasks] = useState<Task[]>([]);
  const [allTasks, setAllTasks] = useState<Task[]>([]);
  const [allScores, setAllScores] = useState<DailyScore[]>([]);
  const [settings, setSettings] = useState<UserSettings>({
    user_id: user?.id || '',
    target_completion_pct: 70,
    max_rest_days_per_week: 2,
  });
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [templates, setTemplates] = useState<TaskTemplate[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Load everything for current user
  const refreshAll = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      let [userSettings, userScores, userRules, userTemplates, currentTasks, fullTasksList] =
        await Promise.all([
          api.getSettings(user.id),
          api.getDailyScores(user.id),
          api.getRecurringRules(user.id),
          api.getTemplates(user.id),
          api.getTasks(user.id, selectedDate),
          api.getTasks(user.id),
        ]);

      // Clean up any uncompleted tasks whose recurring rule was deleted OR were mistakenly generated prior to rule creation date
      const activeRulesMap = new Map(userRules.map((r) => [r.id, r]));
      const invalidTasks = fullTasksList.filter((t) => {
        if (!t.recurring_rule_id || t.is_completed) return false;
        const rule = activeRulesMap.get(t.recurring_rule_id);
        if (!rule) return true; // Rule was deleted
        if (rule.created_at) {
          const ruleCreationDate = formatLocalDate(new Date(rule.created_at));
          if (t.task_date < ruleCreationDate) return true; // Retroactive task generated on day before rule was created
        }
        return false;
      });

      if (invalidTasks.length > 0) {
        const invalidIds = new Set(invalidTasks.map((t) => t.id));
        for (const task of invalidTasks) {
          await api.deleteTask(task.id);
        }
        currentTasks = currentTasks.filter((t) => !invalidIds.has(t.id));
        fullTasksList = fullTasksList.filter((t) => !invalidIds.has(t.id));
        userScores = await api.getDailyScores(user.id);
      }

      setSettings(userSettings);
      setAllScores(userScores);
      setRecurringRules(userRules);
      setTemplates(userTemplates);
      setTasks(currentTasks);
      setAllTasks(fullTasksList);

      // Check if recurring tasks should be generated for selectedDate (today or future only)
      const todayStr = getTodayDateStr();
      if (selectedDate >= todayStr && userRules.length > 0) {
        const generated = generateTasksForDate(userRules, selectedDate, currentTasks, user.id);
        if (generated.length > 0) {
          const inserted = await api.createMultipleTasks(generated);
          setTasks((prev) => [...prev, ...inserted]);
          setAllTasks((prev) => [...prev, ...inserted]);
          const updatedScore = await api.getDailyScores(user.id);
          setAllScores(updatedScore);
        }
      }
    } catch (err) {
      console.error('Error refreshing data:', err);
    } finally {
      setLoading(false);
    }
  }, [user, selectedDate]);

  useEffect(() => {
    refreshAll();
  }, [refreshAll]);

  // Handle changing dates and auto-generating recurring tasks
  const setSelectedDate = useCallback(
    async (newDate: string) => {
      setSelectedDateState(newDate);
      if (!user) return;
      try {
        const dateTasks = await api.getTasks(user.id, newDate);
        setTasks(dateTasks);

        const todayStr = getTodayDateStr();
        if (newDate >= todayStr && recurringRules.length > 0) {
          const generated = generateTasksForDate(recurringRules, newDate, dateTasks, user.id);
          if (generated.length > 0) {
            const inserted = await api.createMultipleTasks(generated);
            setTasks((prev) => [...prev, ...inserted]);
            setAllTasks((prev) => [...prev, ...inserted]);
            const updatedScores = await api.getDailyScores(user.id);
            setAllScores(updatedScores);
          }
        }
      } catch (err) {
        console.error('Error loading date tasks:', err);
      }
    },
    [user, recurringRules]
  );

  const goToPrevDay = useCallback(() => {
    setSelectedDate(addDaysToDateStr(selectedDate, -1));
  }, [selectedDate, setSelectedDate]);

  const goToNextDay = useCallback(() => {
    setSelectedDate(addDaysToDateStr(selectedDate, 1));
  }, [selectedDate, setSelectedDate]);

  const goToToday = useCallback(() => {
    setSelectedDate(getTodayDateStr());
  }, [setSelectedDate]);

  // Check rest day status for selected date
  const isSelectedDateRestDay = useMemo(() => {
    const score = allScores.find((s) => s.score_date === selectedDate);
    return score ? score.is_rest_day : false;
  }, [allScores, selectedDate]);

  // Rest days in the week of selectedDate
  const restDaysInCurrentWeek = useMemo(() => {
    const weekDates = new Set(getDatesInWeek(selectedDate));
    return allScores.filter((s) => weekDates.has(s.score_date) && s.is_rest_day).length;
  }, [allScores, selectedDate]);

  const canAddRestDay = useMemo(() => {
    if (isSelectedDateRestDay) return true; // Can toggle off
    return restDaysInCurrentWeek < settings.max_rest_days_per_week;
  }, [isSelectedDateRestDay, restDaysInCurrentWeek, settings.max_rest_days_per_week]);

  // Daily Score Summary for selected date
  const dailySummary = useMemo(() => {
    return calculateDailyScore(tasks, isSelectedDateRestDay, settings.target_completion_pct);
  }, [tasks, isSelectedDateRestDay, settings.target_completion_pct]);

  // Effective scores incorporating today's live completion state for instant reactive streak & XP updates
  const effectiveScores = useMemo(() => {
    const todayStr = getTodayDateStr();
    if (selectedDate === todayStr && tasks.length > 0) {
      const todayScoreIndex = allScores.findIndex((s) => s.score_date === todayStr);
      const liveTodayScore: DailyScore = {
        id: todayScoreIndex >= 0 ? allScores[todayScoreIndex].id : 'today_live',
        user_id: user?.id || '',
        score_date: todayStr,
        points_earned: dailySummary.points_earned,
        points_total: dailySummary.points_total,
        completion_pct: dailySummary.completion_pct,
        tasks_completed: dailySummary.tasks_completed,
        tasks_total: dailySummary.tasks_total,
        is_rest_day: isSelectedDateRestDay,
      };
      if (todayScoreIndex >= 0) {
        return allScores.map((s, idx) => (idx === todayScoreIndex ? liveTodayScore : s));
      } else {
        return [...allScores, liveTodayScore];
      }
    }
    return allScores;
  }, [allScores, selectedDate, tasks, dailySummary, isSelectedDateRestDay, user?.id]);

  // Streak Stats
  const streakStats = useMemo(() => {
    return calculateStreakStats(effectiveScores, settings.target_completion_pct, getTodayDateStr());
  }, [effectiveScores, settings.target_completion_pct]);

  // Level & XP calculation
  const levelInfo = useMemo(() => {
    // Total XP = total points earned across all scores
    const totalPoints = effectiveScores.reduce((sum, s) => sum + s.points_earned, 0);
    return calculateLevel(totalPoints);
  }, [effectiveScores]);

  // Task actions
  const createTask = async (data: Omit<Task, 'id' | 'user_id' | 'task_date' | 'is_completed'> & { is_completed?: boolean }) => {
    if (!user) return;
    try {
      const created = await api.createTask({
        ...data,
        is_completed: data.is_completed ?? false,
        user_id: user.id,
        task_date: selectedDate,
      });
      setTasks((prev) => [...prev, created]);
      setAllTasks((prev) => [...prev, created]);
      const updatedScores = await api.getDailyScores(user.id);
      setAllScores(updatedScores);
      addToast(`Task "${created.title}" added`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create task';
      addToast(msg, 'error');
    }
  };

  const updateTask = async (taskId: string, updates: Partial<Task>) => {
    if (!user) return;
    try {
      const updated = await api.updateTask(taskId, updates);
      setTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      setAllTasks((prev) => prev.map((t) => (t.id === taskId ? updated : t)));
      const updatedScores = await api.getDailyScores(user.id);
      setAllScores(updatedScores);
      addToast('Task updated', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update task';
      addToast(msg, 'error');
    }
  };

  const deleteTask = async (taskId: string) => {
    if (!user) return;
    try {
      await api.deleteTask(taskId);
      setTasks((prev) => prev.filter((t) => t.id !== taskId));
      setAllTasks((prev) => prev.filter((t) => t.id !== taskId));
      const updatedScores = await api.getDailyScores(user.id);
      setAllScores(updatedScores);
      addToast('Task removed', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete task';
      addToast(msg, 'error');
    }
  };

  const toggleTask = async (task: Task) => {
    if (!user) return;
    try {
      const nextCompleted = !task.is_completed;
      const updated = await api.updateTask(task.id, { is_completed: nextCompleted });
      const nextTasks = tasks.map((t) => (t.id === task.id ? updated : t));
      setTasks(nextTasks);
      setAllTasks((prev) => prev.map((t) => (t.id === task.id ? updated : t)));

      const updatedScores = await api.getDailyScores(user.id);
      setAllScores(updatedScores);

      // Check if this action just triggered "Goal Met"
      const prevScore = calculateDailyScore(tasks, isSelectedDateRestDay, settings.target_completion_pct);
      const newScore = calculateDailyScore(nextTasks, isSelectedDateRestDay, settings.target_completion_pct);

      if (!prevScore.goal_met && newScore.goal_met) {
        addToast(`🎯 Daily Goal Met (${newScore.completion_pct}%)! Streak preserved!`, 'success');
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#26a641', '#39d353', '#58a6ff', '#f1e05a'],
        });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to toggle task';
      addToast(msg, 'error');
    }
  };

  const toggleRestDay = async (dateStr: string = selectedDate): Promise<boolean> => {
    if (!user) return false;
    const isCurrentlyRest = isSelectedDateRestDay;

    if (!isCurrentlyRest && restDaysInCurrentWeek >= settings.max_rest_days_per_week) {
      addToast(
        `Weekly rest day limit reached (${settings.max_rest_days_per_week} days max). You can adjust this in Settings.`,
        'error'
      );
      return false;
    }

    try {
      const targetState = !isCurrentlyRest;
      await api.toggleRestDay(user.id, dateStr, targetState);
      const updatedScores = await api.getDailyScores(user.id);
      setAllScores(updatedScores);

      if (targetState) {
        addToast('🌿 Rest day active. Your streak is safe today!', 'info');
      } else {
        addToast('Rest day turned off.', 'info');
      }
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update rest day';
      addToast(msg, 'error');
      return false;
    }
  };

  const carryOverIncompleteTasks = async (fromDateStr?: string): Promise<number> => {
    if (!user) return 0;
    const sourceDate = fromDateStr || addDaysToDateStr(selectedDate, -1);
    try {
      const count = await api.carryOverTasks(user.id, sourceDate, selectedDate);
      if (count > 0) {
        const dateTasks = await api.getTasks(user.id, selectedDate);
        setTasks(dateTasks);
        setAllTasks(await api.getTasks(user.id));
        setAllScores(await api.getDailyScores(user.id));
        addToast(`Carried over ${count} incomplete task(s) to ${selectedDate}`, 'success');
      } else {
        addToast(`No incomplete tasks to carry over from ${sourceDate}`, 'info');
      }
      return count;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to carry over tasks';
      addToast(msg, 'error');
      return 0;
    }
  };

  // Recurring Rules
  const createRecurringRule = async (ruleData: Omit<RecurringRule, 'id' | 'user_id'>) => {
    if (!user) return;
    try {
      const created = await api.createRecurringRule({
        ...ruleData,
        user_id: user.id,
      });
      setRecurringRules((prev) => [created, ...prev]);
      addToast(`Recurring task "${created.title}" created`, 'success');

      // Also check if it applies to currently viewed date
      const dateTasks = await api.getTasks(user.id, selectedDate);
      const generated = generateTasksForDate([created], selectedDate, dateTasks, user.id);
      if (generated.length > 0) {
        const inserted = await api.createMultipleTasks(generated);
        setTasks((prev) => [...prev, ...inserted]);
        setAllTasks((prev) => [...prev, ...inserted]);
        setAllScores(await api.getDailyScores(user.id));
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to create recurring rule';
      addToast(msg, 'error');
    }
  };

  const updateRecurringRule = async (id: string, updates: Partial<RecurringRule>) => {
    if (!user) return;
    try {
      const updated = await api.updateRecurringRule(id, updates);
      setRecurringRules((prev) => prev.map((r) => (r.id === id ? updated : r)));
      addToast('Recurring rule updated', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to update rule';
      addToast(msg, 'error');
    }
  };

  const deleteRecurringRule = async (id: string) => {
    if (!user) return;
    try {
      await api.deleteRecurringRule(id);
      setRecurringRules((prev) => prev.filter((r) => r.id !== id));
      // Remove all uncompleted tasks associated with this rule from state
      setTasks((prev) => prev.filter((t) => !(t.recurring_rule_id === id && !t.is_completed)));
      setAllTasks((prev) => prev.filter((t) => !(t.recurring_rule_id === id && !t.is_completed)));
      const updatedScores = await api.getDailyScores(user.id);
      setAllScores(updatedScores);
      addToast('Recurring rule and its pending tasks removed', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete rule';
      addToast(msg, 'error');
    }
  };

  // Templates
  const saveDayAsTemplate = async (name: string, description: string = '') => {
    if (!user) return;
    if (tasks.length === 0) {
      addToast('Cannot save an empty day as a template', 'error');
      return;
    }

    try {
      const items: Omit<TemplateItem, 'id' | 'template_id'>[] = tasks.map((t) => ({
        title: t.title,
        description: t.description || '',
        category: t.category,
        priority: t.priority,
        difficulty: t.difficulty,
      }));

      const created = await api.createTemplate(user.id, name, description, items);
      setTemplates((prev) => [created, ...prev]);
      addToast(`Saved template "${name}" with ${items.length} tasks!`, 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save template';
      addToast(msg, 'error');
    }
  };

  const applyTemplate = async (templateId: string): Promise<number> => {
    if (!user) return 0;
    try {
      const applied = await api.applyTemplateToDate(user.id, templateId, selectedDate);
      if (applied.length > 0) {
        setTasks((prev) => [...prev, ...applied]);
        setAllTasks((prev) => [...prev, ...applied]);
        setAllScores(await api.getDailyScores(user.id));
        addToast(`Applied template: ${applied.length} task(s) added`, 'success');
      } else {
        addToast('All tasks in this template already exist on this day', 'info');
      }
      return applied.length;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to apply template';
      addToast(msg, 'error');
      return 0;
    }
  };

  const deleteTemplate = async (templateId: string) => {
    if (!user) return;
    try {
      await api.deleteTemplate(templateId);
      setTemplates((prev) => prev.filter((t) => t.id !== templateId));
      addToast('Template deleted', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to delete template';
      addToast(msg, 'error');
    }
  };

  // Settings & Demo
  const updateSettings = async (updates: Partial<UserSettings>) => {
    if (!user) return;
    try {
      const updated = await api.updateSettings(user.id, updates);
      setSettings(updated);
      addToast('Settings saved successfully', 'success');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to save settings';
      addToast(msg, 'error');
    }
  };

  const loadDemoData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const res = await api.seedDemoData(user.id);
      await refreshAll();
      addToast(`Generated ${res.scoresCount} days of historical demo data!`, 'success');
      confetti({
        particleCount: 100,
        spread: 90,
        origin: { y: 0.5 },
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to load demo data';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  const clearAllData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      await api.clearUserData(user.id);
      await refreshAll();
      addToast('All data cleared.', 'info');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to clear data';
      addToast(msg, 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <DataContext.Provider
      value={{
        selectedDate,
        setSelectedDate,
        goToPrevDay,
        goToNextDay,
        goToToday,
        tasks,
        allTasks,
        allScores,
        settings,
        recurringRules,
        templates,
        loading,
        dailySummary,
        streakStats,
        levelInfo,
        restDaysInCurrentWeek,
        canAddRestDay,
        createTask,
        updateTask,
        deleteTask,
        toggleTask,
        toggleRestDay,
        carryOverIncompleteTasks,
        createRecurringRule,
        updateRecurringRule,
        deleteRecurringRule,
        saveDayAsTemplate,
        applyTemplate,
        deleteTemplate,
        updateSettings,
        loadDemoData,
        clearAllData,
        refreshAll,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};

export const useData = (): DataContextType => {
  const context = useContext(DataContext);
  if (!context) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
};

import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useData } from '../context/DataContext';
import { SettingsModal } from './SettingsModal';
import {
  Calendar,
  History,
  User,
  Settings,
  LogOut,
  Flame,
  Award,
} from 'lucide-react';

export const Layout: React.FC = () => {
  const { user, signOut } = useAuth();
  const { levelInfo, streakStats, settings, updateSettings, loadDemoData, clearAllData } = useData();
  const navigate = useNavigate();
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/auth');
  };

  const initials = user?.display_name
    ? user.display_name.slice(0, 2).toUpperCase()
    : 'SB';

  return (
    <div className="app-layout">
      {/* Desktop Sidebar */}
      <aside className="sidebar">
        <div className="sidebar-header">
          <div className="brand-logo">
            <Flame size={20} fill="#0d1117" />
          </div>
          <div>
            <div className="brand-name">StreakBoard</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Daily Consistency</div>
          </div>
        </div>

        {/* Sidebar Navigation */}
        <nav className="sidebar-nav">
          <NavLink
            to="/"
            end
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <Calendar size={18} />
            <span>Today</span>
          </NavLink>

          <NavLink
            to="/history"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <History size={18} />
            <span>History</span>
          </NavLink>

          <NavLink
            to="/profile"
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
          >
            <User size={18} />
            <span>Profile & Heatmap</span>
          </NavLink>

          <button
            type="button"
            className="nav-item"
            style={{ width: '100%', textAlign: 'left', marginTop: 'auto' }}
            onClick={() => setIsSettingsOpen(true)}
          >
            <Settings size={18} />
            <span>Settings</span>
          </button>
        </nav>

        {/* Sidebar XP Card */}
        <div className="sidebar-xp-card">
          <div className="xp-header">
            <span className="xp-level-badge">
              <Award size={12} /> Lvl {levelInfo.level}
            </span>
            <span className="xp-title">{levelInfo.title}</span>
          </div>

          <div className="xp-bar-container">
            <div
              className="xp-bar-fill"
              style={{ width: `${levelInfo.progressPct}%` }}
            />
          </div>

          <div className="xp-numbers">
            <span>{levelInfo.currentLevelXP} XP</span>
            <span>{levelInfo.xpNeededForNextLevel} XP</span>
          </div>

          {/* Quick Streak Counter */}
          <div
            style={{
              marginTop: '10px',
              paddingTop: '8px',
              borderTop: '1px solid var(--border-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
            }}
          >
            <span style={{ color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Flame size={14} color="#e3b341" /> Streak
            </span>
            <strong style={{ color: 'var(--text-bright)' }}>
              {streakStats.currentStreak} {streakStats.currentStreak === 1 ? 'day' : 'days'}
            </strong>
          </div>
        </div>

        {/* Sidebar Footer User info */}
        <div className="sidebar-footer">
          <div className="sidebar-user">
            <div className="user-avatar">{initials}</div>
            <div className="user-info-text">
              <span className="user-name">{user?.display_name || 'Member'}</span>
              <span className="user-email">{user?.email}</span>
            </div>
          </div>
          <button
            type="button"
            className="logout-btn"
            onClick={handleLogout}
            title="Log out"
            aria-label="Log out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main Outlet */}
      <main className="main-wrapper">
        <Outlet />
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="bottom-nav">
        <NavLink
          to="/"
          end
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <Calendar size={20} />
          <span>Today</span>
        </NavLink>

        <NavLink
          to="/history"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <History size={20} />
          <span>History</span>
        </NavLink>

        <NavLink
          to="/profile"
          className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
        >
          <User size={20} />
          <span>Profile</span>
        </NavLink>

        <button
          type="button"
          className="bottom-nav-item"
          onClick={() => setIsSettingsOpen(true)}
        >
          <Settings size={20} />
          <span>Settings</span>
        </button>
      </nav>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        settings={settings}
        onSaveSettings={updateSettings}
        onLoadDemoData={loadDemoData}
        onClearData={clearAllData}
      />
    </div>
  );
};

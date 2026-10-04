import React from 'react';
import {
  Newspaper,
  Bell,
  UserCheck,
  Shield,
  Wifi,
  WifiOff,
  Database,
  RotateCcw,
  Compass,
  Sparkles
} from 'lucide-react';
import { UserRole, DeliveryStaff } from '../types';

interface NavbarProps {
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  staffList: DeliveryStaff[];
  selectedStaffId: string;
  onSelectStaff: (staffId: string) => void;
  lang: 'en' | 'ta';
  onLangToggle: () => void;
  unreadNotifsCount: number;
  onOpenNotifications: () => void;
  onOpenSchemaModal: () => void;
  onOpenAIAssistant: () => void;
  offlineQueueCount: number;
  onFlushOfflineQueue: () => void;
  onResetDemo: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentRole,
  onRoleChange,
  staffList,
  selectedStaffId,
  onSelectStaff,
  lang,
  onLangToggle,
  unreadNotifsCount,
  onOpenNotifications,
  onOpenSchemaModal,
  onOpenAIAssistant,
  offlineQueueCount,
  onFlushOfflineQueue,
  onResetDemo,
}) => {
  const currentStaff = staffList.find((s) => s.id === selectedStaffId);

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Logo and Tagline */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-sky-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-sky-600/30">
            <Newspaper className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-extrabold text-lg sm:text-xl tracking-tight text-white">
                Paper<span className="text-sky-400">Track</span>
              </span>
              <span className="hidden sm:inline-flex items-center px-2 py-0.5 rounded text-[10px] font-semibold bg-sky-950 text-sky-300 border border-sky-800">
                Chidambaram (608001)
              </span>
            </div>
            <p className="hidden md:block text-[11px] text-slate-400 font-medium leading-none">
              {lang === 'ta' ? 'சிதம்பரம் • ஒவ்வொரு நாளிதழும். ஒவ்வொரு இல்லமும். சரியான நேரத்தில்.' : 'Chidambaram • Every Paper. Every Home. On Time.'}
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {/* AI Dispatch Assistant Button */}
          <button
            onClick={onOpenAIAssistant}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-gradient-to-r from-sky-500/20 to-indigo-500/20 hover:from-sky-500/30 hover:to-indigo-500/30 border border-sky-500/30 rounded-lg text-xs font-semibold text-sky-200 transition-all cursor-pointer"
            title="Chidambaram Route Intelligence & Depot Locator with Gemini & Google Maps Grounding"
          >
            <Sparkles className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
            <span className="hidden md:inline">AI Dispatch</span>
          </button>

          {/* Offline Sync Indicator */}
          {offlineQueueCount > 0 ? (
            <button
              onClick={onFlushOfflineQueue}
              className="flex items-center space-x-1.5 px-2.5 py-1 bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-medium cursor-pointer animate-pulse"
              title="Click to sync offline entries"
            >
              <WifiOff className="w-3.5 h-3.5 text-amber-400" />
              <span>Sync ({offlineQueueCount})</span>
            </button>
          ) : (
            <div className="hidden sm:flex items-center space-x-1 text-xs text-emerald-400 bg-emerald-500/10 px-2 py-1 rounded-lg border border-emerald-500/20">
              <Wifi className="w-3 h-3" />
              <span>Live</span>
            </div>
          )}

          {/* Language Toggle (EN / தமிழ்) */}
          <button
            onClick={onLangToggle}
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-slate-200 border border-slate-700 transition cursor-pointer"
            title="Toggle English / தமிழ்"
          >
            {lang === 'en' ? 'தமிழ்' : 'English'}
          </button>

          {/* Database Schema Viewer */}
          <button
            onClick={onOpenSchemaModal}
            className="hidden lg:flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-300 border border-slate-700 transition cursor-pointer"
            title="View Supabase PostgreSQL Schema & RLS Policies"
          >
            <Database className="w-3.5 h-3.5 text-sky-400" />
            <span>SQL Schema</span>
          </button>

          {/* Role Switcher Pill */}
          <div className="flex items-center bg-slate-800 p-1 rounded-xl border border-slate-700">
            <button
              onClick={() => onRoleChange('admin')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentRole === 'admin'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ta' ? 'நிர்வாகி' : 'Admin'}</span>
            </button>
            <button
              onClick={() => onRoleChange('staff')}
              className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                currentRole === 'staff'
                  ? 'bg-sky-600 text-white shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{lang === 'ta' ? 'ஊழியர்' : 'Staff'}</span>
            </button>
          </div>

          {/* If Staff role, selector for staff member */}
          {currentRole === 'staff' && (
            staffList.length > 0 ? (
              <select
                value={selectedStaffId}
                onChange={(e) => onSelectStaff(e.target.value)}
                className="bg-slate-800 border border-slate-700 text-white text-xs rounded-lg px-2 py-1 focus:ring-2 focus:ring-sky-500 cursor-pointer"
              >
                {staffList.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.fullName} {s.shiftStatus === 'on_route' ? '🟢' : '⚪'}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-[11px] text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-800/60 font-semibold">
                No Staff Added
              </span>
            )
          )}

          {/* Notification Bell */}
          <button
            onClick={onOpenNotifications}
            className="relative p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition cursor-pointer border border-slate-700"
            aria-label="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadNotifsCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-rose-500 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center border-2 border-slate-900 animate-bounce">
                {unreadNotifsCount > 9 ? '9+' : unreadNotifsCount}
              </span>
            )}
          </button>

          {/* Reset Demo Data Button */}
          <button
            onClick={onResetDemo}
            className="hidden xl:flex items-center space-x-1 px-2 py-1 text-slate-400 hover:text-slate-200 text-xs cursor-pointer"
            title="Reset sample data to initial state"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset</span>
          </button>
        </div>
      </div>
    </header>
  );
};

import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useSocket } from '../../context/SocketContext';
import { NotificationDropdown } from './NotificationDropdown';
import { Avatar } from '../common/Avatar';
import {
  Menu,
  ChevronDown,
  Building,
  User,
  LogOut,
  PlusCircle,
  Wifi,
  Sparkles,
} from 'lucide-react';
import { useNavigate, Link } from 'react-router-dom';

export function Header({ onToggleSidebar }) {
  const { user, activeOrg, setActiveOrg, logout } = useAuth();
  const { isConnected } = useSocket();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [orgMenuOpen, setOrgMenuOpen] = useState(false);
  const userMenuRef = useRef(null);
  const orgMenuRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
      if (orgMenuRef.current && !orgMenuRef.current.contains(e.target)) {
        setOrgMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-slate-200 h-16 flex items-center px-4 sm:px-6 justify-between">
      {/* Left: Mobile hamburger & Organization Selector */}
      <div className="flex items-center gap-3">
        <button
          onClick={onToggleSidebar}
          className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100"
          aria-label="Toggle navigation"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Organization Switcher Dropdown */}
        <div className="relative" ref={orgMenuRef}>
          <button
            onClick={() => setOrgMenuOpen(!orgMenuOpen)}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors text-left"
          >
            <div className="h-6 w-6 rounded bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-xs shrink-0">
              <Building className="h-3.5 w-3.5" />
            </div>
            <div className="hidden sm:block">
              <span className="text-xs font-semibold text-slate-900 block truncate max-w-[150px]">
                {activeOrg?.name || 'Select Organization'}
              </span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
          </button>

          {orgMenuOpen && (
            <div className="absolute left-0 mt-2 w-64 rounded-xl bg-white shadow-xl border border-slate-200 p-2 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-2 py-1.5 text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                Active Organization
              </div>
              <div className="px-2 py-1.5 bg-indigo-50/60 rounded-lg text-xs font-medium text-indigo-900 mb-2">
                {activeOrg?.name}
              </div>
              <div className="border-t border-slate-100 pt-1">
                <Link
                  to="/app/org-settings"
                  onClick={() => setOrgMenuOpen(false)}
                  className="flex items-center gap-2 px-2 py-1.5 text-xs text-slate-600 hover:bg-slate-50 rounded-lg transition-colors"
                >
                  <Building className="h-3.5 w-3.5" />
                  Organization Settings
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Right: Live Socket Indicator + Notifications + User Menu */}
      <div className="flex items-center gap-3">
        {/* Real-time Socket status indicator */}
        <div className="hidden md:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-50 border border-slate-200 text-slate-600">
          <span
            className={`h-2 w-2 rounded-full ${
              isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-amber-400'
            }`}
          />
          <span className="text-[11px]">{isConnected ? 'Live Sync' : 'Connecting'}</span>
        </div>

        {/* Notifications Popover */}
        <NotificationDropdown />

        {/* User Profile Menu */}
        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <Avatar user={user} size="sm" />
            <div className="hidden md:block text-left">
              <span className="text-xs font-semibold text-slate-800 block truncate max-w-[120px]">
                {user?.name}
              </span>
              <span className="text-[10px] text-slate-400 block -mt-0.5">{user?.title}</span>
            </div>
            <ChevronDown className="h-3.5 w-3.5 text-slate-400 hidden sm:block" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 mt-2 w-52 rounded-xl bg-white shadow-xl border border-slate-200 p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100">
              <div className="px-3 py-2 border-b border-slate-100 mb-1">
                <p className="text-xs font-semibold text-slate-900 truncate">{user?.name}</p>
                <p className="text-[11px] text-slate-500 truncate">{user?.email}</p>
              </div>
              <Link
                to="/app/settings"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-2 px-3 py-2 text-xs text-slate-700 hover:bg-slate-50 rounded-lg transition-colors"
              >
                <User className="h-3.5 w-3.5 text-slate-400" />
                Profile Settings
              </Link>
              <div className="border-t border-slate-100 mt-1 pt-1">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-2 px-3 py-2 text-xs text-red-600 hover:bg-red-50 rounded-lg transition-colors text-left"
                >
                  <LogOut className="h-3.5 w-3.5 text-red-500" />
                  Sign Out
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}


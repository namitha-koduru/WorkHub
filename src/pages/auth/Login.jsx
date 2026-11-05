import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/common/Button';
import { LogIn, AlertCircle, Sparkles } from 'lucide-react';

const DEMO_USERS = [
  {
    roleTitle: 'Dean & Fest Convener',
    roleTag: 'Org Owner',
    email: 'admin@workhub.com',
    name: 'Dr. Ramesh Kumar',
    color: 'bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100',
  },
  {
    roleTitle: 'Operations Director',
    roleTag: 'Workspace Manager',
    email: 'manager@workhub.com',
    name: 'Priya Sharma',
    color: 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100',
  },
  {
    roleTitle: 'Technical Team Lead',
    roleTag: 'Team Lead',
    email: 'leader@workhub.com',
    name: 'Aditya Verma',
    color: 'bg-emerald-50 border-emerald-200 text-emerald-700 hover:bg-emerald-100',
  },
  {
    roleTitle: 'Media & Tech Lead',
    roleTag: 'Room Member',
    email: 'member1@workhub.com',
    name: 'Sneha Patel',
    color: 'bg-purple-50 border-purple-200 text-purple-700 hover:bg-purple-100',
  },
];

export default function Login() {
  const [email, setEmail] = useState('admin@workhub.com');
  const [password, setPassword] = useState('Password123!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = new URLSearchParams(location.search).get('redirect') || '/app/dashboard';

  const doLogin = async (loginEmail, loginPassword) => {
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await authApi.login({ email: loginEmail, password: loginPassword });
      if (res.success && res.data) {
        login(res.data.user, res.data.activeOrg);
        navigate(redirectPath);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    doLogin(email, password);
  };

  const handleQuickLogin = (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    doLogin(demoEmail, 'Password123!');
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-10 px-4 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-600 text-white items-center justify-center font-bold text-2xl shadow-lg shadow-indigo-100 mb-3">
          W
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to <span className="text-indigo-600">WorkHub</span>
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Team Workflow & Event Operations Management Platform
        </p>
      </div>

      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-8">
          {/* Quick Demo Access Bar */}
          <div className="mb-6 p-3.5 bg-slate-50 rounded-xl border border-slate-200">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-700 mb-2.5">
              <Sparkles className="h-4 w-4 text-amber-500" />
              <span>1-Click Quick Demo Sign-in:</span>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {DEMO_USERS.map((u) => (
                <button
                  key={u.email}
                  type="button"
                  onClick={() => handleQuickLogin(u.email)}
                  disabled={isLoading}
                  className={`text-left p-2 rounded-lg border text-xs transition-colors flex flex-col justify-between ${u.color}`}
                >
                  <span className="font-semibold truncate">{u.name}</span>
                  <span className="text-[10px] opacity-80">{u.roleTag}</span>
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Official Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@workhub.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-slate-700">
                  Password
                </label>
                <span className="text-[11px] text-slate-400">Default: Password123!</span>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <Button
              type="submit"
              className="w-full mt-2"
              size="md"
              loading={isLoading}
            >
              <LogIn className="h-4 w-4 mr-2" />
              Sign In to WorkHub
            </Button>
          </form>

          <div className="mt-6 text-center text-xs text-slate-500 border-t border-slate-100 pt-5">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create an account & Unique Member ID
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

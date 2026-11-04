import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { authApi } from '../../api/auth.api';
import { Button } from '../../components/common/Button';
import {
  LogIn,
  AlertCircle,
  ShieldCheck,
  Briefcase,
  Users,
  Code,
  Sparkles,
} from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    try {
      const res = await authApi.login({ email, password });
      if (res.success && res.data) {
        login(res.data.user, res.data.activeOrg);
        navigate('/app/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Invalid email or password.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (demoEmail) => {
    setEmail(demoEmail);
    setPassword('Password123!');
    setIsLoading(true);
    setErrorMsg('');
    try {
      const res = await authApi.login({ email: demoEmail, password: 'Password123!' });
      if (res.success && res.data) {
        login(res.data.user, res.data.activeOrg);
        navigate('/app/dashboard');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Quick login failed.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="inline-flex h-12 w-12 rounded-2xl bg-indigo-600 text-white items-center justify-center font-bold text-2xl shadow-lg mb-4">
          W
        </div>
        <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
          Sign in to <span className="text-indigo-600">WorkHub</span>
        </h2>
        <p className="mt-2 text-sm text-slate-500">
          Team Workflow & Event Operations Management Platform
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-6 shadow-xl rounded-2xl border border-slate-200 sm:px-10">
          {errorMsg && (
            <div className="mb-5 p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="name@organization.com"
                className="w-full px-3.5 py-2.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Password
              </label>
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
              isLoading={isLoading}
              className="w-full py-2.5 mt-2"
              icon={LogIn}
            >
              Sign In
            </Button>
          </form>

          {/* Quick Demo Access Buttons */}
          <div className="mt-6 pt-6 border-t border-slate-100">
            <div className="flex items-center gap-1 text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-3">
              <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
              One-Click Role Demonstration
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <button
                type="button"
                onClick={() => handleQuickLogin('admin@workhub.com')}
                className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs"
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <ShieldCheck className="h-3.5 w-3.5 text-indigo-600" />
                  Org Owner
                </div>
                <span className="text-[10px] text-slate-500 truncate block">Dr. Ramesh Kumar</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('manager@workhub.com')}
                className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs"
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Briefcase className="h-3.5 w-3.5 text-blue-600" />
                  WS Manager
                </div>
                <span className="text-[10px] text-slate-500 truncate block">Priya Sharma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('leader@workhub.com')}
                className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs"
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Users className="h-3.5 w-3.5 text-amber-600" />
                  Room Leader
                </div>
                <span className="text-[10px] text-slate-500 truncate block">Aditya Verma</span>
              </button>

              <button
                type="button"
                onClick={() => handleQuickLogin('member1@workhub.com')}
                className="p-2 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/50 transition-all text-xs"
              >
                <div className="flex items-center gap-1.5 font-semibold text-slate-800">
                  <Code className="h-3.5 w-3.5 text-emerald-600" />
                  Team Member
                </div>
                <span className="text-[10px] text-slate-500 truncate block">Sneha Patel</span>
              </button>
            </div>
          </div>

          <div className="mt-6 text-center text-xs text-slate-500">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-indigo-600 hover:text-indigo-500">
              Create an account
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


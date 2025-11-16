import React, { useState } from 'react';
import { useAuth } from './AuthContext';

export const Login: React.FC = () => {
  const { login, loading } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    try {
      const success = await login(username, password);
      if (!success) setError('Invalid credentials');
    } catch (e: any) {
      setError(e.message || 'An error occurred during login');
    }
  };

  return (
    <div className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 bg-background-light dark:bg-background-dark font-display">
      <div className="w-full max-w-md">
        {/* Logo Container */}
        <div className="mb-8 flex justify-center">
          <div className="flex h-20 w-20 items-center justify-center rounded-full bg-primary/20 text-primary">
            <span className="material-symbols-outlined !text-4xl">school</span>
          </div>
        </div>

        {/* Headline and Body Text */}
        <div className="text-center">
          <h1 className="text-text-main dark:text-white text-3xl font-bold tracking-tight">
            Welcome Back
          </h1>
          <p className="text-text-secondary dark:text-gray-400 mt-2 text-base font-normal">
            Sign in to manage student fees.
          </p>
        </div>

        {/* Form Container */}
        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          {/* Email/Username Field */}
          <div>
            <label className="text-text-main dark:text-white mb-2 block text-sm font-medium" htmlFor="username">
              Username
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="material-symbols-outlined text-placeholder">person</span>
              </div>
              <input
                className="block h-14 w-full rounded-lg border border-border-color bg-white dark:bg-gray-800 dark:text-white py-3 pl-12 pr-4 text-text-main placeholder:text-placeholder focus:border-primary focus:ring-primary outline-none transition-all"
                id="username"
                placeholder="admin / acct / teacher"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
              />
            </div>
          </div>

          {/* Password Field */}
          <div>
            <label className="text-text-main dark:text-white mb-2 block text-sm font-medium" htmlFor="password">
              Password
            </label>
            <div className="relative">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
                <span className="material-symbols-outlined text-placeholder">lock</span>
              </div>
              <input
                className="block h-14 w-full rounded-lg border border-border-color bg-white dark:bg-gray-800 dark:text-white py-3 pl-12 pr-12 text-text-main placeholder:text-placeholder focus:border-primary focus:ring-primary outline-none transition-all"
                id="password"
                placeholder="Enter your password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <button
                className="absolute inset-y-0 right-0 flex items-center pr-4 text-placeholder hover:text-primary transition-colors"
                type="button"
                onClick={() => setShowPassword(!showPassword)}
              >
                <span className="material-symbols-outlined">
                  {showPassword ? 'visibility' : 'visibility_off'}
                </span>
              </button>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 dark:bg-red-900/20 p-3 rounded-lg">
              <span className="material-symbols-outlined text-base">error</span>
              {error}
            </div>
          )}

          {/* Login Button */}
          <button
            type="submit"
            disabled={loading}
            className="flex h-14 w-full items-center justify-center rounded-lg bg-primary px-6 text-base font-semibold text-white transition-colors hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:focus:ring-offset-background-dark disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing In...' : 'Login'}
          </button>
          
          <div className="mt-6 text-center">
             <p className="text-xs text-text-secondary dark:text-gray-500">
                Demo Credentials: admin/admin, acct/acct
             </p>
          </div>
        </form>
      </div>
    </div>
  );
};
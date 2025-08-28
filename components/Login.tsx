import React, { useState } from 'react';
import { User, Lock, AlertCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [selectedRole, setSelectedRole] = useState('system_admin');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const demoUsers = [
    { username: 'admin', role: 'system_admin', name: 'System Administrator' },
    { username: 'branch_mgr_001', role: 'branch_manager', name: 'Branch Manager' },
    { username: 'approver_001', role: 'branch_approver', name: 'Branch Approver' },
    { username: 'sales_001', role: 'sales_user', name: 'Sales User' },
    { username: 'auditor_001', role: 'auditor', name: 'Auditor' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock authentication - in real app, this would call the API
      const demoUser = demoUsers.find(u => u.username === username);
      if (!demoUser) {
        throw new Error('Invalid credentials');
      }

      const user: UserType = {
        id: username,
        username,
        email: `${username}@bank.com`,
        name: demoUser.name,
        role: demoUser.role as any,
        branchId: demoUser.role !== 'system_admin' ? '1' : undefined,
        phone: '+1234567890',
        status: 'active',
        createdAt: new Date().toISOString()
      };

      setTimeout(() => {
        onLogin(user);
        setLoading(false);
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <div className="text-center mb-8">
          <div className="w-40 h-40 mx-auto mb-4">
            <img src="/SecQR.jpg" alt="SECQR" className="w-full h-full object-contain" />
          </div>
          <p className="text-gray-600">QR Code Management System</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center space-x-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            <span className="text-red-700 text-sm">{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <User className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="username"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter username"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                <Lock className="h-5 w-5 text-gray-400" />
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full pl-10 pr-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Enter password"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-2">
              Demo Role
            </label>
            <select
              id="role"
              value={selectedRole}
              onChange={(e) => {
                setSelectedRole(e.target.value);
                const user = demoUsers.find(u => u.role === e.target.value);
                if (user) setUsername(user.username);
              }}
              className="block w-full px-3 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {demoUsers.map(user => (
                <option key={user.role} value={user.role}>
                  {user.name}
                </option>
              ))}
            </select>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 px-4 rounded-lg font-medium hover:bg-blue-800 focus:ring-4 focus:ring-blue-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <h3 className="text-sm font-medium text-gray-700 mb-2">Demo Accounts:</h3>
          <div className="text-xs text-gray-600 space-y-1">
            {demoUsers.map(user => (
              <div key={user.username}>
                <strong>{user.username}</strong> - {user.name}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
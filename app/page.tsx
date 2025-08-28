'use client'

import React, { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { User } from '../types';
import { apiService } from '../services/api';
import Login from '../components/Login';
import { useUser } from '@/contexts/user-context';
import api, { setAccessToken } from '@/services/axiosInstance';

export default function HomePage() {
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { setCurrentUser } = useUser();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const res = await api.post("/auth/refresh-token");
        const token = res.data.data.accessToken;
        setAccessToken(token);
        setCurrentUser({
          name: res.data.data.user.name,
          email: res.data.data.user.email,
          role: res.data.data.user.role,
          permissions: res.data.data.user.permissions,
          id: res.data.data.user.id,
        });
        router.push("/dashboard");
      } catch (err) {
        console.error("Auto-refresh error:", err);
        redirect("/login");
      }
    };

    initializeAuth();
  }, [router, setCurrentUser]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-4">
            <img src="/SecQR.svg" alt="SecQR" className="w-full h-full object-contain" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return null;
}

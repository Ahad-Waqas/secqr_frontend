"use client";

import React, { useState, useEffect } from 'react';
import { redirect, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, QrCode, FileText, Store, 
  BarChart3, Users, Settings as SettingsIcon, Building, Package, LogOut, CheckCircle, Shield
} from 'lucide-react';
import { useUser } from '@/contexts/user-context';
import api, { setAccessToken } from '@/services/axiosInstance';
import { User } from '../../types';

import Layout from '../../components/Layout';
import Dashboard from '../../components/Dashboard';
import QRManagement from '../../components/QRManagement';
import RequestWorkflow from '../../components/RequestWorkflow';
import SalesManagement from '../../components/SalesManagement';
import UserManagement from '../../components/UserManagement';
import BranchManagement from '../../components/BranchManagement';
import BranchInventory from '../../components/BranchInventory';
import MerchantManagement from '../../components/MerchantManagement';
import Reports from '../../components/Reports';
import Settings from '../../components/Settings';
import KYCManagement from '../../components/KYCManagement';
import AuditManagement from '../../components/AuditManagement';

type Page = 'dashboard' | 'qr-management' | 'requests' | 'sales' | 'merchants' | 'reports' | 'users' | 'branches' | 'inventory' | 'settings' | 'kyc' | 'audit';

export default function DashboardPage() {
  const [currentPage, setCurrentPage] = useState<Page>('dashboard');
  const [loading, setLoading] = useState(true);
  const [compatibleUser, setCompatibleUser] = useState<User | null>(null);
  const router = useRouter();
  const { currentUser, setCurrentUser } = useUser();

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const res = await api.post("/auth/refresh-token");
        const token = res.data.data.accessToken;
        setAccessToken(token);
        setCurrentUser({
          id: res.data.data.user.id,
          name: res.data.data.user.name,
          email: res.data.data.user.email,
          role: res.data.data.user.role,
          permissions: res.data.data.user.permissions,
          region: res.data.data.user.region,
          assignedAccounts: res.data.data.user.assignedAccounts,
          department: res.data.data.user.department,
          hierarchy: res.data.data.user.hierarchy,
        });

        // Create a compatible user object for components
        const compatibleUserObj: User = {
          id: res.data.data.user.id,
          username: res.data.data.user.email, // Use email as username
          email: res.data.data.user.email,
          name: res.data.data.user.name,
          role: res.data.data.user.role,
          branchId: res.data.data.user.branchId || undefined,
          phone: res.data.data.user.phone || '',
          status: 'active' as const,
          createdAt: new Date().toISOString(),
        };
        
        setCompatibleUser(compatibleUserObj);
      } catch (err) {
        console.error("Auto-refresh error:", err);
        redirect("/login");
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, [router, setCurrentUser]);

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setCurrentUser(null);
      router.push('/login');
    }
  };

  const getPageComponent = () => {
    if (!compatibleUser) return null;

    switch (currentPage) {
      case 'dashboard':
        return <Dashboard user={compatibleUser} />;
      case 'qr-management':
        return <QRManagement user={compatibleUser} />;
      case 'requests':
        return <RequestWorkflow user={compatibleUser} />;
      case 'sales':
        return <SalesManagement user={compatibleUser} />;
      case 'merchants':
        return <MerchantManagement user={compatibleUser} />;
      case 'users':
        return <UserManagement user={compatibleUser} />;
      case 'branches':
        return <BranchManagement user={compatibleUser} />;
      case 'inventory':
        return <BranchInventory user={compatibleUser} />;
      case 'reports':
        return <Reports user={compatibleUser} />;
      case 'settings':
        return <Settings user={compatibleUser} />;
      case 'kyc':
        return <KYCManagement user={compatibleUser} />;
      case 'audit':
        return <AuditManagement user={compatibleUser} />;
      default:
        return <Dashboard user={compatibleUser} />;
    }
  };

  const getMenuItems = () => {
    const baseItems = [
      { id: 'dashboard', name: 'Dashboard', icon: LayoutDashboard },
    ];

    if (currentUser?.role === 'SUPER_ADMIN' || currentUser?.role === 'ADMIN') {
      return [
        ...baseItems,
        { id: 'qr-management', name: 'QR Management', icon: QrCode },
        { id: 'inventory', name: 'Inventory Management', icon: Package },
        { id: 'requests', name: 'Request Management', icon: FileText },
        // { id: 'sales', name: 'Sales Management', icon: Store },
        { id: 'branches', name: 'Branch Management', icon: Building },
        { id: 'users', name: 'User Management', icon: Users },
        { id: 'reports', name: 'Reports', icon: BarChart3 },
        { id: 'settings', name: 'Settings', icon: SettingsIcon }
      ];
    }

    if (currentUser?.role === 'BRANCH_MANAGER') {
      return [
        ...baseItems,
        { id: 'qr-management', name: 'QR Management', icon: QrCode },
        { id: 'inventory', name: 'Inventory', icon: Package },
        { id: 'requests', name: 'Request Management', icon: FileText },
        { id: 'sales', name: 'Sales Management', icon: Store },
        { id: 'merchants', name: 'Merchants', icon: Store },
        { id: 'reports', name: 'Reports', icon: BarChart3 }
      ];
    }

    if (currentUser?.role === 'BRANCH_APPROVER') {
      return [
        ...baseItems,
        { id: 'requests', name: 'Approvals', icon: FileText },
        { id: 'kyc', name: 'KYC Management', icon: CheckCircle },
        { id: 'reports', name: 'Reports', icon: BarChart3 }
      ];
    }

    if (currentUser?.role === 'SALES_USER') {
      return [
        ...baseItems,
        { id: 'requests', name: 'My Requests', icon: FileText },
        { id: 'merchants', name: 'Merchants', icon: Store },
        // { id: 'qr-management', name: 'QR Management', icon: QrCode },
        { id: 'sales', name: 'Sales Management', icon: Store },

      ];
    }

    if (currentUser?.role === 'AUDITOR') {
      return [
        ...baseItems,
        { id: 'audit', name: 'Audit Management', icon: Shield },
        { id: 'reports', name: 'Audit Reports', icon: BarChart3 }
      ];
    }

    return baseItems;
  };

  useEffect(() => {
    if (!loading) return; // Only run animation when loading

    const svg = document.getElementById("dashboard-logo") as SVGSVGElement | null;
    if (!svg) return;

    let animationTimeout1: NodeJS.Timeout;
    let animationTimeout2: NodeJS.Timeout;
    let animationTimeout3: NodeJS.Timeout;

    const resetPaths = () => {
      const paths = document.querySelectorAll("#dashboard-logo path") as NodeListOf<SVGPathElement>;
      paths.forEach((path) => {
        path.style.strokeDashoffset = "1000";
        path.style.animation = "none";
      });
    };

    const startDrawing = () => {
      svg.classList.add("drawing");
      svg.classList.remove("filled", "fill-anim", "reversing");
      
      const paths = document.querySelectorAll("#dashboard-logo path") as NodeListOf<SVGPathElement>;
      paths.forEach((path, index) => {
        path.style.animation = `draw 2s forwards`;
        path.style.animationDelay = `${index * 0.3}s`;
      });
    };

    const startFilling = () => {
      svg.classList.add("filled", "fill-anim");
      svg.classList.remove("drawing");
    };

    const startReversing = () => {
      svg.classList.add("reversing");
      svg.classList.remove("filled", "fill-anim");
      
      const paths = document.querySelectorAll("#dashboard-logo path") as NodeListOf<SVGPathElement>;
      paths.forEach((path, index) => {
        path.style.animation = `reverse-draw 2s forwards`;
        path.style.animationDelay = `${index * 0.3}s`;
      });
    };

    const loop = () => {
      // Reset to initial state
      svg.classList.remove("filled", "fill-anim", "drawing", "reversing");
      
      // Force reflow to ensure classes are removed
      svg.getBoundingClientRect();
      
      resetPaths();

      // Start drawing animation
      animationTimeout1 = setTimeout(() => {
        startDrawing();

        // Start fill animation after drawing completes
        animationTimeout2 = setTimeout(() => {
          startFilling();

          // Start reverse animation after fill completes
          animationTimeout3 = setTimeout(() => {
            startReversing();

            // Loop back after reverse completes
            setTimeout(() => {
              loop();
            }, 3000); // Wait for reverse animation to complete
          }, 2000); // Wait for fill animation
        }, 2500); // Wait for drawing to complete (2s + delays)
      }, 100);
    };

    loop();

    // Cleanup function
    return () => {
      clearTimeout(animationTimeout1);
      clearTimeout(animationTimeout2);
      clearTimeout(animationTimeout3);
    };
  }, [loading]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-white">
        {/* Main Loader Container */}
        <div className="flex flex-col items-center space-y-6">
          {/* SVG Logo Animation */}
          <div>
            <svg
              id="dashboard-logo"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 357.71 450.72"
              className="w-32 h-auto"
            >
              <defs>
                <style>{`
                  .cls-1 { fill: #f9d11f; fill-opacity: 0; }
                  .cls-2 { fill: #1f5a7c; fill-opacity: 0; }
                  .cls-3 { fill: #1a5b80; fill-opacity: 0; }
                  
                  #dashboard-logo path {
                    stroke: #1f5a7c;
                    stroke-width: 2;
                    fill: none;
                    stroke-dasharray: 1000;
                    stroke-dashoffset: 1000;
                  }

                  @keyframes draw {
                    to {
                      stroke-dashoffset: 0;
                    }
                  }

                  @keyframes reverse-draw {
                    from {
                      stroke-dashoffset: 0;
                    }
                    to {
                      stroke-dashoffset: 1000;
                    }
                  }

                  #dashboard-logo.filled path {
                    stroke: none;
                    fill-opacity: 1;
                  }

                  #dashboard-logo.filled .cls-1 { fill: #f9d11f; }
                  #dashboard-logo.filled .cls-2 { fill: #1f5a7c; }
                  #dashboard-logo.filled .cls-3 { fill: #1a5b80; }

                  #dashboard-logo.fill-anim path {
                    transition: fill-opacity 1s ease-in-out;
                  }

                  #dashboard-logo.reversing path {
                    stroke: #1f5a7c;
                    stroke-width: 2;
                    fill: none;
                    fill-opacity: 0;
                  }
                `}</style>
              </defs>

              <path className="cls-1" d="M387.81,506.83H319.06a7.3,7.3,0,0,1-1.93-.13c-.68-.2-.61-.92-.6-1.48,0-.92.79-.91,1.4-1.05,5.72-1.33,11.48-2.5,17.15-4,19.52-5.16,38.51-11.76,56.44-21.2,18.28-9.63,32.85-23.31,44.67-40.13a192.7,192.7,0,0,0,21.27-38.79c.4-1,.84-1.57,2.05-1.35,1.39.25,1,1.26,1,2q-.5,49.81-1.05,99.64c0,1.86.65,4.25-.5,5.47s-3.58.43-5.43.43q-32.85,0-65.69,0Z" transform="translate(-102.83 -122.34)" />
              <path className="cls-2" d="M103.16,572.79c.7-.56,1.53-.31,2.31-.31q31.41,0,62.82,0c.77,0,1.6-.27,2.29.35a17.67,17.67,0,0,1-1.91.2H105.06A3,3,0,0,1,103.16,572.79Z" transform="translate(-102.83 -122.34)" />
              <path className="cls-3" d="M446.45,239.6c-10.63-41.1-33.84-73.29-71-94.35-39.87-22.6-82.63-28-127.26-18.32-18.55,4-35.72,11.44-50.64,23.49-1.2,1-1.61.15-2.21-.53-7.11-8-14.24-16.08-21.29-24.17a4.17,4.17,0,0,0-3.53-1.58c-21.4.18-42.8.34-64.2.36-2.31,0-2.69.71-2.69,2.81q-.1,106.56-.33,213.1Q103.14,455,103,569.62c0,1-.37,2.15.21,3.17a3.75,3.75,0,0,1,1.29-.11h64.63a3.47,3.47,0,0,1,1.5.15c.67-.75.32-1.66.32-2.48q0-80.43,0-160.86a5.23,5.23,0,0,1,.31-2.77l.73.85a155.81,155.81,0,0,0,40.38,32.77c35.93,20.32,74.09,26.85,114.33,16.45,55.26-14.28,100.71-58.09,118.14-113.09C455.75,309.19,455.43,274.34,446.45,239.6ZM288.68,389.92c-55.84-.15-101.1-45.74-101-101.77S233.31,187,289.51,187.08c55.91.11,101,45.58,100.95,101.69A101.41,101.41,0,0,1,288.68,389.92Z" transform="translate(-102.83 -122.34)" />
            </svg>
          </div>

          {/* PaySa Logo/Text */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold" style={{color: '#1f5a7c'}}>
              Pay<span style={{color: '#f9d11f'}}>Sa</span>
            </h1>
            <div className="text-lg font-medium text-gray-700">
              Management System
            </div>
          </div>

          {/* Loading Text */}
          <div className="text-sm" style={{color: '#f9d11f'}}>
            Loading...
          </div>
        </div>
      </div>
    );
  }

  if (!currentUser || !compatibleUser) {
    return null;
  }

  const menuItems = getMenuItems();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Mobile sidebar backdrop */}
      <div className="lg:hidden">
        <Layout user={compatibleUser} onLogout={handleLogout}>
          {getPageComponent()}
        </Layout>
      </div>

      {/* Desktop layout */}
      <div className="hidden lg:flex min-h-screen relative">
        {/* Sidebar */}
        <div className="w-64 bg-white shadow-lg fixed left-0 top-0 h-full z-30">
          <div className="flex items-center h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8">
                <img src="/SecQR.svg" alt="SecQR" className="w-full h-full object-contain" />
              </div>
              <h1 className="text-xl font-bold text-gray-900">SECQR</h1>
            </div>
          </div>
          
          <nav className="mt-6 px-4">
            <div className="space-y-2">
              {/* User info */}
              <div className="px-3 py-2 bg-blue-50 rounded-lg border border-blue-200 mb-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                    <span className="text-white text-xs font-medium">
                      {currentUser.name.split(' ').map((n: string) => n[0]).join('').toUpperCase()}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-blue-900 truncate">{currentUser.name}</p>
                    <p className="text-xs text-blue-600 truncate">
                      {currentUser.role.replace('_', ' ').replace(/\b\w/g, (l: string) => l.toUpperCase())}
                    </p>
                  </div>
                </div>
              </div>

              {/* Menu items */}
              {menuItems.map((item) => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setCurrentPage(item.id as Page)}
                    className={`w-full flex items-center space-x-2 px-3 py-2 rounded-lg text-left transition-colors ${
                      currentPage === item.id
                        ? 'bg-blue-100 text-blue-700 border border-blue-200'
                        : 'text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{item.name}</span>
                  </button>
                );
              })}
            </div>
          </nav>

          {/* Logout button */}
          <div className="mt-8 px-4">
            <button
              onClick={handleLogout}
              className="w-full flex items-center space-x-2 px-3 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            >
              <LogOut className="h-4 w-4" />
              <span className="text-sm font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 overflow-auto ml-64">
          <main className="p-6">
            {getPageComponent()}
          </main>
        </div>
      </div>
    </div>
  );
}

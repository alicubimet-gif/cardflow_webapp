'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { AuthService } from '@/services/auth-service';

export interface WebAppUser {
  id: string;
  email: string;
  name: string;
  can_approve_records?: boolean;
  role: 'organization_admin' | 'organization_staff' | string;
  organization_id?: string;
  organization_name?: string;
  organization_type?: 'School' | 'Office' | string;
  assigned_divisions?: string[];
  assigned_departments?: string[];
  phone?: string;
  first_login?: boolean;
  temp_password?: string;
}

interface AuthContextType {
  user: WebAppUser | null;
  loading: boolean;
  login: (credentials: { email: string; password: string }) => Promise<void>;
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  verifyToken: (token: string) => Promise<void>;
  completePassword: (password: string, token: string, confirmPassword?: string) => Promise<void>;
  setupPassword: (password: string, confirmPassword?: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PUBLIC_PATHS = ['/login', '/auth/login', '/auth/magic-login', '/auth/password-setup', '/auth/setup-password', '/setup-password', '/auth/forgot-password', '/auth/reset-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<WebAppUser | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  const handleAuthSuccess = (data: any) => {
    const userPayload = data?.user || data?.data?.user || data || {};
    const orgPayload = userPayload?.organization || {};
    
    const mapped: WebAppUser = {
      id: userPayload.id || '',
      email: userPayload.email || '',
      name: `${userPayload.first_name || ''} ${userPayload.last_name || ''}`.trim() || userPayload.email || '',
      role: userPayload.role || '',
      organization_id: userPayload.school_id || userPayload.office_id || orgPayload.id || userPayload.organization_id || '',
      organization_name: orgPayload.name || userPayload.organization_name || '',
      organization_type: orgPayload.organization_type || userPayload.organization_type || 'School',
      assigned_divisions: userPayload.assigned_divisions || [],
      assigned_departments: userPayload.assigned_departments || [],
      phone: userPayload.phone || userPayload.mobile_number || '',
      first_login: userPayload.first_login || data?.first_login || data?.data?.first_login || false,
      temp_password: userPayload.temp_password || data?.temp_password || data?.data?.temp_password || '',
      can_approve_records: userPayload.can_approve_records || false,
    };
    
    setUser(mapped);
  };

  const checkSession = async () => {
    try {
      const profile = await AuthService.getProfile();
      // Block subscriber_admin and super_admin from WebApp
      if (['subscriber_admin', 'super_admin', 'SUPER_ADMIN', 'SUBSCRIBER_ADMIN'].includes(profile?.role)) {
        setUser(null);
        await AuthService.logout();
        router.push('/login?status=denied');
        return;
      }
      
      if (!['organization_admin', 'organization_staff'].includes(profile?.role)) {
        setUser(null);
        await AuthService.logout();
        router.push('/login?status=denied');
        return;
      }
      
      handleAuthSuccess(profile);
    } catch (error) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkSession();
  }, []);

  useEffect(() => {
    if (!loading) {
      const isPublicPath = PUBLIC_PATHS.some(p => pathname === p || pathname.startsWith(p + '?'));
      
      if (!user && !isPublicPath) {
        router.push('/login');
      } else if (user) {
        if (user.first_login && pathname !== '/auth/setup-password' && pathname !== '/setup-password') {
          router.push('/auth/setup-password');
        } else if (!user.first_login && isPublicPath) {
          router.push('/');
        }
      }
    }
  }, [pathname, loading, user]);

  const login = async (credentials: { email: string; password: string }) => {
    setLoading(true);
    try {
      const data = await AuthService.login(credentials);
      const userPayload = data?.user || data?.data?.user || {};
      
      if (['subscriber_admin', 'super_admin', 'SUPER_ADMIN', 'SUBSCRIBER_ADMIN'].includes(userPayload.role)) {
        await AuthService.logout().catch(() => {});
        throw { response: { data: { message: 'Access denied. Subscriber and Super Admins cannot access CardFlow WebApp.' } } };
      }
      
      if (!['organization_admin', 'organization_staff'].includes(userPayload.role)) {
        await AuthService.logout().catch(() => {});
        throw { response: { data: { message: 'Access denied. Only Organization Admin or Staff can access CardFlow WebApp.' } } };
      }

      handleAuthSuccess(data);
      router.push('/');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await AuthService.logout();
    } catch (e) {
      // ignore
    } finally {
      setUser(null);
      setLoading(false);
      router.push('/login');
    }
  };

  const verifyToken = React.useCallback(async (token: string) => {
    setLoading(true);
    try {
      const data = await AuthService.verifyMagicToken(token);
      handleAuthSuccess(data);
    } catch (error) {
      setUser(null);
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, []);

  const completePassword = React.useCallback(async (password: string, token: string, confirmPassword?: string) => {
    setLoading(true);
    try {
      const data = await AuthService.completePasswordSetup({
        token,
        password,
        confirm_password: confirmPassword || password
      });
      handleAuthSuccess(data);
      router.push('/');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  const setupPassword = React.useCallback(async (password: string, confirmPassword?: string) => {
    setLoading(true);
    try {
      const data = await AuthService.setupPassword({
        new_password: password,
        confirm_password: confirmPassword || password
      });
      handleAuthSuccess(data);
      router.push('/');
    } catch (error) {
      setLoading(false);
      throw error;
    } finally {
      setLoading(false);
    }
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, checkSession, verifyToken, completePassword, setupPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

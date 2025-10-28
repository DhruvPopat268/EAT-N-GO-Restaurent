'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';

export const useAuthInterceptor = () => {
  const router = useRouter();

  useEffect(() => {
    let isRedirecting = false;

    const handleUnauthorized = () => {
      if (!isRedirecting) {
        isRedirecting = true;
        localStorage.removeItem('user');
        localStorage.removeItem('isAuthenticated');
        localStorage.removeItem('authToken');
        router.push('/signin');
      }
    };

    // Axios interceptor
    const axiosInterceptor = axios.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          handleUnauthorized();
        }
        return Promise.reject(error);
      }
    );

    // Fetch interceptor
    const originalFetch = window.fetch;
    window.fetch = async (...args) => {
      try {
        const response = await originalFetch(...args);
        if (response.status === 401) {
          handleUnauthorized();
        }
        return response;
      } catch (error) {
        throw error;
      }
    };

    // Cleanup
    return () => {
      axios.interceptors.response.eject(axiosInterceptor);
      window.fetch = originalFetch;
    };
  }, [router]);
};
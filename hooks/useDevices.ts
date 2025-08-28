import { useState, useEffect, useCallback } from 'react';
import { deviceApi, uploadHistoryApi } from '@/lib/api-client';
import { Device, DeviceFilterDTO, PagedResponseDTO, UploadHistoryItem } from '@/types/device';

export function useDevices() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    empty: true,
  });

  const fetchDevices = useCallback(async (filters: DeviceFilterDTO) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deviceApi.getAll(filters);
      
      if (response.success) {
        setDevices(response.data.content);
        setPagination({
          page: response.data.page,
          size: response.data.size,
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
          first: response.data.first,
          last: response.data.last,
          empty: response.data.empty,
        });
      } else {
        setError(response.error || 'Failed to fetch devices');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const createDevice = useCallback(async (device: Omit<Device, 'id' | 'createdAt' | 'updatedAt'>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deviceApi.create(device);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to create device');
        throw new Error(response.error || 'Failed to create device');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateDevice = useCallback(async (id: number, device: Partial<Device>) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deviceApi.update(id, device);
      
      if (response.success) {
        setDevices(prev => prev.map(d => d.id === id ? response.data : d));
        return response.data;
      } else {
        setError(response.error || 'Failed to update device');
        throw new Error(response.error || 'Failed to update device');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteDevice = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deviceApi.delete(id);
      
      if (response.success) {
        setDevices(prev => prev.filter(d => d.id !== id));
        return true;
      } else {
        setError(response.error || 'Failed to delete device');
        throw new Error(response.error || 'Failed to delete device');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeviceById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deviceApi.getById(id);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch device');
        throw new Error(response.error || 'Failed to fetch device');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const getDeviceBySerial = useCallback(async (serialNumber: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deviceApi.getBySerial(serialNumber);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch device');
        throw new Error(response.error || 'Failed to fetch device');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const importDevices = useCallback(async (file: File) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await deviceApi.import(file);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to import devices');
        throw new Error(response.error || 'Failed to import devices');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const exportDevices = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const blob = await deviceApi.export();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = 'devices.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    devices,
    loading,
    error,
    pagination,
    fetchDevices,
    createDevice,
    updateDevice,
    deleteDevice,
    getDeviceById,
    getDeviceBySerial,
    importDevices,
    exportDevices,
  };
}

export function useDeviceFilters() {
  const [regions, setRegions] = useState<string[]>([]);
  const [branches, setBranches] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRegions = useCallback(async () => {
    setLoading(true);
    try {
      const response = await deviceApi.getRegions();
      if (response.success) {
        setRegions(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch regions');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchBranches = useCallback(async () => {
    setLoading(true);
    try {
      const response = await deviceApi.getBranches();
      if (response.success) {
        setBranches(response.data);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch branches');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRegions();
    fetchBranches();
  }, [fetchRegions, fetchBranches]);

  return {
    regions,
    branches,
    loading,
    error,
    refetch: () => {
      fetchRegions();
      fetchBranches();
    },
  };
}

export function useUploadHistory() {
  const [uploadHistory, setUploadHistory] = useState<UploadHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState({
    page: 0,
    size: 10,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    empty: true,
  });

  const fetchUploadHistory = useCallback(async (page: number = 0, size: number = 10) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await uploadHistoryApi.getAll(page, size);
      
      if (response.success) {
        setUploadHistory(response.data.content);
        setPagination({
          page: response.data.page,
          size: response.data.size,
          totalElements: response.data.totalElements,
          totalPages: response.data.totalPages,
          first: response.data.first,
          last: response.data.last,
          empty: response.data.empty,
        });
      } else {
        setError(response.error || 'Failed to fetch upload history');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred');
    } finally {
      setLoading(false);
    }
  }, []);

  const getUploadHistoryById = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await uploadHistoryApi.getById(id);
      
      if (response.success) {
        return response.data;
      } else {
        setError(response.error || 'Failed to fetch upload history');
        throw new Error(response.error || 'Failed to fetch upload history');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    uploadHistory,
    loading,
    error,
    pagination,
    fetchUploadHistory,
    getUploadHistoryById,
  };
}
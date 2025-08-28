import { useState, useCallback, useMemo } from 'react';
import { AuditLogFilterDTO } from '@/api/services/auditLogService';

export interface UseAuditFiltersReturn {
  filters: AuditLogFilterDTO;
  setSearchTerm: (searchTerm: string) => void;
  setModuleFilter: (module: string) => void;
  setActionFilter: (action: string) => void;
  setStatusFilter: (status: string) => void;
  setUserFilter: (userId: string) => void;
  setDateFilter: (dateFilter: string) => void;
  setResourceTypeFilter: (resourceType: string) => void;
  setIpAddressFilter: (ipAddress: string) => void;
  setPage: (page: number) => void;
  setPageSize: (size: number) => void;
  setSorting: (sortBy: string, sortDirection: 'asc' | 'desc') => void;
  resetFilters: () => void;
  hasActiveFilters: boolean;
}

const defaultFilters: AuditLogFilterDTO = {
  page: 0,
  size: 10,
  sortBy: 'timestamp',
  sortDirection: 'desc',
  searchTerm: '',
  action: '',
  module: '',
  status: '',
  userId: undefined,
  userRole: '',
  dateFilter: '',
  startDate: '',
  endDate: '',
  resourceType: '',
  ipAddress: '',
};

export function useAuditFilters(): UseAuditFiltersReturn {
  const [filters, setFilters] = useState<AuditLogFilterDTO>(defaultFilters);

  const setSearchTerm = useCallback((searchTerm: string) => {
    setFilters(prev => ({ ...prev, searchTerm, page: 0 }));
  }, []);

  const setModuleFilter = useCallback((module: string) => {
    setFilters(prev => ({ 
      ...prev, 
      module: module === 'all' ? '' : module, 
      page: 0 
    }));
  }, []);

  const setActionFilter = useCallback((action: string) => {
    setFilters(prev => ({ 
      ...prev, 
      action: action === 'all' ? '' : action, 
      page: 0 
    }));
  }, []);

  const setStatusFilter = useCallback((status: string) => {
    setFilters(prev => ({ 
      ...prev, 
      status: status === 'all' ? '' : status, 
      page: 0 
    }));
  }, []);

  const setUserFilter = useCallback((userId: string) => {
    setFilters(prev => ({ 
      ...prev, 
      userId: userId === 'all' ? undefined : parseInt(userId, 10), 
      page: 0 
    }));
  }, []);

  const setDateFilter = useCallback((dateFilter: string) => {
    let startDate = '';
    let endDate = '';
    
    if (dateFilter !== 'all' && dateFilter !== '') {
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          startDate = today.toISOString().split('T')[0];
          endDate = new Date(today.getTime() + 24 * 60 * 60 * 1000 - 1).toISOString().split('T')[0];
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          startDate = weekAgo.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          startDate = monthAgo.toISOString().split('T')[0];
          endDate = today.toISOString().split('T')[0];
          break;
      }
    }

    setFilters(prev => ({ 
      ...prev, 
      dateFilter: dateFilter === 'all' ? '' : dateFilter,
      startDate,
      endDate,
      page: 0 
    }));
  }, []);

  const setResourceTypeFilter = useCallback((resourceType: string) => {
    setFilters(prev => ({ 
      ...prev, 
      resourceType: resourceType === 'all' ? '' : resourceType, 
      page: 0 
    }));
  }, []);

  const setIpAddressFilter = useCallback((ipAddress: string) => {
    setFilters(prev => ({ 
      ...prev, 
      ipAddress: ipAddress === 'all' ? '' : ipAddress, 
      page: 0 
    }));
  }, []);

  const setPage = useCallback((page: number) => {
    setFilters(prev => ({ ...prev, page }));
  }, []);

  const setPageSize = useCallback((size: number) => {
    setFilters(prev => ({ ...prev, size, page: 0 }));
  }, []);

  const setSorting = useCallback((sortBy: string, sortDirection: 'asc' | 'desc') => {
    setFilters(prev => ({ ...prev, sortBy, sortDirection }));
  }, []);

  const resetFilters = useCallback(() => {
    setFilters(defaultFilters);
  }, []);

  const hasActiveFilters = useMemo(() => {
    return filters.searchTerm !== '' ||
           filters.action !== '' ||
           filters.module !== '' ||
           filters.status !== '' ||
           filters.userId !== undefined ||
           filters.userRole !== '' ||
           filters.dateFilter !== '' ||
           filters.resourceType !== '' ||
           filters.ipAddress !== '';
  }, [filters]);

  return {
    filters,
    setSearchTerm,
    setModuleFilter,
    setActionFilter,
    setStatusFilter,
    setUserFilter,
    setDateFilter,
    setResourceTypeFilter,
    setIpAddressFilter,
    setPage,
    setPageSize,
    setSorting,
    resetFilters,
    hasActiveFilters,
  };
}

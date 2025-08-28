import { useState, useEffect, useCallback } from 'react';
import terminalService, { 
  TerminalDTO, 
  TerminalCreateDTO, 
  TerminalFilterDTO, 
  TerminalMaintenanceDTO, 
  TerminalConfigurationDTO,
  PagedResponseDTO
} from '@/api/services/terminalService';

interface UseTerminalsResult {
  terminals: TerminalDTO[];
  loading: boolean;
  error: string | null;
  totalItems: number;
  totalPages: number;
  currentPage: number;
  stats: Record<string, any> | null;
  merchants: string[];
  locations: string[];
  
  // Actions
  loadTerminals: (filter: TerminalFilterDTO) => Promise<void>;
  createTerminal: (terminalData: TerminalCreateDTO) => Promise<TerminalDTO>;
  updateTerminal: (id: number, terminalData: TerminalCreateDTO) => Promise<TerminalDTO>;
  deleteTerminal: (id: number) => Promise<void>;
  getTerminalById: (id: number) => Promise<TerminalDTO>;
  
  // Maintenance
  addMaintenanceRecord: (terminalId: number, maintenanceData: TerminalMaintenanceDTO) => Promise<TerminalMaintenanceDTO>;
  updateMaintenanceRecord: (terminalId: number, maintenanceId: number, maintenanceData: TerminalMaintenanceDTO) => Promise<TerminalMaintenanceDTO>;
  deleteMaintenanceRecord: (terminalId: number, maintenanceId: number) => Promise<void>;
  
  // Configuration
  updateConfiguration: (terminalId: number, configurationData: TerminalConfigurationDTO) => Promise<TerminalConfigurationDTO>;
  getConfiguration: (terminalId: number) => Promise<TerminalConfigurationDTO | null>;
  
  // Utility
  checkTerminalIdAvailability: (terminalId: string, excludeId?: number) => Promise<boolean>;
  exportTerminals: () => Promise<void>;
  importTerminals: (file: File) => Promise<any>;
  
  // Reset functions
  clearError: () => void;
  refresh: () => Promise<void>;
}

// Utility function to calculate statistics from terminals array
const calculateLocalStats = (terminals: TerminalDTO[]) => {
  const statusBreakdown = terminals.reduce((acc, terminal) => {
    const status = terminal.status;
    acc[status] = (acc[status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    total: terminals.length,
    statusBreakdown
  };
};

export const useTerminals = (): UseTerminalsResult => {
  const [terminals, setTerminals] = useState<TerminalDTO[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [currentPage, setCurrentPage] = useState(0);
  const [stats, setStats] = useState<Record<string, any> | null>(null);
  const [merchants, setMerchants] = useState<string[]>([]);
  const [locations, setLocations] = useState<string[]>([]);
  const [lastFilter, setLastFilter] = useState<TerminalFilterDTO>({});

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const loadTerminals = useCallback(async (filter: TerminalFilterDTO) => {
    setLoading(true);
    setError(null);
    setLastFilter(filter);
    
    try {
      const response = await terminalService.getAllTerminals(filter);
      setTerminals(response.content);
      setTotalItems(response.totalElements);
      setTotalPages(response.totalPages);
      setCurrentPage(response.number);
      
      // Calculate and set local statistics
      const localStats = calculateLocalStats(response.content);
      setStats(localStats);
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to load terminals');
      console.error('Error loading terminals:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const createTerminal = useCallback(async (terminalData: TerminalCreateDTO): Promise<TerminalDTO> => {
    setLoading(true);
    setError(null);
    
    try {
      const newTerminal = await terminalService.createTerminal(terminalData);
      
      // Refresh the terminals list
      await loadTerminals(lastFilter);
      
      return newTerminal;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to create terminal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [loadTerminals, lastFilter]);

  const updateTerminal = useCallback(async (id: number, terminalData: TerminalCreateDTO): Promise<TerminalDTO> => {
    setLoading(true);
    setError(null);
    
    try {
      const updatedTerminal = await terminalService.updateTerminal(id, terminalData);
      
      // Update the local state
      const updatedTerminals = terminals.map(terminal => 
        terminal.id === id ? updatedTerminal : terminal
      );
      setTerminals(updatedTerminals);
      
      // Recalculate statistics
      const localStats = calculateLocalStats(updatedTerminals);
      setStats(localStats);
      
      return updatedTerminal;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update terminal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [terminals]);

  const deleteTerminal = useCallback(async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    
    try {
      await terminalService.deleteTerminal(id);
      
      // Remove from local state
      const updatedTerminals = terminals.filter(terminal => terminal.id !== id);
      setTerminals(updatedTerminals);
      setTotalItems(prev => prev - 1);
      
      // Recalculate statistics
      const localStats = calculateLocalStats(updatedTerminals);
      setStats(localStats);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete terminal';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const getTerminalById = useCallback(async (id: number): Promise<TerminalDTO> => {
    setError(null);
    
    try {
      return await terminalService.getTerminalById(id);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get terminal';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const addMaintenanceRecord = useCallback(async (terminalId: number, maintenanceData: TerminalMaintenanceDTO): Promise<TerminalMaintenanceDTO> => {
    setError(null);
    
    try {
      const newMaintenance = await terminalService.addMaintenanceRecord(terminalId, maintenanceData);
      
      // Update the terminal in local state
      setTerminals(prev => prev.map(terminal => {
        if (terminal.id === terminalId) {
          return {
            ...terminal,
            maintenanceHistory: [...(terminal.maintenanceHistory || []), newMaintenance]
          };
        }
        return terminal;
      }));
      
      return newMaintenance;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to add maintenance record';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateMaintenanceRecord = useCallback(async (terminalId: number, maintenanceId: number, maintenanceData: TerminalMaintenanceDTO): Promise<TerminalMaintenanceDTO> => {
    setError(null);
    
    try {
      const updatedMaintenance = await terminalService.updateMaintenanceRecord(terminalId, maintenanceId, maintenanceData);
      
      // Update the terminal in local state
      setTerminals(prev => prev.map(terminal => {
        if (terminal.id === terminalId && terminal.maintenanceHistory) {
          return {
            ...terminal,
            maintenanceHistory: terminal.maintenanceHistory.map(record => 
              record.id === maintenanceId ? updatedMaintenance : record
            )
          };
        }
        return terminal;
      }));
      
      return updatedMaintenance;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update maintenance record';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const deleteMaintenanceRecord = useCallback(async (terminalId: number, maintenanceId: number): Promise<void> => {
    setError(null);
    
    try {
      await terminalService.deleteMaintenanceRecord(terminalId, maintenanceId);
      
      // Update the terminal in local state
      setTerminals(prev => prev.map(terminal => {
        if (terminal.id === terminalId && terminal.maintenanceHistory) {
          return {
            ...terminal,
            maintenanceHistory: terminal.maintenanceHistory.filter(record => record.id !== maintenanceId)
          };
        }
        return terminal;
      }));
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to delete maintenance record';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const updateConfiguration = useCallback(async (terminalId: number, configurationData: TerminalConfigurationDTO): Promise<TerminalConfigurationDTO> => {
    setError(null);
    
    try {
      const updatedConfiguration = await terminalService.updateConfiguration(terminalId, configurationData);
      
      // Update the terminal in local state
      setTerminals(prev => prev.map(terminal => {
        if (terminal.id === terminalId) {
          return {
            ...terminal,
            configuration: updatedConfiguration
          };
        }
        return terminal;
      }));
      
      return updatedConfiguration;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to update configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const getConfiguration = useCallback(async (terminalId: number): Promise<TerminalConfigurationDTO | null> => {
    setError(null);
    
    try {
      return await terminalService.getConfiguration(terminalId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to get configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const checkTerminalIdAvailability = useCallback(async (terminalId: string, excludeId?: number): Promise<boolean> => {
    setError(null);
    
    try {
      return await terminalService.checkTerminalIdAvailability(terminalId, excludeId);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to check terminal ID availability';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const exportTerminals = useCallback(async (): Promise<void> => {
    setError(null);
    
    try {
      const blob = await terminalService.exportTerminals();
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `terminals_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to export terminals';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, []);

  const importTerminals = useCallback(async (file: File): Promise<any> => {
    setError(null);
    
    try {
      const result = await terminalService.importTerminals(file);
      
      // Refresh the terminals list
      await loadTerminals(lastFilter);
      
      return result;
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Failed to import terminals';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  }, [loadTerminals, lastFilter]);

  const refresh = useCallback(async (): Promise<void> => {
    await loadTerminals(lastFilter);
  }, [loadTerminals, lastFilter]);

  // Load initial data
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const [merchantsData, locationsData] = await Promise.all([
          terminalService.getDistinctMerchantNames(),
          terminalService.getDistinctLocationNames()
        ]);

        setMerchants(merchantsData);
        setLocations(locationsData);
        
        // Try to get stats from backend, but don't fail if unavailable
        try {
          const statsData = await terminalService.getTerminalStatistics();
          if (statsData && Object.keys(statsData).length > 0) {
            setStats(statsData);
          }
        } catch (statsError) {
          // Stats will be calculated locally when terminals are loaded
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      }
    };

    loadInitialData();
  }, []);

  // Calculate local statistics
  useEffect(() => {
    const localStats = calculateLocalStats(terminals);
    setStats(prevStats => ({
      ...prevStats,
      ...localStats
    }));
  }, [terminals]);

  return {
    terminals,
    loading,
    error,
    totalItems,
    totalPages,
    currentPage,
    stats,
    merchants,
    locations,
    
    loadTerminals,
    createTerminal,
    updateTerminal,
    deleteTerminal,
    getTerminalById,
    
    addMaintenanceRecord,
    updateMaintenanceRecord,
    deleteMaintenanceRecord,
    
    updateConfiguration,
    getConfiguration,
    
    checkTerminalIdAvailability,
    exportTerminals,
    importTerminals,
    
    clearError,
    refresh
  };
};

// api/hooks/useSimCards.ts
import { useState, useEffect, useCallback } from 'react';
import { SimCardService } from '../api/services/simCardService';
import type { 
  SimCard, 
  CreateSimCardRequest, 
  SimCardFilter, 
  PagedResponse, 
  ImportResult 
} from '../types/sim';

export interface UseSimCardsResult {
  simCards: SimCard[];
  loading: boolean;
  error: string | null;
  totalElements: number;
  totalPages: number;
  currentPage: number;
  refresh: () => Promise<void>;
  loadPage: (page: number) => Promise<void>;
}

export function useSimCards(initialFilter: SimCardFilter = {}) {
  const [simCards, setSimCards] = useState<SimCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<SimCardFilter>(initialFilter);
  const [pageData, setPageData] = useState({
    totalElements: 0,
    totalPages: 0,
    currentPage: 0,
  });

  const fetchSimCards = useCallback(async (newFilter?: SimCardFilter) => {
    setLoading(true);
    setError(null);

    const filterToUse = newFilter || filter;
    const response = await SimCardService.getSimCards(filterToUse);

    if (response.success && response.data) {
      setSimCards(response.data.content);
      setPageData({
        totalElements: response.data.totalElements,
        totalPages: response.data.totalPages,
        currentPage: response.data.page,
      });
    } else {
      setError(response.error?.message || 'Failed to load SIM cards');
      setSimCards([]);
    }

    setLoading(false);
  }, [filter]);

  const updateFilter = useCallback((newFilter: Partial<SimCardFilter>) => {
    const updatedFilter = { ...filter, ...newFilter, page: 0 };
    setFilter(updatedFilter);
    return fetchSimCards(updatedFilter);
  }, [filter, fetchSimCards]);

  const loadPage = useCallback((page: number) => {
    const updatedFilter = { ...filter, page };
    setFilter(updatedFilter);
    return fetchSimCards(updatedFilter);
  }, [filter, fetchSimCards]);

  const refresh = useCallback(() => fetchSimCards(), [fetchSimCards]);

  useEffect(() => {
    fetchSimCards();
  }, [fetchSimCards]);

  return {
    simCards,
    loading,
    error,
    totalElements: pageData.totalElements,
    totalPages: pageData.totalPages,
    currentPage: pageData.currentPage,
    filter,
    updateFilter,
    refresh,
    loadPage,
  };
}

export interface UseSimCardResult {
  simCard: SimCard | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useSimCard(id: number | null) {
  const [simCard, setSimCard] = useState<SimCard | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSimCard = useCallback(async () => {
    if (!id) {
      setSimCard(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    const response = await SimCardService.getSimCardById(id);

    if (response.success && response.data) {
      setSimCard(response.data);
    } else {
      setError(response.error?.message || 'Failed to load SIM card');
      setSimCard(null);
    }

    setLoading(false);
  }, [id]);

  const refresh = useCallback(() => fetchSimCard(), [fetchSimCard]);

  useEffect(() => {
    fetchSimCard();
  }, [fetchSimCard]);

  return {
    simCard,
    loading,
    error,
    refresh,
  };
}

export interface UseSimCardMutationsResult {
  createSimCard: (request: CreateSimCardRequest) => Promise<SimCard | null>;
  updateSimCard: (id: number, simCard: SimCard) => Promise<SimCard | null>;
  deleteSimCard: (id: number) => Promise<boolean>;
  importSimCards: (file: File) => Promise<ImportResult | null>;
  exportSimCards: () => Promise<void>;
  loading: boolean;
  error: string | null;
}

export function useSimCardMutations() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createSimCard = useCallback(async (request: CreateSimCardRequest): Promise<SimCard | null> => {
    setLoading(true);
    setError(null);

    const response = await SimCardService.createSimCard(request);

    setLoading(false);

    if (response.success && response.data) {
      return response.data;
    } else {
      setError(response.error?.message || 'Failed to create SIM card');
      return null;
    }
  }, []);

  const updateSimCard = useCallback(async (id: number, simCard: SimCard): Promise<SimCard | null> => {
    setLoading(true);
    setError(null);

    const response = await SimCardService.updateSimCard(id, simCard);

    setLoading(false);

    if (response.success && response.data) {
      return response.data;
    } else {
      setError(response.error?.message || 'Failed to update SIM card');
      return null;
    }
  }, []);

  const deleteSimCard = useCallback(async (id: number): Promise<boolean> => {
    setLoading(true);
    setError(null);

    const response = await SimCardService.deleteSimCard(id);

    setLoading(false);

    if (response.success) {
      return true;
    } else {
      setError(response.error?.message || 'Failed to delete SIM card');
      return false;
    }
  }, []);

  const importSimCards = useCallback(async (file: File): Promise<ImportResult | null> => {
    setLoading(true);
    setError(null);

    const response = await SimCardService.importSimCards(file);

    setLoading(false);

    if (response.success && response.data) {
      return response.data;
    } else {
      setError(response.error?.message || 'Failed to import SIM cards');
      return null;
    }
  }, []);

  const exportSimCards = useCallback(async (): Promise<void> => {
    setLoading(true);
    setError(null);

    try {
      await SimCardService.exportSimCards();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export SIM cards');
    }

    setLoading(false);
  }, []);

  return {
    createSimCard,
    updateSimCard,
    deleteSimCard,
    importSimCards,
    exportSimCards,
    loading,
    error,
  };
}

export interface UseProvidersResult {
  providers: string[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useProviders() {
  const [providers, setProviders] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProviders = useCallback(async () => {
    setLoading(true);
    setError(null);

    const response = await SimCardService.getProviders();

    if (response.success && response.data) {
      setProviders(response.data);
    } else {
      setError(response.error?.message || 'Failed to load providers');
      // Fallback providers if API fails
      setProviders(['TeleCom', 'MobileCorp', 'Airtel', 'Vodafone']);
    }

    setLoading(false);
  }, []);

  const refresh = useCallback(() => fetchProviders(), [fetchProviders]);

  useEffect(() => {
    fetchProviders();
  }, [fetchProviders]);

  return {
    providers,
    loading,
    error,
    refresh,
  };
}
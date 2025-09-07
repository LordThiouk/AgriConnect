// Unified API Service - AgriConnect
// Replaces local services with real API calls to Supabase Edge Functions

import { Database } from '../supabase/types/database';

// Types from database
type Producer = Database['public']['Tables']['producers']['Row'];
type Plot = Database['public']['Tables']['plots']['Row'];
type Crop = Database['public']['Tables']['crops']['Row'];
type Operation = Database['public']['Tables']['operations']['Row'];
type Observation = Database['public']['Tables']['observations']['Row'];
type Cooperative = Database['public']['Tables']['cooperatives']['Row'];

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('.supabase.co', '.supabase.co/functions/v1') || 
                    'https://swggnqbymblnyjcocqxi.supabase.co/functions/v1';

// Authentication token management
class AuthTokenManager {
  private static instance: AuthTokenManager;
  private token: string | null = null;

  static getInstance(): AuthTokenManager {
    if (!AuthTokenManager.instance) {
      AuthTokenManager.instance = new AuthTokenManager();
    }
    return AuthTokenManager.instance;
  }

  setToken(token: string): void {
    this.token = token;
    // Store in localStorage for web app
    if (typeof window !== 'undefined') {
      localStorage.setItem('agriconnect_token', token);
    }
  }

  getToken(): string | null {
    if (!this.token) {
      // Try to get from localStorage for web app
      if (typeof window !== 'undefined') {
        this.token = localStorage.getItem('agriconnect_token');
      }
    }
    return this.token;
  }

  clearToken(): void {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('agriconnect_token');
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }
}

// Base API client with authentication
class ApiClient {
  private tokenManager = AuthTokenManager.getInstance();

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const token = this.tokenManager.getToken();
    
    if (!token) {
      throw new Error('Authentication required');
    }

    const url = `${API_BASE_URL}${endpoint}`;
    const config: RequestInit = {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`,
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
      }

      return await response.json();
    } catch (error) {
      console.error(`API Error (${endpoint}):`, error);
      throw error;
    }
  }

  // Generic CRUD methods
  async get<T>(endpoint: string, params?: Record<string, string | number>): Promise<T> {
    const queryString = params ? `?${new URLSearchParams(
      Object.fromEntries(
        Object.entries(params).map(([key, value]) => [key, String(value)])
      )
    ).toString()}` : '';
    return this.request<T>(`${endpoint}${queryString}`);
  }

  async post<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: any): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async delete<T>(endpoint: string): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
    });
  }
}

// Authentication service
export class AuthService {
  private api = new ApiClient();
  private tokenManager = AuthTokenManager.getInstance();

  async login(email: string, password: string): Promise<{ token: string; user: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Login failed');
      }

      const data = await response.json();
      this.tokenManager.setToken(data.data.token);
      return data.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async signup(email: string, password: string, full_name: string, role: string = 'agent'): Promise<{ token: string; user: any }> {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/signup`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, full_name, role }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Signup failed');
      }

      const data = await response.json();
      this.tokenManager.setToken(data.data.token);
      return data.data;
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async logout(): Promise<void> {
    this.tokenManager.clearToken();
  }

  isAuthenticated(): boolean {
    return this.tokenManager.isAuthenticated();
  }

  getToken(): string | null {
    return this.tokenManager.getToken();
  }
}

// Producers service
export class ProducersService {
  private api = new ApiClient();

  async getAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    cooperative_id?: string;
    region?: string;
  }): Promise<{
    data: Producer[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.api.get('/producers', params);
  }

  async getById(id: string): Promise<{ data: Producer }> {
    return this.api.get(`/producers/${id}`);
  }

  async create(data: Omit<Producer, 'id' | 'created_at' | 'updated_at'>): Promise<{
    message: string;
    data: Producer;
  }> {
    return this.api.post('/producers', data);
  }

  async update(id: string, data: Partial<Producer>): Promise<{
    message: string;
    data: Producer;
  }> {
    return this.api.put(`/producers/${id}`, data);
  }

  async delete(id: string): Promise<{ message: string }> {
    return this.api.delete(`/producers/${id}`);
  }
}

// Plots service
export class PlotsService {
  private api = new ApiClient();

  async getAll(params?: {
    page?: number;
    limit?: number;
    producer_id?: string;
    cooperative_id?: string;
    region?: string;
    status?: string;
  }): Promise<{
    data: Plot[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.api.get('/plots', params);
  }

  async getById(id: string): Promise<{ data: Plot }> {
    return this.api.get(`/plots/${id}`);
  }

  async create(data: Omit<Plot, 'id' | 'created_at' | 'updated_at'>): Promise<{
    message: string;
    data: Plot;
  }> {
    return this.api.post('/plots', data);
  }

  async update(id: string, data: Partial<Plot>): Promise<{
    message: string;
    data: Plot;
  }> {
    return this.api.put(`/plots/${id}`, data);
  }

  async delete(id: string): Promise<{ message: string }> {
    return this.api.delete(`/plots/${id}`);
  }
}

// Crops service
export class CropsService {
  private api = new ApiClient();

  async getAll(params?: {
    page?: number;
    limit?: number;
    plot_id?: string;
    season_id?: string;
    crop_type?: string;
    status?: string;
  }): Promise<{
    data: Crop[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.api.get('/crops', params);
  }

  async getById(id: string): Promise<{ data: Crop }> {
    return this.api.get(`/crops/${id}`);
  }

  async create(data: Omit<Crop, 'id' | 'created_at' | 'updated_at'>): Promise<{
    message: string;
    data: Crop;
  }> {
    return this.api.post('/crops', data);
  }

  async update(id: string, data: Partial<Crop>): Promise<{
    message: string;
    data: Crop;
  }> {
    return this.api.put(`/crops/${id}`, data);
  }

  async delete(id: string): Promise<{ message: string }> {
    return this.api.delete(`/crops/${id}`);
  }
}

// Operations service
export class OperationsService {
  private api = new ApiClient();

  async getAll(params?: {
    page?: number;
    limit?: number;
    crop_id?: string;
    op_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    data: Operation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.api.get('/operations', params);
  }

  async getById(id: string): Promise<{ data: Operation }> {
    return this.api.get(`/operations/${id}`);
  }

  async create(data: Omit<Operation, 'id' | 'created_at' | 'updated_at'>): Promise<{
    message: string;
    data: Operation;
  }> {
    return this.api.post('/operations', data);
  }

  async update(id: string, data: Partial<Operation>): Promise<{
    message: string;
    data: Operation;
  }> {
    return this.api.put(`/operations/${id}`, data);
  }

  async delete(id: string): Promise<{ message: string }> {
    return this.api.delete(`/operations/${id}`);
  }
}

// Observations service
export class ObservationsService {
  private api = new ApiClient();

  async getAll(params?: {
    page?: number;
    limit?: number;
    crop_id?: string;
    pest_disease?: string;
    severity?: number;
    start_date?: string;
    end_date?: string;
  }): Promise<{
    data: Observation[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.api.get('/observations', params);
  }

  async getById(id: string): Promise<{ data: Observation }> {
    return this.api.get(`/observations/${id}`);
  }

  async create(data: Omit<Observation, 'id' | 'created_at' | 'updated_at'>): Promise<{
    message: string;
    data: Observation;
  }> {
    return this.api.post('/observations', data);
  }

  async update(id: string, data: Partial<Observation>): Promise<{
    message: string;
    data: Observation;
  }> {
    return this.api.put(`/observations/${id}`, data);
  }

  async delete(id: string): Promise<{ message: string }> {
    return this.api.delete(`/observations/${id}`);
  }
}

// Cooperatives service
export class CooperativesService {
  private api = new ApiClient();

  async getAll(params?: {
    page?: number;
    limit?: number;
    region?: string;
    department?: string;
    legal_status?: string;
    search?: string;
  }): Promise<{
    data: Cooperative[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      pages: number;
    };
  }> {
    return this.api.get('/cooperatives', params);
  }

  async getById(id: string): Promise<{ data: Cooperative }> {
    return this.api.get(`/cooperatives/${id}`);
  }

  async create(data: Omit<Cooperative, 'id' | 'created_at' | 'updated_at'>): Promise<{
    message: string;
    data: Cooperative;
  }> {
    return this.api.post('/cooperatives', data);
  }

  async update(id: string, data: Partial<Cooperative>): Promise<{
    message: string;
    data: Cooperative;
  }> {
    return this.api.put(`/cooperatives/${id}`, data);
  }

  async delete(id: string): Promise<{ message: string }> {
    return this.api.delete(`/cooperatives/${id}`);
  }
}

// Export all services
export const authService = new AuthService();
export const producersService = new ProducersService();
export const plotsService = new PlotsService();
export const cropsService = new CropsService();
export const operationsService = new OperationsService();
export const observationsService = new ObservationsService();
export const cooperativesService = new CooperativesService();

// Export token manager for direct access if needed
export const tokenManager = AuthTokenManager.getInstance();

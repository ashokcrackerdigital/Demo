import axios from 'axios';
import { SlotsResponse, BookingRequest, BookingResponse } from '../types';

const API_URL = import.meta.env.VITE_API_URL

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error
      const message = error.response.data?.message || error.response.data?.error || 'An error occurred';
      return Promise.reject(new Error(message));
    } else if (error.request) {
      // Request made but no response
      return Promise.reject(new Error('Network error. Please check your connection.'));
    } else {
      // Something else happened
      return Promise.reject(error);
    }
  }
);

export const slotsApi = {
  /**
   * Get slots for a specific date
   */
  getSlots: async (date: string): Promise<SlotsResponse> => {
    const response = await api.get<SlotsResponse>('/api/slots', {
      params: { date },
    });
    return response.data;
  },

  /**
   * Book a slot
   */
  bookSlot: async (booking: BookingRequest): Promise<BookingResponse> => {
    const response = await api.post<BookingResponse>('/api/book', booking);
    return response.data;
  },

  /**
   * Book a slot by date (auto-assign next available slot)
   */
  bookSlotByDate: async (date: string, bookingData: {
    patientName: string;
    patientEmail: string;
    patientPhone: string;
  }): Promise<BookingResponse & { slotTime?: string; slotDate?: string }> => {
    const response = await api.post('/api/book/by-date', {
      date,
      ...bookingData,
    });
    return response.data;
  },
};

export const adminApi = {
  /**
   * Get all slots (admin)
   */
  getAllSlots: async (params?: {
    limit?: number;
    offset?: number;
    date?: string;
    type?: string;
    status?: string;
  }) => {
    const response = await api.get('/api/admin/slots', { params });
    return response.data;
  },

  /**
   * Override slot status (admin)
   */
  overrideSlot: async (slotId: number, status: string) => {
    const response = await api.post('/api/admin/slot/override', {
      slotId,
      status,
    });
    return response.data;
  },
};

export default api;


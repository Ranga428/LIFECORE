import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';

interface User {
  id: string;
  email: string;
  name: string;
  subscription_tier: string;
  theme: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  login: (user: User, token: string, refreshToken: string) => Promise<void>;
  logout: () => Promise<void>;
  loadAuth: () => Promise<void>;
  updateUser: (updates: Partial<User>) => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  token: null,
  refreshToken: null,
  isLoading: true,

  login: async (user, token, refreshToken) => {
    await SecureStore.setItemAsync('token', token);
    await SecureStore.setItemAsync('refreshToken', refreshToken);
    await AsyncStorage.setItem('user', JSON.stringify(user));
    set({ user, token, refreshToken, isLoading: false });
  },

  logout: async () => {
    await SecureStore.deleteItemAsync('token');
    await SecureStore.deleteItemAsync('refreshToken');
    await AsyncStorage.removeItem('user');
    set({ user: null, token: null, refreshToken: null, isLoading: false });
  },

  loadAuth: async () => {
    try {
      const token = await SecureStore.getItemAsync('token');
      const refreshToken = await SecureStore.getItemAsync('refreshToken');
      const userStr = await AsyncStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      
      if (token && user) {
        set({ user, token, refreshToken, isLoading: false });
      } else {
        set({ isLoading: false });
      }
    } catch (error) {
      console.error('Failed to load auth:', error);
      set({ isLoading: false });
    }
  },

  updateUser: (updates) => {
    const { user } = get();
    if (user) {
      const updatedUser = { ...user, ...updates };
      AsyncStorage.setItem('user', JSON.stringify(updatedUser));
      set({ user: updatedUser });
    }
  },
}));
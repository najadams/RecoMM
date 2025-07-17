import React, { createContext, useContext, useState, useEffect } from 'react';
import apiService from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await apiService.getCurrentUser();
          setUser(userData);
          setIsAuthenticated(true);
        } catch (error) {
          // Token is invalid, remove it
          localStorage.removeItem('token');
          setUser(null);
          setIsAuthenticated(false);
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  const login = async (credentials) => {
    try {
      const response = await apiService.login(credentials);
      const { token, user } = response;
      
      apiService.setAuthToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      console.error('Login failed:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Login failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (errorMessage.includes('Invalid credentials')) {
        errorMessage = 'Invalid email or password. Please check your credentials and try again.';
      } else if (errorMessage.includes('Account has been deactivated')) {
        errorMessage = 'Your account has been deactivated. Please contact support for assistance.';
      } else if (errorMessage.includes('valid email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      const friendlyError = new Error(errorMessage);
      friendlyError.originalError = error;
      throw friendlyError;
    }
  };

  const register = async (userData) => {
    try {
      const response = await apiService.register(userData);
      const { token, user } = response;
      
      apiService.setAuthToken(token);
      setUser(user);
      setIsAuthenticated(true);
      
      return response;
    } catch (error) {
      console.error('Registration failed:', error);
      
      // Provide user-friendly error messages
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      // Handle specific error cases
      if (errorMessage.includes('email already exists')) {
        errorMessage = 'An account with this email already exists. Please use a different email or try logging in.';
      } else if (errorMessage.includes('username already exists')) {
        errorMessage = 'This username is already taken. Please choose a different username.';
      } else if (errorMessage.includes('Password must be at least')) {
        errorMessage = 'Password must be at least 6 characters long.';
      } else if (errorMessage.includes('Passwords do not match')) {
        errorMessage = 'Passwords do not match. Please make sure both passwords are identical.';
      } else if (errorMessage.includes('valid email')) {
        errorMessage = 'Please enter a valid email address.';
      }
      
      const friendlyError = new Error(errorMessage);
      friendlyError.originalError = error;
      throw friendlyError;
    }
  };

  const logout = async () => {
    try {
      await apiService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsAuthenticated(false);
      localStorage.removeItem('token');
    }
  };

  const updateProfile = async (profileData) => {
    try {
      const response = await apiService.updateProfile(profileData);
      setUser(response.user);
      return response;
    } catch (error) {
      throw error;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    updateProfile
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
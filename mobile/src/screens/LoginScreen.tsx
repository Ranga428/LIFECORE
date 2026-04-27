import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useAuthStore } from '../store/authStore';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const LoginScreen: React.FC<Props> = ({ navigation }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const { theme } = useTheme();
  const { login } = useAuthStore();

  const handleSubmit = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all fields');
      return;
    }

    setLoading(true);
    try {
      if (isLogin) {
        const response = await api.post('/auth/login', { email, password });
        await login(response.data.user, response.data.token, response.data.refreshToken);
      } else {
        if (!name) {
          Alert.alert('Error', 'Please enter your name');
          setLoading(false);
          return;
        }
        const response = await api.post('/auth/register', { email, password, name });
        await login(response.data.user, response.data.token, response.data.refreshToken);
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
    title: { ...theme.typography.h1, color: theme.colors.text, marginBottom: theme.spacing.xl, textAlign: 'center' },
    input: { backgroundColor: theme.colors.inputBg, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, marginBottom: theme.spacing.md, color: theme.colors.text, fontSize: 16 },
    button: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: theme.spacing.md },
    buttonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    toggle: { marginTop: theme.spacing.lg, alignItems: 'center' },
    toggleText: { color: theme.colors.primary, fontSize: 16 },
    error: { color: theme.colors.error, marginBottom: theme.spacing.sm },
  });

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>LifeCore</Text>
        
        {!isLogin && (
          <TextInput
            style={styles.input}
            placeholder="Your name"
            placeholderTextColor={theme.colors.textSecondary}
            value={name}
            onChangeText={setName}
          />
        )}
        
        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={theme.colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={theme.colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        
        <TouchableOpacity style={styles.button} onPress={handleSubmit} disabled={loading}>
          <Text style={styles.buttonText}>{loading ? 'Loading...' : isLogin ? 'Sign In' : 'Create Account'}</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.toggle} onPress={() => setIsLogin(!isLogin)}>
          <Text style={styles.toggleText}>
            {isLogin ? "Don't have an account? Sign Up" : 'Already have an account? Sign In'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};
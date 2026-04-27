import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const SettingsScreen: React.FC<Props> = ({ navigation }) => {
  const { theme, themeName, setTheme } = useTheme();
  const { user, logout } = useAuthStore();

  const themeOptions = [
    { key: 'light', label: 'Light', icon: '☀️' },
    { key: 'dark', label: 'Dark', icon: '🌙' },
    { key: 'gaming', label: 'Gaming', icon: '🎮' },
    { key: 'professional', label: 'Professional', icon: '💼' },
  ];

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background, padding: theme.spacing.lg },
    section: { marginBottom: theme.spacing.xl },
    sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: theme.spacing.md, borderBottomWidth: 1, borderBottomColor: theme.colors.border },
    rowText: { ...theme.typography.body, color: theme.colors.text },
    themeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    themeOption: { width: '48%', padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, alignItems: 'center', borderWidth: 2 },
    themeOptionSelected: { borderColor: theme.colors.primary },
    themeIcon: { fontSize: 32, marginBottom: theme.spacing.xs },
    themeLabel: { ...theme.typography.bodySmall },
    logoutButton: { backgroundColor: theme.colors.error, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: theme.spacing.xl },
    logoutText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600' },
    userInfo: { backgroundColor: theme.colors.surface, padding: theme.spacing.lg, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.xl },
    userName: { ...theme.typography.h3, color: theme.colors.text },
    userEmail: { ...theme.typography.bodySmall, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
  });

  return (
    <View style={styles.container}>
      <View style={styles.userInfo}>
        <Text style={styles.userName}>{user?.name}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Theme</Text>
        <View style={styles.themeGrid}>
          {themeOptions.map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[styles.themeOption, { backgroundColor: theme.colors.surface }, themeName === option.key && styles.themeOptionSelected]}
              onPress={() => setTheme(option.key)}
            >
              <Text style={styles.themeIcon}>{option.icon}</Text>
              <Text style={[styles.themeLabel, { color: theme.colors.text }]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.row} onPress={() => navigation.navigate('Templates')}>
          <Text style={styles.rowText}>Template Community</Text>
          <Text style={{ color: theme.colors.textSecondary }}>→</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.logoutButton} onPress={logout}>
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>
    </View>
  );
};
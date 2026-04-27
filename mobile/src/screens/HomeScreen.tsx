import React, { useState } from 'react';
import { View, Text, TouchableOpacity, ScrollView, StyleSheet, TextInput, Alert } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import { useAuthStore } from '../store/authStore';
import api from '../services/api';

type Props = {
  navigation: NativeStackNavigationProp<any>;
};

export const HomeScreen: React.FC<Props> = ({ navigation }) => {
  const { theme } = useTheme();
  const { user } = useAuthStore();
  const [prompt, setPrompt] = useState('');
  const [generating, setGenerating] = useState(false);

  const handleGenerate = async () => {
    if (prompt.length < 10) {
      Alert.alert('Too Short', 'Please describe your life goals in more detail (at least 10 characters)');
      return;
    }

    setGenerating(true);
    try {
      const response = await api.post('/ai/generate-tracker', { prompt });
      navigation.navigate('TrackerDetail', { trackerId: response.data.tracker.id });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to generate tracker');
    } finally {
      setGenerating(false);
    }
  };

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: theme.spacing.lg, paddingTop: theme.spacing.xl },
    greeting: { ...theme.typography.h2, color: theme.colors.text },
    subtitle: { ...theme.typography.body, color: theme.colors.textSecondary, marginTop: theme.spacing.xs },
    section: { padding: theme.spacing.lg },
    sectionTitle: { ...theme.typography.h3, color: theme.colors.text, marginBottom: theme.spacing.md },
    promptInput: { backgroundColor: theme.colors.inputBg, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, color: theme.colors.text, fontSize: 16, minHeight: 100, textAlignVertical: 'top' },
    generateButton: { backgroundColor: theme.colors.primary, padding: theme.spacing.md, borderRadius: theme.borderRadius.md, alignItems: 'center', marginTop: theme.spacing.md },
    generateButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '600', textAlign: 'center' },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing.sm },
    quickAction: { backgroundColor: theme.colors.surface, padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, width: '47%', borderWidth: 1, borderColor: theme.colors.border },
    quickActionText: { color: theme.colors.text, fontWeight: '500' },
  });

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.greeting}>Hello, {user?.name || 'there'}!</Text>
        <Text style={styles.subtitle}>What would you like to track today?</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>AI Tracker Generator</Text>
        <TextInput
          style={styles.promptInput}
          placeholder="e.g., I want to lose 10lbs, eat healthier, and improve my sleep schedule..."
          placeholderTextColor={theme.colors.textSecondary}
          value={prompt}
          onChangeText={setPrompt}
          multiline
        />
        <TouchableOpacity style={styles.generateButton} onPress={handleGenerate} disabled={generating}>
          <Text style={styles.generateButtonText}>
            {generating ? 'Generating...' : 'Generate My Tracker'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActions}>
          {['Schedule', 'Workout', 'Nutrition', 'Finance', 'Medicine', 'Voice Note'].map((action) => (
            <TouchableOpacity
              key={action}
              style={styles.quickAction}
              onPress={() => navigation.navigate(action)}
            >
              <Text style={styles.quickActionText}>{action}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};
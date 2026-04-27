import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity } from 'react-native';
import { RouteProp, useRoute } from '@react-navigation/native';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

type TrackerDetailRouteProp = RouteProp<RootStackParamList, 'TrackerDetail'>;

interface TrackerSection {
  id: string;
  type: string;
  order_index: number;
  config_json: { title?: string; goals?: string[]; metrics?: string[] };
}

interface Tracker {
  id: string;
  name: string;
  tracker_sections: TrackerSection[];
}

export const TrackerDetailScreen: React.FC = () => {
  const route = useRoute<TrackerDetailRouteProp>();
  const { trackerId } = route.params;
  const { theme } = useTheme();
  const [tracker, setTracker] = useState<Tracker | null>(null);

  useEffect(() => {
    loadTracker();
  }, [trackerId]);

  const loadTracker = async () => {
    try {
      const response = await api.get(`/trackers/${trackerId}`);
      setTracker(response.data.tracker);
    } catch (error) {
      console.error('Failed to load tracker:', error);
    }
  };

  const getTypeIcon = (type: string) => {
    const icons: Record<string, string> = {
      fitness: '🏋️', nutrition: '🥗', finance: '💰', schedule: '📅',
      medicine: '💊', wellness: '🧘', productivity: '📊', custom: '📝',
    };
    return icons[type] || '📝';
  };

  const renderSection = ({ item }: { item: TrackerSection }) => (
    <TouchableOpacity style={[styles.section, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionIcon}>{getTypeIcon(item.type)}</Text>
        <Text style={[styles.sectionTitle, { color: theme.colors.text }]}>
          {item.config_json?.title || item.type}
        </Text>
      </View>
      {item.config_json?.goals && (
        <View style={styles.goals}>
          {item.config_json.goals.map((goal, i) => (
            <Text key={i} style={[styles.goal, { color: theme.colors.textSecondary }]}>• {goal}</Text>
          ))}
        </View>
      )}
      {item.config_json?.metrics && (
        <View style={styles.metrics}>
          {item.config_json.metrics.map((metric, i) => (
            <View key={i} style={[styles.metricBadge, { backgroundColor: theme.colors.surface }]}>
              <Text style={[styles.metricText, { color: theme.colors.textSecondary }]}>{metric}</Text>
            </View>
          ))}
        </View>
      )}
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    header: { ...theme.typography.h1, padding: theme.spacing.lg },
    section: { padding: theme.spacing.md, marginHorizontal: theme.spacing.md, marginBottom: theme.spacing.sm, borderRadius: theme.borderRadius.lg, borderWidth: 1 },
    sectionHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: theme.spacing.sm },
    sectionIcon: { fontSize: 24, marginRight: theme.spacing.sm },
    sectionTitle: { ...theme.typography.h3 },
    goals: { marginTop: theme.spacing.xs },
    goal: { ...theme.typography.bodySmall },
    metrics: { flexDirection: 'row', flexWrap: 'wrap', marginTop: theme.spacing.sm, gap: theme.spacing.xs },
    metricBadge: { paddingHorizontal: theme.spacing.sm, paddingVertical: theme.spacing.xs, borderRadius: theme.borderRadius.full },
    metricText: { ...theme.typography.caption },
  });

  if (!tracker) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: theme.colors.background }}>
        <Text style={{ color: theme.colors.textSecondary }}>Loading...</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={{ flex: 1, backgroundColor: theme.colors.background }}
      data={tracker.tracker_sections}
      renderItem={renderSection}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ paddingVertical: theme.spacing.md }}
      ListHeaderComponent={<Text style={styles.header}>{tracker.name}</Text>}
    />
  );
};
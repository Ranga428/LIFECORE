import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useTheme } from '../theme/ThemeContext';
import api from '../services/api';
import { RootStackParamList } from '../navigation/AppNavigator';

interface Tracker {
  id: string;
  name: string;
  created_at: string;
  tracker_sections?: Array<{ type: string }>;
}

export const TrackersScreen: React.FC = () => {
  const { theme } = useTheme();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [trackers, setTrackers] = useState<Tracker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTrackers();
  }, []);

  const loadTrackers = async () => {
    try {
      const response = await api.get('/trackers');
      setTrackers(response.data.trackers || []);
    } catch (error) {
      console.error('Failed to load trackers:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderTracker = ({ item }: { item: Tracker }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.colors.card, borderColor: theme.colors.border }]}
      onPress={() => navigation.navigate('TrackerDetail', { trackerId: item.id })}
    >
      <Text style={[styles.cardTitle, { color: theme.colors.text }]}>{item.name}</Text>
      <Text style={[styles.cardSubtitle, { color: theme.colors.textSecondary }]}>
        {item.tracker_sections?.length || 0} sections
      </Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: theme.colors.background },
    header: { padding: theme.spacing.lg },
    title: { ...theme.typography.h2, color: theme.colors.text },
    card: { padding: theme.spacing.md, borderRadius: theme.borderRadius.lg, marginBottom: theme.spacing.sm, borderWidth: 1 },
    cardTitle: { ...theme.typography.body, fontWeight: '600' },
    cardSubtitle: { ...theme.typography.caption, marginTop: theme.spacing.xs },
    empty: { padding: theme.spacing.lg, alignItems: 'center' },
    emptyText: { ...theme.typography.body, color: theme.colors.textSecondary },
  });

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Trackers</Text>
      </View>
      <FlatList
        data={trackers}
        renderItem={renderTracker}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: theme.spacing.md }}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyText}>No trackers yet. Create one with AI!</Text>
            </View>
          ) : null
        }
      />
    </View>
  );
};
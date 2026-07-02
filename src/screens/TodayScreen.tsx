import React, { useLayoutEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Ionicons } from '@expo/vector-icons';

import { useHabits } from '../context/HabitsContext';
import HabitRow from '../components/HabitRow';
import { colors, radius, spacing } from '../theme';
import { todayKey } from '../utils/date';
import { isDone, getDayProgress } from '../storage/completions';
import { RootStackParamList } from '../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function TodayScreen() {
  const navigation = useNavigation<Nav>();
  const { habits, completions, loading, toggle, markReminder } = useHabits();
  const day = todayKey();

  const completedCount = habits.filter((h) => isDone(completions, h.id, day)).length;
  const total = habits.length;
  const pct = total === 0 ? 0 : Math.round((completedCount / total) * 100);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <Pressable
          onPress={() => navigation.navigate('EditHabit')}
          hitSlop={10}
          style={{ paddingHorizontal: spacing.md }}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </Pressable>
      ),
    });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={colors.primary} size="large" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.summary}>
        <View style={styles.summaryTextWrap}>
          <Text style={styles.summaryTitle}>Today</Text>
          <Text style={styles.summarySub}>
            {completedCount} of {total} habits done
          </Text>
        </View>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{pct}%</Text>
        </View>
      </View>
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${pct}%` }]} />
      </View>

      <FlatList
        data={habits}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <HabitRow
            habit={item}
            done={isDone(completions, item.id, day)}
            reminderFlags={getDayProgress(completions, item.id, day).reminders}
            onToggle={() => toggle(item.id, day)}
            onToggleReminder={(reminderId) => {
              const flags = getDayProgress(completions, item.id, day).reminders;
              markReminder(item.id, reminderId, !flags[reminderId], day);
            }}
            onEdit={() => navigation.navigate('EditHabit', { habitId: item.id })}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="leaf-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyTitle}>No habits yet</Text>
            <Text style={styles.emptySub}>
              Tap + to add your first habit and start tracking.
            </Text>
            <Pressable
              style={styles.emptyBtn}
              onPress={() => navigation.navigate('EditHabit')}
            >
              <Text style={styles.emptyBtnText}>Add a habit</Text>
            </Pressable>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  summaryTextWrap: { flex: 1 },
  summaryTitle: { fontSize: 22, fontWeight: '700', color: colors.text },
  summarySub: { fontSize: 14, color: colors.subtext, marginTop: 2 },
  badge: {
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  progressTrack: {
    height: 8,
    backgroundColor: colors.muted,
    borderRadius: 4,
    marginHorizontal: spacing.lg,
    overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: colors.success },
  list: { padding: spacing.lg, paddingTop: spacing.md, flexGrow: 1 },
  empty: { alignItems: 'center', paddingTop: spacing.xl * 2 },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginTop: spacing.md,
  },
  emptySub: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.xl,
  },
  emptyBtn: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  emptyBtnText: { color: '#fff', fontWeight: '700' },
});

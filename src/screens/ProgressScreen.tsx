import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useHabits } from '../context/HabitsContext';
import ScoreChart from '../components/ScoreChart';
import { colors, radius, spacing } from '../theme';
import { daysInMonth, keyForDay, monthLabel } from '../utils/date';
import { isDone } from '../storage/completions';

export default function ProgressScreen() {
  const { habits, completions } = useHabits();
  const { width } = useWindowDimensions();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());

  const totalDays = daysInMonth(year, month0);

  // completion count per day of the selected month
  const values: number[] = [];
  for (let d = 1; d <= totalDays; d++) {
    const key = keyForDay(year, month0, d);
    let count = 0;
    for (const h of habits) {
      if (isDone(completions, h.id, key)) count++;
    }
    values.push(count);
  }

  const totalCheckins = values.reduce((a, b) => a + b, 0);
  const bestDay = values.reduce((max, v) => Math.max(max, v), 0);
  const possible = habits.length * totalDays;
  const rate = possible === 0 ? 0 : Math.round((totalCheckins / possible) * 100);

  const changeMonth = (delta: number) => {
    let m = month0 + delta;
    let y = year;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setMonth0(m);
    setYear(y);
  };

  return (
    <View style={styles.container}>
      <View style={styles.monthBar}>
        <Pressable onPress={() => changeMonth(-1)} hitSlop={10} style={styles.arrow}>
          <Ionicons name="chevron-back" size={22} color={colors.primary} />
        </Pressable>
        <Text style={styles.monthLabel}>{monthLabel(year, month0)}</Text>
        <Pressable onPress={() => changeMonth(1)} hitSlop={10} style={styles.arrow}>
          <Ionicons name="chevron-forward" size={22} color={colors.primary} />
        </Pressable>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {habits.length === 0 ? (
          <View style={styles.empty}>
            <Ionicons name="stats-chart-outline" size={48} color={colors.muted} />
            <Text style={styles.emptyText}>
              Add habits and check them off to see your progress graph.
            </Text>
          </View>
        ) : (
          <>
            <ScoreChart
              values={values}
              maxValue={habits.length}
              width={width - spacing.lg * 2 - spacing.md * 2}
            />

            <View style={styles.statsRow}>
              <Stat label="Check-ins" value={`${totalCheckins}`} />
              <Stat label="Best day" value={`${bestDay}`} />
              <Stat label="Completion" value={`${rate}%`} />
            </View>
          </>
        )}
      </ScrollView>
    </View>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.stat}>
      <Text style={styles.statValue}>{value}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.card,
  },
  arrow: { padding: spacing.xs },
  monthLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
  content: { padding: spacing.lg },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between' },
  stat: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginHorizontal: spacing.xs,
  },
  statValue: { fontSize: 22, fontWeight: '700', color: colors.primary },
  statLabel: { fontSize: 12, color: colors.subtext, marginTop: 2 },
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: spacing.xl * 2 },
  emptyText: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: spacing.md,
    paddingHorizontal: spacing.xl,
  },
});

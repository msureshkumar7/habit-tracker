import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { useHabits } from '../context/HabitsContext';
import { colors, radius, spacing } from '../theme';
import { daysInMonth, keyForDay, monthLabel } from '../utils/date';
import { isDone } from '../storage/completions';

const CELL = 36;
const NAME_W = 120;

export default function MonthGridScreen() {
  const { habits, completions, toggle } = useHabits();
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month0, setMonth0] = useState(now.getMonth());

  const totalDays = daysInMonth(year, month0);
  const days = Array.from({ length: totalDays }, (_, i) => i + 1);

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

      {habits.length === 0 ? (
        <View style={styles.empty}>
          <Ionicons name="calendar-outline" size={48} color={colors.muted} />
          <Text style={styles.emptyText}>
            Add habits on the Today tab to see your monthly grid.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.vScroll}>
          <View style={styles.row}>
            {/* Frozen habit-name column */}
            <View>
              <View style={[styles.nameCell, styles.headerCell]}>
                <Text style={styles.headerText}>Habit</Text>
              </View>
              {habits.map((h) => (
                <View key={h.id} style={styles.nameCell}>
                  <View style={[styles.dot, { backgroundColor: h.color }]} />
                  <Text style={styles.nameText} numberOfLines={2}>
                    {h.name}
                  </Text>
                </View>
              ))}
            </View>

            {/* Scrollable day columns */}
            <ScrollView horizontal showsHorizontalScrollIndicator>
              <View>
                <View style={styles.headerRow}>
                  {days.map((d) => (
                    <View key={d} style={[styles.dayCell, styles.headerCell]}>
                      <Text style={styles.headerText}>{d}</Text>
                    </View>
                  ))}
                </View>
                {habits.map((h) => (
                  <View key={h.id} style={styles.dataRow}>
                    {days.map((d) => {
                      const key = keyForDay(year, month0, d);
                      const done = isDone(completions, h.id, key);
                      return (
                        <Pressable
                          key={d}
                          style={styles.dayCell}
                          onPress={() => toggle(h.id, key)}
                        >
                          <View
                            style={[
                              styles.mark,
                              done && { backgroundColor: h.color },
                            ]}
                          >
                            {done && (
                              <Ionicons name="checkmark" size={16} color="#fff" />
                            )}
                          </View>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </ScrollView>
          </View>
          <Text style={styles.hint}>Tap any cell to mark a habit done for that day.</Text>
        </ScrollView>
      )}
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
  arrow: {
    padding: spacing.xs,
  },
  monthLabel: { fontSize: 18, fontWeight: '700', color: colors.text },
  vScroll: { padding: spacing.md },
  row: { flexDirection: 'row' },
  headerRow: { flexDirection: 'row' },
  dataRow: { flexDirection: 'row' },
  headerCell: {
    backgroundColor: colors.primary,
  },
  headerText: { color: '#fff', fontWeight: '700', fontSize: 12 },
  nameCell: {
    width: NAME_W,
    height: CELL,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  dot: { width: 8, height: 8, borderRadius: 4, marginRight: 6 },
  nameText: { flex: 1, fontSize: 12, color: colors.text },
  dayCell: {
    width: CELL,
    height: CELL,
    alignItems: 'center',
    justifyContent: 'center',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  mark: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: colors.muted,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontSize: 12,
    color: colors.subtext,
    marginTop: spacing.md,
    textAlign: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  emptyText: {
    fontSize: 14,
    color: colors.subtext,
    textAlign: 'center',
    marginTop: spacing.md,
  },
});

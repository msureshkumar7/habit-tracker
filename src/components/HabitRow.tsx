import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Habit } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatTime } from '../utils/date';

type Props = {
  habit: Habit;
  done: boolean;
  reminderFlags: Record<string, boolean>;
  onToggle: () => void; // manual whole-day override
  onToggleReminder: (reminderId: string) => void;
  onEdit: () => void;
};

export default function HabitRow({
  habit,
  done,
  reminderFlags,
  onToggle,
  onToggleReminder,
  onEdit,
}: Props) {
  const reminders = habit.reminderEnabled ? habit.reminders : [];
  const total = reminders.length;
  const doneCount = reminders.reduce(
    (n, r) => (reminderFlags[r.id] ? n + 1 : n),
    0
  );
  const pct = total === 0 ? (done ? 100 : 0) : Math.round((doneCount / total) * 100);

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Pressable
          onPress={onToggle}
          style={styles.checkWrap}
          hitSlop={8}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={`Mark ${habit.name} as ${done ? 'not done' : 'done'}`}
        >
          <View
            style={[
              styles.checkCircle,
              { borderColor: habit.color },
              done && { backgroundColor: habit.color },
            ]}
          >
            {done && <Ionicons name="checkmark" size={20} color="#fff" />}
          </View>
        </Pressable>

        <Pressable style={styles.body} onPress={onEdit}>
          <Text style={[styles.name, done && styles.nameDone]}>{habit.name}</Text>
          {!!habit.goal && <Text style={styles.goal}>🎯 {habit.goal}</Text>}
          {total > 0 && (
            <Text style={styles.progressText}>
              {doneCount}/{total} steps done
            </Text>
          )}
        </Pressable>

        <Pressable onPress={onEdit} hitSlop={8} style={styles.editBtn}>
          <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
        </Pressable>
      </View>

      {total > 0 && (
        <>
          <View style={styles.progressTrack}>
            <View
              style={[
                styles.progressFill,
                { width: `${pct}%`, backgroundColor: habit.color },
              ]}
            />
          </View>
          <View style={styles.reminderList}>
            {reminders.map((r) => {
              const rDone = Boolean(reminderFlags[r.id]);
              return (
                <Pressable
                  key={r.id}
                  style={styles.reminderItem}
                  onPress={() => onToggleReminder(r.id)}
                >
                  <Ionicons
                    name={rDone ? 'checkmark-circle' : 'ellipse-outline'}
                    size={20}
                    color={rDone ? habit.color : colors.muted}
                  />
                  <Text style={[styles.reminderTime, rDone && styles.reminderDone]}>
                    {formatTime(r.time)}
                  </Text>
                  {!!r.label && (
                    <Text
                      style={[styles.reminderLabel, rDone && styles.reminderDone]}
                      numberOfLines={1}
                    >
                      {r.label}
                    </Text>
                  )}
                </Pressable>
              );
            })}
          </View>
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center' },
  checkWrap: { marginRight: spacing.md },
  checkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  name: { fontSize: 16, fontWeight: '600', color: colors.text },
  nameDone: { textDecorationLine: 'line-through', color: colors.subtext },
  goal: { fontSize: 13, color: colors.subtext, marginTop: 2 },
  progressText: { fontSize: 12, color: colors.primary, marginTop: 2, fontWeight: '600' },
  editBtn: { paddingLeft: spacing.sm },
  progressTrack: {
    height: 6,
    backgroundColor: colors.muted,
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: spacing.sm,
  },
  progressFill: { height: 6 },
  reminderList: { marginTop: spacing.sm },
  reminderItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
  },
  reminderTime: {
    marginLeft: spacing.sm,
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
    width: 76,
  },
  reminderLabel: { flex: 1, fontSize: 13, color: colors.subtext },
  reminderDone: { textDecorationLine: 'line-through', color: colors.subtext },
});

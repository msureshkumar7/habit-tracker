import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Habit } from '../types';
import { colors, radius, spacing } from '../theme';
import { formatTime } from '../utils/date';

type Props = {
  habit: Habit;
  done: boolean;
  onToggle: () => void;
  onEdit: () => void;
};

export default function HabitRow({ habit, done, onToggle, onEdit }: Props) {
  return (
    <View style={styles.card}>
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
        {habit.reminderEnabled && !!habit.reminderTime && (
          <Text style={styles.reminder}>⏰ {formatTime(habit.reminderTime)}</Text>
        )}
      </Pressable>

      <Pressable onPress={onEdit} hitSlop={8} style={styles.editBtn}>
        <Ionicons name="chevron-forward" size={20} color={colors.subtext} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
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
  checkWrap: {
    marginRight: spacing.md,
  },
  checkCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    flex: 1,
  },
  name: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.text,
  },
  nameDone: {
    textDecorationLine: 'line-through',
    color: colors.subtext,
  },
  goal: {
    fontSize: 13,
    color: colors.subtext,
    marginTop: 2,
  },
  reminder: {
    fontSize: 12,
    color: colors.primary,
    marginTop: 2,
  },
  editBtn: {
    paddingLeft: spacing.sm,
  },
});

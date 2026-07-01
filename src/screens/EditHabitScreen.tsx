import React, { useLayoutEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  ScrollView,
  Pressable,
  Switch,
  Platform,
  Alert,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import DateTimePicker, {
  DateTimePickerEvent,
} from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { useHabits } from '../context/HabitsContext';
import { colors, habitColors, radius, spacing } from '../theme';
import { RootStackParamList } from '../navigation/types';
import { Habit } from '../types';
import { newHabitId } from '../storage/habits';
import { syncReminder } from '../notifications/reminders';
import { formatTime, pad2, parseTime } from '../utils/date';

type Nav = NativeStackNavigationProp<RootStackParamList, 'EditHabit'>;
type Rt = RouteProp<RootStackParamList, 'EditHabit'>;

export default function EditHabitScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const { habits, saveHabit, removeHabit } = useHabits();

  const editingId = route.params?.habitId;
  const existing = habits.find((h) => h.id === editingId);

  const [name, setName] = useState(existing?.name ?? '');
  const [goal, setGoal] = useState(existing?.goal ?? '');
  const [remarks, setRemarks] = useState(existing?.remarks ?? '');
  const [color, setColor] = useState(existing?.color ?? habitColors[0]);
  const [reminderEnabled, setReminderEnabled] = useState(
    existing?.reminderEnabled ?? false
  );
  const [reminderTime, setReminderTime] = useState<string>(
    existing?.reminderTime ?? '09:00'
  );
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit Habit' : 'New Habit' });
  }, [navigation, existing]);

  const onChangeTime = (event: DateTimePickerEvent, date?: Date) => {
    // On Android the picker is a dialog; close it after a pick/dismiss.
    if (Platform.OS === 'android') setShowPicker(false);
    if (event.type === 'dismissed' || !date) return;
    setReminderTime(`${pad2(date.getHours())}:${pad2(date.getMinutes())}`);
  };

  const timeAsDate = (): Date => {
    const parsed = parseTime(reminderTime) ?? { hour: 9, minute: 0 };
    const d = new Date();
    d.setHours(parsed.hour, parsed.minute, 0, 0);
    return d;
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }
    setSaving(true);
    try {
      const notificationId = await syncReminder(
        existing?.notificationId ?? null,
        reminderEnabled,
        name.trim(),
        reminderTime
      );

      if (reminderEnabled && notificationId === null) {
        Alert.alert(
          'Reminder not scheduled',
          'Notifications permission was denied, so the habit is saved without a reminder. You can enable notifications in system settings.'
        );
      }

      const habit: Habit = {
        id: existing?.id ?? newHabitId(),
        name: name.trim(),
        goal: goal.trim(),
        remarks: remarks.trim(),
        color,
        reminderEnabled: reminderEnabled && notificationId !== null,
        reminderTime: reminderEnabled ? reminderTime : null,
        notificationId,
        createdAt: existing?.createdAt ?? Date.now(),
      };
      await saveHabit(habit);
      navigation.goBack();
    } finally {
      setSaving(false);
    }
  };

  const onDelete = () => {
    if (!existing) return;
    Alert.alert('Delete habit', `Delete "${existing.name}" and its history?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await removeHabit(existing);
          navigation.goBack();
        },
      },
    ]);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.label}>Habit name</Text>
      <TextInput
        style={styles.input}
        value={name}
        onChangeText={setName}
        placeholder="e.g. Drink water"
        placeholderTextColor={colors.subtext}
      />

      <Text style={styles.label}>Goal</Text>
      <TextInput
        style={styles.input}
        value={goal}
        onChangeText={setGoal}
        placeholder="e.g. 8 glasses a day"
        placeholderTextColor={colors.subtext}
      />

      <Text style={styles.label}>Remarks</Text>
      <TextInput
        style={[styles.input, styles.multiline]}
        value={remarks}
        onChangeText={setRemarks}
        placeholder="Optional notes"
        placeholderTextColor={colors.subtext}
        multiline
      />

      <Text style={styles.label}>Color</Text>
      <View style={styles.colorRow}>
        {habitColors.map((c) => (
          <Pressable
            key={c}
            onPress={() => setColor(c)}
            style={[
              styles.colorDot,
              { backgroundColor: c },
              color === c && styles.colorDotSelected,
            ]}
          >
            {color === c && <Ionicons name="checkmark" size={16} color="#fff" />}
          </Pressable>
        ))}
      </View>

      <View style={styles.reminderHeader}>
        <View>
          <Text style={styles.label}>Daily reminder</Text>
          {reminderEnabled && (
            <Text style={styles.reminderTimeText}>{formatTime(reminderTime)}</Text>
          )}
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={setReminderEnabled}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {reminderEnabled && (
        <>
          <Pressable style={styles.timeBtn} onPress={() => setShowPicker(true)}>
            <Ionicons name="time-outline" size={18} color={colors.primary} />
            <Text style={styles.timeBtnText}>
              Reminder at {formatTime(reminderTime)}
            </Text>
          </Pressable>
          {showPicker && (
            <DateTimePicker
              value={timeAsDate()}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
            />
          )}
        </>
      )}

      <Pressable
        style={[styles.saveBtn, saving && { opacity: 0.6 }]}
        onPress={onSave}
        disabled={saving}
      >
        <Text style={styles.saveBtnText}>{existing ? 'Save changes' : 'Add habit'}</Text>
      </Pressable>

      {existing && (
        <Pressable style={styles.deleteBtn} onPress={onDelete}>
          <Ionicons name="trash-outline" size={18} color={colors.danger} />
          <Text style={styles.deleteBtnText}>Delete habit</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  content: { padding: spacing.lg, paddingBottom: spacing.xl * 2 },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
    marginBottom: spacing.xs,
    marginTop: spacing.md,
  },
  input: {
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  multiline: { height: 80, textAlignVertical: 'top' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap' },
  colorDot: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorDotSelected: {
    borderWidth: 3,
    borderColor: colors.text,
  },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  reminderTimeText: { fontSize: 13, color: colors.primary, marginTop: 2 },
  timeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.md,
    padding: spacing.md,
    marginTop: spacing.sm,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  timeBtnText: { marginLeft: spacing.sm, color: colors.text, fontSize: 15 },
  saveBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.xl,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  deleteBtnText: { color: colors.danger, fontWeight: '600', marginLeft: spacing.xs },
});

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
import { Habit, Reminder, SOUND_OPTIONS } from '../types';
import { newHabitId, newReminderId } from '../storage/habits';
import { previewSound } from '../notifications/reminders';
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
  const [sound, setSound] = useState(existing?.sound ?? 'default');
  const [reminderEnabled, setReminderEnabled] = useState(
    existing?.reminderEnabled ?? false
  );
  const [reminders, setReminders] = useState<Reminder[]>(
    existing?.reminders?.length
      ? existing.reminders
      : [{ id: newReminderId(), time: '09:00', label: '', notificationId: null }]
  );
  // id of the reminder whose time picker is open, or null
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({ title: existing ? 'Edit Habit' : 'New Habit' });
  }, [navigation, existing]);

  const addReminder = () => {
    setReminders((rs) => [
      ...rs,
      { id: newReminderId(), time: '12:00', label: '', notificationId: null },
    ]);
  };

  const removeReminder = (id: string) => {
    setReminders((rs) => rs.filter((r) => r.id !== id));
  };

  const updateReminder = (id: string, patch: Partial<Reminder>) => {
    setReminders((rs) => rs.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  const onChangeTime = (event: DateTimePickerEvent, date?: Date) => {
    const id = pickerFor;
    if (Platform.OS === 'android') setPickerFor(null);
    if (event.type === 'dismissed' || !date || !id) return;
    updateReminder(id, { time: `${pad2(date.getHours())}:${pad2(date.getMinutes())}` });
  };

  const timeAsDate = (time: string): Date => {
    const parsed = parseTime(time) ?? { hour: 9, minute: 0 };
    const d = new Date();
    d.setHours(parsed.hour, parsed.minute, 0, 0);
    return d;
  };

  const onSave = async () => {
    if (!name.trim()) {
      Alert.alert('Name required', 'Please enter a habit name.');
      return;
    }
    if (reminderEnabled && reminders.length === 0) {
      Alert.alert('Add a reminder', 'Add at least one reminder or turn reminders off.');
      return;
    }
    setSaving(true);
    try {
      const habit: Habit = {
        id: existing?.id ?? newHabitId(),
        name: name.trim(),
        goal: goal.trim(),
        remarks: remarks.trim(),
        color,
        sound,
        reminderEnabled,
        reminders: reminders.map((r) => ({ ...r, label: r.label.trim() })),
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

  const onTestSound = async () => {
    const ok = await previewSound(sound);
    if (!ok) {
      Alert.alert(
        'Notifications off',
        'Enable notification permission to preview the sound.'
      );
    }
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

      <Text style={styles.label}>Daily goal</Text>
      <TextInput
        style={styles.input}
        value={goal}
        onChangeText={setGoal}
        placeholder="e.g. 2 L water"
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
          <Text style={styles.label}>Reminders</Text>
          <Text style={styles.hintText}>
            Split your goal into steps. Complete all to auto-mark the day.
          </Text>
        </View>
        <Switch
          value={reminderEnabled}
          onValueChange={setReminderEnabled}
          trackColor={{ true: colors.primary }}
        />
      </View>

      {reminderEnabled && (
        <>
          {reminders.map((r, idx) => (
            <View key={r.id} style={styles.reminderRow}>
              <Pressable style={styles.timePill} onPress={() => setPickerFor(r.id)}>
                <Ionicons name="time-outline" size={16} color={colors.primary} />
                <Text style={styles.timePillText}>{formatTime(r.time)}</Text>
              </Pressable>
              <TextInput
                style={styles.reminderLabelInput}
                value={r.label}
                onChangeText={(t) => updateReminder(r.id, { label: t })}
                placeholder={`Step ${idx + 1} (e.g. 500 ml)`}
                placeholderTextColor={colors.subtext}
              />
              <Pressable
                onPress={() => removeReminder(r.id)}
                hitSlop={8}
                style={styles.removeBtn}
              >
                <Ionicons name="close-circle" size={22} color={colors.danger} />
              </Pressable>
            </View>
          ))}

          <Pressable style={styles.addReminderBtn} onPress={addReminder}>
            <Ionicons name="add-circle-outline" size={18} color={colors.primary} />
            <Text style={styles.addReminderText}>Add reminder</Text>
          </Pressable>

          {pickerFor && (
            <DateTimePicker
              value={timeAsDate(reminders.find((r) => r.id === pickerFor)?.time ?? '09:00')}
              mode="time"
              is24Hour={false}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={onChangeTime}
            />
          )}

          <Text style={styles.label}>Reminder sound</Text>
          <View style={styles.soundRow}>
            {SOUND_OPTIONS.map((s) => (
              <Pressable
                key={s.key}
                onPress={() => setSound(s.key)}
                style={[styles.soundChip, sound === s.key && styles.soundChipActive]}
              >
                <Text
                  style={[
                    styles.soundChipText,
                    sound === s.key && styles.soundChipTextActive,
                  ]}
                >
                  {s.label}
                </Text>
              </Pressable>
            ))}
          </View>
          <Pressable style={styles.testBtn} onPress={onTestSound}>
            <Ionicons name="volume-high-outline" size={16} color={colors.primary} />
            <Text style={styles.testBtnText}>Test sound</Text>
          </Pressable>
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
  hintText: { fontSize: 12, color: colors.subtext, maxWidth: 240 },
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
  colorDotSelected: { borderWidth: 3, borderColor: colors.text },
  reminderHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  reminderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  timePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EEECFB',
    borderRadius: radius.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
  },
  timePillText: { marginLeft: 4, color: colors.primary, fontWeight: '600', fontSize: 13 },
  reminderLabelInput: {
    flex: 1,
    backgroundColor: colors.card,
    borderRadius: radius.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 14,
    color: colors.text,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
  },
  removeBtn: { paddingLeft: spacing.sm },
  addReminderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    marginTop: spacing.md,
  },
  addReminderText: { marginLeft: 6, color: colors.primary, fontWeight: '600' },
  soundRow: { flexDirection: 'row', flexWrap: 'wrap' },
  soundChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.lg,
    backgroundColor: colors.card,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.border,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
  soundChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  soundChipText: { color: colors.text, fontSize: 13, fontWeight: '600' },
  soundChipTextActive: { color: '#fff' },
  testBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingVertical: spacing.xs,
  },
  testBtnText: { marginLeft: 6, color: colors.primary, fontWeight: '600' },
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

# Habit Tracker 📈

A cross-platform (Android + iOS) mobile app to track your daily habits, built
with **Expo (React Native + TypeScript)**. Inspired by a printed *Monthly Habit
Tracker*: add habits with goals and remarks, mark them done each day on a
monthly grid, set daily reminders, and watch your **Daily Habits Score Graph**.

> Designed to be **built and tested entirely online for free** — no Android
> Studio or Xcode required.

## Features

- ✅ **Add habits** with a name, goal, remarks, and color
- ⏰ **Daily reminders** — schedule a per-habit notification at a chosen time
- 🗓️ **Monthly grid** — tap a cell to mark a habit done for any day (like the
  paper tracker), with month navigation
- 📊 **Progress score graph** — daily completion chart plus check-in, best-day,
  and completion-rate stats
- 💾 **On-device storage** — everything is saved locally (AsyncStorage). No
  account, works offline, private to your device.

## Tech stack

| Area | Choice |
| --- | --- |
| Framework | Expo SDK 51 + React Native + TypeScript |
| Navigation | React Navigation (bottom tabs + native stack) |
| Storage | `@react-native-async-storage/async-storage` |
| Reminders | `expo-notifications` (daily local notifications) |
| Charts | `react-native-svg` (custom lightweight line chart) |
| Time picker | `@react-native-community/datetimepicker` |

## Project structure

```
App.tsx                     App root: providers + navigation
index.ts                    Expo entry point
app.json                    Expo config (icons, permissions, notifications)
eas.json                    Cloud build profiles (EAS)
src/
  types.ts                  Habit + Completions types
  theme.ts                  Colors, spacing, radii, habit palette
  utils/date.ts             Date-key + time helpers
  storage/habits.ts         Habit CRUD (AsyncStorage)
  storage/completions.ts    Per-day completion CRUD
  notifications/reminders.ts Permissions + schedule/cancel reminders
  context/HabitsContext.tsx  Shared in-memory state + actions
  navigation/               Navigator + route types
  screens/                  Today, MonthGrid, Progress, EditHabit
  components/               HabitRow, ScoreChart
```

## Test it online (free, no local setup)

Pick whichever is easiest for you.

### Option A — Expo Snack (runs in the browser)

1. Open **https://snack.expo.dev**.
2. Choose **Import** → **Import git repository** and paste this repo's URL
   (branch `claude/habit-tracker-mobile-app-k4bpg9`).
3. Run it in the in-browser device preview, or scan the QR code with the
   **Expo Go** app on your phone.
   - Great for UI and flow. Local notifications are limited inside Snack — use
     Option B/C to fully test reminders.

### Option B — Expo Go on your phone (recommended)

1. Install **Expo Go** from the Play Store / App Store.
2. From a machine or cloud shell with this repo checked out:
   ```bash
   npm install
   npx expo start --tunnel
   ```
   `--tunnel` serves over the internet, so your phone doesn't need to be on the
   same network.
3. Scan the printed QR code with Expo Go (Android) or the Camera app (iOS).
4. The real app loads on your device, including scheduled reminders.

### Option C — Build an installable app in the cloud (EAS Build, free tier)

No Android Studio / Xcode needed — Expo builds it on their servers.

1. Create a free account at **https://expo.dev** and install the CLI:
   ```bash
   npm install -g eas-cli
   eas login
   ```
2. Link the project (first time only):
   ```bash
   eas init
   ```
3. Build:
   ```bash
   # Android APK you can install on any phone
   eas build -p android --profile preview

   # iOS build (simulator build, or device build with an Apple account)
   eas build -p ios --profile preview
   ```
4. When the cloud build finishes, EAS gives you a download link / QR code to
   install the app.

## Run locally (optional)

If you do have a local environment:

```bash
npm install
npx expo start        # then press a (Android emulator) or i (iOS simulator)
npm run typecheck     # TypeScript check
```

## Notes on reminders

- The first time you enable a reminder, the app requests notification
  permission and (on Android) creates a "Habit Reminders" channel.
- Reminders are **daily repeating local notifications** at the time you pick;
  editing or disabling a habit reschedules or cancels them automatically.
- Local scheduled notifications work in Expo Go. For the most reliable
  behavior, a free **EAS development build** (Option C with
  `--profile development`) is recommended.

## Data & privacy

All data lives on your device via AsyncStorage. Uninstalling the app clears it.
There is no backend and no account.

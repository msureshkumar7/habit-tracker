# Habit Tracker 📈

A cross-platform (Android + iOS) mobile app to track your daily habits, built
with **Expo (React Native + TypeScript)**. Inspired by a printed *Monthly Habit
Tracker*: add habits with goals and remarks, mark them done each day on a
monthly grid, set daily reminders, and watch your **Daily Habits Score Graph**.

> Designed to be **built and tested entirely online for free** — no Android
> Studio or Xcode required.

## Features

- ✅ **Add habits** with a name, goal, remarks, and color
- ⏰ **Multiple reminders per habit** — split a daily goal (e.g. "2 L water")
  into several timed sub-reminders, each with an optional label ("500 ml")
- ✅ **Yes/No on the notification** — each reminder shows **Done** / **Skip**
  buttons; tapping **Done** marks that step
- 🎯 **Auto-mark the grid** — when *all* of a habit's sub-reminders are done for
  the day, that day auto-completes in the month grid and progress chart
- 🔔 **Custom reminder sound** — pick a built-in tone per habit (Chime, Bell,
  Calm) with a Test button to preview
- 🗓️ **Monthly grid** — tap a cell to mark a habit done for any day (like the
  paper tracker), with month navigation and a partial-progress indicator
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

### Option D — Build from GitHub Actions (fully online, recommended)

This repo includes a workflow at `.github/workflows/eas-build.yml` that runs
EAS Build in the cloud straight from GitHub — **no terminal on your side**.

**One-time setup (all in the browser):**

1. Create a free account at **https://expo.dev**.
2. Create the project (dashboard **Create a project**, or `eas init` if you have
   the CLI) and copy its **Project ID**.
3. Put that ID into `app.json` → `expo.extra.eas.projectId` (currently empty),
   commit, and push.
4. Create an **access token**: expo.dev → Account **Settings** → **Access
   tokens** → *Create token*.
5. In GitHub: repo **Settings → Secrets and variables → Actions → New repository
   secret**. Name it **`EXPO_TOKEN`**, paste the token.

**Run a build:**

1. Go to the repo's **Actions** tab → **EAS Build (cloud APK / iOS)**.
2. Click **Run workflow**, choose the platform (`android`) and profile
   (`preview`), and run it.
3. When it finishes, open **https://expo.dev** → your project → **Builds** and
   download the installable **APK** (or iOS build).

> Snack note: Expo Snack can't run this app (its GitHub importer is finicky and
> it doesn't support `expo-notifications` or the native time picker), so use
> Option B, C, or D to test the real app.

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
  behavior, a free **EAS build** (Option C/D) is recommended.

## Data & privacy

All data lives on your device via AsyncStorage. Uninstalling the app clears it.
There is no backend and no account.

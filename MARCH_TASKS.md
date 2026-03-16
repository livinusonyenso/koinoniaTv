# 🗓️ Koinonia TV — March 2026 Daily Task Plan

> **Stack:** NestJS 11 Backend + React Native Expo 55 Mobile
> **Goal:** Ship a production-ready app by end of March
> **Current date:** March 15, 2026
> **Status:** Core features ✅ | Data pipeline ✅ | Polish & production → in progress

---

## 📊 March Overview

| Week | Focus Area | Theme |
|------|-----------|-------|
| Week 1 (Mar 1–7) | 🔧 Bug Fixes & Data | Stabilise the foundation |
| Week 2 (Mar 8–14) | 🎨 UI Polish & Missing Features | Complete the experience |
| Week 3 (Mar 15–21) | 🔔 Notifications & Auth | Connect & engage users |
| Week 4 (Mar 22–28) | 🚀 Performance & Production | Deploy-ready |
| Final Days (Mar 29–31) | 🎯 QA & Launch Prep | Ship it |

---

## ✅ Already Completed (Pre-March 15)

- [x] Backend NestJS 11 monorepo setup
- [x] YouTube sync + incremental/full cron jobs
- [x] Auto-categorization service (keyword + event-pattern matching)
- [x] Moments detection pipeline (declarations, prayers, testimonies)
- [x] Custom transcript fetcher (innertube API + page-scrape fallback)
- [x] Two-step pagination fix (no TypeORM count inflation)
- [x] `findByIds` → `In()` migration in videos.service.ts
- [x] `categorizeAll(force)` fix — no longer skips partially-tagged videos
- [x] Seed scripts: categories, video-categories, moments
- [x] All 14 mobile screens created
- [x] Navigation (tab + stack + modal)
- [x] MomentPlayerScreen with autoplay, suggestions, thumbnail-first loading
- [x] Declarations, Prayer, Testimonials screens (backed by moments API)
- [x] SermonsScreen with infinite scroll, category pills, sort/year filters
- [x] HomeScreen redesign (hero, quick access, latest messages, browse by topic)
- [x] Replace all emoji icons with MaterialCommunityIcons

---

## 📅 Week 3 — March 15–21: Notifications & Auth Flow

> **Focus:** Prayer Request backend, push notifications, user authentication UI

---

### Day 1 — Sunday, March 15
**🗄️ Fix Category Data**

- [ ] Run `seed-video-categories.ts` and verify all 8 categories have videos
  ```bash
  cd backend
  npx ts-node src/database/seeds/seed-video-categories.ts
  ```
- [ ] Confirm SermonsScreen category pills now return results for all categories
- [ ] Run `seed-moments.ts` to populate declarations/prayers/testimonies
  ```bash
  npx ts-node src/database/seeds/seed-moments.ts
  ```
- [ ] Verify MomentPlayerScreen loads and suggestions work
- [ ] Test the Videos API: `GET /api/v1/videos?category=faith` returns data

---

### Day 2 — Monday, March 16
**🙏 Prayer Request Backend Module**

> Currently the mobile form submits but hits no API. No data is saved.

- [ ] Create `backend/src/modules/prayer-requests/prayer-request.entity.ts`
  - Fields: `id`, `name`, `category` (enum), `request` (text), `userId` (nullable), `createdAt`
- [ ] Create `prayer-requests.service.ts` — `create()`, `findAll(page, limit)`
- [ ] Create `prayer-requests.controller.ts`
  - `POST /prayer-requests` — submit (public, no JWT required)
  - `GET /prayer-requests` — list all (JWT required, admin)
- [ ] Register module in `app.module.ts`
- [ ] Update mobile `userApi.submitPrayerRequest(name, category, request)` in `api/index.ts`
- [ ] Wire up `PrayerRequestScreen.tsx` to call the new API on submit
- [ ] Test: submit form → data appears in MySQL `prayer_requests` table

---

### Day 3 — Tuesday, March 17
**👤 Authentication UI**

> App has full auth backend (register/login/JWT) but no login/register screens

- [ ] Create `mobile/src/screens/Auth/LoginScreen.tsx`
  - Email + password fields
  - "Login" button → calls `authApi.login()`
  - Stores `accessToken` + `refreshToken` in SecureStore
  - Navigate to Home on success
  - Link to RegisterScreen
- [ ] Create `mobile/src/screens/Auth/RegisterScreen.tsx`
  - Name + email + password + confirm password
  - Calls `authApi.register()`
  - Navigate to Login on success
- [ ] Add Auth screens to `AppNavigator.tsx` (unauthenticated stack)
- [ ] Create `AuthContext` (or Zustand store) — expose `user`, `login()`, `logout()`
- [ ] Show login prompt when unauthenticated user taps bookmark/progress features

---

### Day 4 — Wednesday, March 18
**🔔 Firebase Push Notifications — Setup**

> Firebase credentials are in `.env.example` but FCM is never used

- [ ] Set up Firebase project (if not done) → get `google-services.json` (Android) + `GoogleService-Info.plist` (iOS)
- [ ] Install: `npx expo install expo-notifications`
- [ ] Create `backend/src/modules/notifications/notification.service.ts`
  - `sendToDevice(token, title, body, data)` using Firebase Admin SDK
  - `sendToAll(title, body)` — broadcast
- [ ] Create `device-token.entity.ts` — store FCM tokens per user
- [ ] Add `POST /users/device-token` endpoint to register device token
- [ ] Register device token on mobile app startup (after login)

---

### Day 5 — Thursday, March 19
**🔔 Push Notifications — Triggers**

- [ ] Notify all devices when a new video syncs from YouTube
  - Hook into `youtube-sync.service.ts` — after saving new video, fire notification
- [ ] Notify when a live stream goes live
  - Hook into the 5-minute live-check cron
- [ ] Add notification preference toggle in user profile (backend: `notificationsEnabled` column)
- [ ] Test on Android: new video sync triggers push notification
- [ ] Test on Android: going live triggers push notification

---

### Day 6 — Friday, March 20
**📱 User Profile Screen**

- [ ] Create `mobile/src/screens/Profile/ProfileScreen.tsx`
  - Show user avatar (initials fallback), name, email
  - Bookmarks count, watch history count
  - "My Bookmarks" → navigate to BookmarksScreen
  - "Watch History" → navigate to HistoryScreen
  - "Notification Preferences" toggle
  - "Logout" button
- [ ] Create `BookmarksScreen.tsx` — calls `userApi.getBookmarks()`, renders `SermonCard` grid
- [ ] Create `HistoryScreen.tsx` — calls `userApi.getHistory()`, renders with "Resume" button
- [ ] Add Profile tab to bottom navigation (replace or add to existing tabs)

---

### Day 7 — Saturday, March 21
**🧪 Week 3 Testing & Review**

- [ ] End-to-end test: Register → Login → Submit Prayer Request → See it persisted
- [ ] End-to-end test: Watch video 30s → close → reopen → video resumes from saved position
- [ ] End-to-end test: Bookmark video → go to Profile → see bookmarked video
- [ ] End-to-end test: Push notification received on real Android device
- [ ] Fix any regressions found
- [ ] Git commit: `feat: prayer requests, auth UI, push notifications, user profile`

---

## 📅 Week 4 — March 22–28: Performance & Production

> **Focus:** App speed, offline support, media quality, deployment

---

### Day 8 — Sunday, March 22
**⚡ API Performance — Backend**

- [ ] Add Redis caching to frequently-hit endpoints
  - `GET /videos/latest` → cache 5 min
  - `GET /videos/trending` → cache 15 min
  - `GET /categories` → cache 30 min
  - `GET /moments/declarations` → cache 10 min
- [ ] Add database indexes if missing:
  - `videos.published_at DESC`
  - `videos.view_count DESC`
  - `video_categories(video_id, category_id)` — composite unique
- [ ] Set `synchronize: false` in production TypeORM config and write migration
- [ ] Add request rate limiting (throttler): 100 req/min per IP

---

### Day 9 — Monday, March 23
**🖼️ Image & Thumbnail Optimisation**

- [ ] Replace raw YouTube thumbnail URLs with `hqdefault.jpg` → `maxresdefault.jpg` fallback
  - Current: `https://i.ytimg.com/vi/VIDEO_ID/hqdefault.jpg`
  - Better: Try `maxresdefault`, fallback to `hqdefault`
- [ ] Add `FastImage` or Expo `Image` with `contentFit="cover"` + `blurhash` placeholder
  - Install: `npx expo install expo-image`
  - Replace all `<Image source={{ uri: ... }}>` with `<Image source={{ uri: ... }} contentFit="cover" placeholder={blurhash} />`
- [ ] Lazy-load thumbnails in `SermonCard.tsx` and `HomeScreen.tsx`
- [ ] Test scroll performance in SermonsScreen — should be smooth with 900+ videos

---

### Day 10 — Tuesday, March 24
**📶 Offline Support & Error States**

- [ ] Add global `useNetworkState()` hook — show banner when offline
- [ ] Configure TanStack Query `gcTime` (formerly `cacheTime`) to keep data 24h
  - Users can browse previously loaded content offline
- [ ] Add `retry: 2` and `retryDelay: 1000` to all queries
- [ ] Improve error states across screens:
  - Network error → show "No connection" with retry button
  - API error → show specific message (not just "Something went wrong")
  - Empty state → helpful message per screen context
- [ ] Add `RefreshControl` pull-to-refresh to all FlatList screens

---

### Day 11 — Wednesday, March 25
**🎬 VideoPlayerScreen Polish**

- [ ] Add persistent mini-player (picture-in-picture style)
  - Navigating away from VideoPlayer should show a mini bar at the bottom
  - Tap to restore full player
- [ ] Show chapter markers on progress bar if transcript is available
- [ ] Auto-rotate to landscape when video plays
- [ ] Add share button → `expo-sharing` → share YouTube link
- [ ] Show sermon metadata below player:
  - Publish date, view count, like count
  - Category tags (tappable → filter Sermons)
- [ ] "Add to Playlist" button (placeholder for playlist feature)

---

### Day 12 — Thursday, March 26
**🏠 HomeScreen Dynamic Content**

- [ ] "Word for Today" section — pull from `EngraftedWordScreen` scripture list, rotate daily
  - Use today's date modulo scripture count as deterministic daily pick
- [ ] "Upcoming Programs" — wire to `eventsApi.getUpcoming()`
- [ ] "Trending This Week" — wire to `videosApi.getTrending(5)`
- [ ] Add "Continue Watching" section (if user is logged in + has history)
  - Calls `userApi.getHistory({ limit: 5 })`
  - Shows horizontal scroll of in-progress videos with progress bar overlay
- [ ] Hero banner auto-scrolls through 3 featured videos every 5 seconds

---

### Day 13 — Friday, March 27
**🔍 Search Improvements**

- [ ] `SearchScreen.tsx` — add category filter chips below search bar
  - Pre-filter results by category if a chip is selected
- [ ] Add "Recent Searches" stored in AsyncStorage / SecureStore
  - Show below search bar when input is empty
  - Tap to re-run search, swipe to dismiss
- [ ] Backend: improve search to include category name matches
  - `WHERE v.title LIKE :q OR v.description LIKE :q OR c.name LIKE :q`
- [ ] Add `highlightText()` utility — bold the matching part of result titles
- [ ] Debounce search input: 400ms before firing API call (prevent over-fetching)

---

### Day 14 — Saturday, March 28
**🚀 Production Readiness**

- [ ] Backend: set `synchronize: false`, `logging: false` in production config
- [ ] Backend: add `helmet()` middleware for security headers
- [ ] Backend: configure CORS — allow only production mobile app origin
- [ ] Backend: add `compression()` middleware
- [ ] Mobile: update `app.json` — set app name, version, splash screen, icon
  - `"name": "Koinonia TV"`
  - `"version": "1.0.0"`
  - `"icon": "./assets/icon.png"` (ensure icon exists)
- [ ] Mobile: set `EXPO_PUBLIC_API_URL` to production server URL in CI/CD
- [ ] Mobile: run `npx expo prebuild` — test native build
- [ ] Verify Android build: `npx expo run:android`
- [ ] Document all environment variables in `README.md`

---

## 📅 Final Days — March 29–31: QA & Launch

---

### Day 15 — Sunday, March 29
**🧪 Full QA Pass — Mobile**

- [ ] Test on real Android device (not emulator)
- [ ] Screen-by-screen checklist:
  - [ ] HomeScreen — all sections load, hero banner scrolls
  - [ ] SermonsScreen — all 8 category pills return results
  - [ ] VideoPlayerScreen — video plays, bookmark works, progress saves
  - [ ] LiveScreen — shows correct state (live/offline/upcoming)
  - [ ] ClipsScreen — vertical feed loads and scrolls
  - [ ] EventsScreen — events list and countdown work
  - [ ] SearchScreen — search returns results, suggestions work
  - [ ] PrayerScreen — loads moments, MomentPlayer navigates
  - [ ] DeclarationsScreen — loads, navigates to MomentPlayer
  - [ ] TestimonialsScreen — loads, navigates to MomentPlayer
  - [ ] MomentPlayerScreen — plays, autoplay countdown works, suggestions load
  - [ ] MiracleServiceScreen — schedule displays
  - [ ] EngraftedWordScreen — scriptures display with categories
  - [ ] PrayerRequestScreen — form submits, success screen shows, data saved to DB
  - [ ] ProfileScreen — user info, bookmarks, history
- [ ] Fix all critical bugs found

---

### Day 16 — Monday, March 30
**🧪 Full QA Pass — Backend & Data**

- [ ] Verify all 35+ API endpoints return correct data
  - Use Postman or `curl` for each endpoint
- [ ] Verify cron jobs run on schedule (check sync logs)
- [ ] Verify moments detection pipeline: run `POST /admin/moments/process?limit=10`
- [ ] Check DB for data integrity:
  - Every video has at least one category
  - At least 100 moments exist
  - All prayer requests saved correctly
- [ ] Run `seed-video-categories.ts` one final time with fresh data
- [ ] Stress test: scroll through all 900+ videos in SermonsScreen — no crash
- [ ] Memory leak check: switch tabs rapidly for 2 minutes — no crash

---

### Day 17 — Tuesday, March 31
**🎯 Launch Day**

- [ ] Final backend deploy to production server
  - Set all production environment variables
  - Run DB migrations
  - Start with `pm2 start dist/main.js`
- [ ] Update mobile `EXPO_PUBLIC_API_URL` to production URL
- [ ] Build production APK / AAB:
  ```bash
  cd mobile
  npx eas build --platform android --profile production
  ```
- [ ] Submit to Google Play (internal testing track)
- [ ] Tag release: `git tag v1.0.0`
- [ ] Create GitHub release with changelog
- [ ] **🎉 Launch Koinonia TV v1.0.0**

---

## 🗂️ Feature Backlog (April+)

> These are important but deferred to keep March scope focused

| Feature | Priority | Effort |
|---------|----------|--------|
| iOS build + App Store submission | 🔴 High | 3 days |
| AI sermon summaries (OpenAI) | 🟡 Medium | 4 days |
| Playlist feature (create, add, reorder) | 🟡 Medium | 3 days |
| Transcript full-text search | 🟡 Medium | 3 days |
| Watch party / share-to-watch-together | 🟢 Low | 5 days |
| Admin dashboard (web UI) | 🟢 Low | 7 days |
| Multi-language (Hausa, Yoruba) | 🟢 Low | 5 days |
| Chromecast / AirPlay support | 🟢 Low | 4 days |
| Offline download (for premium users) | 🟢 Low | 5 days |
| Giving / donations integration | 🟡 Medium | 4 days |

---

## 🛠️ Reference — Key Commands

```bash
# ── Backend ─────────────────────────────────────────────────────────────
cd backend

# Start development server (hot reload)
npm run start:dev

# Seed database (run in order the first time)
npx ts-node src/database/seeds/seed-categories.ts
npx ts-node src/database/seeds/seed-video-categories.ts
npx ts-node src/database/seeds/seed-moments.ts

# Trigger YouTube sync manually
curl -X POST http://localhost:3000/api/v1/admin/sync/trigger

# Bulk-categorize videos (force re-tag all)
curl -X POST "http://localhost:3000/api/v1/admin/categorize?force=true"

# Detect moments in 50 videos
curl -X POST "http://localhost:3000/api/v1/admin/moments/process?limit=50"

# ── Mobile ──────────────────────────────────────────────────────────────
cd mobile

# Start Expo dev server
npx expo start

# Start on Android (with device connected)
npx expo run:android

# Clear Metro cache
npx expo start --clear
```

---

## 📁 Key File Map

```
backend/src/
├── modules/
│   ├── videos/videos.service.ts          ← Pagination + category filter
│   ├── moments/moments-detection.service.ts  ← Declaration/prayer/testimony detection
│   ├── youtube-sync/categorization.service.ts ← Keyword tagging
│   ├── youtube-sync/transcript.service.ts    ← YouTube caption fetcher
│   └── youtube-sync/admin.controller.ts      ← Admin trigger endpoints
├── database/seeds/
│   ├── seed-categories.ts        ← Run once to set up categories
│   ├── seed-video-categories.ts  ← Run to retag all videos
│   └── seed-moments.ts           ← Run to detect + seed moments

mobile/src/
├── navigation/AppNavigator.tsx   ← All routes defined here
├── api/index.ts                  ← All API functions
├── constants/theme.ts            ← Colors, fonts, spacing
└── screens/
    ├── Home/HomeScreen.tsx       ← Main landing page
    ├── Sermons/SermonsScreen.tsx ← Video list with filters
    ├── MomentPlayer/MomentPlayerScreen.tsx ← Spiritual clips player
    └── PrayerRequest/PrayerRequestScreen.tsx ← ⚠️ Needs backend
```

---

*Last updated: March 15, 2026*

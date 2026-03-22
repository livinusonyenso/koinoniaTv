# 🗓️ Koinonia TV — Full Daily Task Plan
## March → June 2026

> **Stack:** NestJS 11 Backend + React Native Expo 55 Mobile
> **Goal:** Ship a production-ready app by end of March. Scale through June.
> **Current date:** March 17, 2026
> **Status:** Core features ✅ | Data pipeline ✅ | Polish & production → in progress

---

## 📊 Full Overview

| Month | Week | Focus Area | Theme |
|-------|------|-----------|-------|
| **March** | Week 1 (Mar 1–7) | 🔧 Bug Fixes & Data | Stabilise the foundation |
| | Week 2 (Mar 8–14) | 🎨 UI Polish & Missing Features | Complete the experience |
| | Week 3 (Mar 15–21) | 🔔 Notifications & Auth | Connect & engage users |
| | Week 4 (Mar 22–28) | 🚀 Performance & Production | Deploy-ready |
| | Final Days (Mar 29–31) | 🎯 QA & Launch Prep | Ship it |
| **April** | Week 1 (Apr 1–7) | 🐛 Post-Launch Fixes | Real users, real bugs |
| | Week 2 (Apr 8–14) | 📱 App Store & Content | Reach more users |
| | Week 3 (Apr 15–21) | 🏗️ Admin Panel & Infrastructure | Control your platform |
| | Week 4 (Apr 22–30) | 📊 Analytics & Feedback | Measure everything |
| **May** | Week 1 (May 1–7) | 🎬 Self-Hosted Video Backend | Own your pipeline |
| | Week 2 (May 8–14) | 🖥️ Admin Upload UI | Content management |
| | Week 3 (May 15–21) | 📲 Migration & New Features | Deepen engagement |
| | Week 4 (May 22–31) | ⚡ Performance & iOS | Scale and ship iOS |
| **June** | Week 1 (Jun 1–7) | 🤝 Community Features | Real testimonies, real people |
| | Week 2 (Jun 8–14) | 🌍 Language & Sharing | Reach more of Africa |
| | Week 3 (Jun 15–21) | 💛 Giving & Sustainability | Support the ministry |
| | Week 4 (Jun 22–30) | 🔍 Polish & Q2 Review | Reflect and plan |

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

## 📅 MARCH — Week 3 (Mar 15–21): Notifications & Auth Flow

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

## 📅 MARCH — Week 4 (Mar 22–28): Performance & Production

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
- [ ] Add `FastImage` or Expo `Image` with `contentFit="cover"` + `blurhash` placeholder
  - Install: `npx expo install expo-image`
  - Replace all `<Image source={{ uri: ... }}>` with Expo Image
- [ ] Lazy-load thumbnails in `SermonCard.tsx` and `HomeScreen.tsx`
- [ ] Test scroll performance in SermonsScreen — should be smooth with 900+ videos

---

### Day 10 — Tuesday, March 24
**📶 Offline Support & Error States**

- [ ] Add global `useNetworkState()` hook — show banner when offline
- [ ] Configure TanStack Query `gcTime` to keep data 24h
- [ ] Add `retry: 2` and `retryDelay: 1000` to all queries
- [ ] Improve error states across all screens
- [ ] Add `RefreshControl` pull-to-refresh to all FlatList screens

---

### Day 11 — Wednesday, March 25
**🎬 VideoPlayerScreen Polish**

- [ ] Add persistent mini-player (picture-in-picture style)
- [ ] Show chapter markers on progress bar if transcript available
- [ ] Auto-rotate to landscape when video plays
- [ ] Add share button → `expo-sharing` → share YouTube link
- [ ] Show sermon metadata below player (date, views, category tags)
- [ ] "Add to Playlist" button (placeholder for now)

---

### Day 12 — Thursday, March 26
**🏠 HomeScreen Dynamic Content**

- [ ] "Word for Today" section — rotate daily using date modulo
- [ ] "Upcoming Programs" — wire to `eventsApi.getUpcoming()`
- [ ] "Trending This Week" — wire to `videosApi.getTrending(5)`
- [ ] Add "Continue Watching" section (logged-in users with history)
- [ ] Hero banner auto-scrolls through 3 featured videos every 5 seconds

---

### Day 13 — Friday, March 27
**🔍 Search Improvements**

- [ ] Add category filter chips below search bar
- [ ] Add "Recent Searches" stored in AsyncStorage
- [ ] Backend: improve search to match category names
- [ ] Add `highlightText()` utility — bold matching part of result titles
- [ ] Debounce search input: 400ms before API call

---

### Day 14 — Saturday, March 28
**🚀 Production Readiness**

- [ ] Backend: `synchronize: false`, `logging: false` in production config
- [ ] Backend: add `helmet()`, `compression()`, configure CORS
- [ ] Mobile: update `app.json` — name, version, splash, icon
- [ ] Mobile: set `EXPO_PUBLIC_API_URL` to production server
- [ ] Run `npx expo prebuild` — test native build
- [ ] Verify Android build: `npx expo run:android`
- [ ] Document all environment variables in `README.md`

---

## 📅 MARCH — Final Days (Mar 29–31): QA & Launch

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

- [ ] Verify all 35+ API endpoints return correct data with Postman or `curl`
- [ ] Verify cron jobs run on schedule
- [ ] Verify moments detection pipeline
- [ ] Check DB for data integrity (every video has a category, 100+ moments exist)
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

---

# 📅 APRIL 2026 — Launch & Stabilise

> **Theme:** Get v1 in front of real users. Listen. Fix. Iterate fast.
> **Mindset:** Done is better than perfect. Real users break things you never imagined. Stay calm.

---

## April — Week 1 (Apr 1–7): Post-Launch Fixes

---

### Day 1 — Wednesday, April 1
**📡 Monitor Production**

- [ ] Install Sentry for crash reporting on mobile
  ```bash
  npx expo install @sentry/react-native
  ```
  - Wrap `App.tsx` with Sentry provider
  - Test: force a crash → confirm it appears in Sentry dashboard
- [ ] Set up UptimeRobot (free) — monitor `GET /api/v1/health` every 5 mins
  - Get email alert if server goes down
- [ ] Watch server logs live for first few hours: `pm2 logs`
- [ ] Review DB connection pool — check for connection timeout errors
- [ ] Check Redis connection is stable under real traffic

---

### Day 2 — Thursday, April 2
**🐛 Triage & Fix Critical Bugs**

- [ ] Review Sentry — list all unique crashes from Day 1
- [ ] Fix the top 3 highest-impact crashes first
  - Common issues: undefined navigation params, missing null checks, API timeouts
- [ ] Check Play Store review queue — any early user reviews?
  - Respond to all reviews (even negative ones — shows you care)
- [ ] Confirm YouTube API quota usage — are you within daily limits?
  - Add quota monitoring endpoint: `GET /admin/youtube/quota`
- [ ] Fix any blank/white screen issues on first app launch

---

### Day 3 — Friday, April 3
**📊 YouTube API Quota Safety**

- [ ] Add YouTube API quota tracking in your backend
  - Log each API call type + quota cost to a `youtube_quota_log` table
  - Daily quota: 10,000 units — each search costs 100, each video fetch costs 1
- [ ] Add graceful degradation when quota is exceeded:
  - Endpoint returns cached data instead of live YouTube API call
  - Show user a subtle "Refreshing later" indicator instead of error
- [ ] Handle deleted/private YouTube videos gracefully
  - Add `isActive: boolean` column to `videos` table
  - Cron job: mark videos that return 404 from YouTube as `isActive: false`
  - Filter inactive videos from all public API responses
- [ ] Test: manually set a video to `isActive: false` → confirm it disappears from app

---

### Day 4 — Saturday, April 4
**🔧 Stability Fixes**

- [ ] Fix token refresh flow — expired `accessToken` should silently refresh using `refreshToken`
  - Add Axios interceptor in `api/index.ts`:
    ```typescript
    axiosInstance.interceptors.response.use(
      res => res,
      async err => {
        if (err.response?.status === 401) {
          const newToken = await authApi.refresh();
          // retry original request with new token
        }
      }
    );
    ```
- [ ] Fix deep link handling — `koinoniatv://video/:id` should open VideoPlayer
  - Install: `npx expo install expo-linking`
  - Test: send deep link from browser → app opens correct video
- [ ] Fix navigation state persistence — app should restore last tab after restart
- [ ] Fix pull-to-refresh spinner colour (should match brand gold)

---

### Day 5 — Sunday, April 5
**📱 Play Store Listing**

- [ ] Design app icon (1024×1024px)
  - Suggestion: Cross + TV screen shape in deep purple + gold
  - Tools: Figma (free), Canva, or Adobe Express
- [ ] Write Play Store short description (80 chars max):
  - "Watch Koinonia sermons, declarations & miracle services. Grow in faith daily."
- [ ] Write Play Store full description (4000 chars)
  - Sections: What is Koinonia TV, Key Features, Who is Apostle Joshua Selman
- [ ] Take 5 screenshots of key screens (use Android emulator at 1080×1920)
  - HomeScreen, SermonsScreen, VideoPlayer, MomentPlayer, PrayerRequestScreen
- [ ] Upload all assets to Google Play Console
- [ ] Move from internal testing → closed testing (invite 20 people you trust)

---

### Day 6 — Monday, April 6
**🌐 Landing Page**

- [ ] Create a simple one-page landing website (use Vercel + Next.js or plain HTML)
  - Sections: App name + tagline, Screenshots, Download button, About Koinonia
  - Keep it simple — 2 hours max
  - Deploy free to Vercel: `vercel deploy`
- [ ] Add Open Graph meta tags — so WhatsApp/Twitter show a preview card when shared
- [ ] Add Google Play download button (App Store button placeholder)
- [ ] Share the landing page link with 5 people today — get feedback

---

### Day 7 — Tuesday, April 7
**🧪 Week 1 Review**

- [ ] Count: How many users registered in the first week?
- [ ] Review Sentry: how many crashes? What types?
- [ ] Review: which screens are users spending the most time on?
- [ ] Fix the top 5 remaining bugs from the week
- [ ] Git commit: `fix: post-launch stability + Play Store assets`
- [ ] Retrospective note: write 3 sentences — what worked, what broke, what you learned

---

## April — Week 2 (Apr 8–14): Content & App Store

---

### Day 8 — Wednesday, April 8
**📚 Content Audit & Curation**

- [ ] Query DB: which 50 videos have the most views on YouTube?
  ```sql
  SELECT title, youtube_view_count, published_at
  FROM videos ORDER BY youtube_view_count DESC LIMIT 50;
  ```
- [ ] Verify all 50 are properly categorised — fix any that are wrong
- [ ] Add `isFeatured` boolean column to `videos` table
  ```bash
  npx ts-node src/database/migrations/add-is-featured.ts
  ```
- [ ] Mark top 10 all-time sermons as `isFeatured = true`
- [ ] Update `GET /videos/featured` endpoint to use `isFeatured` flag
- [ ] Admin endpoint: `PATCH /admin/videos/:id` — allow toggling `isFeatured`

---

### Day 9 — Thursday, April 9
**🎭 Declarations Screen — "Declare Now" Mode**

- [ ] Add full-screen "Declare Now" mode to `DeclarationsScreen.tsx`
  - Tap "Declare Now" button → enters full-screen mode
  - Shows one declaration at a time, large bold text
  - Swipe right → next declaration
  - Background: deep purple gradient
  - Text: white, centred, 28px bold
- [ ] Add "Declare All" button — plays all declarations as audio moments back to back
- [ ] Track which declarations the user has completed (AsyncStorage)
- [ ] Show progress indicator: "12 of 30 declarations today"

---

### Day 10 — Friday, April 10
**📖 Engrafted Word — Real Scripture Data**

- [ ] Seed 90 days of scriptures — create `src/database/seeds/seed-scriptures.ts`
  - Format: `{ verse, reference, category, meditation }` — 90 entries minimum
  - Categories: Faith, Healing, Prayer, Favour, Wisdom, Identity, Prosperity
  - Use scriptures directly tied to Apostle Joshua Selman's frequent references
- [ ] Create `scriptures` table and `ScriptureEntity`
- [ ] `GET /scriptures/today` — returns deterministic daily scripture (date modulo count)
- [ ] `GET /scriptures?category=faith` — filter by category
- [ ] Update `EngraftedWordScreen.tsx` to use the real API

---

### Day 11 — Saturday, April 11
**🍎 iOS Build — Phase 1**

- [ ] Create Apple Developer account at developer.apple.com ($99/year)
- [ ] Configure EAS for iOS in `eas.json`:
  ```json
  {
    "build": {
      "preview": {
        "ios": { "simulator": true }
      },
      "production": {
        "ios": { "distribution": "store" }
      }
    }
  }
  ```
- [ ] Run first iOS simulator build:
  ```bash
  npx eas build --platform ios --profile preview
  ```
- [ ] Fix iOS-specific issues:
  - Safe area insets (use `edges` prop correctly)
  - Font rendering differences
  - Status bar colour
- [ ] Test all 14 screens on iOS simulator

---

### Day 12 — Sunday, April 12
**🍎 iOS Build — TestFlight**

- [ ] Fix remaining iOS simulator bugs from Day 11
- [ ] Run production iOS build:
  ```bash
  npx eas build --platform ios --profile production
  ```
- [ ] Submit to App Store Connect → TestFlight
  ```bash
  npx eas submit --platform ios
  ```
- [ ] Invite 5 beta testers via TestFlight
- [ ] Create App Store listing (screenshots, description, keywords)
  - Keywords: christian sermons, koinonia, apostle joshua selman, faith, prayer

---

### Day 13 — Monday, April 13
**🔔 Notification Improvements**

- [ ] Add daily "Word for Today" push notification
  - Scheduled daily at 7:00 AM (user's timezone)
  - NestJS cron: `@Cron('0 7 * * *')`
  - Sends today's scripture + short meditation
- [ ] Add weekly "New Sermons" notification
  - Every Sunday at 9:00 AM — list of sermons added that week
- [ ] Add notification history screen
  - Store last 30 sent notifications in `notification_log` table
  - `GET /users/me/notifications` → shows history in app
- [ ] Test all notification types on real Android device

---

### Day 14 — Tuesday, April 14
**🧪 Week 2 Review + Move to Open Testing**

- [ ] Fix all critical iOS bugs found in TestFlight
- [ ] Move Android to open testing on Google Play (anyone can join)
- [ ] Share open testing link in WhatsApp groups you're part of
- [ ] Count: total registered users across Android + iOS
- [ ] Review analytics: most played sermons, most used features
- [ ] Git commit: `feat: declarations mode, scripture API, iOS build, notifications`

---

## April — Week 3 (Apr 15–21): Admin Panel & Infrastructure

---

### Day 15 — Wednesday, April 15
**🖥️ Admin Panel — Setup**

- [ ] Create `admin-panel/` directory in your monorepo (React + Vite)
  ```bash
  cd admin-panel
  npm create vite@latest . -- --template react-ts
  npm install axios react-router-dom @tanstack/react-query
  ```
- [ ] Set up admin routing:
  - `/admin/login` — admin login page
  - `/admin/dashboard` — overview stats
  - `/admin/videos` — video management
  - `/admin/prayers` — prayer requests inbox
  - `/admin/users` — user list
- [ ] Add JWT auth to admin panel — only admin-role users can access
- [ ] Deploy admin panel to same server under `/admin` path

---

### Day 16 — Thursday, April 16
**🖥️ Admin Panel — Dashboard**

- [ ] Build dashboard stats page:
  - Total videos in DB
  - Total registered users
  - Total prayer requests (this week / all time)
  - YouTube API quota remaining today
  - Last sync time + videos added in last sync
  - Pending prayer requests (unread count)
- [ ] All stats from a single `GET /admin/stats` endpoint
  ```typescript
  // admin.controller.ts
  @Get('stats')
  async getStats() {
    return {
      videos: await this.videoService.count(),
      users: await this.userService.count(),
      prayers: await this.prayerService.count(),
      quotaUsed: await this.youtubeService.getQuotaUsed(),
      lastSync: await this.youtubeService.getLastSyncTime(),
    };
  }
  ```
- [ ] Auto-refresh dashboard every 60 seconds

---

### Day 17 — Friday, April 17
**🖥️ Admin Panel — Video Management**

- [ ] Video list page with:
  - Search by title
  - Filter by category
  - Filter by `isFeatured`
  - Filter by `isActive`
  - Columns: thumbnail, title, published date, views, categories, featured toggle
- [ ] Inline toggle `isFeatured` — click to feature/unfeature instantly
- [ ] Inline toggle `isActive` — soft delete / restore a video
- [ ] Bulk action: select multiple videos → assign category
- [ ] Pagination: 50 videos per page

---

### Day 18 — Saturday, April 18
**🖥️ Admin Panel — Prayer Requests Inbox**

- [ ] Prayer requests list:
  - Columns: name, category, request text (truncated), submitted date, status
  - Status: `new` (red badge) / `prayed` (green badge)
  - Filter by category, filter by status
- [ ] Click row → expand full prayer request text
- [ ] "Mark as Prayed" button — updates status in DB
- [ ] Add `PATCH /admin/prayer-requests/:id` endpoint
  - Updates `status` field to `prayed`
  - Optionally records which admin prayed (for accountability)
- [ ] Bulk "Mark all as Prayed" action

---

### Day 19 — Sunday, April 19
**🤝 Ministry Partnership — Official Outreach**

> This is non-technical but arguably the most important task this month.

- [ ] Write a formal outreach letter/email to Koinonia Global content team
  - Who to contact: find the media/content director on their website or social media
  - What to say:
    - Who you are and what you built
    - Show them the app (share a screen recording)
    - Request: permission to redistribute sermon content on Koinonia TV
    - Ask: can we get raw video files or access to their archive?
    - Offer: you handle all hosting, encoding, and categorisation at no cost to them
- [ ] Set up a shared Google Drive folder to receive video files from them
- [ ] Prepare a 2-minute screen recording of the app to attach to your message
- [ ] Follow up on WhatsApp if no email response in 3 days

---

### Day 20 — Monday, April 20
**🏗️ Bunny.net — Account Setup**

- [ ] Create account at bunny.net
- [ ] Create a Bunny Stream video library
  - Name it: `koinonia-tv-sermons`
  - Region: pick closest to Nigeria (Europe West or London — closest with good Africa routing)
- [ ] Get your Bunny API key and Stream library ID
- [ ] Add to backend `.env`:
  ```
  BUNNY_API_KEY=your-api-key
  BUNNY_LIBRARY_ID=your-library-id
  BUNNY_CDN_HOSTNAME=your-hostname.b-cdn.net
  ```
- [ ] Test: manually upload one video via Bunny dashboard
- [ ] Verify it transcodes to HLS (`.m3u8`) and is playable

---

### Day 21 — Tuesday, April 21
**🧪 Week 3 Review**

- [ ] Review admin panel — is everything working? Fix any layout issues
- [ ] Count: prayer requests received and prayed for this week
- [ ] Has the ministry team responded to outreach?
- [ ] Bunny Stream — is your test video playing correctly?
- [ ] Fix any outstanding bugs from the week
- [ ] Git commit: `feat: admin panel v1, Bunny Stream setup, ministry outreach`

---

## April — Week 4 (Apr 22–30): Analytics & Feedback

---

### Day 22 — Wednesday, April 22
**📊 Analytics — PostHog Setup**

- [ ] Create free PostHog account at posthog.com (open source, privacy-respecting)
- [ ] Install in mobile app:
  ```bash
  npx expo install posthog-react-native
  ```
- [ ] Wrap `App.tsx` with PostHog provider
- [ ] Track key events:
  - `video_played` — videoId, title, source (youtube/hosted)
  - `search_performed` — query, results_count
  - `prayer_submitted` — category
  - `declaration_completed` — declarationId
  - `screen_viewed` — screenName
- [ ] All events are anonymous (no PII) — just behaviour data

---

### Day 23 — Thursday, April 23
**📊 Analytics — Backend Events**

- [ ] Add analytics tracking to backend:
  - `POST /videos/:id/view` — increment view count, log to analytics
  - `POST /videos/:id/complete` — mark as completed (user watched 80%+)
- [ ] Create `video_views` table — userId (nullable), videoId, watchedSeconds, completedAt
- [ ] Backend analytics endpoint for admin panel:
  - `GET /admin/analytics/top-videos?period=7d` — top 10 most watched this week
  - `GET /admin/analytics/user-growth?period=30d` — daily new user registrations
  - `GET /admin/analytics/search-terms` — top 20 searched terms
- [ ] Add analytics charts to admin panel dashboard (use recharts or chart.js)

---

### Day 24 — Friday, April 24
**💬 In-App Feedback**

- [ ] Add feedback button to ProfileScreen → opens a modal
  - Type: Bug Report / Feature Request / General Feedback
  - Text input (max 500 chars)
  - Optional: auto-attach device info (OS version, app version)
- [ ] Create `feedback` table + `POST /feedback` endpoint
- [ ] Feedback inbox in admin panel — shows all submissions
- [ ] Auto-email yourself when new feedback arrives
  - NestJS Mailer: `npm install @nestjs-modules/mailer nodemailer`
  - Send to your email on every `POST /feedback`

---

### Day 25 — Saturday, April 25
**🔍 Search Analytics & Improvements**

- [ ] Log all search queries to `search_log` table (query, results_count, userId, createdAt)
- [ ] Admin endpoint: `GET /admin/analytics/searches` — see what people are searching for
- [ ] Improve search ranking:
  - Boost results where query matches title (vs description)
  - Boost featured videos in search results
  - Add `relevance_score` to search response
- [ ] Add "Did you mean…?" suggestions for common misspellings
  - Simple approach: pre-seed a dictionary of Koinonia-specific terms

---

### Day 26 — Sunday, April 26
**🌐 Social Media Presence**

> One hour of intentional presence > one week of passive hoping

- [ ] Create Instagram page for Koinonia TV app
  - Profile: "Koinonia TV App — Watch sermons, declarations & miracle services anywhere"
  - Post 3 screenshots of the app
- [ ] Create Twitter/X account for Koinonia TV App
- [ ] Post first announcement: "Koinonia TV is now on Android. Download link in bio."
- [ ] Share in at least 5 WhatsApp groups related to Koinonia/Christianity
- [ ] Tag @koinoniaglobal and @ApostleJoshuaSelman in posts (respectfully)

---

### Day 27 — Monday, April 27
**⚡ Performance Tuning**

- [ ] Install FlashList to replace FlatList in SermonsScreen
  ```bash
  yarn add @shopify/flash-list
  npx expo install @shopify/flash-list
  ```
  - Replace `FlatList` with `FlashList` in SermonsScreen
  - Set `estimatedItemSize={180}` (approximate card height)
  - Test scroll performance with 900+ videos — should be butter smooth
- [ ] Reduce initial app bundle size
  - Run: `npx expo export --dump-sourcemap`
  - Check bundle analyser — remove unused imports
- [ ] App startup time — target under 3 seconds on mid-range Android

---

### Day 28 — Tuesday, April 28
**🛡️ Security Hardening**

- [ ] Rate limit prayer request submissions: 5 per IP per hour
- [ ] Add input sanitisation to all text inputs (prevent XSS/injection)
  - Backend: use `class-validator` on all DTOs (likely already done — verify)
  - Mobile: strip HTML tags from any user-provided text before display
- [ ] Verify JWT expiry — access token should expire in 15min, refresh in 30 days
- [ ] Add `bcrypt` rounds check — ensure passwords are hashed with minimum 12 rounds
- [ ] Review all admin endpoints — confirm all require admin JWT role

---

### Day 29 — Wednesday, April 29
**🧹 Code Cleanup**

- [ ] Remove all `console.log` statements from production mobile build
  - Add Babel plugin: `babel-plugin-transform-remove-console`
  ```bash
  npm install --save-dev babel-plugin-transform-remove-console
  ```
- [ ] Remove all unused imports across mobile codebase (`npx ts-prune`)
- [ ] Remove unused backend modules
- [ ] Update all NPM packages with known vulnerabilities: `npm audit fix`
- [ ] Ensure `README.md` is accurate and complete

---

### Day 30 — Thursday, April 30
**📋 April Retrospective**

- [ ] Count total registered users
- [ ] Count total videos in DB
- [ ] Count prayer requests received + prayed for
- [ ] Review: top 5 most watched sermons this month
- [ ] Review: top 5 most common search terms
- [ ] Review: top 3 crashes from Sentry
- [ ] Write April summary note (3–5 sentences) — what shipped, what didn't, why
- [ ] Plan May 1 starting task (should be Bunny Stream backend module)
- [ ] Git commit: `chore: April cleanup, analytics, security hardening`

---

---

# 📅 MAY 2026 — Self-Hosting Infrastructure

> **Theme:** Own your platform. Remove the YouTube ceiling.
> **This is the hardest technical month. Take it one day at a time.**

---

## May — Week 1 (May 1–7): Hosted Video Backend

---

### Day 1 — Friday, May 1
**🗄️ Hosted Videos Entity**

- [ ] Create `hosted-videos` NestJS module:
  ```bash
  nest generate module hosted-videos
  nest generate service hosted-videos
  nest generate controller hosted-videos
  ```
- [ ] Create `HostedVideoEntity`:
  ```typescript
  @Entity('hosted_videos')
  export class HostedVideo {
    @PrimaryGeneratedColumn()    id: number;
    @Column()                    title: string;
    @Column({ nullable: true })  description: string;
    @Column()                    bunnyVideoId: string;
    @Column()                    bunnyStreamUrl: string; // .m3u8 URL
    @Column({ nullable: true })  thumbnailUrl: string;
    @Column({ nullable: true })  duration: number; // seconds
    @Column({ nullable: true })  fileSize: number; // bytes
    @Column({ default: 'processing' }) status: 'processing' | 'ready' | 'failed';
    @Column({ nullable: true })  speaker: string;
    @Column({ nullable: true })  series: string;
    @Column({ nullable: true })  recordedDate: Date;
    @Column({ default: false })  isPublished: boolean;
    @CreateDateColumn()          createdAt: Date;
  }
  ```
- [ ] Run migration to create table
- [ ] Verify table exists in MySQL

---

### Day 2 — Saturday, May 2
**📡 Bunny Stream Integration**

- [ ] Create `bunny.service.ts` in hosted-videos module:
  ```typescript
  @Injectable()
  export class BunnyService {
    private readonly apiKey = process.env.BUNNY_API_KEY;
    private readonly libraryId = process.env.BUNNY_LIBRARY_ID;
    private readonly baseUrl = 'https://video.bunnycdn.com';

    async createVideo(title: string): Promise<{ guid: string }> {
      // POST to Bunny to register a new video — returns guid
    }

    async uploadVideo(guid: string, filePath: string): Promise<void> {
      // Stream file to Bunny upload endpoint
    }

    async getVideo(guid: string): Promise<BunnyVideoStatus> {
      // GET video status — check if encoding is complete
    }

    async deleteVideo(guid: string): Promise<void> {
      // DELETE video from Bunny library
    }

    getStreamUrl(guid: string): string {
      return `https://${process.env.BUNNY_CDN_HOSTNAME}/${guid}/playlist.m3u8`;
    }

    getThumbnailUrl(guid: string): string {
      return `https://${process.env.BUNNY_CDN_HOSTNAME}/${guid}/thumbnail.jpg`;
    }
  }
  ```
- [ ] Test: call `createVideo()` and `getVideo()` — confirm Bunny API responds

---

### Day 3 — Sunday, May 3
**📤 Upload API Endpoint**

- [ ] Create `POST /admin/hosted-videos/upload` endpoint
  - Accepts `multipart/form-data` with:
    - `file` — video file (mp4, mov, mkv, max 2GB)
    - `title` — string
    - `speaker` — string
    - `recordedDate` — ISO date string
    - `categories` — comma-separated category slugs
  - Validates file type and size
  - Calls `bunnyService.createVideo(title)` → gets guid
  - Calls `bunnyService.uploadVideo(guid, tempFilePath)` → streams to Bunny
  - Saves `HostedVideoEntity` to DB with `status: 'processing'`
  - Returns `{ id, bunnyVideoId, status }` immediately (don't wait for encoding)
- [ ] Use `@nestjs/platform-express` + `multer` for file handling
  - Store temp file in `/tmp` during upload
  - Delete temp file after upload to Bunny completes

---

### Day 4 — Monday, May 4
**🔄 Webhook — Processing Status**

- [ ] Create `POST /webhooks/bunny` endpoint to receive Bunny encoding callbacks
  - Bunny sends a webhook when video finishes encoding
  - Payload contains: `VideoGuid`, `Status` (3 = finished, 4 = failed)
  - On success: update `status = 'ready'`, set `bunnyStreamUrl`, `thumbnailUrl`
  - On failure: update `status = 'failed'` — log error
- [ ] Configure webhook URL in Bunny dashboard → your server URL
- [ ] Test with Bunny's webhook simulator in their dashboard
- [ ] Add `GET /admin/hosted-videos/:id/status` — poll endpoint for admin panel

---

### Day 5 — Tuesday, May 5
**🔗 Unified Video API**

- [ ] Create unified `GET /videos` response that merges YouTube + hosted videos
  - Add `source: 'youtube' | 'hosted'` field to every video in response
  - When both exist (same sermon), prefer hosted version
  - `hostedVideoId` foreign key on YouTube video — link when same sermon exists
- [ ] Update `GET /videos/latest` — if video has hosted version, return hosted stream URL
- [ ] Update `GET /videos/featured` — same logic
- [ ] Ensure mobile app VideoPlayerScreen handles both source types transparently

---

### Day 6 — Wednesday, May 6
**📲 Mobile — HLS Video Playback**

- [ ] Install react-native-video for HLS support:
  ```bash
  npx expo install react-native-video
  ```
- [ ] Update `VideoPlayerScreen.tsx` to handle source type:
  ```typescript
  const videoSource = video.source === 'hosted'
    ? { uri: video.bunnyStreamUrl, type: 'm3u8' }
    : { uri: `https://www.youtube.com/watch?v=${video.youtubeId}` };
  ```
- [ ] Test HLS playback on real Android device using mobile data (not WiFi)
  - HLS adaptive bitrate = auto quality adjustment on 3G
- [ ] Verify: video starts within 5 seconds on 3G connection
- [ ] Compare: YouTube iframe vs HLS player experience on low bandwidth

---

### Day 7 — Thursday, May 7
**🧪 Week 1 Review**

- [ ] End-to-end test: upload video via curl → webhook fires → video appears in app
- [ ] Verify: HLS stream plays on Android device
- [ ] Performance check: how fast does a 1-hour sermon start playing on HLS?
- [ ] Fix any Bunny API integration issues
- [ ] Git commit: `feat: hosted-videos module, Bunny Stream integration, HLS playback`

---

## May — Week 2 (May 8–14): Admin Upload UI

---

### Day 8 — Friday, May 8
**🖥️ Admin — Upload Page**

- [ ] Build "Upload Video" page in admin panel:
  - Drag-and-drop file zone (accept mp4, mov, mkv)
  - Show file name and size after selection
  - Metadata form below the file zone:
    - Title (required)
    - Speaker (default: "Apostle Joshua Selman")
    - Recorded Date (date picker)
    - Series name (text input)
    - Categories (multi-select dropdown)
    - Description (optional textarea)
  - "Upload" button — disabled until file + title are filled
- [ ] Show upload progress bar during file transfer
- [ ] After upload: show "Processing…" status with animated spinner
- [ ] Polling: check `GET /admin/hosted-videos/:id/status` every 10 seconds until ready

---

### Day 9 — Saturday, May 9
**🖥️ Admin — Video Library Page**

- [ ] Build hosted video library in admin panel:
  - Table: thumbnail, title, speaker, recorded date, duration, status badge, actions
  - Status badges: `Processing` (yellow), `Ready` (green), `Failed` (red)
  - Actions: Edit metadata, Delete, Publish/Unpublish
- [ ] Edit metadata modal — update title, speaker, series, categories, description
  - `PATCH /admin/hosted-videos/:id`
- [ ] Delete confirmation modal — calls `DELETE /admin/hosted-videos/:id`
  - Removes from Bunny AND from DB
- [ ] Publish/Unpublish toggle — `isPublished` flag controls visibility in app

---

### Day 10 — Sunday, May 10
**📋 Content Intake Workflow — Document & Practice**

- [ ] Document your exact content workflow:
  ```
  Step 1: Receive video file (from ministry team via WhatsApp/Drive/email)
  Step 2: Open admin panel → Upload Video
  Step 3: Drag file in, fill metadata (title, date, series, categories)
  Step 4: Click Upload — wait 5–15 mins for processing
  Step 5: Confirm video is Ready → click Publish
  Step 6: Open app → verify video appears in correct sections
  Total time target: 15 minutes per sermon
  ```
- [ ] Practice: upload 3 real sermons using this workflow
  - Time yourself each time
  - Note any friction points
- [ ] Fix any UX issues in the upload flow that slow you down

---

### Day 11 — Monday, May 11
**🎬 Custom Thumbnail Upload**

- [ ] Add thumbnail upload to hosted video form
  - File input: accept jpg, png, webp — max 2MB
  - Preview before upload
- [ ] Upload thumbnail to Cloudflare R2 (or Bunny CDN) — not same as video
  ```bash
  npm install @aws-sdk/client-s3  # R2 uses S3-compatible API
  ```
- [ ] `thumbnailUrl` on `HostedVideoEntity` updated with R2/CDN URL
- [ ] Fallback: if no custom thumbnail, use Bunny auto-generated thumbnail
- [ ] Mobile: hosted video thumbnails load from CDN — verify fast loading

---

### Day 12 — Tuesday, May 12
**📱 Continue Watching — Backend**

- [ ] Create `watch_progress` table:
  ```typescript
  @Entity('watch_progress')
  export class WatchProgress {
    @PrimaryGeneratedColumn() id: number;
    @Column()                 userId: number;
    @Column({ nullable: true }) videoId: number;        // YouTube video
    @Column({ nullable: true }) hostedVideoId: number;  // Hosted video
    @Column()                 watchedSeconds: number;
    @Column()                 totalSeconds: number;
    @Column()                 completedAt: Date | null;
    @UpdateDateColumn()       updatedAt: Date;
  }
  ```
- [ ] Endpoints:
  - `POST /progress` — update progress (call every 30 seconds while watching)
  - `GET /progress/:videoId` — get resume position for a video
  - `GET /users/me/continue-watching` — last 5 in-progress videos
- [ ] Mobile: call `POST /progress` every 30 seconds in VideoPlayerScreen
- [ ] HomeScreen "Continue Watching" section now uses real API data

---

### Day 13 — Wednesday, May 13
**📋 Playlists — Backend**

- [ ] Create `playlists` table + `playlist_videos` junction table
  ```typescript
  @Entity('playlists')
  export class Playlist {
    @PrimaryGeneratedColumn() id: number;
    @Column()                 userId: number;
    @Column()                 name: string;
    @Column({ default: false }) isPublic: boolean;
    @CreateDateColumn()       createdAt: Date;
  }
  ```
- [ ] Endpoints:
  - `POST /playlists` — create playlist
  - `GET /playlists` — user's playlists
  - `POST /playlists/:id/videos` — add video to playlist
  - `DELETE /playlists/:id/videos/:videoId` — remove from playlist
  - `GET /playlists/:id` — get playlist with videos
- [ ] Seed 3 curated public playlists:
  - "Best of Apostle Joshua Selman", "Faith Foundations", "Morning Declarations"

---

### Day 14 — Thursday, May 14
**🧪 Week 2 Review**

- [ ] Complete end-to-end test of self-hosting workflow:
  - Upload real sermon video → process → publish → view in app → track progress
- [ ] Verify Continue Watching works: watch 2 minutes → close → reopen → resumes
- [ ] Verify Playlists: create a playlist → add videos → view from ProfileScreen
- [ ] Fix any remaining issues
- [ ] Git commit: `feat: admin upload UI, watch progress, playlists`
- [ ] Milestone: **First self-hosted sermon is live in the app** 🎉

---

## May — Week 3 (May 15–21): Migration & New Features

---

### Day 15 — Friday, May 15
**🔄 Content Migration Plan**

- [ ] Query: which YouTube videos do you now have hosted versions for?
  - Add `hostedVideoId` column to `videos` (YouTube videos) table
  - When a hosted video matches a YouTube video (same sermon), link them
- [ ] Migration strategy:
  - Priority 1: Top 50 most-watched sermons → host these first
  - Priority 2: All featured sermons
  - Priority 3: Everything else (long tail)
- [ ] Create a migration checklist spreadsheet: YouTube video ID | Title | Hosted? | Priority

---

### Day 16 — Saturday, May 16
**📥 Offline Download — Foundation**

- [ ] Install required packages:
  ```bash
  npx expo install expo-file-system expo-av
  ```
- [ ] Create download service in mobile app:
  ```typescript
  // services/download.service.ts
  export const downloadSermon = async (video: HostedVideo) => {
    const localPath = FileSystem.documentDirectory + `sermon_${video.id}.mp4`;
    const download = FileSystem.createDownloadResumable(
      video.bunnyStreamUrl.replace('playlist.m3u8', 'original.mp4'),
      localPath
    );
    return download.downloadAsync();
  };
  ```
- [ ] Store download state in AsyncStorage: `downloaded_videos: [id, id, id]`
- [ ] Show download progress indicator on sermon card
- [ ] Show "Downloaded" badge on sermon cards that are cached locally
- [ ] Play local file when offline and video is downloaded

---

### Day 17 — Sunday, May 17
**📱 Playlists — Mobile UI**

- [ ] Create `PlaylistsScreen.tsx` — list of user's playlists + curated public playlists
  - Each playlist: thumbnail (first video's thumbnail), name, video count
- [ ] Create `PlaylistDetailScreen.tsx` — videos in a playlist
  - "Play All" button — starts MomentPlayer with all playlist videos in order
  - Reorder by drag (react-native-draggable-flatlist)
- [ ] Add "Add to Playlist" modal in VideoPlayerScreen
  - Shows user's existing playlists
  - "Create new playlist" option at bottom
- [ ] Add Playlists tab or section in ProfileScreen

---

### Day 18 — Monday, May 18
**🔍 Transcript Full-Text Search**

- [ ] Add `fullTextIndex` on `transcripts.content` column in MySQL:
  ```sql
  ALTER TABLE transcripts ADD FULLTEXT INDEX idx_transcript_content (content);
  ```
- [ ] Update search endpoint to include transcript matches:
  ```sql
  WHERE v.title LIKE :q
    OR v.description LIKE :q
    OR MATCH(t.content) AGAINST (:q IN BOOLEAN MODE)
  ```
- [ ] Add "Found in transcript" label on search results that matched transcript
- [ ] Test: search for a specific phrase from a sermon — it should find that video

---

### Day 19 — Tuesday, May 19
**🧩 Series Feature**

- [ ] Create `series` table:
  ```typescript
  @Entity('series')
  export class Series {
    @PrimaryGeneratedColumn()   id: number;
    @Column()                   name: string;
    @Column({ nullable: true }) description: string;
    @Column({ nullable: true }) thumbnailUrl: string;
    @Column({ default: 0 })     videoCount: number;
    @Column({ nullable: true }) year: number;
    @Column({ default: 0 })     displayOrder: number;
  }
  ```
- [ ] Seed initial series from Koinonia's known teaching series:
  - "Zeal of God", "The Mystery of Faith", "Understanding the Spirit Realm",
    "Prayer and Intercession", "The Wealthy Place"
- [ ] `GET /series` — list all series with video counts
- [ ] `GET /series/:id/videos` — paginated videos in a series
- [ ] Mobile: `SeriesScreen.tsx` — horizontal scroll of series cards
- [ ] Add series to HomeScreen below Trending section

---

### Day 20 — Wednesday, May 20
**📊 Watch Analytics**

- [ ] Backend: calculate "Trending" properly using actual watch data
  - Trending = most `video_views` records in last 7 days
  - Not YouTube view count — your own platform view count
  - `GET /videos/trending` now uses real watch_progress data
- [ ] Add `completionRate` to video response:
  - % of users who started the video and watched 80%+
  - Signals which sermons are most impactful
- [ ] Admin panel: new analytics tab
  - Bar chart: top 10 videos by completion rate this month
  - Line chart: daily active users (last 30 days)

---

### Day 21 — Thursday, May 21
**🧪 Week 3 Review**

- [ ] Test offline download: download sermon → turn off WiFi → play video → works
- [ ] Test transcript search: search for sermon phrase → finds correct video
- [ ] Test series: browse series → select → see videos → play video
- [ ] Fix any remaining bugs
- [ ] Git commit: `feat: offline download, playlists UI, series, transcript search`

---

## May — Week 4 (May 22–31): Performance & iOS

---

### Day 22 — Friday, May 22
**⚡ FlashList Migration**

- [ ] Replace `FlatList` with `FlashList` in all heavy list screens:
  - SermonsScreen (900+ items) — highest priority
  - SearchScreen results
  - BookmarksScreen
  - HistoryScreen
  - PlaylistDetailScreen
- [ ] Measure: scroll FPS before and after (use React Native Perf Monitor)
- [ ] Fix any `estimatedItemSize` warnings in FlashList

---

### Day 23 — Saturday, May 23
**🗄️ Database Optimisation**

- [ ] Review slow query log — identify top 5 slowest queries
  ```sql
  SET GLOBAL slow_query_log = 'ON';
  SET GLOBAL long_query_time = 0.5; -- log queries >500ms
  ```
- [ ] Add missing indexes:
  - `watch_progress(userId, updatedAt)` — for Continue Watching
  - `hosted_videos(isPublished, createdAt)` — for latest hosted videos
  - `playlist_videos(playlistId, displayOrder)` — for ordered playlist
- [ ] Add DB connection pool sizing to TypeORM config:
  ```typescript
  extra: { connectionLimit: 20, waitForConnections: true, queueLimit: 0 }
  ```

---

### Day 24 — Sunday, May 24
**🤖 AI Sermon Summaries**

- [ ] Install OpenAI SDK:
  ```bash
  npm install openai
  ```
- [ ] Create `summaries.service.ts`:
  ```typescript
  async generateSummary(transcript: string): Promise<SermonSummary> {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // cheap — ~$0.002 per sermon
      messages: [{
        role: 'user',
        content: `Summarise this sermon transcript in exactly 3 sentences.
          Then extract: main_theme (string), key_scripture (string), actionable_point (string).
          Respond in JSON only. Transcript: ${transcript.slice(0, 8000)}`
      }]
    });
    return JSON.parse(response.choices[0].message.content);
  }
  ```
- [ ] Create `summaries` table — linked to both `videos` and `hosted_videos`
- [ ] Admin trigger: `POST /admin/summaries/generate?limit=50` — bulk process
- [ ] Mobile: show summary card below VideoPlayer — "Sermon Overview"

---

### Day 25 — Monday, May 25
**📱 iOS — Final Fixes**

- [ ] Review all remaining TestFlight feedback from April
- [ ] Fix iOS-specific issues:
  - Video player controls not appearing on iOS 17
  - Safe area issues on iPhone with notch
  - Keyboard covering prayer request input on iOS
  - Pull-to-refresh bounce animation (iOS is different to Android)
- [ ] Test on iPhone 12 or iPhone 13 (most common TestFlight devices)

---

### Day 26 — Tuesday, May 26
**🍎 iOS App Store Submission**

- [ ] Prepare App Store assets:
  - Screenshots: 6.7" (iPhone 15 Plus), 6.1" (iPhone 15), iPad 12.9"
  - App preview video (30 seconds — show the app in action)
  - App description + keywords (different to Android description)
- [ ] Submit to App Store Review:
  ```bash
  npx eas submit --platform ios --profile production
  ```
- [ ] App Store review: 2–4 days typically
- [ ] Prepare press message for when iOS launches

---

### Day 27 — Wednesday, May 27
**🔐 Security Audit**

- [ ] Run `npm audit` on backend — fix all high/critical vulnerabilities
- [ ] Review all API endpoints — are any admin endpoints accidentally public?
- [ ] Check: are passwords hashed? (bcrypt) — verify in DB
- [ ] Check: are JWTs signed with a strong secret (32+ chars)?
- [ ] Check: is `EXPO_PUBLIC_API_URL` pointing to HTTPS (not HTTP)?
- [ ] Check: does the backend reject CORS from unknown origins?
- [ ] Add `X-Content-Type-Options: nosniff` header

---

### Day 28 — Thursday, May 28
**📝 Documentation**

- [ ] Write `ARCHITECTURE.md`:
  - System diagram (ASCII is fine)
  - Module list and what each does
  - Database schema overview
  - Deployment steps
- [ ] Write `CONTENT_WORKFLOW.md`:
  - How to receive videos from ministry team
  - How to upload + categorise in admin panel
  - How to feature a sermon on HomeScreen
- [ ] Update `README.md` — make sure environment variables table is complete

---

### Day 29 — Friday, May 29
**🧪 Full May QA Pass**

- [ ] Android: test every screen top-to-bottom
- [ ] iOS (simulator): test every screen top-to-bottom
- [ ] Test: full content workflow (upload → process → publish → view in app)
- [ ] Test: offline mode (download sermon → airplane mode → play)
- [ ] Test: search by transcript phrase → correct video appears
- [ ] Fix any critical issues found

---

### Day 30–31 — Sat–Sun, May 30–31
**📋 May Retrospective & June Planning**

- [ ] Count metrics: users, videos hosted, prayer requests, downloads
- [ ] Review: YouTube API vs hosted video — what % of content is now self-hosted?
- [ ] Review: iOS App Store status — approved or still in review?
- [ ] Write May summary note
- [ ] Plan June priorities (top 3 focus areas)
- [ ] Git tag: `git tag v1.2.0`
- [ ] Git commit: `chore: May retrospective, docs updated`

---

---

# 📅 JUNE 2026 — Growth & Community

> **Theme:** The platform should feel alive. New content. Real people. Spiritual depth.
> **Mindset:** You've built the foundation. Now fill it with life.

---

## June — Week 1 (Jun 1–7): Community Features

---

### Day 1 — Monday, June 1
**✍️ Testimony Submission — Backend**

- [ ] Create `testimonies` NestJS module:
  ```bash
  nest generate module testimonies
  ```
- [ ] Create `TestimonyEntity`:
  ```typescript
  @Entity('testimonies')
  export class Testimony {
    @PrimaryGeneratedColumn()   id: number;
    @Column()                   name: string;
    @Column({ nullable: true }) location: string;
    @Column('text')             story: string;
    @Column()                   category: string; // healing, provision, miracle, etc.
    @Column({ nullable: true }) userId: number;
    @Column({ default: 'pending' }) status: 'pending' | 'approved' | 'rejected';
    @Column({ nullable: true }) approvedBy: number; // admin user id
    @CreateDateColumn()         createdAt: Date;
  }
  ```
- [ ] Endpoints:
  - `POST /testimonies` — submit (public, no auth required)
  - `GET /testimonies` — list approved (public, paginated)
  - `GET /testimonies?category=healing` — filter by category
  - `PATCH /admin/testimonies/:id/approve` — admin approval
  - `PATCH /admin/testimonies/:id/reject` — admin rejection

---

### Day 2 — Tuesday, June 2
**📱 Testimony Submission — Mobile UI**

- [ ] Create `TestimonySubmitScreen.tsx`:
  - Name field
  - Location field (city, country)
  - Category dropdown: Healing / Provision / Miracle / Breakthrough / Salvation / Other
  - Story textarea (min 50 chars, max 1000 chars)
  - Character counter
  - "Share My Testimony" submit button
  - Success screen: "Thank you! Your testimony will be reviewed and published."
- [ ] Add "Share Testimony" button on TestimonialsScreen
- [ ] Admin panel: Testimonies tab — approve/reject queue

---

### Day 3 — Wednesday, June 3
**🖥️ Admin — Testimony Moderation Queue**

- [ ] Admin panel testimony moderation page:
  - List all pending testimonies (newest first)
  - Each row: name, location, category, preview (first 100 chars), submitted date
  - Click row → expand full testimony
  - "Approve" (green) + "Reject" (red) buttons
  - Rejected testimonies archived (not deleted) for audit
- [ ] After approval: testimony appears in `GET /testimonies` public feed
- [ ] Notify yourself (email) when a new testimony is submitted
- [ ] Seed 5 initial approved testimonies so the screen isn't empty

---

### Day 4 — Thursday, June 4
**📝 Sermon Notes — Backend**

- [ ] Create `sermon_notes` table:
  ```typescript
  @Entity('sermon_notes')
  export class SermonNote {
    @PrimaryGeneratedColumn()   id: number;
    @Column()                   userId: number;
    @Column({ nullable: true }) videoId: number;
    @Column({ nullable: true }) hostedVideoId: number;
    @Column({ nullable: true }) timestampSeconds: number; // note taken at this point
    @Column('text')             content: string;
    @CreateDateColumn()         createdAt: Date;
    @UpdateDateColumn()         updatedAt: Date;
  }
  ```
- [ ] Endpoints:
  - `POST /notes` — create note
  - `GET /notes?videoId=:id` — notes for a specific video
  - `GET /users/me/notes` — all user notes across all sermons
  - `PATCH /notes/:id` — edit note
  - `DELETE /notes/:id` — delete note

---

### Day 5 — Friday, June 5
**📝 Sermon Notes — Mobile UI**

- [ ] Add Notes panel to VideoPlayerScreen:
  - Swipe up from bottom → notes panel slides up (50% screen height)
  - Video continues playing behind the panel
  - Text input at bottom: "Add a note…"
  - When submitted: saves note with current video timestamp
  - List of notes above input — tapping a note seeks video to that timestamp
- [ ] Create `MyNotesScreen.tsx` — all notes across all sermons
  - Group by video
  - Each note shows: video thumbnail, note content, timestamp
  - Tap → opens VideoPlayer at that timestamp

---

### Day 6 — Saturday, June 6
**📚 Series — Mobile UI**

- [ ] Create `SeriesScreen.tsx`:
  - Grid of series cards (2 columns)
  - Each card: thumbnail, series name, video count, year
- [ ] Create `SeriesDetailScreen.tsx`:
  - Series banner at top (blurred thumbnail background)
  - Series name, description, video count
  - Video list (FlatList, ordered by episode number)
  - "Play All from Beginning" button
- [ ] Add Series to HomeScreen below Trending (horizontal scroll)
- [ ] Add Series to bottom navigation or as a tab in Sermons screen

---

### Day 7 — Sunday, June 7
**🧪 Week 1 Review**

- [ ] Test: submit testimony → admin approves → appears in TestimonialsScreen
- [ ] Test: take a note at 5:00 in a video → go to MyNotesScreen → see note → tap → seeks to 5:00
- [ ] Test: browse series → play series → next episode autoplays
- [ ] Fix any issues
- [ ] Git commit: `feat: testimony submission, sermon notes, series UI`

---

## June — Week 2 (Jun 8–14): Language & Sharing

---

### Day 8 — Monday, June 8
**🌍 i18n Setup**

- [ ] Install internationalisation packages:
  ```bash
  npx expo install expo-localization
  npm install i18next react-i18next
  ```
- [ ] Create `mobile/src/i18n/en.json` — English strings (extract all hardcoded UI text)
  - Start with the 30 most visible strings: button labels, screen titles, empty states
  - Example:
    ```json
    {
      "home.greeting": "Grow in Faith Daily",
      "home.featured": "Featured Sermon",
      "home.latest": "Latest Messages",
      "home.trending": "Trending This Week",
      "button.watchNow": "Watch Now",
      "button.seeAll": "See All",
      "button.sendPrayer": "Send Prayer Request"
    }
    ```
- [ ] Replace all hardcoded strings in HomeScreen with `t('home.greeting')` etc.

---

### Day 9 — Tuesday, June 9
**🌍 Hausa Translation**

- [ ] Create `mobile/src/i18n/ha.json` — Hausa translations
  - Use AI (GPT-4o) to translate all 30+ UI strings to Hausa
  - Prompt: "Translate these UI strings to Hausa, keeping them short and natural for a mobile app"
  - Review with a native Hausa speaker if possible (ask in Koinonia WhatsApp groups)
  - Key phrases:
    ```json
    {
      "home.greeting": "Yi girma cikin bangaskiya kowace rana",
      "button.watchNow": "Kalli Yanzu",
      "button.seeAll": "Duba Duka"
    }
    ```
- [ ] Test: switch phone language to Hausa → app UI switches to Hausa

---

### Day 10 — Wednesday, June 10
**🌍 Yoruba Translation**

- [ ] Create `mobile/src/i18n/yo.json` — Yoruba translations
  - Same approach as Hausa (AI translation + community review)
  - Key Yoruba phrases:
    ```json
    {
      "home.greeting": "Dagba ninu igbagbo lojoojumo",
      "button.watchNow": "Wo Bayi",
      "button.seeAll": "Wo Gbogbo"
    }
    ```
- [ ] Add language selector in ProfileScreen → Settings section
  - Three options: English / Hausa / Yoruba
  - Persists choice in AsyncStorage
- [ ] Test: switch to Yoruba → all UI text changes → switch back to English → works

---

### Day 11 — Thursday, June 11
**🔗 Deep Links & Sharing**

- [ ] Configure Expo deep linking:
  ```json
  // app.json
  {
    "expo": {
      "scheme": "koinoniatv",
      "android": {
        "intentFilters": [{
          "action": "VIEW",
          "data": [{ "scheme": "https", "host": "koinoniatv.app" }]
        }]
      }
    }
  }
  ```
- [ ] Link format: `koinoniatv://video/123` or `https://koinoniatv.app/video/123`
- [ ] Handle deep link in `AppNavigator.tsx`:
  ```typescript
  const linking = {
    prefixes: ['koinoniatv://', 'https://koinoniatv.app'],
    config: { screens: { VideoPlayer: 'video/:videoId' } }
  };
  ```
- [ ] Test: tap a link from WhatsApp → app opens at correct video

---

### Day 12 — Friday, June 12
**📤 WhatsApp Share Integration**

- [ ] Add Share button to VideoPlayerScreen:
  ```typescript
  const shareSermon = async (video: Video) => {
    await Share.share({
      message: `🎙️ Watch "${video.title}" by Apostle Joshua Selman\n\nDownload Koinonia TV: https://koinoniatv.app\n\nOr watch directly: koinoniatv://video/${video.id}`,
      title: video.title,
    });
  };
  ```
- [ ] Pre-fill message with sermon title + deep link + app download link
- [ ] Track share events in analytics: `video_shared` with videoId + method
- [ ] Add Share option to sermon card long-press (Android) or context menu

---

### Day 13 — Saturday, June 13
**🔴 Live Stream Improvements**

- [ ] Improve live detection cron:
  - Check YouTube every 5 minutes for live streams (already exists — improve reliability)
  - Cache live status with 2-minute TTL in Redis
  - `GET /live/status` — returns `{ isLive, streamId, title, viewerCount }`
- [ ] Mobile LiveScreen improvements:
  - Show "🔴 LIVE NOW" animated badge in tab bar when live
  - Show estimated viewer count from YouTube API
  - Show countdown timer to next scheduled service when not live
  - "Notify Me" button — schedules notification 15 mins before service
- [ ] Push notification: "🔴 Koinonia is LIVE — Miracle Service starts now!" → tap opens LiveScreen

---

### Day 14 — Sunday, June 14
**🧪 Week 2 Review**

- [ ] Test language switching: English → Hausa → Yoruba → English — all work
- [ ] Test deep link from WhatsApp: sends correctly, opens app to correct video
- [ ] Test live notification: manually trigger → notification arrives → opens LiveScreen
- [ ] Fix any translation issues or layout breaks with longer translated strings
- [ ] Git commit: `feat: Hausa/Yoruba i18n, deep links, WhatsApp sharing, live improvements`

---

## June — Week 3 (Jun 15–21): Giving & Sustainability

---

### Day 15 — Monday, June 15
**💛 Giving — Architecture Decision**

- [ ] Research payment providers for your target market:
  - **Paystack** — best for Nigeria/Africa, easy integration, no monthly fee
    - Supports: card, bank transfer, USSD, mobile money
    - Fee: 1.5% per transaction (capped at ₦2,000)
  - **Stripe** — for international users (diaspora Koinonia fans)
    - Fee: 2.9% + 30¢ per transaction
  - Decision: Start with Paystack only — your core users are Nigerian
- [ ] Create Paystack account at paystack.com
  - Business type: Non-profit / Religious Organisation
  - Complete KYC verification (takes 1–3 business days)
- [ ] Add Paystack keys to backend `.env`

---

### Day 16 — Tuesday, June 16
**💛 Giving — Backend**

- [ ] Create `donations` NestJS module
- [ ] Create `DonationEntity`:
  ```typescript
  @Entity('donations')
  export class Donation {
    @PrimaryGeneratedColumn()   id: number;
    @Column({ nullable: true }) userId: number;
    @Column()                   amount: number; // in kobo (₦100 = 10000 kobo)
    @Column()                   currency: string; // NGN, USD
    @Column()                   method: string; // card, transfer, ussd
    @Column()                   paystackReference: string;
    @Column()                   status: 'pending' | 'success' | 'failed';
    @Column({ nullable: true }) dedicatedTo: string; // "In memory of..." optional
    @CreateDateColumn()         createdAt: Date;
  }
  ```
- [ ] Endpoints:
  - `POST /donations/initiate` — create Paystack transaction, return payment URL
  - `POST /webhooks/paystack` — receive Paystack payment confirmation
  - `GET /admin/donations` — list all donations (admin only)
- [ ] Webhook: on successful payment → update `status = 'success'`, send thank you email

---

### Day 17 — Wednesday, June 17
**💛 Giving — Mobile UI**

- [ ] Create `GivingScreen.tsx`:
  - Header: "Support the Ministry" with a scripture (2 Cor 9:7)
  - Giving purpose: clear framing — "All gifts go directly to Koinonia Global"
  - Amount presets: ₦1,000 / ₦2,000 / ₦5,000 / ₦10,000 / Custom
  - "Custom amount" text input (numeric keyboard)
  - Optional: "Dedicated to" field for special giving
  - "Give Now" button → opens Paystack payment sheet
- [ ] Add Giving tab to bottom navigation
- [ ] After successful payment: show "Thank you" screen with animated cross/dove

---

### Day 18 — Thursday, June 18
**💛 Giving — Recurring Giving**

- [ ] Add recurring giving option to GivingScreen:
  - Toggle: "One-time" / "Monthly"
  - Monthly giving uses Paystack subscriptions API
  - Create `subscription_plans` in Paystack dashboard:
    - "Monthly Seed" — ₦1,000/month
    - "Monthly Supporter" — ₦5,000/month
    - "Monthly Partner" — ₦10,000/month
- [ ] Backend: `POST /donations/subscribe` — create Paystack subscription
- [ ] Track active subscriptions in `donation_subscriptions` table
- [ ] Admin panel: view total recurring giving per month

---

### Day 19 — Friday, June 19
**📊 Admin Analytics Dashboard — Full Build**

- [ ] Complete analytics dashboard in admin panel:
  - **Overview cards** (today / 7 days / 30 days):
    - New users, Total users
    - Videos watched, Minutes watched
    - Prayer requests submitted
    - Testimonies submitted + approved
    - Total giving (Paystack)
  - **Line chart**: User growth last 30 days
  - **Bar chart**: Top 10 sermons by watch count this week
  - **Pie chart**: Category breakdown (which categories get most views)
  - **Table**: Recent prayer requests (unread first)
  - **Table**: Donations this week
- [ ] Auto-refresh every 5 minutes

---

### Day 20 — Saturday, June 20
**📧 Email Notifications — Admin Weekly Report**

- [ ] Create weekly summary email sent to yourself every Monday 8:00 AM:
  ```
  Subject: Koinonia TV — Weekly Report (Week of June 16)

  Users: 847 total (+52 this week)
  Videos watched: 3,241 this week
  Prayer requests: 67 this week
  Testimonies approved: 12 this week
  Giving received: ₦145,000 this week

  Top sermon: "The Mystery of Faith" — 312 plays
  Top search: "prayer" — 89 searches

  — Koinonia TV Auto-Report
  ```
- [ ] NestJS cron: `@Cron('0 8 * * 1')` (every Monday at 8am)
- [ ] Use `@nestjs-modules/mailer` with a Gmail SMTP sender

---

### Day 21 — Sunday, June 21
**🧪 Week 3 Review**

- [ ] Test giving flow: initiate payment → complete on Paystack → webhook fires → donation saved → thank you screen shows
- [ ] Test recurring: subscribe to monthly plan → appears in Paystack dashboard
- [ ] Test analytics dashboard: all numbers correct, auto-refresh works
- [ ] Test weekly email: trigger manually → email received correctly
- [ ] Fix any issues
- [ ] Git commit: `feat: Paystack giving, recurring donations, full analytics dashboard`

---

## June — Week 4 (Jun 22–30): Polish & Q2 Review

---

### Day 22 — Monday, June 22
**⚡ App Performance Audit**

- [ ] Profile HomeScreen render time:
  - Open React Native DevTools
  - Record a HomeScreen load
  - Target: fully rendered in under 2 seconds on mid-range Android (Tecno/Infinix)
- [ ] Identify and fix slow components (re-rendering unnecessarily)
  - Wrap heavy components in `React.memo()`
  - Use `useCallback` for functions passed as props
- [ ] Check: does scrolling SermonsScreen stay at 60fps? (Use FlashList if not yet migrated)
- [ ] Check: does the app use too much memory? (Profile with Android Studio)
  - Target: under 200MB RAM usage during normal browsing

---

### Day 23 — Tuesday, June 23
**🎨 UI Polish Pass**

- [ ] Review all 14 screens for visual consistency:
  - Do all empty states have the same style?
  - Are all error messages using the same colour/tone?
  - Are all loading states using skeleton screens (not just spinners)?
- [ ] Add skeleton loading to HomeScreen sections that load async
  - Skeleton: grey rectangles that pulse (use `expo-linear-gradient` for shimmer)
- [ ] Review typography: are all font sizes consistent across screens?
- [ ] Review spacing: is padding consistent? (should use DS spacing values everywhere)
- [ ] Fix any misaligned elements on small screens (360px wide — Tecno Pop/Infinix Hot)

---

### Day 24 — Wednesday, June 24
**♿ Accessibility**

- [ ] Add `accessibilityLabel` to all touchable elements:
  ```typescript
  <TouchableOpacity accessibilityLabel={`Play sermon: ${video.title}`} accessibilityRole="button">
  ```
- [ ] Ensure minimum touch target size: 44×44px (Apple HIG / Google MD standard)
  - Check all icon buttons — are they at least 44px?
- [ ] Test with Android TalkBack screen reader enabled — can a blind user navigate?
- [ ] Ensure sufficient colour contrast:
  - Text on dark background: contrast ratio > 4.5:1
  - Gold (`#F4C430`) on dark purple (`#0D0A1A`) — calculate ratio
- [ ] Add `accessibilityHint` to VideoPlayer play button

---

### Day 25 — Thursday, June 25
**🔍 App Store Optimisation (ASO)**

- [ ] Review Google Play listing analytics:
  - Impression → install conversion rate
  - Which screenshots get the most attention?
  - What keywords are driving organic installs?
- [ ] Update Play Store description with top performing keywords
- [ ] Create a second set of screenshots with Hausa text overlays
  - "Kalli wa'azozin Koinonia" — for Hausa-speaking market
- [ ] Add Hausa as an additional language in Play Store listing
- [ ] Review iOS App Store Connect analytics (if iOS is live)

---

### Day 26 — Friday, June 26
**🗄️ Database Backup & Disaster Recovery**

- [ ] Set up automated daily MySQL backup:
  ```bash
  # Add to crontab on server
  0 2 * * * mysqldump -u root -p$DB_PASS koinonia_tv | gzip > /backups/db_$(date +%Y%m%d).sql.gz
  ```
- [ ] Upload backup to Cloudflare R2 (or S3):
  ```bash
  aws s3 cp /backups/db_$(date +%Y%m%d).sql.gz s3://koinonia-tv-backups/
  ```
- [ ] Keep last 30 days of backups (auto-delete older)
- [ ] Test restore: download a backup → restore to test DB → verify data
- [ ] Document restore process in `DEPLOYMENT.md`
- [ ] Set up server disk monitoring — alert if disk usage > 80%

---

### Day 27 — Saturday, June 27
**📋 Documentation Final Pass**

- [ ] `README.md` — complete, accurate, up to date
- [ ] `ARCHITECTURE.md` — system diagram, all modules documented
- [ ] `CONTENT_WORKFLOW.md` — content manager can follow this without asking you
- [ ] `DEPLOYMENT.md` — step-by-step deployment instructions
- [ ] `API.md` — list all public endpoints with example requests/responses
- [ ] Comment all complex functions in backend code
  - Especially: transcript fetcher, moments detection, youtube sync service

---

### Day 28 — Sunday, June 28
**🎯 Q2 Metrics Review**

- [ ] Pull final June numbers:
  - Total registered users
  - Total videos (YouTube + hosted)
  - Prayer requests received (April + May + June)
  - Testimonies approved
  - Downloads from Play Store + App Store
  - Total giving received via Paystack
  - Most played sermon of Q2
  - Most searched term of Q2
- [ ] Write honest Q2 retrospective:
  - What shipped? (vs what was planned)
  - What were the biggest technical challenges?
  - What did users respond to most positively?
  - What should have been done differently?

---

### Day 29 — Monday, June 29
**🚀 Q3 Planning**

- [ ] Draft July–September focus areas based on what you learned in Q2
- [ ] Decide: is it time to bring on a content manager volunteer?
  - Criteria: are you spending more than 5 hours/week on content intake?
- [ ] Decide: should you pursue Koinonia TV Plus (premium tier) in Q3?
  - Check: do you have 1,000+ active users? That's the minimum for monetisation to matter
- [ ] Prioritise feature backlog — rank by user impact and effort
- [ ] Plan one "wow" feature for Q3 that will delight your most engaged users

---

### Day 30 — Tuesday, June 30
**🎉 Q2 Close**

- [ ] Final commit: `chore: Q2 complete — v1.3.0`
- [ ] Git tag: `git tag v1.3.0`
- [ ] GitHub release with full changelog
- [ ] Post on social media: "3 months. Koinonia TV is live and growing."
  - Share the milestone numbers (users, videos, prayers)
  - Thank the community
- [ ] Take one day off tomorrow. You've built something significant. Rest.

---

---

## 🗂️ Feature Backlog (July+)

| Feature | Priority | Effort |
|---------|----------|--------|
| Koinonia TV Plus — subscription tier | 🔴 High | 5 days |
| Watch party (share-to-watch-together) | 🟡 Medium | 5 days |
| AI sermon recommendations | 🟡 Medium | 4 days |
| Multi-language subtitles | 🟡 Medium | 5 days |
| Chromecast / AirPlay support | 🟢 Low | 4 days |
| Admin mobile app | 🟢 Low | 7 days |
| Web version (React) | 🟡 Medium | 10 days |
| Transcript-powered study notes | 🟡 Medium | 3 days |
| Community prayer rooms | 🟢 Low | 6 days |
| Push notification scheduling (admin) | 🟡 Medium | 2 days |

---

## 📊 Milestone Summary

| Date | Milestone |
|------|-----------|
| Mar 31 | v1.0 APK on Google Play internal testing |
| Apr 7 | First 50 real users |
| Apr 14 | iOS on TestFlight |
| Apr 21 | Admin panel v1 live |
| Apr 30 | First 150 users |
| May 14 | First self-hosted sermon live in app |
| May 26 | iOS on App Store |
| May 31 | 300+ users |
| Jun 7 | Testimonies + sermon notes live |
| Jun 14 | Hausa/Yoruba UI + deep links |
| Jun 21 | Giving/Paystack integration live |
| Jun 30 | 500+ users · v1.3.0 shipped |

---

## 💰 Estimated Monthly Costs

| Service | Cost | Notes |
|---------|------|-------|
| VPS / Server | ~$15/mo | Hetzner CX21 or DigitalOcean |
| Bunny Stream | ~$5–20/mo | Storage + bandwidth |
| Cloudflare R2 | ~$0–5/mo | Thumbnails + assets |
| Firebase (FCM) | Free | Up to 1M notifications/month |
| OpenAI (summaries) | ~$3/mo | GPT-4o mini, 1500 summaries |
| PostHog | Free | Up to 1M events/month |
| Paystack | 0 monthly | 1.5% per transaction only |
| Apple Developer | $8/mo | ($99/year billed annually) |
| **Total** | **~$35–55/month** | Lean and sustainable |

---

## 🛠️ Reference — Key Commands

```bash
# ── Backend ─────────────────────────────────────────────────────────────
cd backend

# Start dev server
npm run start:dev

# Run seeds (in order)
npx ts-node src/database/seeds/seed-categories.ts
npx ts-node src/database/seeds/seed-video-categories.ts
npx ts-node src/database/seeds/seed-moments.ts
npx ts-node src/database/seeds/seed-scriptures.ts

# Trigger YouTube sync manually
curl -X POST http://localhost:3000/api/v1/admin/sync/trigger

# Bulk categorize videos
curl -X POST "http://localhost:3000/api/v1/admin/categorize?force=true"

# Detect moments
curl -X POST "http://localhost:3000/api/v1/admin/moments/process?limit=50"

# Generate AI summaries
curl -X POST "http://localhost:3000/api/v1/admin/summaries/generate?limit=50"

# ── Mobile ──────────────────────────────────────────────────────────────
cd mobile

# Start Expo dev server
npx expo start

# Android
npx expo run:android

# iOS simulator
npx eas build --platform ios --profile preview

# Production Android build
npx eas build --platform android --profile production

# Production iOS build
npx eas build --platform ios --profile production

# Submit to stores
npx eas submit --platform android
npx eas submit --platform ios

# Clear Metro cache
npx expo start --clear
```

---

## 📁 Key File Map

```
backend/src/
├── modules/
│   ├── videos/                     ← YouTube videos + unified API
│   ├── hosted-videos/              ← Self-hosted video module (May+)
│   ├── moments/                    ← Declaration/prayer/testimony detection
│   ├── prayer-requests/            ← Prayer request form backend
│   ├── testimonies/                ← Testimony submission + moderation (June+)
│   ├── sermon-notes/               ← Personal notes feature (June+)
│   ├── series/                     ← Sermon series grouping (May+)
│   ├── playlists/                  ← User playlists (May+)
│   ├── donations/                  ← Paystack giving (June+)
│   ├── notifications/              ← Firebase FCM
│   ├── summaries/                  ← AI sermon summaries (May+)
│   ├── youtube-sync/               ← YouTube sync cron jobs
│   └── auth/                       ← JWT auth
├── database/seeds/
│   ├── seed-categories.ts
│   ├── seed-video-categories.ts
│   ├── seed-moments.ts
│   └── seed-scriptures.ts          ← 90-day scripture plan (April+)

admin-panel/src/
├── pages/
│   ├── Dashboard.tsx               ← Overview stats
│   ├── Videos.tsx                  ← Video management
│   ├── HostedVideos.tsx            ← Upload + manage hosted videos
│   ├── PrayerRequests.tsx          ← Prayer inbox
│   ├── Testimonies.tsx             ← Moderation queue
│   ├── Donations.tsx               ← Giving history
│   └── Analytics.tsx               ← Charts + metrics

mobile/src/
├── navigation/AppNavigator.tsx
├── api/index.ts
├── constants/theme.ts
├── i18n/
│   ├── en.json                     ← English strings
│   ├── ha.json                     ← Hausa strings (June+)
│   └── yo.json                     ← Yoruba strings (June+)
└── screens/
    ├── Home/HomeScreen.tsx
    ├── Sermons/SermonsScreen.tsx
    ├── Series/SeriesScreen.tsx     ← (May+)
    ├── Series/SeriesDetailScreen.tsx
    ├── Playlists/PlaylistsScreen.tsx ← (May+)
    ├── Auth/LoginScreen.tsx
    ├── Auth/RegisterScreen.tsx
    ├── Profile/ProfileScreen.tsx
    ├── Profile/BookmarksScreen.tsx
    ├── Profile/HistoryScreen.tsx
    ├── Profile/MyNotesScreen.tsx   ← (June+)
    ├── Testimony/TestimonySubmitScreen.tsx ← (June+)
    ├── Giving/GivingScreen.tsx     ← (June+)
    ├── MomentPlayer/MomentPlayerScreen.tsx
    └── PrayerRequest/PrayerRequestScreen.tsx
```

---

## 🧠 Principles to Stay On

1. **Ship weekly** — something in users' hands every week, even small
2. **YouTube first, hosted second** — parallel run, don't migrate everything at once
3. **Content before features** — a great sermon library beats a feature no one uses
4. **Africa-first performance** — every feature: "Does this work on 3G in Lagos?"
5. **Ministry partnership is your moat** — official access is what competitors can't copy
6. **Stay solo until it hurts** — bring collaborators only when the bottleneck is truly people

---
Add something like community,something like whatsapp channel,a chating icon where people can just chats and share exprince ,also suggestion box,where people can suggest something
*Last updated: March 17, 2026*
*Built with purpose. Powered by faith. Koinonia TV.*

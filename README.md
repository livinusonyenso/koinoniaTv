# ✝ Koinonia TV

> A Netflix-style spiritual streaming platform for Apostle Joshua Selman's sermons from Koinonia Global.

---

## 📁 Project Structure

```
koinonia-tv/
├── backend/       NestJS REST API (MySQL + TypeORM + YouTube Sync)
└── mobile/        React Native Expo App (iOS + Android)
```

---

## 🚀 Quick Start

### 1. Prerequisites

| Tool | Version |
|------|---------|
| Node.js | 18+ |
| npm | 9+ |
| MySQL | 8.0 |
| Docker (optional) | any |
| Expo CLI | latest |

---

### 2. Backend Setup

```bash
cd backend

# Copy and fill in environment variables
cp .env.example .env
# Edit .env with your MySQL credentials, YouTube API key, JWT secrets

# (Option A) Start MySQL + Redis with Docker
docker-compose up -d

# (Option B) Use existing MySQL — create the database
mysql -u root -p -e "CREATE DATABASE koinonia_tv;"

# Install dependencies
npm install

# Start in development (auto-creates tables via TypeORM synchronize)
npm run start:dev
```

**The API will be running at:** `http://localhost:3000/api/v1`

#### Seed default categories
```bash
npx ts-node src/database/seeds/seed-categories.ts
```

#### Trigger initial YouTube sync (after seeding)
```bash
curl -X POST http://localhost:3000/api/v1/admin/sync/trigger \
  -H "Authorization: Bearer YOUR_JWT" \
  -H "Content-Type: application/json" \
  -d '{"type":"full"}'
```

---

### 3. Mobile App Setup

```bash
cd mobile

# Install dependencies
npm install

# Set your API URL
echo "EXPO_PUBLIC_API_URL=http://YOUR_LOCAL_IP:3000/api/v1" > .env

# Start Expo development server
npx expo start

# Run on device
npx expo start --android   # Android emulator
npx expo start --ios        # iOS simulator (Mac only)
```

> **Note:** Use your machine's local IP (e.g. `192.168.1.x`) instead of `localhost`
> when running on a physical device.

---

## 🔑 Environment Variables (Backend)

| Variable | Description |
|----------|-------------|
| `YOUTUBE_API_KEY` | YouTube Data API v3 key from Google Cloud Console |
| `YOUTUBE_CHANNEL_ID` | Koinonia Global YouTube channel ID |
| `DB_HOST/PORT/NAME/USER/PASSWORD` | MySQL connection details |
| `JWT_SECRET` | 64-char random string for signing access tokens |
| `JWT_REFRESH_SECRET` | Separate secret for refresh tokens |
| `FIREBASE_PROJECT_ID/PRIVATE_KEY/CLIENT_EMAIL` | Firebase FCM push notifications |

---

## 📺 Core Features Built

| Feature | Status |
|---------|--------|
| YouTube API sync (incremental + full + live check) | ✅ |
| Smart categorization (keyword matching + rules) | ✅ |
| Video browsing with filters (category, year, sort) | ✅ |
| Short clips vertical feed | ✅ |
| Live streaming with countdown | ✅ |
| Events & programs calendar | ✅ |
| Full-text sermon search | ✅ |
| User auth (JWT + refresh tokens) | ✅ |
| Bookmarks & watch history | ✅ |
| Mobile: Home with hero banner + rows | ✅ |
| Mobile: Sermons grid with filters | ✅ |
| Mobile: Video player with resume | ✅ |
| Mobile: Clips TikTok-style feed | ✅ |
| Mobile: Live screen (3 states) | ✅ |
| Mobile: Events with countdown | ✅ |
| Mobile: Search screen | ✅ |
| Push notifications (FCM) | ⚙️ Configure Firebase |
| AI categorization (OpenAI) | 🗺️ Phase 2 |

---

## 🗄️ Database Tables

`videos` · `categories` · `video_categories` · `clips` · `events`
`users` · `watch_history` · `bookmarks` · `sync_logs`

Tables are **auto-created** in development via TypeORM `synchronize: true`.
In production, use TypeORM migrations.

---

## 📡 API Reference

Base URL: `/api/v1`

| Group | Endpoints |
|-------|-----------|
| Auth | POST /auth/register, /login, /refresh · GET /auth/me |
| Videos | GET /videos, /videos/featured, /videos/latest, /videos/trending, /videos/:id |
| Categories | GET /categories, /categories/:slug/videos |
| Clips | GET /clips, /clips/featured · POST /clips/:id/share |
| Live | GET /live/status, /live/stream, /live/upcoming |
| Events | GET /events, /events/upcoming, /events/:id/countdown |
| Search | GET /search?q=, /search/suggestions?q= |
| Users | GET /users/bookmarks, /users/history |
| Admin | POST /admin/sync/trigger · GET /admin/sync/logs |

---

## 🔄 YouTube Sync Schedule

| Job | Schedule |
|-----|----------|
| Incremental sync | Every 30 minutes |
| Full archive sync | Weekly (Sunday 2am) |
| Live status check | Every 5 minutes |
| Upcoming streams | Every 1 hour |
| Stats refresh | Daily 3am |

---

## 🚢 Production Deployment

```bash
# Backend
npm run build
node dist/main.js

# Set NODE_ENV=production (disables TypeORM auto-synchronize)
# Use TypeORM migrations for schema changes in production
```

**Recommended stack:**
- API: AWS EC2 t3.medium or Railway.app
- DB: AWS RDS MySQL 8
- Redis: Upstash (free tier) or ElastiCache
- Mobile: Expo EAS Build → App Store + Google Play

---

## 🤖 AI Roadmap (Phase 2)

- Sermon auto-tagging via GPT-4o
- 3-sentence sermon summaries
- Key takeaways extraction
- Transcript search (YouTube captions)
- Personalized recommendations
- Smart clip detection from transcripts

---

*"Intimacy · Partnership · Fellowship" — Koinonia Global*

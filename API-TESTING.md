# Koinonia TV — API Testing Reference

**Base URL:** `http://localhost:3000/api/v1`

**Auth Header (where required):**
```
Authorization: Bearer <accessToken>
```

**Content-Type for all POST/PATCH requests:**
```
Content-Type: application/json
```

---

## Quick Setup — Get a Token

Run **Register** or **Login** first, copy the `accessToken` from the response,
and paste it into the Authorization header for all protected endpoints.

---

## 1. AUTH

### POST /auth/register
Create a new account.

```json
{
  "email": "test@koinonia.tv",
  "password": "password123",
  "fullName": "John Doe"
}
```

**Response:**
```json
{
  "accessToken": "eyJ...",
  "refreshToken": "eyJ...",
  "user": { "id": 1, "email": "test@koinonia.tv", "fullName": "John Doe" }
}
```

---

### POST /auth/login
Login with email + password.

```json
{
  "email": "test@koinonia.tv",
  "password": "password123"
}
```

**Response:** same shape as register.

---

### POST /auth/google
Login or register with a Google ID token.

```json
{
  "token": "<google_id_token>",
  "tokenType": "id_token"
}
```
`tokenType` options: `"id_token"` (default) | `"access_token"`

---

### POST /auth/refresh
Get a new accessToken using a refreshToken.

```json
{
  "refreshToken": "eyJ..."
}
```

---

### GET /auth/me
`JWT required`

No body. Returns the logged-in user's profile.

---

## 2. VIDEOS

### GET /videos
List all videos. All query params are optional.

| Param | Type | Default | Notes |
|-------|------|---------|-------|
| `page` | number | 1 | |
| `limit` | number | 20 | |
| `category` | string | — | category slug e.g. `faith` |
| `year` | number | — | e.g. `2024` |
| `sort` | string | `latest` | `latest` \| `trending` \| `az` |

Example: `GET /videos?page=1&limit=10&sort=trending`

---

### GET /videos/featured
No params. Returns the featured/pinned video.

---

### GET /videos/latest
| Param | Type | Default |
|-------|------|---------|
| `limit` | number | 10 |

Example: `GET /videos/latest?limit=5`

---

### GET /videos/trending
| Param | Type | Default |
|-------|------|---------|
| `limit` | number | 10 |

---

### GET /videos/:id
Get a single video by ID.

Example: `GET /videos/42`

---

### GET /videos/:id/related
Get related videos for a given video ID.

Example: `GET /videos/42/related`

---

### GET /videos/:id/bookmark
`JWT required`

Check if the current user has bookmarked this video.

**Response:**
```json
{ "bookmarked": true }
```

---

### POST /videos/:id/bookmark
`JWT required`

No body. Adds the video to the user's bookmarks.

**Response:** the created bookmark record.

---

### DELETE /videos/:id/bookmark
`JWT required`

No body. Removes the video from bookmarks.

---

### POST /videos/:id/progress
`JWT required`

Save watch progress. Also creates the watch history record on first call.

```json
{
  "progressSeconds": 1245,
  "totalSeconds": 3600
}
```
`totalSeconds` is optional but recommended — used to determine if the video is "completed" (≥90% watched).

---

### GET /videos/:id/progress
`JWT required`

Get the current user's saved progress for a video.

**Response:**
```json
{ "progressSeconds": 1245, "completed": false }
```

---

## 3. CATEGORIES

### GET /categories
List all categories.

---

### GET /categories/:slug
Get a single category by slug.

Example: `GET /categories/faith`

---

### GET /categories/:slug/videos
Get videos in a category.

| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |

Example: `GET /categories/healing/videos?page=1&limit=10`

---

### POST /categories
`JWT required`

Create a new category.

```json
{
  "name": "Faith",
  "slug": "faith",
  "description": "Messages on faith",
  "icon": "cross"
}
```

---

### POST /videos/:id/categories
`JWT required`

Assign categories to a video.

```json
{
  "categoryIds": [1, 3, 5]
}
```

---

## 4. CLIPS (Daily Word)

### GET /clips
| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |

---

### GET /clips/featured
No params.

---

### GET /clips/:id
Get a single clip.

---

### POST /clips/:id/share
Increment share count for a clip. No body.

---

### POST /clips
`JWT required`

Create a clip.

```json
{
  "title": "Walking in Faith",
  "youtubeId": "dQw4w9WgXcQ",
  "videoId": 42,
  "startSeconds": 300,
  "endSeconds": 420,
  "transcript": "When you walk by faith and not by sight..."
}
```

---

## 5. EVENTS

### GET /events
| Param | Type | Notes |
|-------|------|-------|
| `type` | string | filter by event type e.g. `service`, `conference` |

---

### GET /events/upcoming
No params. Returns future events sorted by date.

---

### GET /events/:id
Get a single event.

---

### GET /events/:id/countdown
Get time remaining until an event.

**Response:**
```json
{ "days": 3, "hours": 14, "minutes": 22, "seconds": 5, "isLive": false }
```

---

### POST /events
`JWT required`

Create an event.

```json
{
  "title": "Miracle Service",
  "description": "Monthly miracle service",
  "type": "service",
  "startDate": "2026-04-06T09:00:00Z",
  "endDate": "2026-04-06T13:00:00Z",
  "location": "Goshen, Ibadan",
  "imageUrl": "https://example.com/banner.jpg"
}
```

---

### POST /events/:id
`JWT required`

Update an event (same body shape, all fields optional).

---

### DELETE /events/:id
`JWT required`

No body.

---

## 6. LIVE

### GET /live/status
No auth. Returns current live stream status.

**Response:**
```json
{ "isLive": false, "title": null, "viewerCount": 0 }
```

---

### GET /live/stream
No auth. Returns the active stream details (YouTube ID, etc).

---

### GET /live/upcoming
No auth. Returns the next scheduled live event.

---

## 7. SEARCH

### GET /search
| Param | Type | Default | Required |
|-------|------|---------|----------|
| `q` | string | — | yes |
| `page` | number | 1 | |
| `limit` | number | 20 | |

Example: `GET /search?q=grace&page=1&limit=10`

**Response:**
```json
{ "items": [...], "total": 84, "page": 1, "limit": 10 }
```

---

### GET /search/suggestions
| Param | Type | Notes |
|-------|------|-------|
| `q` | string | min 2 characters |

Example: `GET /search/suggestions?q=mir`

**Response:**
```json
{ "suggestions": ["Miracle Service Jan 2025", "Miracle Testimonies..."] }
```

---

## 8. USERS (Profile & Library)

### GET /users/bookmarks
`JWT required`

| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "videoId": 42,
      "video": { "id": 42, "title": "...", "thumbnailUrl": "...", "durationSeconds": 3600 },
      "createdAt": "2026-03-01T10:00:00Z"
    }
  ],
  "total": 5,
  "page": 1,
  "limit": 20
}
```

---

### GET /users/history
`JWT required`

| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |

**Response:**
```json
{
  "items": [
    {
      "id": 1,
      "videoId": 42,
      "progressSeconds": 1200,
      "completed": false,
      "watchedAt": "2026-03-20T18:00:00Z",
      "video": { "id": 42, "title": "...", "thumbnailUrl": "...", "durationSeconds": 3600 }
    }
  ],
  "total": 12,
  "page": 1,
  "limit": 20
}
```

---

### GET /users/me/notification-preferences
`JWT required`

No body.

**Response:**
```json
{ "notificationsEnabled": true }
```

---

### PATCH /users/me/notification-preferences
`JWT required`

```json
{ "notificationsEnabled": false }
```

**Response:**
```json
{ "notificationsEnabled": false }
```

---

## 9. MOMENTS (Declarations, Prayers, Testimonies)

### GET /moments
All moments (all types).

| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |

---

### GET /moments/declarations
Declarations only. Same query params as above.

---

### GET /moments/prayers
Prayers only.

---

### GET /moments/testimonies
Testimonies only.

---

### GET /moments/suggestions
Get related moments for a given moment.

| Param | Type | Required | Notes |
|-------|------|----------|-------|
| `momentId` | number | yes | ID of the current moment |
| `youtubeId` | string | yes | YouTube video ID of source sermon |
| `type` | string | yes | `declaration` \| `prayer` \| `testimony` |
| `limit` | number | | default 8 |

Example: `GET /moments/suggestions?momentId=5&youtubeId=abc123&type=declaration&limit=8`

---

## 10. PRAYER REQUESTS

### POST /prayer-requests
Public — no JWT required. Rate limited to 5 per minute.

```json
{
  "name": "John Doe",
  "category": "healing",
  "request": "Please pray for my mother who is sick in hospital."
}
```

`category` must be one of:
`healing` | `financial` | `family` | `career` | `marriage` | `salvation` | `other`

**Response:** `201 Created` with the saved prayer request record.

---

### GET /prayer-requests
`JWT required` + `Admin only`

| Param | Type | Default |
|-------|------|---------|
| `page` | number | 1 |
| `limit` | number | 20 |

---

## 11. NOTIFICATIONS

### POST /notifications/device-token
`JWT required`

Register a device's FCM push token after login.

```json
{
  "token": "fKz8...<FCM_token>",
  "platform": "android"
}
```
`platform` options: `"android"` | `"ios"` (default: `"android"`)

**Response:** `204 No Content`

---

### POST /notifications/broadcast
`JWT required` + `Admin only`

Send a push notification to all users who have notifications enabled.

```json
{
  "title": "New Sermon Available",
  "body": "Watch the latest message from Apostle Joshua Selman"
}
```

**Response:** `204 No Content`

---

## 12. ADMIN

> These endpoints have no JWT guard in the current build — protect them in production.

### POST /admin/sync/trigger
Manually trigger a YouTube sync.

```json
{
  "type": "incremental"
}
```
`type` options: `"incremental"` (default, fetches new videos only) | `"full"` (re-syncs everything)

---

### GET /admin/sync/logs
Get the last 20 sync run logs.

No body.

**Response:**
```json
[
  {
    "id": 1,
    "type": "incremental",
    "status": "completed",
    "videosAdded": 3,
    "startedAt": "2026-03-20T18:00:00Z",
    "finishedAt": "2026-03-20T18:00:12Z"
  }
]
```

---

### POST /admin/categorize
Bulk-categorize existing videos using keyword matching.

| Query Param | Value | Notes |
|-------------|-------|-------|
| `force` | `true` | Re-tag ALL videos |
| `force` | `false` (default) | Only tag videos with zero categories |

Example: `POST /admin/categorize?force=false`

No body.

---

### POST /admin/moments/process
Detect and extract moments (declarations, prayers, testimonies) from sermon transcripts.
Runs in the background — returns immediately.

| Query Param | Type | Default | Notes |
|-------------|------|---------|-------|
| `limit` | number | 50 | How many unprocessed videos to scan |

Example: `POST /admin/moments/process?limit=20`

No body.

**Response:**
```json
{ "message": "Processing up to 20 videos in background." }
```

---

## Error Response Format

All errors follow this shape:

```json
{
  "statusCode": 401,
  "message": "Invalid credentials",
  "error": "Unauthorized"
}
```

| Status | Meaning |
|--------|---------|
| 400 | Bad Request — validation failed, check body fields |
| 401 | Unauthorized — missing or expired JWT |
| 403 | Forbidden — authenticated but not admin |
| 404 | Not Found |
| 409 | Conflict — e.g. email already registered |
| 429 | Too Many Requests — rate limit hit |

---

## Postman Environment Variables

Set these as Postman environment variables to avoid repeating values:

| Variable | Example Value |
|----------|---------------|
| `base_url` | `http://localhost:3000/api/v1` |
| `access_token` | *(paste from login response)* |
| `refresh_token` | *(paste from login response)* |
| `video_id` | `1` |
| `category_slug` | `faith` |

Use `{{base_url}}/auth/login` and `Authorization: Bearer {{access_token}}` in your requests.

**Tip — Auto-save token after login:**
Add this to the **Tests** tab of your Login request:

```javascript
const res = pm.response.json();
pm.environment.set("access_token", res.accessToken);
pm.environment.set("refresh_token", res.refreshToken);
```

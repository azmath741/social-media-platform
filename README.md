# Pulse Social Media Platform

A complete, fully functional, modern social media web application engineered with **Express.js**, **EJS** (Embedded JavaScript templates), **Tailwind CSS**, and **MongoDB with Mongoose**.

Built following clean **MVC architecture**, robust session-based authentication, and modern web application security practices.

---
🔗 Live Demo: [https://social-media-platform-3lmu.onrender.com)

## 🌟 Key Features

### 1. Authentication & Security
- **Registration & Login**: Secure account creation with email and username uniqueness validation.
- **Session Authentication**: State managed via `express-session` with MongoDB persistent session store (`connect-mongo`).
- **Cryptographic Security**: Passwords hashed with `bcryptjs` (salt rounds: 10), never stored in plaintext.
- **Session Regeneration**: Regenerates session ID upon successful login to prevent session fixation attacks.
- **CSRF Protection**: Synchronizer Token Pattern implemented across all state-modifying requests (`POST`, `PUT`, `DELETE`) with support for hidden form inputs and `X-CSRF-Token` AJAX headers.
- **Rate Limiting**: Brute-force protection on authentication endpoints via `express-rate-limit`.
- **HTTP Security Headers**: Strict Content Security Policy (CSP), frameguard, and XSS filtering via `helmet`.
- **Ownership & Authorization**: Server-side authorization verification on all edit, delete, and moderation actions.

### 2. User Profiles
- **Profile Header**: Banner, dynamic or custom profile picture avatar, display name, `@username`, bio, and join date.
- **Profile Statistics**: Live counts for total posts, followers, and following.
- **Profile Management**: Dedicated edit profile view to update display name, bio, and avatar with live preview.
- **Profile Isolation**: Strict ownership checks preventing unauthorized users from editing other profiles.

### 3. Follow System
- **Relationship Management**: Follow and unfollow creators with real-time UI updates.
- **Followers & Following Lists**: Dedicated pages displaying followers and following accounts with quick-follow controls.
- **Self-Follow Prevention**: Validated at both the Mongoose schema layer and controller layer.
- **Compound Unique Indexing**: `{ follower: 1, following: 1 }` guarantees zero duplicate relationships.
- **Suggested Users**: Intelligent sidebar suggestions showing creators you do not yet follow.

### 4. Posts & Chronological Home Feed
- **Create Posts**: Post textual updates up to 2000 characters with optional image attachments.
- **Chronological Feed**: Displays posts from accounts you follow and your own updates.
- **Exploration Fallback**: Gracefully falls back to global community updates when a new user follows no one yet.
- **Post Editing & Deletion**: Only post authors may modify or permanently delete their posts.
- **Cascading Cleanup**: Deleting a post automatically purges all related comments.
- **Pagination**: Built-in page-based pagination for high performance feeds.

### 5. Likes & Comments
- **Likes**: One-click liking and unliking with `$addToSet` and `$pull` atomic database updates to eliminate race conditions and duplicate likes.
- **AJAX + Form Fallback**: Seamless, no-refresh like button updates with full graceful degradation if JavaScript is disabled.
- **Comments**: Threaded comments under posts with author details and timestamps.
- **Comment Moderation**: Both the comment author and the post owner have rights to delete comments.

### 6. User Discovery & Search
- Search users by display name or `@username` with sanitized regular expressions.
- Empty states and quick-follow actions directly from search results.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | EJS (Embedded JavaScript), Tailwind CSS (locally compiled CLI), Vanilla JS |
| **Backend** | Node.js, Express.js (MVC Pattern, Express Router) |
| **Database** | MongoDB, Mongoose ODM |
| **Sessions** | `express-session`, `connect-mongo` |
| **Security** | `bcryptjs`, `helmet`, `express-rate-limit`, `express-validator`, CSRF Protection |

---

## 📁 Folder Structure

```
social-media/
├── config/
│   └── db.js                        # MongoDB Mongoose connection
├── controllers/
│   ├── authController.js            # Registration, login, logout, session regeneration
│   ├── commentController.js         # Comment creation, deletion, and moderation
│   ├── followController.js          # Follow/unfollow actions, followers & following lists
│   ├── postController.js            # Feed generation, post CRUD, liking/unliking, pagination
│   └── userController.js            # Profiles, profile editing, user search
├── middleware/
│   ├── authMiddleware.js            # ensureAuth, ensureGuest, attachCurrentUser
│   ├── csrfMiddleware.js            # CSRF token generation and validation
│   ├── errorMiddleware.js           # 404 and 500 error handlers
│   └── validationMiddleware.js      # express-validator schemas
├── models/
│   ├── Comment.js                   # Comment schema and indexes
│   ├── Follow.js                    # Follow relationship schema with compound unique index
│   ├── Post.js                      # Post schema, author reference, like array, timestamps
│   └── User.js                      # User schema, bcrypt pre-save hook, comparePassword method
├── public/
│   ├── css/
│   │   └── output.css               # Locally compiled, minified Tailwind CSS
│   └── js/
│       └── main.js                  # Client-side AJAX liking/following, mobile nav, alerts
├── routes/
│   ├── authRoutes.js                # /register, /login, /logout
│   ├── commentRoutes.js             # /posts/:id/comments, /comments/:id/delete
│   ├── postRoutes.js                # /, /posts, /posts/:id, /posts/:id/like
│   ├── searchRoutes.js              # /search
│   └── userRoutes.js                # /profile, /users/:username, /users/:id/follow
├── src/
│   └── input.css                    # Tailwind CSS input file with custom directives
├── views/
│   ├── edit-profile.ejs             # Profile editing form
│   ├── error.ejs                    # 404 & 500 error display
│   ├── followers.ejs                # Followers list page
│   ├── following.ejs                # Following list page
│   ├── home.ejs                     # Main 3-column feed page
│   ├── login.ejs                    # Login page
│   ├── post-detail.ejs              # Single post view with comments
│   ├── profile.ejs                  # User profile view with user posts
│   ├── register.ejs                 # Registration page
│   ├── search.ejs                   # User search and discovery page
│   └── partials/
│       ├── flash-messages.ejs       # Success and error alert banners
│       ├── footer.ejs               # Shared footer
│       ├── head.ejs                 # HTML head with meta tags and stylesheet
│       ├── navbar.ejs               # Responsive desktop & mobile navigation bar
│       ├── pagination.ejs           # Feed pagination controls
│       ├── post-card.ejs            # Reusable post card component
│       └── suggested-users.ejs      # Who to follow sidebar card
├── .env.example                     # Environment variables template
├── .gitignore                       # Git ignore file
├── package.json                     # Scripts and dependencies
├── seed.js                          # Database seeder with sample accounts
├── server.js                        # Express app entrypoint
├── tailwind.config.js               # Tailwind CSS configuration
├── test-app.js                      # Backend & Mongoose test suite
└── test-http.js                     # HTTP routes & security test suite
```

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: v18.0.0 or higher (Tested with v22.18.0)
- **MongoDB**: Local MongoDB instance running on `mongodb://127.0.0.1:27017` or a MongoDB Atlas connection URI

### 1. Installation
Clone the repository and install all dependencies:
```bash
npm install
```

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
Ensure your `.env` contains:
```env
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/social_media_platform
SESSION_SECRET=replace_with_a_long_random_secret_at_least_32_chars
NODE_ENV=development
```

### 3. Seed Sample Data (Optional)
To immediately populate the database with realistic sample users, posts, follows, and comments:
```bash
npm run seed
```
**Sample Accounts:**
- `sarah@pulse.com` / `password123`
- `marcus@pulse.com` / `password123`
- `elena@pulse.com` / `password123`

### 4. Build Tailwind CSS
Compile the minified Tailwind CSS stylesheet to `public/css/output.css`:
```bash
npm run css:build
```

---

## 💻 Development Commands

| Command | Action |
|---|---|
| `npm run dev:all` | **Recommended**: Concurrently watches Tailwind CSS and runs Express with Nodemon |
| `npm run dev` | Runs the Express server with Nodemon (auto-restarts on code changes) |
| `npm run css:watch` | Watches EJS templates and rebuilds `output.css` on template edits |
| `npm run css:build` | Compiles a production-minified Tailwind CSS stylesheet |
| `npm start` | Runs the Express server in production mode |
| `npm run seed` | Seeds realistic demo accounts, relationships, posts, and comments |
| `npm test` | Executes both the model/controller test suite and live HTTP integration test suite |

---

## 🔒 Security Implementations

1. **Password Hashing**: Pre-save hook hashes all user passwords with `bcryptjs` using 10 salt rounds. Plaintext passwords or hashes are never returned to views.
2. **Session Hardening**: Sessions are encrypted, stored in MongoDB with TTL auto-expiry, and configured with `httpOnly: true`, `sameSite: 'lax'`, and dynamic `secure` cookies in production.
3. **Session Regeneration**: Upon successful credential verification, `req.session.regenerate()` assigns a fresh session identifier to protect against session fixation attacks.
4. **CSRF Validation**: Cryptographic synchronizer tokens validate every `POST`/`PUT`/`DELETE` request. Submissions lacking a valid token are rejected with HTTP 403.
5. **NoSQL / Regex Injection Mitigation**: Search queries escape all regular expression control characters before querying MongoDB.
6. **XSS Protection**: EJS escaped output (`<%=`) is strictly enforced across all user-generated fields.
7. **Rate Limiting**: Authentication endpoints are rate-limited to 20 attempts per 15 minutes per IP.
8. **Cascading Relational Cleanup**: When a post is deleted, all child comments are atomically purged from MongoDB.

---

## 🧪 Testing and Verification

The application includes an automated test suite verifying database models, authorization checks, and live HTTP endpoints:

```bash
npm test
```

### Test Coverage Highlights:
- User registration and bcrypt password hashing
- Duplicate email and username rejection
- Self-follow prevention and compound unique index enforcement
- Follow count updates and chronological feed generation
- Like and unlike toggles with atomic `$addToSet` duplicate prevention
- Comment creation and dual-role moderation (author and post owner)
- Post deletion with cascading comments cleanup
- Case-insensitive user search
- Live HTTP redirects, 200 OK responses, 404 pages, and 403 CSRF rejection

---

## 🌐 Routes Overview

### Authentication
- `GET /register` — Registration page
- `POST /register` — Process registration
- `GET /login` — Login page
- `POST /login` — Process login & session regeneration
- `POST /logout` — Destroy session and log out

### Feed & Posts
- `GET /` — Home feed with suggested users and pagination
- `POST /posts` — Publish a new post
- `GET /posts/:id` — View post details and comments
- `POST /posts/:id/edit` — Update post content (author only)
- `POST /posts/:id/delete` — Delete post & comments (author only)
- `POST /posts/:id/like` — Like a post
- `POST /posts/:id/unlike` — Unlike a post

### Comments
- `POST /posts/:id/comments` — Add comment to post
- `POST /posts/:postId/comments/:commentId/delete` — Delete comment (comment author or post owner)

### Profiles & Follow
- `GET /profile` — Redirect to current user's profile
- `GET /profile/edit` — Edit profile page
- `POST /profile/edit` — Update profile details and avatar
- `GET /users/:username` — View user profile and user's posts
- `GET /users/:username/followers` — View followers list
- `GET /users/:username/following` — View following list
- `POST /users/:id/follow` — Follow a user
- `POST /users/:id/unfollow` — Unfollow a user

### Search
- `GET /search` — Search users by name or username

---


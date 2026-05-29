# Gesture Arena - Project Instructions

**Version:** v2.1.0-stable

## 🌐 Live Deployment
The game is publicly playable online at: **[https://gesture-game-ai.vercel.app](https://gesture-game-ai.vercel.app)**

## 🎮 Overview
Gesture Arena is an AI-powered Rock, Paper, Scissors game running entirely in the browser. It uses **MediaPipe** for real-time hand gesture recognition and **Supabase** for user authentication, global leaderboards, and database management.

## 🚀 Setup & Installation
1. **Prerequisites:** Ensure you have Node.js and npm installed.
2. **Environment Variables:** The project requires a `.env` file in the root directory containing your Supabase credentials:
   ```env
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_ANON_KEY=eyJhbGciOi...
   SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOi...
   ```
3. **Run Locally:**
   Start the local development server by running:
   ```bash
   npm start
   ```
   The game will be available at `http://localhost:3000`.

## 🛡️ Admin Control Center
A dedicated Admin Terminal is included to manage players and track game analytics.
*   **URL:** `http://localhost:3000/admin.html`
*   **Default Admin Email:** `admin@gesturearena.com`
*   **Default Admin Password:** `admin123`

### Admin Features:
*   **Overview Dashboard:** Track total registered users, global matches played, and the highest active win streaks.
*   **Player Directory:** View all authenticated users. Ban malicious players or permanently delete accounts (which safely cascades to delete their match history).
*   **Activity Logs:** A real-time audit feed of every match played globally.
*   **System Parameters:** Configure Voice Narration (ElevenLabs API) and manage Supabase backend connections securely without exposing them to the frontend users.

## 🔐 Security Notes
*   The `.env` file and `admin.html` rely on the powerful **Service Role Key** to bypass Row Level Security (RLS) for administration.
*   **Do not** deploy the `admin.html` or `.env` files to public static hosts (like Vercel). They should be kept exclusively for local administration.

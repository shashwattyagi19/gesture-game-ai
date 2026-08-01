# 🖐️ Gesture Arena - Rock Paper Scissors

A modern Rock Paper Scissors game powered by Computer Vision (MediaPipe Hands).

## 🚀 Live Demo & Deployment

This project is deployed and actively hosted on **Vercel**.

*   🎮 **Play the Game:** [https://gesture-game-ai.vercel.app](https://gesture-game-ai.vercel.app)
*   🛡️ **Admin Dashboard:** [https://gesture-game-ai.vercel.app/admin.html](https://gesture-game-ai.vercel.app/admin.html)

1. **GitHub Repository**: [shashwattyagi19/gesture-game-ai](https://github.com/shashwattyagi19/gesture-game-ai)

## How to Run Locally

### Option 1: Using Python (Simplest)
If you have Python installed, run this command in your terminal:
```bash
python -m http.server 8000
```
Then open [http://localhost:8000](http://localhost:8000) in your browser.

### Option 2: Using Node.js (Recommended)
If you have Node.js installed:
1. Open terminal in the project folder.
2. Run:
   ```bash
   npm start
   ```
3. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Google Sign-In Setup

"Continue with Google" uses Supabase Auth. If sign-in fails:

1. **Supabase dashboard** → your project → **Authentication → URL Configuration**
   - Add redirect URLs:
     - `http://localhost:3000`
     - `https://gesture-game-ai.vercel.app`
2. **Authentication → Providers → Google** → Enable, then paste **Client ID** and **Client Secret** from [Google Cloud Console](https://console.cloud.google.com/apis/credentials).
3. In Google Cloud, set **Authorized redirect URI** to:
   - `https://<your-project-ref>.supabase.co/auth/v1/callback`
4. Use a **fixed local port** (`npm start` uses port 3000). Random ports break OAuth redirects.
5. If you see `ERR_NAME_NOT_RESOLVED`, the Supabase project may be deleted or paused — restore it in the dashboard.

### Option 3: VS Code "Live Server"
If you are using VS Code:
1. Install the **Live Server** extension.
2. Right-click `index.html` and select **"Open with Live Server"**.

## Controls
- **Start Game**: Click the button.
- **Move**: Show your hand to the camera!
  - ✊ **Rock**: 0-1 fingers extended.
  - 🖐️ **Paper**: 4-5 fingers extended.
  - ✌️ **Scissors**: 2 fingers extended.


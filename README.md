# 🖐️ Gesture Arena - Rock Paper Scissors

A modern Rock Paper Scissors game powered by Computer Vision (MediaPipe Hands).

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
   npx serve .
   ```
3. Open the URL shown in the terminal.

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

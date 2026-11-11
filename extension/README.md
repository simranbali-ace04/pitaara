# Pitaara Web Clipper (Desktop Browser Extension)

A lightweight Manifest V3 browser companion for **Pitaara**. Capture any webpage, GitHub repository, code snippet, image, or highlighted quote in one keystroke without ever leaving your active tab.

---

## ⚡ Quick Shortcut
- **Windows / Linux**: `Alt + S`
- **Mac**: `Alt + S` or `Ctrl + S` (configurable in `chrome://extensions/shortcuts`)
- Or simply click the **Pitaara** chest icon in your browser toolbar.

---

## 📦 How to Install (Chrome, Edge, Brave, Arc)

1. Open your browser and navigate to:
   - **Chrome / Brave**: `chrome://extensions`
   - **Edge**: `edge://extensions`
   - **Arc**: Open Settings → Extensions
2. Enable **Developer mode** (toggle switch in the top-right corner).
3. Click the **Load unpacked** button in the top-left toolbar.
4. Select this directory:
   ```
   C:\Users\Simran Bali\pitaara\extension
   ```
5. *(Recommended)* Click the puzzle piece icon in your browser toolbar and pin **Pitaara Web Clipper** for quick access.

---

## 🎯 How It Works

1. Make sure your local Pitaara development server is running:
   ```bash
   npm run dev
   ```
2. Navigate to any website (e.g. `https://github.com/facebook/react`, Twitter, or any blog).
3. Press `Alt + S` (or highlight text first to save a quote).
4. A floating **Pitaara toast pill** will appear at the top-center:
   - Type an optional keepsake thought and press **Enter**.
   - Or do nothing: it will automatically save within 2 seconds.
   - Press **Esc** anytime to cancel.
5. The artifact is saved with its extracted OpenGraph metadata, GitHub repository statistics, or dominant palette color directly into your Pitaara vault!


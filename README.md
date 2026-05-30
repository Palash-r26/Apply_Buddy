# ✦ Apply Buddy — All in One Vault

**Your personal profile vault and universal form auto-filler — fully dynamic, fully yours.**

Apply Buddy is a sleek, modern profile manager paired with a powerful Chrome Extension. You can store all the information you repeatedly type into forms — personal details, resumes, addresses, online accounts, and more. 

No hardcoded fields. Every section, every field, and every label is created, edited, and managed by you inside the Vault, and instantly synced to your browser extension for one-click autofilling across the web.

---

## 🧩 Features

### The Vault (Web App)
- **Dynamic Sections** — Add, rename, and delete custom sections to organize your life.
- **Custom Fields** — Add fields inside any section with a label, type, and value.
- **File Uploads** — Built-in support for uploading resumes and documents.
- **Dual Themes** — Switch between the sleek "Void" (dark) and "Paper" (light) themes.
- **Auto-Save** — Every change saves instantly to your local vault. No save button needed.

### The Extension (Chrome)
- **Instant Sync** — Your Vault data is instantly and securely beamed to your extension.
- **Smart Autofill** — Automatically detects form fields on any website and fills them with your custom profile data.
- **Quick Copy** — Open the side panel to instantly copy any piece of data or document to your clipboard.

---

## 🚀 Getting Started

### 1. Run the Vault (Web App)

The Vault is a modern React app powered by Vite.

```bash
cd frontend
npm install
npm run dev
```
Open **http://localhost:5173** in your browser. 

*(Note: The Vault currently saves all data securely in your browser's local storage).*

### 2. Install the Chrome Extension

To get the autofill magic working, load the companion extension into Chrome:

1. Open Chrome and navigate to `chrome://extensions/`
2. Turn on **Developer mode** (toggle in the top right).
3. Click **Load unpacked** in the top left.
4. Select the `extension/` folder located inside the `Apply_Buddy` repository.
5. Pin the ApplyBuddy **green vault icon** to your toolbar!

### 3. Sync & Autofill

1. Open the Vault at `localhost:5173`.
2. Add your details, sections, and documents.
3. The data is instantly synced to your extension!
4. Navigate to any job application or form online, click the Apply Buddy extension icon, and hit **Fill Form**.

---

## 📁 Project Structure

```text
ApplyBuddy/
├── frontend/                # The Vault Web App
│   ├── index.html           
│   ├── src/
│   │   ├── App.jsx          # Main Layout
│   │   ├── index.css        # Design System & Themes
│   │   ├── useProfile.js    # Core Data Engine
│   │   └── components/      # UI Components (Sidebar, Forms, etc.)
│
├── extension/               # The Chrome Extension
│   ├── manifest.json        # Extension Config
│   ├── background.js        # Sync Listener
│   ├── sync.js              # Injected Data Extractor
│   ├── sidepanel.html       # Extension UI
│   ├── content.js           # Smart Autofill Engine
│   └── icon.png             # Vault Icon
│
└── backend/                 # (Optional/Deprecated) Legacy API Server
```

---

## 📜 License

This project is open source and available under the [MIT License](LICENSE).

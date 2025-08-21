# Always Running NPM Dev Scripts

This project now includes several options for running your development server that will automatically restart and keep running.

## Available Scripts

### 1. **dev:always** (Recommended)
```bash
npm run dev:always
```
- Uses `concurrently` and `nodemon` for robust process management
- Automatically restarts when source files change
- Ignores build artifacts (`.next` folder)
- Most reliable option for continuous development

### 2. **dev:watch**
```bash
npm run dev:watch
```
- Uses Next.js built-in watch mode
- Restarts when files change
- Lightweight option

### 3. **dev:nodemon**
```bash
npm run dev:nodemon
```
- Uses nodemon to watch source files
- Restarts the entire dev process when files change
- Good for catching all types of changes

### 4. **Windows Batch Script**
```bash
dev-forever.bat
```
- Double-click to run
- Keeps running even if the dev server crashes
- Automatically restarts after 3 seconds
- Simple and reliable

### 5. **PowerShell Script**
```powershell
.\dev-forever.ps1
```
- PowerShell version with better error handling
- Colored output for better visibility
- Automatically restarts after crashes
- More robust error handling

### 6. **Phone Access Scripts** 🆕
```bash
npm run dev:phone
npm run dev:phone:always
```
- Makes your dev server accessible from your phone!
- Binds to all network interfaces (0.0.0.0)
- Shows your computer's IP address automatically
- Perfect for testing on mobile devices

### 7. **Phone Access Batch Script** 🆕
```bash
dev-phone.bat
```
- Double-click to run
- Automatically shows your IP address
- Makes dev server accessible from phone
- Always running with auto-restart

### 8. **Phone Access PowerShell Script** 🆕
```powershell
.\dev-phone.ps1
```
- PowerShell version for phone access
- Better network information display
- Colored output and error handling

## Quick Start

### For Windows Users:
1. **Double-click** `dev-forever.bat` (easiest)
2. **Or run** `.\dev-forever.ps1` in PowerShell

### For All Users:
```bash
npm run dev:always
```

## 📱 **Phone Access (New!)**

### **Quick Phone Access:**
1. **Double-click** `dev-phone.bat` (easiest)
2. **Or run** `npm run dev:phone` in terminal
3. **Use the IP address shown** on your phone browser

### **Step-by-Step Phone Access:**
1. **Start the phone-accessible server:**
   ```bash
   npm run dev:phone
   # or double-click dev-phone.bat
   ```

2. **Find your computer's IP address:**
   - The script will show it automatically
   - Or run `get-ip.bat` for a quick check

3. **On your phone:**
   - Connect to the same WiFi network as your computer
   - Open browser and go to: `http://YOUR_IP:3000`
   - Example: `http://192.168.1.100:3000`

### **Phone Access Features:**
- ✅ **Network accessible** - works from any device on your WiFi
- ✅ **Auto IP detection** - shows your IP address automatically
- ✅ **Always running** - auto-restart if server crashes
- ✅ **Mobile optimized** - perfect for testing responsive design
- ✅ **Real-time updates** - see changes on phone immediately

## Features

- ✅ **Auto-restart** on file changes
- ✅ **Crash recovery** - automatically restarts if the server crashes
- ✅ **Process monitoring** - keeps track of when restarts happen
- ✅ **Cross-platform** - works on Windows, Mac, and Linux
- ✅ **Multiple options** - choose the method that works best for you

## Stopping the Server

- Press **Ctrl+C** in the terminal
- Close the terminal window
- For batch/PowerShell scripts, press **Ctrl+C** or close the window

## Troubleshooting

If you encounter issues:

1. **Clear npm cache**: `npm cache clean --force`
2. **Delete node_modules**: `rm -rf node_modules && npm install`
3. **Check Node.js version**: Ensure you're using Node.js 18+
4. **Use the batch script**: `dev-forever.bat` is the most reliable option

## Why These Scripts?

- **Development Continuity**: No more manually restarting the dev server
- **Crash Recovery**: Automatically recovers from errors
- **File Watching**: Restarts when you make changes
- **Multiple Options**: Choose what works best for your workflow

# Telegram Bot Setup Guide

## 🤖 How to Enable Real Telegram Notifications

### Step 1: Create a Telegram Bot
1. Open Telegram and search for **@BotFather**
2. Send `/newbot` command
3. Enter bot name: `Optimize Tasks Bot`
4. Enter bot username: `optimize_tasks_bot`
5. Copy the **BOT TOKEN** (looks like: `1234567890:ABCdefGHIjklMNOpqrsTUVwxyz`)

### Step 2: Get Your Chat ID
1. Send a message to your new bot
2. Go to: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
3. Find your **chat_id** (looks like: `123456789`)

### Step 3: Update Configuration
1. Open `src/config/telegram.ts`
2. Replace `YOUR_BOT_TOKEN_HERE` with your actual bot token
3. Replace `YOUR_CHAT_ID_HERE` with your actual chat ID

### Step 4: Test
1. Restart the development server
2. Register a new user or create a training account
3. Check your Telegram for the notification

## 📱 Current Status
The system will send detailed notifications for:
- ✅ New user registrations
- ✅ Training account creation
- ✅ Account credentials and instructions

## 🔧 Configuration File
```typescript
export const TELEGRAM_CONFIG = {
  BOT_TOKEN: '1234567890:ABCdefGHIjklMNOpqrsTUVwxyz', // Your actual token
  CHAT_ID: '123456789', // Your actual chat ID
  SUPPORT_LINK: 'https://t.me/EARNINGSLLCONLINECS1'
};
```

## 📨 Notification Examples

### New User Registration:
```
🆕 NEW USER REGISTRATION

👤 User Details:
• Email: user@example.com
• Name: John Doe
• VIP Level: 1
• Status: Registered (Training Required)

⚠️ Action Required:
• Create training account for this user
• Send training credentials via Telegram
```

### Training Account Created:
```
🎓 TRAINING ACCOUNT CREATED

👤 Account Details:
• Email: training@example.com
• Password: 123456
• Assigned to: John Doe
• Initial Balance: $1100.00

📋 Training Instructions:
1. Login with provided credentials
2. Complete Phase 1: 45 tasks
3. Complete Phase 2: 45 tasks
```

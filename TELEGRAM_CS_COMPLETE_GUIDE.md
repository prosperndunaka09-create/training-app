# Telegram Bot & Customer Service - Complete Guide

## 🚀 Overview

Your platform has a **complete Telegram integration** with:
- ✅ **Notification Bot** - Sends alerts for platform events
- ✅ **Customer Service (CS) Bot** - Two-way chat between users and admins
- ✅ **Webhook Integration** - Receives Telegram replies
- ✅ **Real-time Notifications** - For registrations, withdrawals, pending orders

---

## 📱 Telegram Bot Setup

### 1. Notification Bot (Primary)
**Purpose:** Sends notifications to admin group/channel

**Current Config:**
```env
TELEGRAM_BOT_TOKEN=8513756424:AAGvKY6eJK8ANfqC2S-5z0LlXM-YDRGbmaA
TELEGRAM_CHAT_ID=7683177085
```

**How to Setup Your Own:**
1. Message @BotFather on Telegram
2. Type `/newbot` and follow instructions
3. Get your **BOT_TOKEN**
4. Create a group/channel for notifications
5. Add the bot to the group
6. Send a test message in the group
7. Visit: `https://api.telegram.org/bot<YOUR_BOT_TOKEN>/getUpdates`
8. Find the chat ID in the response

### 2. CS Bot (Customer Service)
**Purpose:** Two-way communication with users

**Current Config:**
```env
CS_BOT_TOKEN=your_cs_bot_token
CS_CHAT_ID=your_cs_chat_id
```

**Setup Steps:**
1. Create another bot via @BotFather
2. Get **CS_BOT_TOKEN**
3. Create a CS support group
4. Add bot to group
5. Get **CS_CHAT_ID**

---

## 🔔 Notification Types

Your system sends these Telegram notifications:

### 1. **NEW_USER** - New Registration
```
🎉 NEW USER REGISTRATION
📧 Email: user@example.com
👤 Name: John Doe
🔗 Referral Code: ABC123
👑 VIP Level: 1
⏰ Time: 4/11/2026, 10:30 AM

🚀 Welcome to Optimize Tasks!
```

### 2. **NEW_WITHDRAWAL** - Withdrawal Request
```
💰 NEW WITHDRAWAL REQUEST
👤 User: user@example.com
💵 Amount: $500.00
🏦 Wallet Type: USDT-TRC20
📋 Status: Pending
⏰ Time: 4/11/2026, 10:30 AM

🔍 Admin review required
```

### 3. **PENDING_ORDER_CREATED** - Combination Product Hit
```
⚠️ PENDING ORDER CREATED
👤 User: user@example.com
🆔 User ID: uuid-here
📦 Task: #23
💰 Amount: $210.00
📱 Product: Combination Product
⏰ Time: 4/11/2026, 10:30 AM

⚡ User must contact CS to clear this order and receive 6× profit!
```

### 4. **PENDING_ORDER_CLEARED** - Admin Clears Order
```
✅ PENDING ORDER CLEARED - 6× PROFIT PAID
👤 User: user@example.com
🆔 User ID: uuid-here
💰 Pending Amount: $210.00
💎 6× Profit: $1,260.00
💵 Total Credited: $1,470.00
👨‍💼 Cleared By: admin@optimize.com
⏰ Time: 4/11/2026, 10:30 AM

🎉 User can now continue with tasks!
```

### 5. **COMBINATION_PRODUCT_TRIGGERED**
```
🎯 COMBINATION PRODUCT TRIGGERED
👤 User: user@example.com
🆔 User ID: uuid-here
📦 Task Number: #23
💰 Product Price: $210.00
🎁 Expected 6× Profit: $1,260.00
⏰ Time: 4/11/2026, 10:30 AM

⚠️ User hit combination product - pending order created!
```

### 6. **ADMIN_ACTION** - Important Admin Operations
```
🛡️ ADMIN ACTION
🔧 Action: USER_FREEZE
👤 Admin: admin@optimize.com
📋 Details: { ... }
⏰ Time: 4/11/2026, 10:30 AM

🔐 Administrative action performed
```

---

## 💬 Customer Service Flow

### How It Works:

```
┌────────────────────────────────────────────────────────────────┐
│  USER SIDE                    │  TELEGRAM (ADMIN SIDE)         │
├────────────────────────────────────────────────────────────────┤
│                               │                                │
│  1. User clicks "CS" icon     │                                │
│     ↓                         │                                │
│  2. Fills form:               │  3. Notification sent:         │
│     - Name                    │     🟢 ONLINE CS - NEW TICKET  │
│     - Phone                   │     👤 User: John              │
│     - Message                 │     🆔 ID: uuid                │
│     ↓                         │     📝 Message: "Help!"        │
│  3. Submit → /api/send-message│                                │
│     ↓                         │                                │
│  4. Message saved to DB       │                                │
│     ↓                         │                                │
│  5. Shows chat interface      │                                │
│     (polling every 3s)        │                                │
│                               │  6. Admin replies in Telegram  │
│  7. Reply appears in chat   │     group (via webhook)        │
│     ↓                         │     ↓                          │
│  8. User sees response        │  9. Webhook saves to DB        │
│                               │                                │
└────────────────────────────────────────────────────────────────┘
```

### User Experience:
1. **Click CS Icon** → Opens pink chat modal
2. **Submit Form** → Creates support ticket
3. **Chat Interface** → Real-time messaging
4. **Get Reply** → Admin response from Telegram

### Admin Experience:
1. **Receive Notification** → In Telegram group
2. **Reply in Telegram** → Type response
3. **Webhook Delivers** → Message appears in user's chat
4. **Two-way Communication** → Seamless chat

---

## 🔧 Files & Configuration

### Core Files:

| File | Purpose |
|------|---------|
| `api/telegram-webhook.js` | Receives Telegram replies, saves to DB |
| `api/send-message.js` | Sends user messages to Telegram |
| `supabase/functions/telegram-bot/index.ts` | Edge function for notifications |
| `src/lib/realtime.ts` | Notification formatter & sender |
| `src/components/CustomerService.tsx` | Chat UI for users |
| `src/config/telegram.ts` | Bot configuration |

### Environment Variables:
```env
# Primary Bot (Notifications)
TELEGRAM_BOT_TOKEN=your_bot_token_here
TELEGRAM_CHAT_ID=your_chat_id_here

# CS Bot (Customer Service)
CS_BOT_TOKEN=your_cs_bot_token_here
CS_CHAT_ID=your_cs_chat_id_here
```

---

## 🛠️ Setup Checklist

### Step 1: Create Telegram Bots
- [ ] Message @BotFather
- [ ] Create notification bot
- [ ] Create CS bot
- [ ] Save both tokens

### Step 2: Setup Notification Channel
- [ ] Create Telegram group
- [ ] Add notification bot
- [ ] Get chat ID
- [ ] Test with curl

### Step 3: Setup CS Channel
- [ ] Create CS support group
- [ ] Add CS bot
- [ ] Get chat ID
- [ ] Test message

### Step 4: Configure Environment
- [ ] Add tokens to `.env`
- [ ] Deploy to Vercel
- [ ] Set environment variables in Vercel dashboard

### Step 5: Setup Webhook
- [ ] Run webhook setup script
- [ ] Verify webhook is active
- [ ] Test reply delivery

---

## 🧪 Testing

### Test Notification Bot:
```bash
# Run this to test your bot
curl -X POST "https://api.telegram.org/bot<TOKEN>/sendMessage" \
  -H "Content-Type: application/json" \
  -d '{
    "chat_id": "<CHAT_ID>",
    "text": "🧪 Test notification from Optimize Tasks"
  }'
```

### Test Webhook:
1. Send message in Telegram group
2. Check Supabase `customer_messages` table
3. Verify message was saved

### Test CS Flow:
1. Open app → Click CS icon
2. Submit test message
3. Check Telegram group for notification
4. Reply in Telegram
5. Verify reply appears in app

---

## 🚨 Troubleshooting

### Issue: Notifications not sending
**Solution:**
- Check bot token is correct
- Verify chat ID is correct
- Check Vercel environment variables
- Look at function logs in Vercel

### Issue: Webhook not receiving
**Solution:**
- Verify webhook URL is set
- Check webhook with `getWebhookInfo`
- Ensure HTTPS is used
- Check Vercel function logs

### Issue: CS messages not delivering
**Solution:**
- Check CS bot token
- Verify CS chat ID
- Check `api/send-message.js` logs
- Ensure Supabase is connected

---

## 📝 Notification Triggers

### When Notifications Send:

| Event | Notification Type | Telegram? |
|-------|------------------|-----------|
| New user registers | NEW_USER | ✅ |
| Withdrawal requested | NEW_WITHDRAWAL | ✅ |
| Task completed | TASK_COMPLETED | ✅ |
| Combination product hit | PENDING_ORDER_CREATED | ✅ |
| Admin clears pending order | PENDING_ORDER_CLEARED | ✅ |
| User frozen/unfrozen | ADMIN_ACTION | ✅ |
| Withdrawal approved/rejected | ADMIN_ACTION | ✅ |
| Account reset | ACCOUNT_RESET | ✅ |

---

## 🎯 Summary

Your platform has **full Telegram integration**:

✅ **Notification Bot** - All platform events
✅ **CS Bot** - Two-way user support  
✅ **Webhook** - Receive admin replies
✅ **Real-time** - Instant notifications
✅ **Pending Orders** - Special alerts for 6× profit system

**Everything is configured and ready!** 🚀

Just update the environment variables with your own bot tokens and chat IDs!

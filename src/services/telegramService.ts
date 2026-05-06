// Telegram notification service
// This calls the server-side API route to send Telegram messages
// The actual Telegram API call happens server-side to keep tokens secure

export interface TelegramNotificationData {
  type: 'signup' | 'login' | 'withdrawal' | 'admin_action' | 'new_account';
  userEmail?: string;
  userName?: string;
  amount?: number;
  action?: string;
  details?: string;
}

export interface NewAccountNotificationData {
  userId: string;
  email: string;
  displayName: string;
  accountType: 'personal' | 'training' | 'admin';
  vipLevel: number;
  balance: number;
  referralCode: string;
  userStatus: string;
  createdAt: string;
  // Training account specific fields
  isTrainingAccount?: boolean;
  trainingBalance?: number;
  taskNumber?: number;
  totalTasks?: number;
}

export class TelegramService {
  private static API_URL = '/api/send-telegram-notification';

  static async sendNotification(data: TelegramNotificationData): Promise<boolean> {
    try {
      let message = '';

      switch (data.type) {
        case 'signup':
          message = `🎉 <b>New User Signup</b>\n\n` +
                   `📧 Email: ${data.userEmail}\n` +
                   `👤 Name: ${data.userName || 'N/A'}\n` +
                   `🌐 Domain: earnings.ink`;
          break;

        case 'login':
          message = `🔐 <b>User Login</b>\n\n` +
                   `📧 Email: ${data.userEmail}\n` +
                   `👤 Name: ${data.userName || 'N/A'}\n` +
                   `🌐 Domain: earnings.ink`;
          break;

        case 'withdrawal':
          message = `💰 <b>Withdrawal Request</b>\n\n` +
                   `📧 Email: ${data.userEmail}\n` +
                   `👤 Name: ${data.userName || 'N/A'}\n` +
                   `💵 Amount: $${data.amount?.toFixed(2)}\n` +
                   `🌐 Domain: earnings.ink`;
          break;

        case 'admin_action':
          message = `⚙️ <b>Admin Action</b>\n\n` +
                   `👤 Admin: ${data.userName || 'N/A'}\n` +
                   `🔧 Action: ${data.action}\n` +
                   `📝 Details: ${data.details || 'N/A'}\n` +
                   `🌐 Domain: earnings.ink`;
          break;

        default:
          message = `📢 <b>Notification</b>\n\n${data.details || 'No details'}`;
      }

      console.log('[TelegramService] Sending notification:', data.type);

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[TelegramService] Failed to send notification:', result);
        return false;
      }

      console.log('[TelegramService] Notification sent successfully');
      return true;

    } catch (error) {
      console.error('[TelegramService] Exception sending notification:', error);
      return false;
    }
  }

  static async sendSignupNotification(email: string, displayName?: string): Promise<boolean> {
    return this.sendNotification({
      type: 'signup',
      userEmail: email,
      userName: displayName
    });
  }

  static async sendLoginNotification(email: string, displayName?: string): Promise<boolean> {
    return this.sendNotification({
      type: 'login',
      userEmail: email,
      userName: displayName
    });
  }

  static async sendWithdrawalNotification(email: string, displayName: string, amount: number): Promise<boolean> {
    return this.sendNotification({
      type: 'withdrawal',
      userEmail: email,
      userName: displayName,
      amount
    });
  }

  static async sendWithdrawalApprovedNotification(data: {
    userId: string;
    userEmail: string;
    amount: number;
    walletType: string;
    timestamp: string;
  }): Promise<boolean> {
    try {
      const message = `✅ <b>Withdrawal Approved</b>\n\n` +
        `📧 Email: ${data.userEmail}\n` +
        `💵 Amount: $${data.amount.toFixed(2)}\n` +
        `👛 Wallet: ${data.walletType}\n` +
        `📅 Approved: ${data.timestamp}`;

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[Telegram] Withdrawal approval notification failed:', result);
        return false;
      }

      console.log('[Telegram] Withdrawal approval notification sent');
      return true;

    } catch (error) {
      console.error('[Telegram] Withdrawal approval notification failed:', error);
      return false;
    }
  }

  static async sendAdminNotification(adminName: string, action: string, details?: string): Promise<boolean> {
    return this.sendNotification({
      type: 'admin_action',
      userName: adminName,
      action,
      details
    });
  }

  static async sendNewAccountNotification(data: NewAccountNotificationData): Promise<boolean> {
    console.log('[Telegram] New account notification started');
    
    try {
      const isTraining = data.accountType === 'training' || data.isTrainingAccount;
      
      let message = `🎉 <b>New Account Created</b>\n\n` +
        `👤 <b>User Details:</b>\n` +
        `🆔 ID: <code>${data.userId}</code>\n` +
        `📧 Email: ${data.email}\n` +
        `🏷️ Name: ${data.displayName}\n` +
        `🏢 Account Type: ${data.accountType.toUpperCase()}\n` +
        `⭐ VIP Level: ${data.vipLevel}\n` +
        `💰 Balance: $${data.balance.toFixed(2)}\n` +
        `🔗 Referral Code: <code>${data.referralCode}</code>\n` +
        `📊 Status: ${data.userStatus}\n` +
        `🕐 Created: ${new Date(data.createdAt).toLocaleString()}\n`;
      
      // Add training account specific details
      if (isTraining) {
        message += `\n📚 <b>Training Account Details:</b>\n` +
          `✅ Training Account: Yes\n` +
          `💵 Training Balance: $${(data.trainingBalance || data.balance).toFixed(2)}\n` +
          `📋 Current Task: ${data.taskNumber || 1} of ${data.totalTasks || 45}\n` +
          `🎯 Total Tasks: ${data.totalTasks || 45}\n`;
      }
      
      message += `\n🌐 Domain: earnings.ink`;

      const response = await fetch(this.API_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message })
      });

      const result = await response.json();

      if (!response.ok) {
        console.error('[Telegram] New account notification failed:', result);
        return false;
      }

      console.log('[Telegram] New account notification sent');
      return true;

    } catch (error) {
      console.error('[Telegram] New account notification failed:', error);
      return false;
    }
  }
}

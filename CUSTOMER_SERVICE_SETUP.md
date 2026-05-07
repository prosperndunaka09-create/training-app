# Customer Service Database Setup Instructions

## ⚠️ IMPORTANT: Manual Database Setup Required

Since Docker is not available on your system, you need to manually set up the customer service database tables in your Supabase project.

## 📋 Step-by-Step Instructions:

### 1. **Access Your Supabase Project**
- Go to: https://supabase.com/dashboard/project/ybxshqzwirqfybdeukvq
- Sign in to your Supabase account

### 2. **Open SQL Editor**
- In the left sidebar, click on "**SQL Editor**"
- Click on "**New query**" to create a new SQL script

### 3. **Execute the Customer Service Schema**
- Copy the entire contents of this file: `supabase/add-customer-service.sql`
- Paste it into the SQL editor
- Click "**Run**" to execute the schema

### 4. **Verify the Setup**
After running the SQL, you should see:
- ✅ Customer service database setup completed successfully!
- 📊 Tables created: customer_service_tickets, customer_service_messages
- 🔒 RLS policies enabled
- 📈 Indexes created for performance
- 🔧 Functions created for ticket management and messaging

## 🎯 What This Creates:

### Tables:
1. **customer_service_tickets** - Stores support tickets
2. **customer_service_messages** - Stores conversation messages

### Functions:
1. **generate_ticket_number()** - Creates unique ticket numbers (CS2024-0001 format)
2. **create_customer_service_ticket()** - Creates new tickets with initial message
3. **send_customer_service_message()** - Sends messages to existing tickets

### Security:
- Row Level Security (RLS) enabled
- Users can only see their own tickets
- Admins can see all tickets
- Proper permission policies in place

## 🚀 After Setup:

Once you complete these steps, your customer service system will be fully functional:

1. Users can click the **CS button** in the navbar
2. Fill out the branded support form
3. Submit tickets that get saved to the database
4. Have real-time conversations with support staff
5. Access Telegram support as an alternative

## 🔍 Testing the Setup:

1. Start your development server: `npm run dev`
2. Go to http://localhost:5173
3. Click the **CS button** in the navbar
4. Try submitting a customer service ticket
5. Verify it works correctly

## 📞 If You Need Help:

If you encounter any issues during the setup:
1. Make sure you're logged into the correct Supabase project
2. Ensure you have sufficient permissions (Admin/Owner)
3. Check that the SQL executes without errors
4. Verify the tables appear in the **Table Editor** section

## ✅ Success Indicators:

You'll know it worked when:
- The SQL executes successfully
- You can see `customer_service_tickets` and `customer_service_messages` in the Table Editor
- The customer service form in your app works without database errors
- Tickets are being created and saved properly

---

**🎉 Once you complete this manual setup, your customer service system will be fully operational!**

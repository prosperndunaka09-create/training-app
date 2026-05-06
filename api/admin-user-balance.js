// Server-side API route for managing user balance
// Secure backend function - requires admin authentication

exports.handler = async (event, context) => {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const { userId, action, amount, reason, adminPassword } = JSON.parse(event.body);
if (adminPassword !== process.env.ADMIN_PASSWORD) {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: 'Invalid admin password' })
  };
}
    // Validate required fields
    if (!userId || !action || !amount) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: userId, action, amount' })
      };
    }

    // Validate action
    if (!['add', 'reduce'].includes(action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid action. Must be "add" or "reduce"' })
      };
    }

    // Validate amount
    if (typeof amount !== 'number' || amount <= 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Amount must be a positive number' })
      };
    }

    // Simple admin password check (in production, use proper auth)
   const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

 

    // Import supabase (assuming it's available in the environment)
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !supabaseServiceKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);
// 🔐 Verify admin using logged-in user
const authHeader = event.headers.authorization;

if (!authHeader) {
  return {
    statusCode: 401,
    body: JSON.stringify({ error: 'No auth token' })
  };
}
// 🔐 Get logged-in user from token
const userClient = createClient(
  supabaseUrl,
  process.env.VITE_SUPABASE_ANON_KEY,
  {
    global: {
      headers: {
        Authorization: authHeader
      }
    }
  }
);

const { data: { user }, error: userError } =
  await userClient.auth.getUser(authHeader.replace('Bearer ', ''));

if (userError || !user) {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: 'Unauthorized user' })
  };
}


// ✅ CHANGE THIS EMAIL TO YOUR ADMIN EMAIL

if (user.email !== "kansasnelly@gmail.com") {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: 'Not admin' })
  };
}    // Get current user balance
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('balance, email, display_name')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      console.error('[Admin Balance] Error fetching user:', fetchError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const currentBalance = userData.balance || 0;
    let newBalance;

    if (action === 'add') {
      newBalance = currentBalance + amount;
    } else {
      newBalance = currentBalance - amount;
      // Prevent negative balance
      if (newBalance < 0) {
        return {
          statusCode: 400,
          body: JSON.stringify({ error: 'Insufficient balance. Cannot reduce below zero.' })
        };
      }
    }

    // Update user balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        balance: newBalance,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Admin Balance] Error updating balance:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update balance' })
      };
    }

    // Create transaction record for audit trail
    const { error: transactionError } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: action === 'add' ? 'deposit' : 'withdrawal',
        amount: amount,
        description: `Admin ${action === 'add' ? 'added' : 'reduced'} balance. Reason: ${reason || 'No reason provided'}`,
        status: 'completed',
        created_at: new Date().toISOString()
      });

    if (transactionError) {
      console.error('[Admin Balance] Error creating transaction record:', transactionError);
      // Don't fail the operation if transaction logging fails
    }

    console.log(`[Admin Balance] ${action === 'add' ? 'Added' : 'Reduced'} $${amount} to user ${userData.email}. New balance: $${newBalance}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        newBalance,
        previousBalance: currentBalance,
        action,
        amount
      })
    };

  } catch (error) {
    console.error('[Admin Balance] Exception:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};

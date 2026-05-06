// Server-side API route for freezing/unfreezing user accounts
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
    const { userId, action, adminPassword } = JSON.parse(event.body);

    // Validate required fields
    if (!userId || !action) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: userId, action' })
      };
    }

    // Validate action
    if (!['freeze', 'unfreeze'].includes(action)) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Invalid action. Must be "freeze" or "unfreeze"' })
      };
    }

    // Simple admin password check (in production, use proper auth)
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
    if (adminPassword !== ADMIN_PASSWORD) {
      return {
        statusCode: 403,
        body: JSON.stringify({ error: 'Unauthorized' })
      };
    }

    // Import supabase
    const { createClient } = require('@supabase/supabase-js');
    const supabaseUrl = process.env.VITE_SUPABASE_URL;
    

    if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Supabase configuration missing' })
      };
    }

    const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY);
// 🔐 Verify admin using logged-in user
const authHeader = event.headers.authorization;

if (!authHeader) {
  return {
    statusCode: 401,
    body: JSON.stringify({ error: 'No auth token' })
  };
}

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

// ✅ CHANGE THIS EMAIL
if (user.email !== "kansasnelly@gmail.com") {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: 'Not admin' })
  };
}
    // Get current user data
    const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('is_frozen, email, display_name')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      console.error('[Admin Freeze] Error fetching user:', fetchError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    const isFrozen = action === 'freeze';

    // Update user freeze status
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        is_frozen: isFrozen,
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Admin Freeze] Error updating freeze status:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to update freeze status' })
      };
    }

    console.log(`[Admin Freeze] ${action === 'freeze' ? 'Froze' : 'Unfroze'} user ${userData.email}`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        isFrozen,
        action
      })
    };

  } catch (error) {
    console.error('[Admin Freeze] Exception:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};

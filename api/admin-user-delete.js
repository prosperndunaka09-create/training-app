// Server-side API route for deleting user accounts (soft delete)
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
    const { userId, adminPassword } = JSON.parse(event.body);
if (adminPassword !== process.env.ADMIN_PASSWORD) {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: 'Invalid admin password' })
  };
}
    // Validate required fields
    if (!userId) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required field: userId' })
      };
    }

    // Admin password + logged-in user verification
    

    // Import supabase
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
    /// 🔐 Verify admin using logged-in user
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

// Get current user data before deletion
const { data: userData, error: fetchError } = await supabase
      .from('users')
      .select('email, display_name')
      .eq('id', userId)
      .single();

    if (fetchError || !userData) {
      console.error('[Admin Delete] Error fetching user:', fetchError);
      return {
        statusCode: 404,
        body: JSON.stringify({ error: 'User not found' })
      };
    }

    // Soft delete - update user_status to 'deleted'
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        user_status: 'deleted',
        updated_at: new Date().toISOString()
      })
      .eq('id', userId);

    if (updateError) {
      console.error('[Admin Delete] Error soft deleting user:', updateError);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to delete user' })
      };
    }

    console.log(`[Admin Delete] Soft deleted user ${userData.email} (${userData.display_name})`);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        success: true, 
        message: 'User soft deleted successfully'
      })
    };

  } catch (error) {
    console.error('[Admin Delete] Exception:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};

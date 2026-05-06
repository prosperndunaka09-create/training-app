// Server-side API route for updating user VIP level
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
    const { userId, vipLevel, adminPassword } = JSON.parse(event.body);

    // Validate required fields
    if (!userId || vipLevel === undefined) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Missing required fields: userId, vipLevel' })
      };
    }

    // Validate VIP level (1-5)
    if (typeof vipLevel !== 'number' || vipLevel < 1 || vipLevel > 5) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'VIP level must be between 1 and 5' })
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
    

    // Check required env variables
if (!supabaseUrl || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Supabase configuration missing' })
  };

// Create admin client (server-side)
const supabase = createClient(
  supabaseUrl,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 🔐 Verify admin using logged-in user
const authHeader = event.headers?.authorization;

if (!authHeader) {
  return {
    statusCode: 401,
    body: JSON.stringify({ error: 'No auth token' })
  };
}

// Create user client (to verify JWT)
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

// Get current user
const { data: { user }, error: userError } =
  await userClient.auth.getUser(authHeader.replace('Bearer ', ''));

if (userError || !user) {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: 'Unauthorized user' })
  };
}

// ✅ Only admin allowed
if (user.email !== "kansasnelly@gmail.com") {
  return {
    statusCode: 403,
    body: JSON.stringify({ error: 'Not admin' })
  };
// Get current user data
const { data: userData, error: fetchError } = await supabase
  .from('users')
  .select('vip_level, email, display_name')
  .eq('id', userId)
  .single();

if (fetchError || !userData) {
  console.error('[Admin VIP] Error fetching user:', fetchError);
  return {
    statusCode: 404,
    body: JSON.stringify({ error: 'User not found' })
  };
}

const previousVipLevel = userData.vip_level || 1;

// Update user VIP level
const { error: updateError } = await supabase
  .from('users')
  .update({
    vip_level: vipLevel,
    updated_at: new Date().toISOString()
  })
  .eq('id', userId);

if (updateError) {
  console.error('[Admin VIP] Error updating VIP level:', updateError);
  return {
    statusCode: 500,
    body: JSON.stringify({ error: 'Failed to update VIP level' })
  };
}

console.log(
  `[Admin VIP] Updated VIP level for user ${userData.email} from VIP${previousVipLevel} to VIP${vipLevel}`
);

return {
  statusCode: 200,
  body: JSON.stringify({
    success: true,
    previousVipLevel,
    newVipLevel: vipLevel
  })
};

catch (error) {
  console.error('[Admin VIP] Exception:', error);
  return {
    statusCode: 500,
    body: JSON.stringify({
      error: 'Internal server error',
      message: error.message
    })
  };
}

}; // closes function

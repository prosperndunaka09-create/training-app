import { createClient } from '@supabase/supabase-js';


// Initialize database client
const supabaseUrl = 'https://dpqhspojbffcyfxgiget.databasepad.com';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCIsImtpZCI6ImYwMmRmYzQ5LTdlM2MtNGQyMy05ZTZhLTM0NTE2NjQzNmZmMCJ9.eyJwcm9qZWN0SWQiOiJkcHFoc3BvamJmZmN5ZnhnaWdldCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNzcyNzYxMjEyLCJleHAiOjIwODgxMjEyMTIsImlzcyI6ImZhbW91cy5kYXRhYmFzZXBhZCIsImF1ZCI6ImZhbW91cy5jbGllbnRzIn0.F31KOV0_SHVnQpp80l2aLd0mroKt0idpd_nYyY2YCSA';
const supabase = createClient(supabaseUrl, supabaseKey);


export { supabase };
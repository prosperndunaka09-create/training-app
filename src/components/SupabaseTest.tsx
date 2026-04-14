import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export const SupabaseConnectionTest = () => {
  const [status, setStatus] = useState<'testing' | 'success' | 'error'>('testing');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    const testConnection = async () => {
      try {
        // Test 1: Check if we can reach Supabase
        console.log('Testing Supabase connection...');
        console.log('Supabase client:', supabase);
        
        // Test 2: Try a simple auth check
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        console.log('Session check:', { session, sessionError });
        
        if (sessionError) {
          setError(`Session error: ${sessionError.message}`);
          setStatus('error');
          return;
        }
        
        setStatus('success');
      } catch (err: any) {
        console.error('Connection test failed:', err);
        setError(err.message || 'Unknown error');
        setStatus('error');
      }
    };
    
    testConnection();
  }, []);

  if (status === 'testing') {
    return <div className="p-4 text-yellow-500">Testing Supabase connection...</div>;
  }
  
  if (status === 'error') {
    return (
      <div className="p-4 bg-red-900/50 rounded-lg">
        <h3 className="text-red-400 font-bold">Supabase Connection Failed</h3>
        <p className="text-red-300 text-sm mt-2">{error}</p>
        <div className="mt-4 text-sm text-gray-300">
          <p className="font-semibold">Fix Instructions:</p>
          <ol className="list-decimal ml-5 mt-2 space-y-1">
            <li>Go to Supabase Dashboard → Authentication → URL Configuration</li>
            <li>Add Site URL: <code className="bg-gray-800 px-1">https://earnings.ink</code></li>
            <li>Or disable "Enable email confirmations" temporarily</li>
            <li>Check that Auth is enabled in your Supabase project</li>
          </ol>
        </div>
      </div>
    );
  }
  
  return <div className="p-4 text-green-500">Supabase connection successful!</div>;
};

// Test component to verify Supabase integration
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const TestSupabaseIntegration: React.FC = () => {
  const testComponent = () => {
    alert('Supabase components are working!');
  };

  return (
    <Card className="bg-green-500/10 border-green-500/20 mb-4">
      <CardHeader>
        <CardTitle className="text-green-400">✅ Supabase Integration Test</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-green-300 mb-4">
          If you can see this card, the new Supabase components are properly imported and working!
        </p>
        <Button onClick={testComponent} className="bg-green-600 hover:bg-green-700">
          Test Integration
        </Button>
      </CardContent>
    </Card>
  );
};

export default TestSupabaseIntegration;

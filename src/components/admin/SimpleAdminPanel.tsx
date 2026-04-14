import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Button } from '../ui/button';

const SimpleAdminPanel: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#060a14] p-6">
      <div className="max-w-7xl mx-auto">
        <Card className="bg-green-500/10 border-green-500/20 mb-6">
          <CardHeader>
            <CardTitle className="text-green-400">✅ Admin Panel Loading Successfully!</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-green-300 mb-4">
              The admin panel is working! This confirms the route and basic rendering is functional.
            </p>
            <Button className="bg-green-600 hover:bg-green-700">
              Test Button
            </Button>
          </CardContent>
        </Card>
        
        <Card className="bg-blue-500/10 border-blue-500/20">
          <CardHeader>
            <CardTitle className="text-blue-400">🔧 Next Steps:</CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="text-blue-300 space-y-2">
              <li>✅ Basic admin panel loading confirmed</li>
              <li>🔄 We'll now fix the full admin dashboard</li>
              <li>🚀 Database integration will be restored</li>
              <li>🎯 All features will be working soon</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SimpleAdminPanel;

import React from 'react';
import EnhancedAdminDashboard from '@/components/admin/EnhancedAdminDashboard';
import { Toaster } from '@/components/ui/toaster';

const Admin: React.FC = () => {
  return (
    <>
      <Toaster />
      <EnhancedAdminDashboard />
    </>
  );
};

export default Admin;

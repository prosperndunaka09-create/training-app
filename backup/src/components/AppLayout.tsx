import React from 'react';
import { useAppContext } from '@/contexts/AppContext';
import Navbar from './Navbar';
import AuthModal from './AuthModal';
import LandingHero from './LandingHero';
import Dashboard from './Dashboard';
import TaskGrid from './TaskGrid';
import WalletSection from './WalletSection';
import WithdrawalSection from './WithdrawalSection';
import ProfileSection from './ProfileSection';
import AdminPanel from './AdminPanel';
import TelegramWidget from './TelegramWidget';
import Footer from './Footer';
const AppLayout: React.FC = () => {
  const {
    isAuthenticated,
    activeTab
  } = useAppContext();
  const renderContent = () => {
    if (!isAuthenticated) {
      return <LandingHero />;
    }
    switch (activeTab) {
      case 'tasks':
        return <TaskGrid />;
      case 'wallet':
        return <WalletSection />;
      case 'withdraw':
        return <WithdrawalSection />;
      case 'profile':
        return <ProfileSection />;
      case 'admin':
        return <AdminPanel />;
      case 'dashboard':
      default:
        return <Dashboard />;
    }
  };
  return <div className="min-h-screen bg-[#060a14] text-white text-left">
      <Navbar />
      <AuthModal />
      <TelegramWidget />

      {isAuthenticated ? <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {renderContent()}
        </main> : renderContent()}

      <Footer />
    </div>;
};
export default AppLayout;
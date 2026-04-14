import React from 'react';
import { Send, MessageCircle } from 'lucide-react';

const TelegramWidget: React.FC = () => {
  const telegramUrl = "https://t.me/EARNINGSLLCONLINECS1";
  
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {/* Telegram Button */}
      <a
        href={telegramUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="group relative flex items-center justify-center w-14 h-14 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-full shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 transition-all duration-300 hover:scale-110"
        title="Contact Customer Service"
      >
        {/* Small CS Logo */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
            <span className="text-white font-bold text-xs">CS</span>
          </div>
        </div>
        
        {/* Pulse Animation */}
        <div className="absolute inset-0 rounded-full bg-blue-500 animate-ping opacity-75" />
        
        {/* Hover Tooltip */}
        <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none">
          Customer Service
        </div>
      </a>
      
      {/* Customer Service Badge */}
      <div className="bg-green-500 text-white text-xs px-2 py-1 rounded-full flex items-center gap-1 shadow-lg">
        <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
        Online
      </div>
    </div>
  );
};

export default TelegramWidget;

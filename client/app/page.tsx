'use client';

import { useState } from 'react';
import { TopBar } from '@/components/layout/TopBar';
import { Sidebar } from '@/components/layout/Sidebar';
import { MainContent } from '@/components/layout/MainContent';
import { QueryHistory } from '@/components/query/QueryHistory';
import { Dashboard } from '@/components/dashboard/Dashboard';
import { QueryBuilder } from '@/components/query/QueryBuilder';
import { UploadData } from '@/components/data/UploadData';
import { Settings } from '@/components/settings/Settings';
import { useAuth } from '@/contexts/AuthContext';
import { Profile } from '@/components/profile/Profile';
import { Favorites } from '@/components/favorites/Favorites';

export default function HomePage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user } = useAuth();
  const [activeSection, setActiveSection] = useState('dashboard');
  
  // render the appropriate component based on activeSection
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard': 
        return <Dashboard onSectionChange={setActiveSection} />;
      case 'query-builder':
        return <QueryBuilder />;
      case 'history':
        return <QueryHistory user={user} database={undefined} />;
      case 'favorites':
        return <Favorites user={user} database={undefined} />;
      case 'upload':
        return <UploadData />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <Profile />;
      default:
        return <Dashboard onSectionChange={setActiveSection} />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-50 dark:bg-gray-900">
      {/* sidebar */}
      <Sidebar 
        isOpen={sidebarOpen} 
        onClose={() => setSidebarOpen(false)}
        activeSection={activeSection}
        onSectionChange={setActiveSection}
      />
      
      {/* main content */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* top bar */}
        <TopBar 
          onMenuClick={() => setSidebarOpen(true)}
          user={user}
          onSectionChange={setActiveSection}
        />
        
        {/* main content area  */}
        <div className="flex-1 overflow-auto">
          {renderContent()}
        </div>
      </div>
      
      {/* mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black bg-opacity-50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}
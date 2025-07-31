// components/Layout.tsx
// This component creates the main dashboard structure with a header,
// collapsible sidebar, and a main content area.

import Header from '../layouts/AdminHeader';
import Footer from '../layouts/AdminFooter';
import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../Sidebar';

interface AdminLayoutProps {
  children?: ReactNode; // 'children' is optional as Outlet is used
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const [isSidebarOpen, setIsSidebarOpen] = useState<boolean>(true);

  // On smaller screens, the sidebar should be closed by default.
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setIsSidebarOpen(false);
      } else {
        setIsSidebarOpen(true);
      }
    };
    window.addEventListener('resize', handleResize);
    handleResize(); // run on initial render
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return (
    <div className="flex h-screen bg-white text-gray-50 font-sans">
      <Sidebar isOpen={isSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header toggleSidebar={() => setIsSidebarOpen(!isSidebarOpen)} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-white-50 p-6 z-0">
          {children || <Outlet />}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
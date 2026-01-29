'use client';

import React from 'react';
import Settings from '../../pages/Settings';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import Login from '../../components/Login';

export default function SettingsRoute() {
  const { user } = useAuth();

  if (!user) {
    return <Login />;
  }

  // Passing a dummy onMenuClick since we might not have the sidebar here,
  // or we could treat this as a standalone mobile view.
  return (
    <div className="flex flex-col h-full bg-[#343541] text-gray-100">
        <div className="p-4 bg-[#202123] border-b border-gray-700 flex items-center">
            <Link href="/" className="flex items-center text-gray-300 hover:text-white transition-colors">
                <ArrowLeft size={20} className="mr-2" />
                <span className="font-medium">Voltar para Home</span>
            </Link>
        </div>
        <div className="flex-1 overflow-hidden">
             <Settings onMenuClick={() => {}} />
        </div>
    </div>
  );
}

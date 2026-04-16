/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  MessageSquare, 
  Send, 
  Users, 
  Gavel, 
  Settings, 
  Bell,
  Search,
  Plus,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Menu,
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from './lib/utils';
import type { Case, CaseStage } from './types';

// Sub-components
import Dashboard from './components/Dashboard';
import DocumentAnalysis from './components/DocumentAnalysis';
import NavigatorChat from './components/NavigatorChat';
import Communications from './components/Communications';
import ProfessionalFinder from './components/ProfessionalFinder';
import TribunalPrep from './components/TribunalPrep';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [appCase, setAppCase] = useState<Case>({
    childName: 'Maya',
    age: 7,
    laName: 'Kent County Council',
    currentStage: 'Draft Plan',
    nextDeadline: '2026-05-15',
    deadlineLabel: 'LA Response Deadline',
    docs: [
      { id: '1', name: 'Draft EHCP — Section B, E, F', type: 'Draft Plan', uploadDate: '3 days ago', status: 'flagged', flagsCount: 3 },
      { id: '2', name: 'LA Refusal Letter — July 2025', type: 'LA Letter', uploadDate: 'Oct 2025', status: 'reviewed' },
      { id: '3', name: 'EP Report — Dr. Sarah Mills', type: 'Professional Report', uploadDate: 'Oct 2025', status: 'reviewed' },
    ],
    comms: [
      { id: '1', title: 'Section F Objection Letter', to: 'SEN Team, Kent', status: 'draft', date: 'Drafted today', content: '', isAiGenerated: true },
    ]
  });

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'documents', label: 'Documents', icon: FileText },
    { id: 'chat', label: 'Navigator Chat', icon: MessageSquare },
    { id: 'comms', label: 'Communications', icon: Send },
    { id: 'professionals', label: 'Team', icon: Users },
    { id: 'tribunal', label: 'Tribunal Prep', icon: Gavel },
  ];

  return (
    <div className="flex h-screen bg-[#FDF8F6] text-slate-900 overflow-hidden font-sans">
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 280 : 80 }}
        className={cn(
          "bg-white border-r border-[#EADDD7] flex flex-col z-50 transition-all duration-300 relative shrink-0",
          !isSidebarOpen && "items-center"
        )}
      >
        <div className="p-6 flex items-center gap-3 h-20">
          <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white shrink-0">
            <Gavel size={20} />
          </div>
          {isSidebarOpen && (
            <span className="font-display italic font-bold text-xl tracking-tight text-brand-900 truncate">
              Navigator
            </span>
          )}
        </div>

        <nav className="flex-1 px-3 space-y-1">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group relative",
                activeTab === tab.id 
                  ? "bg-brand-50 text-brand-700 font-bold" 
                  : "text-slate-500 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <tab.icon size={22} className={cn(
                "shrink-0",
                activeTab === tab.id ? "text-brand-600" : "group-hover:text-slate-900"
              )} />
              {isSidebarOpen && (
                <span className="text-sm">{tab.label}</span>
              )}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeTab"
                  className="absolute left-0 w-1 h-6 bg-brand-600 rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#EADDD7]">
          <button className={cn(
            "w-full flex items-center gap-3 px-3 py-3 rounded-xl text-slate-500 hover:bg-slate-50 transition-colors",
            !isSidebarOpen && "justify-center"
          )}>
            <Settings size={22} />
            {isSidebarOpen && <span className="text-sm font-medium">Settings</span>}
          </button>
          
          <div className={cn(
            "mt-4 p-3 bg-brand-50 rounded-2xl border border-brand-100 flex items-center gap-3",
            !isSidebarOpen && "hidden"
          )}>
            <div className="w-10 h-10 rounded-full bg-brand-200 flex items-center justify-center text-brand-800 font-bold overflow-hidden border-2 border-white shrink-0">
              <img src="https://picsum.photos/seed/user/100/100" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold truncate">Parent: Sarah</p>
              <p className="text-xs text-brand-600 truncate">Maya's Advocate</p>
            </div>
          </div>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-3 top-24 w-6 h-6 bg-white border border-[#EADDD7] rounded-full flex items-center justify-center text-slate-400 hover:text-brand-600 shadow-sm transition-colors hidden lg:flex"
        >
          {isSidebarOpen ? <X size={12} /> : <Menu size={12} />}
        </button>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0 bg-[#FDF8F6] relative h-full">
        <header className="h-20 bg-white/80 backdrop-blur-md border-b border-[#EADDD7] flex items-center justify-between px-8 shrink-0">
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-slate-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h1>
            <div className="px-3 py-1 bg-brand-100 text-brand-700 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-2">
              <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-pulse" />
              Child: {appCase.childName}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="relative group hidden md:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-brand-600 transition-colors" size={18} />
              <input 
                type="text" 
                placeholder="Search case files..." 
                className="pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 transition-all w-64"
              />
            </div>
            <button className="p-2.5 text-slate-500 hover:bg-slate-50 rounded-xl relative transition-colors">
              <Bell size={20} />
              <span className="absolute top-2 right-2.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white" />
            </button>
            <button className="px-4 py-2 bg-brand-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm hover:bg-brand-800 transition-all active:scale-95 shrink-0">
              <Plus size={18} />
              <span className="hidden sm:inline">Add Resource</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-4 md:p-8 custom-scrollbar">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="h-full"
            >
              {activeTab === 'dashboard' && <Dashboard appCase={appCase} />}
              {activeTab === 'documents' && <DocumentAnalysis appCase={appCase} />}
              {activeTab === 'chat' && <NavigatorChat appCase={appCase} />}
              {activeTab === 'comms' && <Communications appCase={appCase} />}
              {activeTab === 'professionals' && <ProfessionalFinder />}
              {activeTab === 'tribunal' && <TribunalPrep appCase={appCase} />}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #EADDD7;
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #D2BAB0;
        }
      `}</style>
    </div>
  );
}


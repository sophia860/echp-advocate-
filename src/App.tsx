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

// UI Components
import Modal from './components/ui/Modal';
import Toast from './components/ui/Toast';

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

  // Global UI State
  const [isAddResourceOpen, setIsAddResourceOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [toast, setToast] = useState<{ message: string; isVisible: boolean }>({ message: '', isVisible: false });
  const [notifications, setNotifications] = useState([
    { id: '1', text: "🔴 Vague provision flagged in Maya's draft EHCP", time: '2h ago' },
    { id: '2', text: "⏰ LA Response deadline passed 2 days ago", time: '1d ago' },
    { id: '3', text: "✅ Navigator analysis complete for Draft EHCP", time: '3d ago' },
  ]);

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    setTimeout(() => setToast(prev => ({ ...prev, isVisible: false })), 3000);
  };

  const dismissNotification = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  const tabs = [
    { id: 'dashboard', label: 'Command', icon: LayoutDashboard },
    { id: 'documents', label: 'Evidence', icon: FileText },
    { id: 'chat', label: 'Aide', icon: MessageSquare },
    { id: 'comms', label: 'Outreach', icon: Send },
    { id: 'professionals', label: 'Alliance', icon: Users },
    { id: 'tribunal', label: 'Prep', icon: Gavel },
  ];

  useEffect(() => {
    const tabLabel = tabs.find(t => t.id === activeTab)?.label ?? 'Navigator';
    document.title = `${tabLabel} — ${appCase.childName} | EHCP Navigator`;
  }, [activeTab, appCase.childName]);

  return (
    <div className="flex h-screen bg-brand-bg text-brand-primary overflow-hidden font-sans selection:bg-brand-accent/30">
      <AnimatePresence>
        {!isSidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsSidebarOpen(true)}
            className="fixed inset-0 bg-brand-primary/40 backdrop-blur-sm z-40 lg:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar: The Control Column */}
      <motion.aside 
        initial={false}
        animate={{ width: isSidebarOpen ? 300 : 96 }}
        className={cn(
          "bg-brand-primary text-white flex flex-col z-50 transition-all duration-500 relative shrink-0",
          !isSidebarOpen && "items-center"
        )}
      >
        <div className="p-10 flex items-center gap-4 h-28 relative">
           <div className="w-12 h-12 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10 shrink-0">
            <Gavel className="text-brand-accent" size={28} />
          </div>
          {isSidebarOpen && (
            <span className="text-display text-2xl tracking-tight translate-y-1">
              Navigator
            </span>
          )}
        </div>

        <nav className="flex-1 px-4 space-y-2 mt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] transition-all duration-300 group relative text-left",
                activeTab === tab.id 
                  ? "bg-white/10 text-white shadow-lg" 
                  : "text-white/40 hover:text-white"
              )}
            >
              <tab.icon size={24} className={cn(
                "shrink-0 transition-transform group-hover:scale-110",
                activeTab === tab.id ? "text-brand-accent" : ""
              )} />
              {isSidebarOpen && (
                <span className="text-[13px] font-bold uppercase tracking-[0.2em]">{tab.label}</span>
              )}
              {!isSidebarOpen && (
                <span className="absolute left-full ml-6 px-4 py-2 bg-brand-primary border border-white/10 text-white text-[10px] font-bold uppercase tracking-widest rounded-xl whitespace-nowrap opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-50 shadow-2xl">
                  {tab.label}
                </span>
              )}
              {activeTab === tab.id && (
                <motion.div 
                  layoutId="activeBar"
                  className="absolute left-0 w-1 h-8 bg-brand-accent rounded-r-full"
                />
              )}
            </button>
          ))}
        </nav>

        <div className="p-8 space-y-6">
           <div className={cn(
            "p-5 bg-white/5 rounded-3xl border border-white/5 flex items-center gap-4 transition-all hover:bg-white/10 group cursor-pointer",
            !isSidebarOpen && "p-0 bg-transparent border-0"
          )}>
            <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-primary font-bold overflow-hidden border-2 border-brand-accent shrink-0 group-hover:scale-105 transition-transform">
              <img src="https://picsum.photos/seed/sarah-navigator/100/100" alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            </div>
            {isSidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">Sarah</p>
                <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest truncate">Case Lead</p>
              </div>
            )}
          </div>
          
          <button 
            onClick={() => setIsSettingsOpen(true)}
            className={cn(
              "w-full flex items-center gap-4 px-5 py-4 rounded-[1.25rem] text-white/40 hover:text-white hover:bg-white/5 transition-all",
              !isSidebarOpen && "justify-center"
            )}
          >
            <Settings size={22} />
            {isSidebarOpen && <span className="text-[10px] font-black uppercase tracking-[0.2em]">Context</span>}
          </button>
        </div>

        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="absolute -right-4 top-24 w-8 h-8 bg-brand-primary border border-white/10 rounded-full flex items-center justify-center text-white/40 hover:text-brand-accent shadow-xl transition-all hidden lg:flex active:scale-95"
        >
          {isSidebarOpen ? <X size={14} /> : <Menu size={14} />}
        </button>
      </motion.aside>

      <main className="flex-1 flex flex-col min-w-0 bg-brand-bg relative h-full">
        <header className="h-28 glass border-b border-brand-primary/5 flex items-center justify-between px-12 shrink-0 z-30">
          <div className="flex items-center gap-8">
            <div className="space-y-1">
              <h1 className="text-3xl text-display">
                {tabs.find(t => t.id === activeTab)?.label}
              </h1>
              <div className="flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.2em]">Case Verified • {appCase.childName}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <div className="relative group hidden xl:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-primary/20 group-focus-within:text-brand-accent transition-colors" size={20} />
              <input 
                type="text" 
                placeholder="Query file matrix..." 
                className="pl-12 pr-6 py-4 bg-brand-primary/5 border border-transparent rounded-2xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 focus:bg-white focus:border-brand-accent/20 transition-all w-80"
              />
            </div>
            
            <div className="relative">
              <button 
                onClick={() => setShowNotifications(!showNotifications)}
                className={cn(
                  "w-14 h-14 bg-white border border-brand-primary/5 shadow-sm text-brand-primary/40 hover:text-brand-primary hover:bg-brand-bg rounded-2xl relative transition-all flex items-center justify-center",
                  showNotifications && "bg-brand-primary text-white"
                )}
              >
                <Bell size={24} />
                {notifications.length > 0 && (
                  <span className="absolute top-4 right-4 w-2.5 h-2.5 bg-brand-accent rounded-full border-2 border-white shadow-[0_0_8px_rgba(255,98,0,0.5)]" />
                )}
              </button>

              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 20, scale: 0.9 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 20, scale: 0.9 }}
                    className="absolute right-0 mt-6 w-96 bg-white border border-brand-primary/5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.1)] z-50 overflow-hidden"
                  >
                    <div className="p-8 bg-brand-bg/50 flex items-center justify-between border-b border-brand-primary/5">
                      <span className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.2em]">Live Feed</span>
                      {notifications.length > 0 && (
                        <button 
                          onClick={() => setNotifications([])}
                          className="text-[10px] text-brand-accent font-black uppercase tracking-widest hover:underline"
                        >
                          Clear Sync
                        </button>
                      )}
                    </div>
                    <div className="max-h-[500px] overflow-y-auto custom-scrollbar">
                      {notifications.length > 0 ? (
                        notifications.map(n => (
                          <div key={n.id} className="p-8 border-b border-brand-primary/5 last:border-0 hover:bg-brand-bg transition-colors group flex items-start gap-6">
                            <div className="w-10 h-10 bg-brand-accent/5 rounded-xl flex items-center justify-center text-brand-accent shrink-0 group-hover:scale-110 transition-transform">
                               {n.text.includes('🔴') ? <AlertCircle size={20} /> : <Clock size={20} />}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-bold text-brand-primary leading-relaxed">{n.text.replace(/🔴|⏰|✅ /g, '')}</p>
                              <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-widest mt-2">{n.time} • Global Server {n.id}</p>
                            </div>
                            <button 
                              onClick={() => dismissNotification(n.id)}
                              className="text-brand-primary/10 hover:text-red-500 p-2 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))
                      ) : (
                        <div className="p-16 text-center">
                          <p className="text-sm text-brand-primary/30 font-bold italic">Matrix is clear</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <button 
              onClick={() => setIsAddResourceOpen(true)}
              className="btn-accent flex items-center gap-3 px-8 text-xs font-black uppercase tracking-widest"
            >
              <Plus size={20} />
              <span className="hidden sm:inline">Add Intent</span>
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-12 custom-scrollbar relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              className="h-full"
            >
              {activeTab === 'dashboard' && (
                <Dashboard 
                  appCase={appCase} 
                  onNavigate={setActiveTab} 
                  onUpdateCase={(updated) => setAppCase({ ...appCase, ...updated })}
                />
              )}
              {activeTab === 'documents' && (
                <DocumentAnalysis 
                  appCase={appCase} 
                  onUpdateDocs={(docs) => setAppCase({ ...appCase, docs })}
                  onToast={showToast}
                />
              )}
              {activeTab === 'chat' && <NavigatorChat appCase={appCase} />}
              {activeTab === 'comms' && (
                <Communications 
                  appCase={appCase} 
                  onAddComm={(comm) => setAppCase(prev => ({ ...prev, comms: [comm, ...prev.comms] }))}
                  onUpdateComm={(updatedComm) => setAppCase(prev => ({ ...prev, comms: prev.comms.map(c => c.id === updatedComm.id ? updatedComm : c) }))}
                  onToast={showToast}
                />
              )}
              {activeTab === 'professionals' && (
                <ProfessionalFinder 
                  onToast={showToast}
                />
              )}
              {activeTab === 'tribunal' && (
                <TribunalPrep 
                  appCase={appCase} 
                  onToast={showToast}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Global Context Modals */}
      <Modal 
        isOpen={isAddResourceOpen} 
        onClose={() => setIsAddResourceOpen(false)} 
        title="Deploy New Intent"
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4">
          {[
            { id: 'documents', title: 'File Matrix', desc: 'Analyse and lock evidence', icon: FileText, color: 'bg-brand-primary/5 text-brand-primary' },
            { id: 'professionals', title: 'Alliance', desc: 'Secure independent experts', icon: Users, color: 'bg-emerald-50 text-emerald-600' },
            { id: 'comms', title: 'Outreach', desc: 'Command AI response system', icon: Send, color: 'bg-brand-accent/5 text-brand-accent' },
          ].map((option) => (
            <button
              key={option.id}
              onClick={() => {
                setActiveTab(option.id);
                setIsAddResourceOpen(false);
              }}
              className="p-10 rounded-[3rem] border border-brand-primary/5 bg-brand-bg hover:bg-brand-accent hover:border-brand-accent transition-all duration-500 text-left group shadow-sm hover:shadow-2xl hover:shadow-brand-accent/30 hover:-translate-y-2"
            >
              <div className={cn("w-16 h-16 rounded-[1.5rem] flex items-center justify-center mb-6 group-hover:bg-white group-hover:scale-110 transition-all", option.color)}>
                <option.icon size={32} />
              </div>
              <h4 className="text-xl font-bold text-brand-primary group-hover:text-white mb-2">{option.title}</h4>
              <p className="text-xs text-brand-primary/40 group-hover:text-white/60 leading-relaxed font-bold uppercase tracking-widest scale-90 -translate-x-2">{option.desc}</p>
            </button>
          ))}
        </div>
      </Modal>

      <Modal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        title="Case Context"
      >
        <div className="space-y-10 p-6">
          <div className="space-y-3">
            <label className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Subject Name</label>
            <input 
              type="text" 
              value={appCase.childName}
              onChange={(e) => setAppCase(prev => ({ ...prev, childName: e.target.value }))}
              className="w-full px-8 py-5 bg-brand-bg border border-brand-primary/5 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent/20"
            />
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Local Authority (Region)</label>
            <input 
              type="text" 
              value={appCase.laName}
              onChange={(e) => setAppCase(prev => ({ ...prev, laName: e.target.value }))}
              className="w-full px-8 py-5 bg-brand-bg border border-brand-primary/5 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent/20"
            />
          </div>
          <button 
            onClick={() => {
              setIsSettingsOpen(false);
              showToast("✓ Records Updated");
            }}
            className="w-full py-6 btn-primary text-xs font-black uppercase tracking-widest shadow-2xl"
          >
            Commit Changes
          </button>
        </div>
      </Modal>

      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}


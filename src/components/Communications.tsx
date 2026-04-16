import { 
  Plus, 
  Send, 
  Clock, 
  CheckCircle2, 
  FileEdit, 
  Download,
  Search,
  ArrowRight,
  Mail,
  Sparkles
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import type { Case } from '../types';

export default function Communications({ appCase }: { appCase: Case }) {
  const allComms = [
    ...appCase.comms,
    { id: '2', title: 'Initial EHCP Request', to: 'SEN Team, Kent', status: 'sent', date: 'Mar 2025', content: '', isAiGenerated: false },
    { id: '3', title: 'Chaser — 6-week mark', to: 'SEN Team, Kent', status: 'sent', date: 'Apr 2025', content: '', isAiGenerated: true },
    { id: '4', title: 'Refusal Challenge', to: 'SEN Team, Kent', status: 'sent', date: 'May 2025', content: '', isAiGenerated: true },
    { id: '5', title: 'LA Acknowledgement', to: 'Parent', status: 'received', date: 'Mar 2025', content: '', isAiGenerated: false },
    { id: '6', title: 'LA Refusal', to: 'Parent', status: 'received', date: 'Apr 2025', content: '', isAiGenerated: false },
    { id: '7', title: 'Draft EHCP', to: 'Parent', status: 'received', date: 'Jun 2025', content: '', isAiGenerated: false },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center bg-white p-6 rounded-[2.5rem] border border-[#EADDD7] shadow-sm">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600">
            <Mail size={24} />
          </div>
          <div>
            <h2 className="text-xl font-bold font-display italic tracking-tight">Communications Centre</h2>
            <p className="text-xs text-slate-400 font-medium">Manage all letter drafts and records</p>
          </div>
        </div>
        <button className="px-5 py-2.5 bg-brand-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-900/10 hover:bg-brand-800 transition-all">
          <Plus size={18} /> Draft New Letter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Recent Timeline
          </h3>
          
          <div className="space-y-3">
            {allComms.map((comm) => (
              <motion.div 
                whileHover={{ x: 4 }}
                key={comm.id} 
                className="bg-white p-5 rounded-[2rem] border border-[#EADDD7] shadow-sm flex items-center justify-between group"
              >
                <div className="flex items-center gap-4 min-w-0">
                  <div className={cn(
                    "w-10 h-10 rounded-xl flex items-center justify-center shrink-0",
                    comm.status === 'draft' ? "bg-brand-50 text-brand-600" :
                    comm.status === 'sent' ? "bg-emerald-50 text-emerald-600" :
                    "bg-blue-50 text-blue-600"
                  )}>
                    {comm.status === 'draft' ? <FileEdit size={18} /> : 
                     comm.status === 'sent' ? <Send size={18} /> : 
                     <Download size={18} />}
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="font-bold text-sm truncate">{comm.title}</p>
                      {comm.isAiGenerated && (
                        <span className="flex items-center gap-1 text-[9px] font-bold text-brand-500 bg-brand-50 px-1.5 py-0.5 rounded-full uppercase tracking-tighter">
                          <Sparkles size={10} /> AI
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400">
                      {comm.status === 'draft' ? 'To: ' : 
                       comm.status === 'sent' ? 'To: ' : 
                       'From: '} {comm.to} • {comm.date}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  {comm.status === 'draft' ? (
                    <button className="px-4 py-2 bg-brand-900 text-white rounded-xl text-xs font-bold hover:bg-brand-800 transition-colors">
                      Review & Send
                    </button>
                  ) : (
                    <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors rounded-lg">
                      <Download size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2.5rem] border border-[#EADDD7] shadow-sm">
            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-4">Draft Templates</h3>
            <div className="space-y-2">
              {[
                'Section F Objection',
                'Timeline Chaser',
                'Request for Assessment',
                'Response to Refusals',
                'Appeal Notice'
              ].map((template, i) => (
                <button key={i} className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-sm flex items-center justify-between group">
                  <span className="text-slate-600 font-medium">{template}</span>
                  <ArrowRight size={14} className="text-slate-300 group-hover:text-brand-600 group-hover:translate-x-1 transition-all" />
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50/50 p-6 rounded-[2.5rem] border border-emerald-100 flex items-start gap-4">
            <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shrink-0 shadow-sm border border-emerald-100">
               <CheckCircle2 size={24} />
            </div>
            <div>
              <p className="font-bold text-emerald-900 text-sm">Legal Accuracy</p>
              <p className="text-xs text-emerald-700 mt-1 leading-relaxed font-medium">
                The AI ensures all drafted letters cite the correct sections of the **SEND Code of Practice 2015**.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

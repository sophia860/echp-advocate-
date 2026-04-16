import { useState } from 'react';
import { 
  Gavel, 
  Target, 
  MessageSquare, 
  FileCheck, 
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Bot,
  Loader2,
  Lock,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import type { Case } from '../types';

export default function TribunalPrep({ appCase }: { appCase: Case }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeSession, setActiveSession] = useState(false);

  return (
    <div className="h-full space-y-8">
      {!isUnlocked ? (
        <div className="max-w-4xl mx-auto mt-12">
          <div className="bg-white p-12 rounded-[3.5rem] border-2 border-brand-900/10 shadow-2xl shadow-brand-900/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-96 h-96 bg-brand-50 rounded-full -mr-48 -mt-48 group-hover:scale-105 transition-transform duration-1000" />
            <div className="relative z-10 text-center">
              <div className="w-20 h-20 bg-brand-900 rounded-[2rem] flex items-center justify-center text-white mx-auto mb-8 shadow-xl shadow-brand-900/20">
                <Gavel size={40} />
              </div>
              <h2 className="text-4xl font-display italic font-bold text-slate-900 mb-4 tracking-tight">Unlock Tribunal Mode</h2>
              <p className="text-slate-500 max-w-xl mx-auto mb-10 text-lg leading-relaxed">
                Heading to SENDIST? Get specialized AI preparation tools designed to strengthen your case and your confidence.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-lg mx-auto mb-10">
                {[
                  { icon: Target, title: 'Mock Cross-Exam', desc: 'AI plays the panel role' },
                  { icon: FileCheck, title: 'Evidence Builder', desc: 'Auto-index your bundle' },
                  { icon: ShieldCheck, title: 'Legal Grounding', desc: 'Cite R (L) v Waltham Forest' },
                  { icon: Zap, title: 'Priority Access', desc: 'Faster AI reasoning' },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-3 items-start p-4 bg-brand-50 rounded-2xl border border-brand-100">
                    <feature.icon className="text-brand-600 shrink-0" size={20} />
                    <div>
                      <p className="font-bold text-sm text-brand-900 leading-tight">{feature.title}</p>
                      <p className="text-[10px] text-brand-600 font-medium uppercase tracking-wider mt-1">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-4">
                <button 
                  onClick={() => setIsUnlocked(true)}
                  className="px-10 py-5 bg-brand-900 text-white rounded-[1.5rem] text-lg font-bold shadow-xl shadow-brand-900/20 hover:bg-brand-800 transition-all flex items-center gap-3 active:scale-95"
                >
                  Upgrade Case £39/mo <ArrowRight size={20} />
                </button>
                <p className="text-xs text-slate-400 flex items-center gap-2">
                  <Lock size={12} /> Secure Checkout via Shopify Billing
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 pb-12">
          {/* Main Prep Area */}
          <div className="lg:col-span-2 space-y-8">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl font-display italic font-bold tracking-tight">Tribunal Coach</h2>
                <p className="text-slate-400 text-sm font-medium mt-1">Practise your evidence and strategy</p>
              </div>
              <div className="px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl text-xs font-bold uppercase tracking-widest flex items-center gap-2 border border-emerald-100">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 Ready for Maya's Case
              </div>
            </div>

            <div className="bg-white p-8 rounded-[3rem] border border-[#EADDD7] shadow-sm relative min-h-[400px] flex flex-col">
              {!activeSession ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                   <div className="w-16 h-16 bg-slate-50 text-slate-300 rounded-3xl flex items-center justify-center mb-6 border border-slate-100">
                      <MessageSquare size={32} />
                   </div>
                   <h3 className="text-xl font-bold mb-2">Start a Mock Hearing Session</h3>
                   <p className="text-slate-500 max-w-sm mb-8 italic">The Navigator will ask you questions a panel might ask, then provide feedback on your legal and emotional grounding.</p>
                   <button 
                    onClick={() => setActiveSession(true)}
                    className="px-8 py-4 bg-brand-900 text-white rounded-2xl font-bold flex items-center gap-3 shadow-lg shadow-brand-900/10 hover:bg-brand-800 transition-all"
                   >
                     Begin Session <ArrowRight size={18} />
                   </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col">
                   <div className="flex-1 space-y-6">
                      <div className="flex gap-4">
                         <div className="w-10 h-10 bg-brand-900 text-white rounded-xl flex items-center justify-center shrink-0 shadow-lg">
                            <Bot size={20} />
                         </div>
                         <div className="flex-1 p-5 bg-brand-50 rounded-3xl rounded-tl-none border border-brand-100">
                            <p className="font-bold text-brand-900 text-sm mb-2 uppercase tracking-widest">Tribunal Roleplay</p>
                            <p className="text-slate-800 font-medium leading-relaxed italic">
                              "Mrs. Sarah, you've mentioned in your statement that Maya experiences 'high-level anxiety' during transition. Can you specify how this manifests specifically at the school gate, and why you feel the current provision is insufficient to address this?"
                            </p>
                         </div>
                      </div>

                      <div className="text-center py-8">
                         <span className="text-[10px] font-bold text-slate-300 uppercase tracking-[0.3em]">Parent is Responding...</span>
                      </div>
                   </div>
                   <div className="mt-auto pt-6 border-t border-slate-50 flex gap-3">
                      <button className="flex-1 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-400 text-sm font-medium hover:bg-slate-100 transition-colors">
                        Type your answer...
                      </button>
                      <button className="px-6 py-4 bg-brand-900 text-white rounded-2xl font-bold shadow-lg shadow-brand-900/10 hover:bg-brand-800 transition-all">
                        Send Response
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Right: Evidence Tracker */}
          <div className="space-y-6">
             <div className="bg-white p-8 rounded-[3rem] border border-[#EADDD7] shadow-sm">
                <h3 className="text-lg font-bold mb-6">Evidence Bundle</h3>
                <div className="space-y-4">
                  {[
                    { title: 'EP Report (Sarah Mills)', status: 'ready', date: '2024' },
                    { title: 'SALT Assessment', status: 'ready', date: 'June 2025' },
                    { title: 'School Provision Log', status: 'needed', date: '-' },
                    { title: 'Home Evidence Video', status: 'needed', date: '-' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group">
                      <div className="flex items-center gap-3 min-w-0">
                         {item.status === 'ready' ? (
                           <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />
                         ) : (
                           <AlertTriangle size={16} className="text-amber-500 shrink-0" />
                         )}
                         <div className="truncate">
                           <p className="text-sm font-bold truncate group-hover:text-brand-900">{item.title}</p>
                           <p className="text-[10px] text-slate-400 font-medium uppercase tracking-widest">{item.date === '-' ? 'Missing' : item.date}</p>
                         </div>
                      </div>
                      <ChevronRight size={16} className="text-slate-200 group-hover:text-brand-600 transition-all" />
                    </div>
                  ))}
                  <button className="w-full mt-4 py-3 bg-brand-50 text-brand-700 border border-dashed border-brand-200 rounded-2xl text-sm font-bold hover:bg-brand-100 transition-colors">
                     Add to Bundle
                  </button>
                </div>
             </div>

             <div className="bg-brand-100/30 p-8 rounded-[3rem] border border-brand-100">
                <h3 className="text-lg font-bold text-brand-900 mb-4 italic">Advocates Corner</h3>
                <p className="text-sm text-brand-800 leading-relaxed mb-4">
                  Tribunal panels are looking for **Quantified and Specified** provision in Section F. 
                </p>
                <div className="p-4 bg-white/50 rounded-2xl text-xs text-brand-900 font-medium leading-relaxed italic">
                  "If it isn't written down in hours and minutes, the school doesn't have to provide it."
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

function ChevronRight({ size, className }: { size: number, className: string }) {
  return <ArrowRight size={size} className={className} />;
}

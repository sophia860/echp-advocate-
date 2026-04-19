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
  CheckCircle2,
  ChevronRight,
  Plus,
  Users,
  Download
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import type { Case } from '../types';
import { askNavigator } from '../lib/gemini';
import { htmlToPdf, mergePdfs, downloadBase64File, htmlToPdfBase64 } from '../lib/flowr';

export default function TribunalPrep({ appCase, onToast }: { appCase: Case; onToast: (msg: string) => void }) {
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [activeSession, setActiveSession] = useState(false);
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: `Panel Chair active. We are reviewing ${appCase.childName}'s case. In your statement, you mention 'significant sensory processing difficulties' impacting focus. \n\nHow does this manifest specifically during lesson transitions, and why do you feel the current provision is insufficient?` }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [isAddingToBundle, setIsAddingToBundle] = useState(false);
  const [newBundleTitle, setNewBundleTitle] = useState('');
  const [isExportingBundle, setIsExportingBundle] = useState(false);
  
  const [bundle, setBundle] = useState([
    { id: '1', title: 'EP Report (Sarah Mills)', status: 'ready', date: '2024' },
    { id: '2', title: 'SALT Assessment', status: 'ready', date: 'June 2025' },
    { id: '3', title: 'School Provision Log', status: 'needed', date: '-' },
    { id: '4', title: 'Home Evidence Video', status: 'needed', date: '-' },
  ]);
  
  const handleSendResponse = async () => {
    if (!userInput.trim() || isAiResponding) return;
    
    const newMessages: { role: 'user' | 'assistant'; content: string }[] = [...messages, { role: 'user', content: userInput }];
    setMessages(newMessages);
    setUserInput('');
    setIsAiResponding(true);

    const history = newMessages
      .filter((m, i) => !(i === 0 && m.role === 'assistant'))
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

    const prompt = `
      You are an expert Tribunal Prep Coach for families in England going to a SENDIST tribunal. 
      Case Context:
      - Child: ${appCase.childName} (Age ${appCase.age})
      - LA: ${appCase.laName}
      - Current Stage: ${appCase.currentStage}
      
      The parent just responded to your question: "${userInput}". 
      
      1. Provide a brief encouraging but direct "Coach Insight" on how their answer would be perceived by a panel (is it specific enough? does it cite evidence? is it legally relevant?).
      2. Then, play the role of the LA Representative or the Panel Chair and ask a follow-up cross-examination style question that challenges their position or asks for quantification. 
      
      Keep it professional, helpful, and firm to prepare them for the real hearing.
    `;
    
    const response = await askNavigator(prompt, history);
    setMessages([...newMessages, { role: 'assistant' as const, content: response }]);
    setIsAiResponding(false);
  };

  const confirmAddToBundle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBundleTitle.trim()) return;
    
    const newItem = {
      id: Math.random().toString(36).substr(2, 9),
      title: newBundleTitle,
      status: 'ready' as const,
      date: 'Today'
    };
    setBundle([...bundle, newItem]);
    setNewBundleTitle('');
    setIsAddingToBundle(false);
    onToast("✓ Added to bundle");
  };

  const handleExportBundle = async () => {
    const readyItems = bundle.filter(item => item.status === 'ready');
    if (readyItems.length === 0) {
      onToast('No ready documents in the bundle to export.');
      return;
    }
    setIsExportingBundle(true);
    try {
      const today = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
      const coverHtml = `
        <!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>
          body { font-family: Georgia, serif; color: #0A2540; padding: 80px 60px; background: #F8F5F2; }
          h1 { font-size: 32pt; color: #0A2540; margin-bottom: 8px; font-family: 'Playfair Display', serif; }
          h2 { font-size: 14pt; font-weight: normal; color: #FF6200; margin-top: 0; text-transform: uppercase; letter-spacing: 0.2em; }
          .meta { margin-top: 60px; font-size: 11pt; line-height: 2; border-top: 2px solid #0A2540; padding-top: 40px; }
          .index { margin-top: 48px; }
          .index h3 { font-size: 12pt; text-transform: uppercase; letter-spacing: 0.2em; color: rgba(10, 37, 64, 0.4); border-bottom: 1px solid rgba(10, 37, 64, 0.1); padding-bottom: 12px; font-weight: 900; }
          .index-item { padding: 15px 0; border-bottom: 1px solid rgba(10, 37, 64, 0.05); font-size: 11pt; display: flex; justify-content: space-between; font-weight: 500; }
          .badge { font-size: 9pt; color: #FF6200; font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
          .footer { position: fixed; bottom: 40px; font-size: 9pt; color: rgba(10, 37, 64, 0.2); font-weight: 900; text-transform: uppercase; letter-spacing: 0.1em; }
        </style></head>
        <body>
          <h1>Appellate Evidence Matrix</h1>
          <h2>RE: ${appCase.childName} • CASE_ID_${appCase.childName.toUpperCase()}_2026</h2>
          <div class="meta">
            <strong>Target Authority:</strong> ${appCase.laName}<br/>
            <strong>Jurisdiction:</strong> SENDIST Tribunal<br/>
            <strong>Matrix Compiled:</strong> ${today}<br/>
            <strong>Intelligence Sync:</strong> EHCP Navigator Premium
          </div>
          <div class="index">
            <h3>Matrix Contents</h3>
            ${readyItems.map((item, i) => `
              <div class="index-item">
                <span><strong>${i + 1}.</strong> ${item.title}</span>
                <span class="badge">Verified Asset · ${item.date}</span>
              </div>
            `).join('')}
          </div>
          <div class="footer">
            STATUTORY COMPLIANCE AUTO-SHIELD • GENERATED ${today}
          </div>
        </body></html>
      `;
      const coverBase64 = await htmlToPdfBase64(coverHtml, 'cover.pdf');
      const filesToMerge: { content: string; name: string }[] = [{ content: coverBase64, name: 'cover.pdf' }];
      for (const item of readyItems) {
        const matchingDoc = appCase.docs.find(d => d.name.toLowerCase().includes(item.title.toLowerCase().split(' ')[0].toLowerCase()));
        if (matchingDoc?.content) {
          const docHtml = `<html><body style="font-family:Georgia,serif;padding:60px;font-size:11pt;line-height:1.8;color:#0A2540;background:#F8F5F2">
            <h2 style="color:#FF6200;border-bottom:2px solid #0A2540;padding-bottom:12px;text-transform:uppercase;letter-spacing:0.2em;font-size:10pt;font-weight:900">EXHIBIT: ${matchingDoc.name}</h2>
            <p style="color:rgba(10,37,64,0.4);font-size:8pt;margin-bottom:40px;text-transform:uppercase;letter-spacing:0.2em;font-weight:900">Type: ${matchingDoc.type} • Matrix Date: ${matchingDoc.uploadDate}</p>
            <div style="font-weight:500">${matchingDoc.content.replace(/\n/g, '<br/>')}</div>
          </body></html>`;
          try {
            const docBase64 = await htmlToPdfBase64(docHtml, `${matchingDoc.name}.pdf`);
            filesToMerge.push({ content: docBase64, name: `${matchingDoc.name}.pdf` });
          } catch {}
        }
      }
      if (filesToMerge.length === 1) {
        downloadBase64File(coverBase64, `${appCase.childName}_Tribunal_Matrix_${today.replace(/ /g, '_')}.pdf`, 'application/pdf');
      } else {
        await mergePdfs(filesToMerge, `${appCase.childName}_Tribunal_Matrix_${today.replace(/ /g, '_')}.pdf`);
      }
      onToast('✓ Evidence Matrix downloaded successfully');
    } catch (error) {
      onToast('⚠ Matrix export failed.');
    } finally {
      setIsExportingBundle(false);
    }
  };

  return (
    <div className="h-full space-y-10">
      {!isUnlocked ? (
        <div className="max-w-5xl mx-auto mt-12">
          <div className="bg-brand-primary p-16 rounded-[4rem] border border-white/5 shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-brand-accent/10 rounded-full -mr-64 -mt-64 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
            <div className="relative z-10 text-center">
              <div className="w-24 h-24 bg-brand-accent rounded-[2.5rem] flex items-center justify-center text-white mx-auto mb-10 shadow-2xl shadow-brand-accent/20">
                <Gavel size={48} strokeWidth={1.5} />
              </div>
              <h2 className="text-5xl text-display text-white mb-6">Upgrade to Statutory Advocate</h2>
              <p className="text-white/40 max-w-2xl mx-auto mb-16 text-lg font-medium leading-relaxed tracking-wide">
                Unlock high-fidelity tribunal simulations and legal-grade evidence bundling. Built for families who need a definitive advantage in SENDIST hearings.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 text-left max-w-6xl mx-auto mb-16">
                {[
                  { icon: Target, title: 'Panel Sim', desc: 'Mock cross-examination' },
                  { icon: FileCheck, title: 'Matrix Builder', desc: 'Legal-grade bundling' },
                  { icon: ShieldCheck, title: 'Case Law Sync', desc: 'Automated legal citations' },
                  { icon: Zap, title: 'Reasoning+', desc: 'Pro-tier AI analysis' },
                ].map((feature, i) => (
                  <div key={i} className="flex gap-4 items-start p-6 bg-white/5 rounded-3xl border border-white/10 hover:bg-white/10 transition-colors">
                    <feature.icon className="text-brand-accent shrink-0" size={24} strokeWidth={1.5} />
                    <div>
                      <p className="font-black text-xs text-white uppercase tracking-widest leading-tight">{feature.title}</p>
                      <p className="text-[10px] text-white/40 font-bold uppercase tracking-widest mt-2 leading-relaxed">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex flex-col items-center gap-6">
                <button 
                  onClick={() => setIsUnlocked(true)}
                  className="px-12 py-7 bg-brand-accent text-white rounded-[2rem] text-xl font-black shadow-2xl shadow-brand-accent/30 hover:bg-white hover:text-brand-primary transition-all flex items-center gap-4 active:scale-95 group"
                >
                  Acquire Case Upgrade <ArrowRight size={24} className="group-hover:translate-x-2 transition-transform" />
                </button>
                <div className="flex items-center gap-3 text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">
                  <Lock size={14} /> SECURE_CHECKOUT_SHOPIFY_v2.0
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 pb-12">
          {/* Simulation Console */}
          <div className="lg:col-span-8 space-y-10">
            <div className="flex justify-between items-end">
              <div className="space-y-1">
                <h2 className="text-4xl text-display">Advocate Simulator</h2>
                <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em]">RE: ${appCase.childName.toUpperCase()} PROTOCOL</p>
              </div>
              <div className="px-6 py-2 bg-emerald-50 text-emerald-600 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-3 border border-emerald-100 shadow-sm">
                 <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse" />
                 Simulation Ready
              </div>
            </div>

            <div className="bg-white p-10 rounded-[4rem] border border-brand-primary/5 shadow-2xl relative min-h-[600px] flex flex-col overflow-hidden">
               <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden opacity-10">
                <div className="absolute top-0 right-0 w-96 h-96 bg-brand-bg rounded-full -mr-48 -mt-48 blur-3xl" />
              </div>
              
              {!activeSession ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-12 relative z-10">
                   <div className="w-24 h-24 bg-brand-bg text-brand-primary/20 rounded-[2.5rem] flex items-center justify-center mb-8 border border-brand-primary/5 shadow-inner">
                      <MessageSquare size={40} strokeWidth={1} />
                   </div>
                   <h3 className="text-2xl text-display mb-4">Initialize Mock Hearing</h3>
                   <p className="text-brand-primary/40 max-w-sm mb-12 text-xs font-bold uppercase tracking-widest leading-relaxed">The advocate engine will simulate panel cross-examination to audit your evidence and legal stance.</p>
                   <button 
                    onClick={() => setActiveSession(true)}
                    className="px-12 py-6 btn-primary text-xs font-black uppercase tracking-widest flex items-center gap-4 transition-all"
                   >
                     Initiate Session <ArrowRight size={20} strokeWidth={2.5} />
                   </button>
                </div>
              ) : (
                <div className="flex-1 flex flex-col relative z-10 h-full">
                   <div className="flex-1 space-y-10 overflow-y-auto pr-4 custom-scrollbar pb-10">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn("flex gap-6", msg.role === 'user' ? "flex-row-reverse" : "")}>
                          <div className={cn(
                            "w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 shadow-lg border-2",
                            msg.role === 'assistant' ? "bg-brand-primary border-brand-primary text-white" : "bg-white border-brand-primary/5 text-brand-primary"
                          )}>
                             {msg.role === 'assistant' ? <Bot size={22} strokeWidth={1.5} /> : <Users size={22} strokeWidth={1.5} />}
                          </div>
                          <div className={cn(
                            "flex-1 p-8 rounded-[2.5rem] border shadow-sm",
                            msg.role === 'assistant' ? "bg-brand-bg rounded-tl-none border-brand-primary/5" : "bg-white rounded-tr-none border-brand-primary/5"
                          )}>
                             <p className={cn(
                               "text-[9px] font-black mb-3 uppercase tracking-widest opacity-30",
                               msg.role === 'assistant' ? "text-brand-primary" : "text-brand-primary"
                             )}>
                               {msg.role === 'assistant' ? 'Advocate Engine' : 'Asset Input'}
                             </p>
                             <div className="prose prose-brand prose-sm max-w-none text-brand-primary/80 font-medium italic">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                             </div>
                          </div>
                        </div>
                      ))}

                      {isAiResponding && (
                        <div className="flex gap-6 animate-pulse">
                           <div className="w-12 h-12 bg-brand-primary text-white rounded-[1rem] flex items-center justify-center shrink-0 shadow-lg">
                              <Bot size={22} />
                           </div>
                           <div className="flex-1 p-8 bg-brand-bg rounded-[2.5rem] rounded-tl-none border border-brand-primary/5 flex items-center gap-4">
                             <div className="flex gap-1.5">
                               {[0, 1, 2].map(i => (
                                 <motion.div key={i} animate={{ scale: [1, 1.3, 1] }} transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} className="w-2 h-2 bg-brand-accent rounded-full" />
                               ))}
                             </div>
                             <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">Processing response...</span>
                           </div>
                        </div>
                      )}
                   </div>
                   
                   <div className="mt-auto pt-10 border-t border-brand-primary/5 flex gap-4">
                      <textarea 
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder="State your evidence points..."
                        rows={2}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendResponse();
                          }
                        }}
                        className="flex-1 px-8 py-6 bg-brand-bg border border-brand-primary/5 rounded-[2rem] text-brand-primary text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 transition-all resize-none placeholder:text-brand-primary/20"
                      />
                      <button 
                        onClick={handleSendResponse}
                        disabled={!userInput.trim() || isAiResponding}
                        className="px-10 bg-brand-primary text-white rounded-[1.5rem] font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/20 hover:bg-brand-accent disabled:opacity-20 transition-all flex items-center justify-center min-w-[200px]"
                      >
                        {isAiResponding ? <Loader2 size={24} className="animate-spin" /> : 'Commit Response'}
                      </button>
                   </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Space: Evidence Matrix */}
          <div className="lg:col-span-4 space-y-8">
             <div className="bg-white p-10 rounded-[3.5rem] border border-brand-primary/5 shadow-xl glass">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-xl font-bold">Evidence Matrix</h3>
                  <div className="w-8 h-8 bg-brand-bg rounded-lg flex items-center justify-center text-brand-primary/20">
                    <Zap size={16} />
                  </div>
                </div>
                <div className="space-y-4">
                  {bundle.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 hover:bg-brand-bg rounded-[1.5rem] transition-all cursor-pointer group border border-transparent hover:border-brand-primary/5">
                      <div className="flex items-center gap-4 min-w-0">
                         {item.status === 'ready' ? (
                           <div className="w-6 h-6 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center border border-emerald-100">
                             <CheckCircle2 size={14} strokeWidth={3} />
                           </div>
                         ) : (
                           <div className="w-6 h-6 bg-brand-accent/5 text-brand-accent rounded-full flex items-center justify-center border border-brand-accent/10">
                             <AlertTriangle size={14} strokeWidth={3} />
                           </div>
                         )}
                         <div className="truncate">
                           <p className="text-xs font-black truncate text-brand-primary/80 group-hover:text-brand-primary uppercase tracking-tight">{item.title}</p>
                           <p className="text-[9px] text-brand-primary/30 font-black uppercase tracking-widest mt-0.5">{item.date === '-' ? 'PENDING' : item.date}</p>
                         </div>
                      </div>
                      <ChevronRight size={16} className="text-brand-primary/10 group-hover:text-brand-accent transition-all" />
                    </div>
                  ))}
                  
                  <div className="pt-6 space-y-4">
                    <AnimatePresence>
                      {isAddingToBundle ? (
                        <motion.form 
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          onSubmit={confirmAddToBundle}
                          className="bg-brand-bg p-6 rounded-[2rem] border border-brand-primary/5 space-y-4"
                        >
                          <input 
                            autoFocus
                            type="text" 
                            placeholder="Label asset..."
                            value={newBundleTitle}
                            onChange={e => setNewBundleTitle(e.target.value)}
                            className="w-full px-5 py-4 bg-white border border-brand-primary/5 rounded-xl text-xs font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 placeholder:text-brand-primary/20"
                          />
                          <div className="flex gap-3">
                            <button type="submit" className="flex-1 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-colors">Add</button>
                            <button type="button" onClick={() => setIsAddingToBundle(false)} className="px-4 py-3 bg-white border border-brand-primary/5 text-brand-primary/40 rounded-xl text-[10px] font-black hover:text-brand-primary transition-colors">Cancel</button>
                          </div>
                        </motion.form>
                      ) : (
                        <button 
                          onClick={() => setIsAddingToBundle(true)}
                          className="w-full py-4 bg-brand-bg text-brand-primary/40 border border-dashed border-brand-primary/10 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest hover:bg-brand-bg/80 hover:text-brand-primary transition-all flex items-center justify-center gap-3"
                        >
                          <Plus size={16} strokeWidth={3} /> Append Asset
                        </button>
                      )}
                    </AnimatePresence>
                    
                    {bundle.some(item => item.status === 'ready') && (
                      <button
                        onClick={handleExportBundle}
                        disabled={isExportingBundle}
                        className="w-full py-6 btn-accent text-[10px] font-black uppercase tracking-[0.2em] shadow-2xl shadow-brand-accent/20 transition-all flex items-center justify-center gap-3"
                      >
                        {isExportingBundle ? (
                          <><Loader2 size={18} className="animate-spin" /> Compiling Matrix...</>
                        ) : (
                          <><Download size={18} strokeWidth={2.5} /> Export Matrix PDF</>
                        )}
                      </button>
                    )}
                  </div>
                </div>
             </div>

             <div className="bg-brand-primary p-10 rounded-[3.5rem] border border-white/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000" />
                <h3 className="text-xl text-display text-white mb-6">Expert Insight</h3>
                <p className="text-sm text-white/60 leading-relaxed font-bold uppercase tracking-widest scale-90 origin-left mb-6">
                  Sections B and F must match. If an Educational Need is in Section B, there MUST be a provision in Section F to meet it.
                </p>
                <div className="p-5 bg-white/5 rounded-2xl text-[10px] text-brand-accent font-black leading-relaxed italic uppercase tracking-widest border border-white/5">
                  "Hours and minutes define reality in SENDIST law."
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}

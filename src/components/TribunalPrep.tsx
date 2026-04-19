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
    { role: 'assistant', content: `Hello. I am the Panel Chair. We are here to discuss ${appCase.childName}'s EHCP. To begin, you've mentioned in your statement that ${appCase.childName} experiences 'high-level anxiety' during transitions. Can you specify how this manifests specifically at the school gate, and why you feel the current provision is insufficient to address this?` }
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
      // Step 1: Build a cover page HTML and convert it to PDF base64
      const today = new Date().toLocaleDateString('en-GB', {
        day: 'numeric', month: 'long', year: 'numeric'
      });

      const coverHtml = `
        <!DOCTYPE html><html><head><meta charset="UTF-8">
        <style>
          body { font-family: Georgia, serif; color: #1a1a1a; padding: 80px 60px; }
          h1 { font-size: 28pt; color: #6B2619; margin-bottom: 8px; }
          h2 { font-size: 14pt; font-weight: normal; color: #666; margin-top: 0; }
          .meta { margin-top: 60px; font-size: 11pt; line-height: 2; }
          .index { margin-top: 48px; }
          .index h3 { font-size: 12pt; text-transform: uppercase; letter-spacing: 0.1em; color: #999; border-bottom: 1px solid #eee; padding-bottom: 8px; }
          .index-item { padding: 10px 0; border-bottom: 1px solid #f5f5f5; font-size: 11pt; display: flex; justify-content: space-between; }
          .badge { font-size: 9pt; color: #2d9e6b; font-weight: bold; text-transform: uppercase; }
          .footer { position: fixed; bottom: 40px; font-size: 9pt; color: #bbb; }
        </style></head>
        <body>
          <h1>Tribunal Evidence Bundle</h1>
          <h2>Case of ${appCase.childName}, Age ${appCase.age}</h2>
          <div class="meta">
            <strong>Local Authority:</strong> ${appCase.laName}<br/>
            <strong>Current Stage:</strong> ${appCase.currentStage}<br/>
            <strong>Bundle Prepared:</strong> ${today}<br/>
            <strong>Prepared by:</strong> Parent/Guardian via EHCP Navigator
          </div>
          <div class="index">
            <h3>Bundle Contents</h3>
            ${readyItems.map((item, i) => `
              <div class="index-item">
                <span><strong>${i + 1}.</strong> ${item.title}</span>
                <span class="badge">âœ“ Ready Â· ${item.date}</span>
              </div>
            `).join('')}
          </div>
          <div class="footer">
            EHCP Navigator Â· Generated ${today} Â· SENDIST Tribunal Bundle
          </div>
        </body></html>
      `;

      const coverBase64 = await htmlToPdfBase64(coverHtml, 'cover.pdf');

      // Step 2: Collect all ready document files
      const filesToMerge: { content: string; name: string }[] = [
        { content: coverBase64, name: 'cover.pdf' }
      ];

      for (const item of readyItems) {
        const matchingDoc = appCase.docs.find(d => 
          d.name.toLowerCase().includes(item.title.toLowerCase().split(' ')[0].toLowerCase())
        );
        if (matchingDoc?.content) {
          const docHtml = `<html><body style="font-family:Georgia,serif;padding:40px;font-size:11pt;line-height:1.7">
            <h2 style="color:#6B2619;border-bottom:1px solid #eee;padding-bottom:8px">${matchingDoc.name}</h2>
            <p style="color:#999;font-size:9pt;margin-bottom:24px">Document Type: ${matchingDoc.type} Â· Added: ${matchingDoc.uploadDate}</p>
            <div>${matchingDoc.content.replace(/\n/g, '<br/>')}</div>
          </body></html>`;

          try {
            const docBase64 = await htmlToPdfBase64(docHtml, `${matchingDoc.name}.pdf`);
            filesToMerge.push({ content: docBase64, name: `${matchingDoc.name}.pdf` });
          } catch {
            // skip this doc silently if conversion fails
          }
        }
      }

      // Step 3: Merge all into one bundle PDF
      if (filesToMerge.length === 1) {
        downloadBase64File(coverBase64, `${appCase.childName}_Tribunal_Bundle_${today.replace(/ /g, '_')}.pdf`, 'application/pdf');
      } else {
        await mergePdfs(
          filesToMerge,
          `${appCase.childName}_Tribunal_Bundle_${today.replace(/ /g, '_')}.pdf`
        );
      }

      onToast('✓ Tribunal bundle downloaded successfully');
    } catch (error) {
      console.error('Bundle export error:', error);
      onToast('âš  Bundle export failed. Please try again.');
    } finally {
      setIsExportingBundle(false);
    }
  };

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

            <div className="bg-white p-8 rounded-[3rem] border border-[#EADDD7] shadow-sm relative min-h-[500px] flex flex-col">
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
                   <div className="flex-1 space-y-6 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar pb-8">
                      {messages.map((msg, i) => (
                        <div key={i} className={cn("flex gap-4", msg.role === 'user' ? "flex-row-reverse" : "")}>
                          <div className={cn(
                            "w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-lg",
                            msg.role === 'assistant' ? "bg-brand-900 text-white" : "bg-brand-50 text-brand-700"
                          )}>
                             {msg.role === 'assistant' ? <Bot size={20} /> : <Users size={20} />}
                          </div>
                          <div className={cn(
                            "flex-1 p-5 rounded-3xl border",
                            msg.role === 'assistant' ? "bg-brand-50 rounded-tl-none border-brand-100" : "bg-white rounded-tr-none border-slate-200"
                          )}>
                             <p className={cn(
                               "font-bold text-[10px] mb-2 uppercase tracking-widest",
                               msg.role === 'assistant' ? "text-brand-900" : "text-slate-400"
                             )}>
                               {msg.role === 'assistant' ? 'Tribunal Coach' : 'Parent Response'}
                             </p>
                             <div className="text-slate-800 font-medium leading-relaxed italic prose prose-sm max-w-none">
                                <ReactMarkdown>{msg.content}</ReactMarkdown>
                             </div>
                          </div>
                        </div>
                      ))}

                      {isAiResponding && (
                        <div className="flex gap-4 animate-pulse">
                           <div className="w-10 h-10 bg-brand-900 text-white rounded-xl flex items-center justify-center shrink-0">
                              <Bot size={20} />
                           </div>
                           <div className="flex-1 p-5 bg-brand-50 rounded-3xl rounded-tl-none border border-brand-100">
                             <p className="text-brand-900 text-sm font-bold flex items-center gap-2">
                               <Loader2 size={16} className="animate-spin" /> Thinking...
                             </p>
                           </div>
                        </div>
                      )}
                   </div>
                   
                   <div className="mt-auto pt-6 border-t border-slate-50 flex gap-3">
                      <textarea 
                        value={userInput}
                        onChange={e => setUserInput(e.target.value)}
                        placeholder="Describe your evidence or answer the question..."
                        rows={2}
                        onKeyDown={e => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleSendResponse();
                          }
                        }}
                        className="flex-1 px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 text-sm font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20 resize-none"
                      />
                      <button 
                        onClick={handleSendResponse}
                        disabled={!userInput.trim() || isAiResponding}
                        className="px-6 py-4 bg-brand-900 text-white rounded-2xl font-bold shadow-lg shadow-brand-900/10 hover:bg-brand-800 disabled:opacity-50 disabled:hover:bg-brand-900 transition-all flex items-center justify-center min-w-[120px]"
                      >
                        {isAiResponding ? <Loader2 size={20} className="animate-spin" /> : 'Send Response'}
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
                  {bundle.map((item, i) => (
                    <div key={item.id} className="flex items-center justify-between p-3 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer group">
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
                  <AnimatePresence>
                    {isAddingToBundle ? (
                      <motion.form 
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        onSubmit={confirmAddToBundle}
                        className="bg-slate-50 p-4 rounded-2xl border border-slate-100 space-y-3"
                      >
                        <input 
                          autoFocus
                          type="text" 
                          placeholder="Evidence title..."
                          value={newBundleTitle}
                          onChange={e => setNewBundleTitle(e.target.value)}
                          className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                        />
                        <div className="flex gap-2">
                          <button type="submit" className="flex-1 py-2 bg-brand-900 text-white rounded-xl text-xs font-bold hover:bg-brand-800">Add</button>
                          <button type="button" onClick={() => setIsAddingToBundle(false)} className="px-3 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-50">Cancel</button>
                        </div>
                      </motion.form>
                    ) : (
                      <button 
                        onClick={() => setIsAddingToBundle(true)}
                        className="w-full mt-4 py-3 bg-brand-50 text-brand-700 border border-dashed border-brand-200 rounded-2xl text-sm font-bold hover:bg-brand-100 transition-colors flex items-center justify-center gap-2"
                      >
                        <Plus size={16} /> Add to Bundle
                      </button>
                    )}
                  </AnimatePresence>
                  {bundle.some(item => item.status === 'ready') && (
                    <button
                      onClick={handleExportBundle}
                      disabled={isExportingBundle}
                      className="w-full mt-2 py-3 bg-brand-900 text-white rounded-2xl text-sm font-bold hover:bg-brand-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/10"
                    >
                      {isExportingBundle ? (
                        <><Loader2 size={16} className="animate-spin" /> Building Bundle...</>
                      ) : (
                        <><Download size={16} /> Export Bundle PDF</>
                      )}
                    </button>
                  )}
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

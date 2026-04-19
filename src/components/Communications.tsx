import { useState } from 'react';
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
  Sparkles,
  Copy,
  Loader2,
  Info,
  Archive
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import type { Case, Communication } from '../types';
import { askNavigator } from '../lib/gemini';
import { htmlToPdf, buildLetterHtml } from '../lib/flowr';
import Modal from './ui/Modal';
import AiButton from './ui/AiButton';

export default function Communications({ 
  appCase,
  onAddComm,
  onUpdateComm,
  onToast
}: { 
  appCase: Case; 
  onAddComm: (comm: Communication) => void; 
  onUpdateComm: (comm: Communication) => void;
  onToast: (msg: string) => void;
}) {
  const [isDraftModalOpen, setIsDraftModalOpen] = useState(false);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [selectedLetterType, setSelectedLetterType] = useState('Section F Objection');
  const [customDescription, setCustomDescription] = useState('');
  const [generatedDraft, setGeneratedDraft] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [reviewingComm, setReviewingComm] = useState<Communication | null>(null);
  const [reviewBody, setReviewBody] = useState('');

  const allComms: Communication[] = [
    ...appCase.comms,
    { id: '2', title: 'Initial EHCP Request', to: 'SEN Team, Kent', status: 'sent', date: 'Mar 2025', content: '', isAiGenerated: false },
    { id: '3', title: 'Chaser — 6-week mark', to: 'SEN Team, Kent', status: 'sent', date: 'Apr 2025', content: '', isAiGenerated: true },
    { id: '4', title: 'Refusal Challenge', to: 'SEN Team, Kent', status: 'sent', date: 'May 2025', content: '', isAiGenerated: true },
    { id: '5', title: 'LA Acknowledgement', to: 'Parent', status: 'received', date: 'Mar 2025', content: '', isAiGenerated: false },
    { id: '6', title: 'LA Refusal', to: 'Parent', status: 'received', date: 'Apr 2025', content: '', isAiGenerated: false },
    { id: '7', title: 'Draft EHCP', to: 'Parent', status: 'received', date: 'Jun 2025', content: '', isAiGenerated: false },
  ];

  const handleGenerate = async () => {
    setIsGenerating(true);
    let prompt = `Draft a formal ${selectedLetterType} letter to the SEN Team at ${appCase.laName} regarding ${appCase.childName}'s EHCP process. Mention child ID ${appCase.childName.toUpperCase()}_v2026.`;
    if (selectedLetterType === 'Custom') {
      prompt = `Draft a formal letter to ${appCase.laName} about ${appCase.childName}'s EHCP case based on these details: ${customDescription}. The tone should be authoritative yet professional.`;
    }
    const result = await askNavigator(prompt);
    setGeneratedDraft(result);
    setIsGenerating(false);
  };

  const handleDownloadLetterPdf = async () => {
    if (!generatedDraft) return;
    setIsDownloadingPdf(true);
    try {
      const html = buildLetterHtml({
        childName: appCase.childName,
        laName: appCase.laName,
        letterTitle: selectedLetterType,
        body: generatedDraft,
        senderName: `Parent of ${appCase.childName}`,
      });
      await htmlToPdf(html, `${selectedLetterType.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Pdf build failure:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSaveDraft = () => {
    if (!generatedDraft) return;
    const newComm: Communication = {
      id: Math.random().toString(36).substr(2, 9),
      title: selectedLetterType === 'Custom' ? 'Strategic Directive' : selectedLetterType,
      to: 'SEN Team Registry',
      status: 'draft',
      date: 'Protocol Today',
      content: generatedDraft,
      isAiGenerated: true
    };
    onAddComm(newComm);
    setGeneratedDraft(null);
    setIsDraftModalOpen(false);
  };

  const handleDownload = (comm: Communication) => {
    const blob = new Blob([`${comm.title}\n\nTo: ${comm.to}\nDate: ${comm.date}\n\n${comm.content || '[Protocol detail encrypted in demo]'}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${comm.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReview = (comm: Communication) => {
    setReviewingComm(comm);
    setReviewBody(comm.content || 'Awaiting intelligence review. This narrative was synthesized via EHCP Navigator.');
    setIsReviewModalOpen(true);
  };

  const handleMarkAsSent = () => {
    if (!reviewingComm) return;
    onUpdateComm({ ...reviewingComm, status: 'sent', content: reviewBody });
    setIsReviewModalOpen(false);
  };

  return (
    <div className="space-y-12 h-full">
      {/* Comms Command Header */}
      <div className="bg-white p-10 rounded-[3.5rem] border border-brand-primary/5 shadow-2xl flex items-center justify-between glass group">
        <div className="flex items-center gap-8">
          <div className="w-16 h-16 bg-brand-primary text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-brand-primary/20 group-hover:bg-brand-accent transition-colors duration-500">
            <Mail size={32} strokeWidth={1.5} />
          </div>
          <div>
            <h2 className="text-4xl text-display">Dispatch Command</h2>
            <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.4em] mt-2 italic">Intelligence Output Control Matrix</p>
          </div>
        </div>
        <button 
          onClick={() => {
            setSelectedLetterType('Section F Objection');
            setIsDraftModalOpen(true);
          }}
          className="px-8 py-4 btn-primary text-xs font-black uppercase tracking-widest flex items-center gap-3 transition-all active:scale-95"
        >
          <Plus size={18} strokeWidth={3} /> Initiate Draft
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full">
        {/* Timeline Pillar */}
        <div className="lg:col-span-8 space-y-8">
          <div className="flex items-end justify-between px-4">
             <h3 className="text-xl font-bold flex items-center gap-3">
               <Archive size={18} className="text-brand-accent" /> Dispatch History
             </h3>
             <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-widest italic">{allComms.length} items synced</p>
          </div>
          
          {allComms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-32 text-center bg-white rounded-[4rem] border border-dashed border-brand-primary/10">
              <div className="w-24 h-24 bg-brand-bg rounded-[2.5rem] flex items-center justify-center text-brand-primary/10 mb-8 border border-brand-primary/5">
                <Mail size={48} strokeWidth={0.5} />
              </div>
              <h3 className="text-2xl text-display mb-4">No Data Points Syncing</h3>
              <p className="text-xs font-black text-brand-primary/30 uppercase tracking-[0.2em] max-w-xs leading-relaxed">Initiate a strategic draft to begin building your communication timeline.</p>
            </div>
          ) : (
            <div className="relative space-y-6 pl-10 before:absolute before:left-[16px] before:top-4 before:bottom-4 before:w-0.5 before:bg-brand-primary/5">
              {allComms.map((comm, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  whileHover={{ x: 6 }}
                  key={comm.id} 
                  className="bg-white p-8 rounded-[2.5rem] border border-brand-primary/5 shadow-xl flex items-center justify-between group relative hover:border-brand-accent/30 transition-all cursor-pointer"
                >
                  {/* Timeline node */}
                  <div className={cn(
                    "absolute -left-[31px] top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-4 border-brand-bg z-10 transition-transform group-hover:scale-125",
                    comm.status === 'draft' ? "bg-brand-primary/20" :
                    comm.status === 'sent' ? "bg-brand-accent" :
                    "bg-emerald-500"
                  )} />
                  
                  <div className="flex items-center gap-8 min-w-0">
                    <div className={cn(
                      "w-14 h-14 rounded-[1.25rem] flex items-center justify-center shrink-0 shadow-sm",
                      comm.status === 'draft' ? "bg-brand-bg text-brand-primary/30" :
                      comm.status === 'sent' ? "bg-brand-accent/10 text-brand-accent" :
                      "bg-emerald-50 text-emerald-500"
                    )}>
                      {comm.status === 'draft' ? <FileEdit size={24} /> : 
                       comm.status === 'sent' ? <Send size={24} /> : 
                       <Mail size={24} />}
                    </div>
                    <div className="truncate">
                      <div className="flex items-center gap-3 mb-1.5">
                        <p className="text-lg font-black text-brand-primary tracking-tight truncate group-hover:text-brand-accent transition-colors">{comm.title}</p>
                        {comm.isAiGenerated && (
                          <span className="flex items-center gap-2 text-[8px] font-black text-brand-accent bg-brand-accent/5 px-2 py-1 rounded-full uppercase tracking-widest border border-brand-accent/10 italic">
                            <Sparkles size={10} /> Intelligence Sync
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-widest">
                        {comm.status === 'draft' ? 'Target: ' : 
                         comm.status === 'sent' ? 'Recipient: ' : 
                         'Origin: '} {comm.to} • {comm.date}
                      </p>
                    </div>
                  </div>
                
                  <div className="flex gap-4">
                    {comm.status === 'draft' ? (
                      <button 
                        onClick={() => handleReview(comm)}
                        className="px-6 py-3 bg-brand-primary text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent transition-all shadow-lg shadow-brand-primary/10"
                      >
                        Execute Review
                      </button>
                    ) : (
                      <button 
                        onClick={() => handleDownload(comm)}
                        className="p-3 text-brand-primary/20 hover:text-brand-primary hover:bg-brand-bg transition-all rounded-xl border border-transparent hover:border-brand-primary/5"
                      >
                        <Download size={20} />
                      </button>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Sidebar Pillar: Strategic Controls */}
        <div className="lg:col-span-4 space-y-10">
          <div className="bg-white p-10 rounded-[3.5rem] border border-brand-primary/5 shadow-xl glass">
            <h3 className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-8 pl-2">Intelligence Library</h3>
            <div className="space-y-4">
              {[
                'Section F Objection',
                'Timeline Chaser',
                'Request for Assessment',
                'Response to Refusals',
                'Appeal Notice'
              ].map((template, i) => (
                <button 
                  key={i} 
                  onClick={() => {
                    setSelectedLetterType(template);
                    setIsDraftModalOpen(true);
                  }}
                  className="w-full text-left p-5 rounded-[1.5rem] hover:bg-brand-bg group transition-all border border-transparent hover:border-brand-primary/5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-brand-primary/60 uppercase tracking-widest group-hover:text-brand-primary transition-colors">{template}</span>
                    <ArrowRight size={18} className="text-brand-primary/10 group-hover:text-brand-accent group-hover:translate-x-1 transition-all" />
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-emerald-50/30 p-10 rounded-[3.5rem] border border-emerald-100/50 flex items-start gap-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full -mr-12 -mt-12 transition-transform duration-700 group-hover:scale-125" />
            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center text-emerald-500 shrink-0 shadow-sm border border-emerald-100/50 relative z-10">
               <CheckCircle2 size={28} />
            </div>
            <div className="relative z-10 space-y-2">
              <p className="font-black text-emerald-900 text-[10px] uppercase tracking-widest">Compliance Protocol</p>
              <p className="text-xs text-emerald-700/70 leading-relaxed font-bold italic">
                AI verified. All narratives strictly adhere to the guidelines established by **R (L) v Waltham Forest (2004)** for quantified Section F provision.
              </p>
            </div>
          </div>
        </div>
      </div>

      <Modal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        title="Initialize Dispatch Sync"
      >
        <div className="p-10 space-y-10">
          <div className="space-y-8">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Matrix Blueprint</label>
              <select 
                value={selectedLetterType}
                onChange={e => setSelectedLetterType(e.target.value)}
                className="w-full px-8 py-5 bg-brand-bg border border-brand-primary/5 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 appearance-none cursor-pointer"
              >
                <option value="Section F Objection">Section F Objection</option>
                <option value="Timeline Chaser">Timeline Chaser</option>
                <option value="Request for Assessment">Request for Assessment</option>
                <option value="Response to Refusals">Response to Refusals</option>
                <option value="Appeal Notice">Appeal Notice</option>
                <option value="Custom">Custom Directive</option>
              </select>
            </div>
            
            {selectedLetterType === 'Custom' && (
              <div className="space-y-3">
                <label className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Strategic Parameters</label>
                <textarea 
                  value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  placeholder="Input specific challenge parameters..."
                  className="w-full px-8 py-6 bg-brand-bg border border-brand-primary/5 rounded-[2rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 min-h-[120px] transition-all resize-none"
                />
              </div>
            )}
          </div>

          {!generatedDraft ? (
            <AiButton 
              onClick={handleGenerate} 
              isLoading={isGenerating}
              className="w-full py-6 btn-primary text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/20"
            >
              Synthesize Narrative
            </AiButton>
          ) : (
            <div className="space-y-10">
              <div className="prose prose-brand prose-sm p-10 bg-brand-bg rounded-[3rem] border border-brand-primary/5 max-h-[400px] overflow-y-auto custom-scrollbar italic font-medium text-brand-primary/80">
                <ReactMarkdown>{generatedDraft}</ReactMarkdown>
              </div>
              <div className="grid grid-cols-3 gap-4">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedDraft);
                    onToast("✓ Logic Copied");
                  }}
                  className="py-5 bg-white border border-brand-primary/5 rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-bg transition-colors"
                >
                  <Copy size={16} /> Copy
                </button>
                <button
                  onClick={handleDownloadLetterPdf}
                  disabled={isDownloadingPdf}
                  className="py-5 bg-brand-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-3 hover:bg-brand-accent disabled:opacity-20 transition-all shadow-xl shadow-brand-primary/10"
                >
                  {isDownloadingPdf
                    ? <><Loader2 size={16} className="animate-spin" /> ...</>
                    : <><Download size={16} strokeWidth={3} /> PDF</>
                  }
                </button>
                <button 
                  onClick={handleSaveDraft}
                  className="py-5 btn-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest"
                >
                  Commit Draft
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Intelligence Review Protocol"
      >
        <div className="p-10 space-y-10">
          <div className="flex justify-between items-start">
             <div>
                <h4 className="text-xl font-bold">{reviewingComm?.title}</h4>
                <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-widest mt-1">Syncing with SEN Team Registry</p>
             </div>
             <div className="px-4 py-1.5 bg-brand-accent/5 text-brand-accent rounded-full text-[9px] font-black uppercase tracking-widest border border-brand-accent/10 italic">Awaiting Authorization</div>
          </div>
          <div className="space-y-3">
            <label className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Narrative Control</label>
            <textarea 
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              className="w-full px-10 py-8 bg-brand-bg border border-brand-primary/5 rounded-[3rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 min-h-[300px] leading-relaxed italic text-brand-primary/80"
            />
          </div>
          <div className="flex gap-4">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="px-8 py-5 border border-brand-primary/5 rounded-2xl text-[10px] font-black uppercase tracking-widest text-brand-primary/20 hover:text-brand-primary hover:bg-brand-bg transition-all"
            >
              Abort Sync
            </button>
            <button 
              onClick={handleMarkAsSent}
              className="flex-1 py-5 btn-primary text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/20 flex items-center justify-center gap-4"
            >
              <Send size={20} strokeWidth={3} /> Deploy Communication
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

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
  Loader2
} from 'lucide-react';
import { motion } from 'motion/react';
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
  onUpdateComm
}: { 
  appCase: Case; 
  onAddComm: (comm: Communication) => void;
  onUpdateComm: (comm: Communication) => void;
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
    let prompt = `Draft a formal ${selectedLetterType} letter to the SEN Team at ${appCase.laName} regarding ${appCase.childName}'s EHCP process.`;
    if (selectedLetterType === 'Custom') {
      prompt = `Draft a formal letter to ${appCase.laName} about ${appCase.childName}'s EHCP case based on these details: ${customDescription}`;
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
        senderName: `Sarah (${appCase.childName}'s Parent)`,
      });
      await htmlToPdf(html, `${selectedLetterType.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Flowr error:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleSaveDraft = () => {
    if (!generatedDraft) return;
    const newComm: Communication = {
      id: Math.random().toString(36).substr(2, 9),
      title: selectedLetterType === 'Custom' ? 'Custom Letter' : selectedLetterType,
      to: 'SEN Team, Kent',
      status: 'draft',
      date: 'Drafted today',
      content: generatedDraft,
      isAiGenerated: true
    };
    onAddComm(newComm);
    setGeneratedDraft(null);
    setIsDraftModalOpen(false);
  };

  const handleDownload = (comm: Communication) => {
    const blob = new Blob([`${comm.title}\n\nTo: ${comm.to}\nDate: ${comm.date}\n\n${comm.content || '[Content not available in demo]'}`], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${comm.title.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleReview = (comm: Communication) => {
    setReviewingComm(comm);
    setReviewBody(comm.content || 'This draft was AI-generated. Review and edit before sending.');
    setIsReviewModalOpen(true);
  };

  const handleMarkAsSent = () => {
    if (!reviewingComm) return;
    onUpdateComm({ ...reviewingComm, status: 'sent', content: reviewBody });
    setIsReviewModalOpen(false);
  };

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
        <button 
          onClick={() => {
            setSelectedLetterType('Section F Objection');
            setIsDraftModalOpen(true);
          }}
          className="px-5 py-2.5 bg-brand-900 text-white rounded-xl text-sm font-bold flex items-center gap-2 shadow-lg shadow-brand-900/10 hover:bg-brand-800 transition-all"
        >
          <Plus size={18} /> Draft New Letter
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-4">
          <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest flex items-center gap-2">
            Recent Timeline
          </h3>
          
          {allComms.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-brand-50 rounded-3xl flex items-center justify-center text-brand-300 mb-4">
                <Mail size={32} />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">No communications yet</h3>
              <p className="text-sm text-slate-400 max-w-xs">Draft your first letter to the LA using one of the templates on the right.</p>
            </div>
          ) : (
            <div className="relative space-y-3 pl-6 before:absolute before:left-[11px] before:top-4 before:bottom-4 before:w-0.5 before:bg-slate-100">
              {allComms.map((comm) => (
                <motion.div 
                  whileHover={{ x: 4 }}
                  key={comm.id} 
                  className="bg-white p-5 rounded-[2rem] border border-[#EADDD7] shadow-sm flex items-center justify-between group relative"
                >
                  {/* Timeline dot */}
                  <div className={cn(
                    "absolute -left-[26px] top-1/2 -translate-y-1/2 w-3.5 h-3.5 rounded-full border-2 border-white z-10",
                    comm.status === 'draft' ? "bg-brand-400" :
                    comm.status === 'sent' ? "bg-emerald-400" :
                    "bg-blue-400"
                  )} />
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
                    <button 
                      onClick={() => handleReview(comm)}
                      className="px-4 py-2 bg-brand-900 text-white rounded-xl text-xs font-bold hover:bg-brand-800 transition-colors"
                    >
                      Review & Send
                    </button>
                  ) : (
                    <button 
                      onClick={() => handleDownload(comm)}
                      className="p-2 text-slate-400 hover:text-brand-600 hover:bg-slate-50 transition-colors rounded-lg"
                    >
                      <Download size={18} />
                    </button>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
          )}
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
                <button 
                  key={i} 
                  onClick={() => {
                    setSelectedLetterType(template);
                    setIsDraftModalOpen(true);
                  }}
                  className="w-full text-left p-3 rounded-xl hover:bg-slate-50 text-sm flex items-center justify-between group"
                >
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

      <Modal
        isOpen={isDraftModalOpen}
        onClose={() => setIsDraftModalOpen(false)}
        title="Draft New Letter"
      >
        <div className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Letter Type</label>
              <select 
                value={selectedLetterType}
                onChange={e => setSelectedLetterType(e.target.value)}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none"
              >
                <option value="Section F Objection">Section F Objection</option>
                <option value="Timeline Chaser">Timeline Chaser</option>
                <option value="Request for Assessment">Request for Assessment</option>
                <option value="Response to Refusals">Response to Refusals</option>
                <option value="Appeal Notice">Appeal Notice</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            
            {selectedLetterType === 'Custom' && (
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Describe what you need</label>
                <textarea 
                  value={customDescription}
                  onChange={e => setCustomDescription(e.target.value)}
                  placeholder="e.g. I need to ask the LA for an extension on the draft response deadline..."
                  className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[100px]"
                />
              </div>
            )}
          </div>

          {!generatedDraft ? (
            <AiButton 
              onClick={handleGenerate} 
              isLoading={isGenerating}
              className="w-full py-4 justify-center text-sm"
            >
              Generate with AI
            </AiButton>
          ) : (
            <div className="space-y-6">
              <div className="prose prose-sm p-5 bg-slate-50 rounded-2xl border border-slate-100 max-h-[300px] overflow-y-auto custom-scrollbar">
                <ReactMarkdown>{generatedDraft}</ReactMarkdown>
              </div>
              <div className="flex gap-3">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(generatedDraft);
                  }}
                  className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-slate-50 text-sm"
                >
                  <Copy size={16} /> Copy
                </button>
                <button
                  onClick={handleDownloadLetterPdf}
                  disabled={isDownloadingPdf}
                  className="flex-1 py-4 bg-slate-700 text-white rounded-2xl font-bold text-sm flex items-center justify-center gap-2 hover:bg-slate-600 disabled:opacity-50 transition-all"
                >
                  {isDownloadingPdf
                    ? <><Loader2 size={16} className="animate-spin" /> PDF...</>
                    : <><Download size={16} /> PDF</>
                  }
                </button>
                <button 
                  onClick={handleSaveDraft}
                  className="flex-1 py-4 bg-brand-900 text-white rounded-2xl font-bold text-sm hover:bg-brand-800"
                >
                  Save as Draft
                </button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      <Modal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        title="Review & Send"
      >
        <div className="space-y-6">
          <div>
             <h4 className="font-bold text-slate-900">{reviewingComm?.title}</h4>
             <p className="text-xs text-slate-400 mt-1">To: {reviewingComm?.to}</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Message Body</label>
            <textarea 
              value={reviewBody}
              onChange={(e) => setReviewBody(e.target.value)}
              className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 min-h-[250px] font-sans leading-relaxed"
            />
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => setIsReviewModalOpen(false)}
              className="flex-1 py-4 bg-white border border-slate-200 rounded-2xl font-bold text-slate-400 hover:bg-slate-50"
            >
              Close
            </button>
            <button 
              onClick={handleMarkAsSent}
              className="flex-1 py-4 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800 shadow-lg shadow-brand-900/10 flex items-center justify-center gap-2"
            >
              <Send size={18} /> Mark as Sent
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

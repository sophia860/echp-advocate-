import { useState, useRef } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Loader2,
  Sparkles,
  Info,
  ArrowRight,
  X,
  Plus,
  Send,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import type { Case, CaseDoc } from '../types';
import { analyzeDocument, askNavigator, scanProvision } from '../lib/gemini';
import { extractTextFromFile, extractStructuredData } from '../lib/flowr';
import Modal from './ui/Modal';
import AiButton from './ui/AiButton';

export default function DocumentAnalysis({ 
  appCase,
  onUpdateDocs,
  onToast
}: { 
  appCase: Case;
  onUpdateDocs: (docs: CaseDoc[]) => void;
  onToast: (msg: string) => void;
}) {
  const [selectedDoc, setSelectedDoc] = useState<CaseDoc | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);
  const [isDraftingResponse, setIsDraftingResponse] = useState(false);
  const [draftResponse, setDraftResponse] = useState<string | null>(null);
  const [isScanningProvision, setIsScanningProvision] = useState(false);
  const [provisionScanResult, setProvisionScanResult] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [newDocInfo, setNewDocInfo] = useState({ name: '', type: 'Draft Plan' });
  const [uploadedFileContent, setUploadedFileContent] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [extractionError, setExtractionError] = useState<string | null>(null);

  const handleAnalyze = async (doc: CaseDoc) => {
    setSelectedDoc(doc);
    setIsAnalyzing(true);
    setAnalysisResult(null);

    const content = doc.content || `Draft EHCP for ${appCase.childName}. Section F provision: "${appCase.childName} will have access to support in the classroom as appropriate to her needs. The school will provide some sensory equipment where possible."`;
    
    const [result] = await Promise.all([
      analyzeDocument(content, doc.type),
      doc.content
        ? extractStructuredData(btoa(new TextEncoder().encode(doc.content).reduce((s, c) => s + String.fromCharCode(c), '')), doc.name)
            .then(fields => {
              if (Object.keys(fields).length > 0) {
                const updatedDocs = appCase.docs.map(d =>
                  d.id === doc.id ? { ...d, structuredData: fields } : d
                );
                onUpdateDocs(updatedDocs);
              }
            })
            .catch(() => {})
        : Promise.resolve(),
    ]);

    setAnalysisResult(result);
    setIsAnalyzing(false);

    if (result) {
      const updatedDocs = appCase.docs.map(d => d.id === doc.id ? { ...d, analysis: result, status: 'reviewed' as const } : d);
      onUpdateDocs(updatedDocs);
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const extension = file.name.split('.').pop()?.toLowerCase();
    const supported = ['txt', 'pdf', 'doc', 'docx'];

    if (!supported.includes(extension || '')) {
      setExtractionError('Unsupported file type. Use PDF, Word, or TXT.');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const text = await extractTextFromFile(file);
      if (!text || text.trim().length === 0) {
        setExtractionError('No text found. Possibly a scanned image.');
        setIsExtracting(false);
        return;
      }
      setUploadedFileContent(text);
      setNewDocInfo(prev => ({ ...prev, name: file.name }));
      setIsUploadModalOpen(true);
    } catch (err) {
      setExtractionError('Problem reading file.');
    } finally {
      setIsExtracting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const confirmUpload = () => {
    const newDoc: CaseDoc = {
      id: Math.random().toString(36).substr(2, 9),
      name: newDocInfo.name,
      type: newDocInfo.type as any,
      uploadDate: 'Today',
      status: 'reviewed',
      content: uploadedFileContent
    };
    onUpdateDocs([newDoc, ...appCase.docs]);
    setIsUploadModalOpen(false);
    handleAnalyze(newDoc);
  };

  const handleDraftResponse = async () => {
    if (!selectedDoc || !analysisResult) return;
    setIsDraftingResponse(true);
    const draft = await askNavigator(`Based on this document analysis of ${selectedDoc.name}, draft a formal response letter to the LA. The analysis found: ${analysisResult}. Write a letter in the parent's voice challenging the weaknesses identified.`);
    setDraftResponse(draft);
    setIsDraftingResponse(false);
  };

  const handleScanProvision = async () => {
    if (!selectedDoc) return;
    setIsScanningProvision(true);
    const result = await scanProvision(selectedDoc.content || '');
    setProvisionScanResult(result);
    setIsScanningProvision(false);
  };

  const statusConfig = {
    flagged: { label: 'Flagged', color: 'bg-brand-accent/10 text-brand-accent border-brand-accent/20 px-4' },
    reviewed: { label: 'Verified', color: 'bg-emerald-50 text-emerald-600 border-emerald-100 px-4' },
    pending: { label: 'Syncing', color: 'bg-brand-primary/5 text-brand-primary/40 border-brand-primary/10 px-4' },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 h-full min-h-[700px]">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept=".txt,.pdf,.doc,.docx"
        className="hidden" 
      />
      
      {/* Left: Evidence Library */}
      <div className="lg:col-span-5 space-y-10">
        <div className="flex justify-between items-end">
          <div className="space-y-1">
            <h2 className="text-3xl text-display">File Matrix</h2>
             <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.2em]">{appCase.docs.length} assets deployed</p>
          </div>
          <button 
            onClick={handleUploadClick}
            disabled={isExtracting}
            className="btn-primary py-3 px-6 text-[10px] font-black uppercase tracking-widest flex items-center gap-3"
          >
            {isExtracting ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Plus size={16} />
            )}
            Add Matrix
          </button>
        </div>

        {extractionError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-red-50 border border-red-100 rounded-[2rem] flex gap-4 items-start"
          >
            <AlertCircle size={20} className="text-red-500 shrink-0 mt-1" />
            <div className="flex-1">
              <p className="text-sm font-black text-red-900 uppercase tracking-tight">Sync Failure</p>
              <p className="text-xs text-red-600/80 mt-1 leading-relaxed">{extractionError}</p>
            </div>
            <button onClick={() => setExtractionError(null)} className="text-red-300 hover:text-red-500"><X size={16} /></button>
          </motion.div>
        )}

        <div className="space-y-4">
          {appCase.docs.map((doc) => (
            <motion.div
              layoutId={doc.id}
              key={doc.id}
              onClick={() => handleAnalyze(doc)}
              className={cn(
                "p-8 rounded-[2.5rem] border transition-all cursor-pointer group flex items-center justify-between",
                selectedDoc?.id === doc.id
                  ? "bg-brand-primary text-white border-brand-primary shadow-2xl shadow-brand-primary/30"
                  : "bg-white border-brand-primary/5 hover:border-brand-accent/30 hover:shadow-xl hover:shadow-brand-accent/5"
              )}
            >
              <div className="flex items-center gap-6 min-w-0">
                <div className={cn(
                  "w-16 h-16 rounded-[1.25rem] flex items-center justify-center shrink-0 transition-colors",
                  selectedDoc?.id === doc.id ? "bg-white/10" : "bg-brand-bg group-hover:bg-brand-accent/5"
                )}>
                  <FileText 
                    size={28} 
                    className={selectedDoc?.id === doc.id ? "text-brand-accent" : "text-brand-primary group-hover:text-brand-accent transition-colors"} 
                  />
                </div>
                <div className="truncate">
                  <p className="text-sm font-black tracking-tight truncate mb-1">{doc.name}</p>
                  <p className={cn(
                    "text-[10px] font-bold uppercase tracking-widest truncate",
                    selectedDoc?.id === doc.id ? "text-white/40" : "text-brand-primary/30"
                  )}>
                    {doc.type} • {doc.uploadDate}
                  </p>
                  <span className={cn(
                    "inline-flex items-center py-1 rounded-full text-[9px] font-black uppercase tracking-widest border mt-3 transition-colors",
                    selectedDoc?.id === doc.id 
                      ? "bg-white/10 text-white border-white/20" 
                      : statusConfig[doc.status].color
                  )}>
                    {statusConfig[doc.status].label}
                    {doc.flagsCount && doc.status === 'flagged' ? ` · ${doc.flagsCount} Critical` : ''}
                  </span>
                </div>
              </div>
              <ChevronRight size={24} className={cn(
                "transition-transform",
                selectedDoc?.id === doc.id ? "text-white translate-x-2" : "text-brand-primary/10 group-hover:text-brand-accent group-hover:translate-x-1"
              )} />
            </motion.div>
          ))}
        </div>

        <div className="p-8 bg-brand-primary/95 text-white rounded-[3rem] border border-white/5 relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-700" />
          <div className="relative z-10 flex gap-6">
            <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-brand-accent shrink-0">
               <Info size={24} />
            </div>
            <div className="space-y-2">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-accent">Strategic Tip</p>
              <p className="text-xs text-white/50 leading-relaxed font-medium">
                Draft EHCPs should always be audited for "Quantification Gaps". If it doesn't say WHO, WHEN, and HOW MUCH, it's a legal weakness.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Right: Analysis & Intelligence Pane */}
      <div className="lg:col-span-7 relative h-full">
        <AnimatePresence mode="wait">
          {!selectedDoc ? (
            <motion.div 
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.98 }}
              className="h-full flex flex-col items-center justify-center p-16 text-center bg-brand-bg/50 border border-dashed border-brand-primary/10 rounded-[4rem]"
            >
              <div className="w-24 h-24 bg-white rounded-[2rem] flex items-center justify-center text-brand-primary/10 mb-8 card-shadow">
                <Search size={48} strokeWidth={1} />
              </div>
              <h3 className="text-2xl text-display mb-4">Awaiting Data Point</h3>
              <p className="text-brand-primary/40 max-w-sm text-sm font-medium leading-relaxed uppercase tracking-widest scale-90">
                Select an asset from the library to initiate deep-scan intelligence analysis.
              </p>
            </motion.div>
          ) : (
            <motion.div 
               key={selectedDoc.id}
               initial={{ opacity: 0, x: 40 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -40 }}
               transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
               className="h-full bg-white rounded-[4rem] border border-brand-primary/5 shadow-2xl flex flex-col overflow-hidden"
            >
              {/* Analysis Header */}
              <div className="p-10 border-b border-brand-primary/5 flex items-center justify-between glass">
                <div>
                  <h3 className="text-xl font-bold truncate max-w-md">{selectedDoc.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                    <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.2em]">Live Intelligence Protocol Active</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                   {isAnalyzing ? (
                     <div className="flex items-center gap-3 px-5 py-2 bg-brand-primary/5 rounded-full">
                       <Loader2 size={16} className="animate-spin text-brand-primary" />
                       <span className="text-[10px] font-black text-brand-primary uppercase tracking-widest">Scanning...</span>
                     </div>
                   ) : (
                      <div className="flex items-center gap-3 px-5 py-2 bg-emerald-50 rounded-full">
                        <CheckCircle2 size={16} className="text-emerald-500" />
                        <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Verified</span>
                      </div>
                   )}
                </div>
              </div>

              {/* Analysis Content */}
              <div className="flex-1 overflow-y-auto p-12 custom-scrollbar space-y-12">
                {isAnalyzing ? (
                  <div className="space-y-10">
                    <div className="h-6 w-1/3 bg-brand-bg rounded-xl animate-pulse" />
                    <div className="space-y-4">
                      <div className="h-40 w-full bg-brand-bg rounded-[2rem] animate-pulse" />
                      <div className="h-4 w-5/6 bg-brand-bg rounded-full animate-pulse" />
                      <div className="h-4 w-4/6 bg-brand-bg rounded-full animate-pulse" />
                    </div>
                  </div>
                ) : (
                  <div className="space-y-12">
                    {/* Structured Extraction Matrix */}
                    {selectedDoc?.structuredData && Object.keys(selectedDoc.structuredData).length > 0 && (
                      <div className="space-y-6">
                        <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Extracted Matrix</p>
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
                          {Object.entries(selectedDoc.structuredData).slice(0, 9).map(([key, value]) => (
                            <div key={key} className="bg-brand-bg/50 p-6 rounded-[1.5rem] border border-brand-primary/5 group hover:bg-white hover:border-brand-accent/20 transition-all">
                              <p className="text-[9px] font-black text-brand-primary/40 uppercase tracking-widest mb-2 group-hover:text-brand-accent transition-colors">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs font-bold text-brand-primary truncate" title={value}>
                                {value || 'NULL'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Main Intelligence Output */}
                    <div className="space-y-6">
                       <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Executive Analysis</p>
                       <div className="bg-brand-bg p-10 rounded-[2.5rem] border border-brand-primary/5 relative group">
                          <div className="absolute top-0 right-0 p-6 text-brand-accent/20 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Sparkles size={24} />
                          </div>
                          <div className="prose prose-brand prose-sm max-w-none text-brand-primary/80 font-medium leading-relaxed text-brand-primary">
                            <ReactMarkdown>
                              {analysisResult || "Awaiting intelligence trigger."}
                            </ReactMarkdown>
                          </div>
                       </div>
                    </div>

                    {/* Critical Tasks */}
                    <div className="space-y-6">
                      <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Action Directives</p>
                      <div className="p-8 bg-brand-accent/5 border border-brand-accent/20 rounded-[2rem] flex gap-6 items-center">
                        <div className="w-14 h-14 bg-brand-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-brand-accent/20">
                          <AlertCircle size={24} strokeWidth={2.5} />
                        </div>
                        <div className="flex-1">
                          <p className="text-xs font-black text-brand-accent uppercase tracking-widest mb-1">compliance alert</p>
                          <p className="text-sm font-bold text-brand-primary leading-snug">
                            Non-statutory language identified in provision clusters. Initiation of challenge outreach recommended.
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Global Actions Bar */}
              <div className="p-10 glass border-t border-brand-primary/5 grid grid-cols-2 gap-6">
                <AiButton 
                  onClick={handleDraftResponse} 
                  isLoading={isDraftingResponse}
                  className="py-5 px-8 btn-primary text-xs font-black uppercase tracking-[0.2em]"
                >
                  <Send size={18} className="mr-3" /> Execute Draft
                </AiButton>
                
                <div className="grid grid-cols-2 gap-4">
                  <button 
                    onClick={() => onToast("✓ Resource Committed")}
                    className="py-5 bg-white border border-brand-primary/5 text-brand-primary rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-bg transition-colors flex items-center justify-center gap-2"
                  >
                    Commit File
                  </button>
                  {selectedDoc?.type === 'Draft Plan' && (
                    <button 
                      onClick={handleScanProvision}
                      className="py-5 bg-brand-accent/5 border border-brand-accent/10 text-brand-accent rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-brand-accent/10 transition-colors"
                    >
                      Audit Sec. F
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Deploy New Evidence"
      >
        <div className="p-10 space-y-10">
          <div className="p-6 bg-brand-accent/5 border border-brand-accent/10 rounded-[1.5rem] flex gap-4">
            <Sparkles size={24} className="text-brand-accent shrink-0" />
            <p className="text-xs text-brand-accent/80 leading-relaxed font-black uppercase tracking-widest">
              Intelligence engine primed. File text extracted. Ready for legal sync.
            </p>
          </div>
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Asset Label</label>
              <input 
                type="text" 
                value={newDocInfo.name}
                onChange={e => setNewDocInfo({ ...newDocInfo, name: e.target.value })}
                className="w-full px-8 py-5 bg-brand-bg border border-brand-primary/5 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Asset Classification</label>
              <select 
                value={newDocInfo.type}
                onChange={e => setNewDocInfo({ ...newDocInfo, type: e.target.value })}
                className="w-full px-8 py-5 bg-brand-bg border border-brand-primary/5 rounded-[1.5rem] text-sm font-bold focus:outline-none appearance-none cursor-pointer"
              >
                <option value="Draft Plan">Draft Plan</option>
                <option value="LA Letter">LA Letter</option>
                <option value="Professional Report">Professional Report</option>
              </select>
            </div>
          </div>
          <button 
            onClick={confirmUpload}
            className="w-full py-6 btn-primary text-xs font-black uppercase tracking-widest"
          >
            Initiate Matrix Sync
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!draftResponse}
        onClose={() => setDraftResponse(null)}
        title="Intelligence Draft"
      >
        <div className="p-10 space-y-10">
          <div className="bg-brand-bg p-10 rounded-[3rem] border border-brand-primary/5 prose prose-brand prose-sm max-w-none text-brand-primary">
            <ReactMarkdown>{draftResponse || ''}</ReactMarkdown>
          </div>
          <button 
            onClick={() => {
              navigator.clipboard.writeText(draftResponse || '');
              onToast("✓ Data Copied");
              setDraftResponse(null);
            }}
            className="btn-accent w-full py-6 text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand-accent/20"
          >
            Copy Intelligence Data
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!provisionScanResult}
        onClose={() => setProvisionScanResult(null)}
        title="Section F Auditor"
      >
        <div className="p-10 space-y-10">
          <div className="p-6 bg-brand-accent/5 border border-brand-accent/10 rounded-[2rem] flex gap-4">
             <AlertCircle size={24} className="text-brand-accent shrink-0" />
             <p className="text-xs text-brand-primary/60 font-bold uppercase tracking-widest leading-relaxed">
               Quantification Audit Active. StatutotrySEND_2015 benchmarks in effect.
             </p>
          </div>
          <div className="bg-brand-bg p-10 rounded-[3rem] border border-brand-primary/5 prose prose-brand prose-sm max-w-none text-brand-primary shadow-sm">
            <ReactMarkdown>{provisionScanResult || ''}</ReactMarkdown>
          </div>
          <button 
            onClick={() => setProvisionScanResult(null)}
            className="w-full py-6 btn-primary text-xs font-black uppercase tracking-widest"
          >
            Acknowledge Findings
          </button>
        </div>
      </Modal>

      <style>{`
        .prose h1, .prose h2, .prose h3 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 900; color: #0A2540; text-transform: uppercase; letter-spacing: -0.01em; }
        .prose p { margin-bottom: 1em; color: rgba(10, 37, 64, 0.8) !important; font-weight: 500; }
        .prose strong { color: #0A2540; font-weight: 900; }
        .prose ul { margin-bottom: 1em; padding-left: 1.5em; list-style-type: none; }
        .prose li { margin-bottom: 0.8rem; position: relative; padding-left: 1.5rem; color: rgba(10, 37, 64, 0.8); }
        .prose li::before { content: "•"; position: absolute; left: 0; color: #FF6200; font-weight: 900; }
      `}</style>
    </div>
  );
}

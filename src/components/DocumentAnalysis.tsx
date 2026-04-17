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
  X
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import type { Case, CaseDoc } from '../types';
import { analyzeDocument, askNavigator, scanProvision } from '../lib/ai-client';
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
    
    // Run Gemini analysis and Flowr extraction in parallel
    const [result] = await Promise.all([
      analyzeDocument(content, doc.type),
      // Only run structured extraction if the doc has real uploaded content
      doc.content
        ? extractStructuredData(btoa(new TextEncoder().encode(doc.content).reduce((s, c) => s + String.fromCharCode(c), '')), doc.name)
            .then(fields => {
              if (Object.keys(fields).length > 0) {
                // Update the doc with structured data
                const updatedDocs = appCase.docs.map(d =>
                  d.id === doc.id ? { ...d, structuredData: fields } : d
                );
                onUpdateDocs(updatedDocs);
              }
            })
            .catch(() => {}) // silent fail â€” structured extraction is a bonus
        : Promise.resolve(),
    ]);

    setAnalysisResult(result);
    setIsAnalyzing(false);

    // Store analysis result back on the doc
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
      setExtractionError('Unsupported file type. Please upload a PDF, Word (.docx), or text (.txt) file.');
      return;
    }

    setIsExtracting(true);
    setExtractionError(null);

    try {
      const text = await extractTextFromFile(file);

      if (!text || text.trim().length === 0) {
        setExtractionError('No text could be extracted from this file. It may be a scanned image â€” please try a text-based PDF.');
        setIsExtracting(false);
        return;
      }

      setUploadedFileContent(text);
      setNewDocInfo(prev => ({ ...prev, name: file.name }));
      setIsUploadModalOpen(true);
    } catch (err) {
      setExtractionError('There was a problem reading this file. Please try again or use a .txt file.');
    } finally {
      setIsExtracting(false);
      // Reset the input so the same file can be re-uploaded if needed
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
    const prompt = `Based on this document analysis of ${selectedDoc.name}, draft a formal response letter to the LA. The analysis found: ${analysisResult}. Write a letter in the parent's voice challenging the weaknesses identified.`;
    const draft = await askNavigator(prompt);
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
    flagged: { label: 'Needs Review', color: 'bg-amber-50 text-amber-700 border-amber-200' },
    reviewed: { label: 'Reviewed', color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    pending: { label: 'Pending', color: 'bg-slate-50 text-slate-500 border-slate-200' },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px]">
      <input 
        type="file" 
        ref={fileInputRef} 
        onChange={handleFileChange}
        accept=".txt,.pdf,.doc,.docx"
        className="hidden" 
      />
      {/* Left: Document List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-display italic tracking-tight">Case Library</h2>
          <button 
            onClick={handleUploadClick}
            disabled={isExtracting}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EADDD7] rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all disabled:opacity-50"
          >
            {isExtracting ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Reading file...
              </>
            ) : (
              <>
                <Upload size={16} /> Upload New
              </>
            )}
          </button>
        </div>

        {extractionError && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 bg-red-50 border border-red-100 rounded-2xl flex gap-3 items-start"
          >
            <AlertCircle size={18} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold text-red-700">Upload Failed</p>
              <p className="text-xs text-red-600 mt-0.5">{extractionError}</p>
            </div>
            <button
              onClick={() => setExtractionError(null)}
              className="ml-auto text-red-300 hover:text-red-500"
            >
              <X size={14} />
            </button>
          </motion.div>
        )}

        <div className="space-y-3">
          {appCase.docs.map((doc) => (
            <motion.div
              layoutId={doc.id}
              key={doc.id}
              onClick={() => handleAnalyze(doc)}
              className={cn(
                "p-5 rounded-[2rem] border transition-all cursor-pointer group flex items-center justify-between",
                selectedDoc?.id === doc.id
                  ? "bg-brand-900 text-white border-brand-900 shadow-xl shadow-brand-900/20"
                  : "bg-white border-[#EADDD7] hover:border-brand-300 hover:shadow-md"
              )}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className={cn(
                  "w-12 h-12 rounded-[1.25rem] flex items-center justify-center shrink-0",
                  selectedDoc?.id === doc.id ? "bg-white/10" : "bg-slate-50"
                )}>
                  <FileText size={24} className={selectedDoc?.id === doc.id ? "text-white" : "text-brand-600"} />
                </div>
                  <div className="truncate">
                    <p className="font-bold text-sm truncate">{doc.name}</p>
                    <p className={cn(
                      "text-xs truncate",
                      selectedDoc?.id === doc.id ? "text-white/60" : "text-slate-400"
                    )}>
                      {doc.type} • Uploaded {doc.uploadDate}
                    </p>
                    <span className={cn(
                      "inline-flex items-center px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider border mt-1",
                      selectedDoc?.id === doc.id 
                        ? "bg-white/20 text-white border-white/30" 
                        : statusConfig[doc.status].color
                    )}>
                      {statusConfig[doc.status].label}
                      {doc.flagsCount && doc.status === 'flagged' ? ` · ${doc.flagsCount} flags` : ''}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <ChevronRight size={20} className={cn(
                    "transition-transform",
                    selectedDoc?.id === doc.id ? "text-white" : "text-slate-300 group-hover:translate-x-1"
                  )} />
                </div>
            </motion.div>
          ))}
        </div>

        <div className="p-6 bg-blue-50/50 rounded-[2.5rem] border border-blue-100/50 flex gap-4">
          <div className="w-10 h-10 bg-white rounded-2xl flex items-center justify-center text-blue-600 shrink-0 shadow-sm">
            <Info size={20} />
          </div>
          <div>
            <p className="font-bold text-slate-900 text-sm italic">Pro Tip</p>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Always request EHCP drafts in editable format (Word) if possible. It makes it easier for the AI to analyze specific wording for tribunal preparation.
            </p>
          </div>
        </div>
      </div>

      {/* Right: Analysis Pane */}
      <div className="relative">
        <AnimatePresence mode="wait">
          {!selectedDoc ? (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="h-full flex flex-col items-center justify-center p-12 text-center bg-brand-50/30 border border-dashed border-[#EADDD7] rounded-[3rem]"
            >
              <div className="w-20 h-20 bg-white rounded-3xl flex items-center justify-center text-brand-300 mb-6 shadow-sm">
                <Search size={40} />
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">Select a document to analyze</h3>
              <p className="text-slate-500 max-w-sm">The Navigator will read the text and flag potential issues or missing legal compliance items.</p>
            </motion.div>
          ) : (
            <motion.div 
               key={selectedDoc.id}
               initial={{ opacity: 0, x: 20 }}
               animate={{ opacity: 1, x: 0 }}
               exit={{ opacity: 0, x: -20 }}
               className="h-full bg-white rounded-[3rem] border border-[#EADDD7] shadow-xl shadow-brand-900/5 flex flex-col overflow-hidden"
            >
              <div className="p-8 border-b border-[#EADDD7] flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-bold truncate max-w-[200px]">{selectedDoc.name}</h3>
                  <p className="text-xs text-slate-400 font-medium">AI Document Intelligence</p>
                </div>
                <div className="flex items-center gap-2">
                   {isAnalyzing ? (
                     <span className="flex items-center gap-2 text-brand-600 font-bold text-sm animate-pulse">
                       <Loader2 size={16} className="animate-spin" /> Analyzing...
                     </span>
                   ) : (
                     <span className="flex items-center gap-2 text-emerald-600 font-bold text-sm">
                       <CheckCircle2 size={16} /> Analysis Complete
                     </span>
                   )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
                {isAnalyzing ? (
                  <div className="space-y-6">
                    <div className="h-4 w-1/2 bg-slate-50 rounded animate-pulse" />
                    <div className="h-32 w-full bg-slate-50 rounded-3xl animate-pulse" />
                    <div className="h-4 w-2/3 bg-slate-50 rounded animate-pulse" />
                    <div className="h-32 w-full bg-slate-50 rounded-3xl animate-pulse" />
                  </div>
                ) : (
                  <div className="prose prose-brand prose-sm max-w-none">
                    {selectedDoc?.structuredData && Object.keys(selectedDoc.structuredData).length > 0 && (
                      <div className="mb-6 p-5 bg-slate-50 rounded-3xl border border-slate-100">
                        <p className="font-bold text-slate-500 uppercase tracking-widest text-[10px] mb-3">
                          Extracted Fields
                        </p>
                        <div className="grid grid-cols-2 gap-3">
                          {Object.entries(selectedDoc.structuredData).slice(0, 8).map(([key, value]) => (
                            <div key={key} className="bg-white p-3 rounded-2xl border border-slate-100">
                              <p className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mb-1">
                                {key.replace(/_/g, ' ')}
                              </p>
                              <p className="text-xs font-bold text-slate-900 truncate" title={value}>
                                {value || 'â€”'}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="bg-brand-50/50 p-6 rounded-3xl border border-brand-100 mb-8 flex items-start gap-4">
                      <Sparkles size={24} className="text-brand-600 shrink-0 mt-1" />
                      <div>
                        <p className="font-bold text-brand-900 uppercase tracking-widest text-[10px] mb-2">Navigator Summary</p>
                        <div className="text-slate-700 leading-relaxed font-medium">
                          <ReactMarkdown>
                            {analysisResult || "No analysis generated."}
                          </ReactMarkdown>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <h4 className="font-bold text-slate-900 flex items-center gap-2">
                        <AlertCircle size={18} className="text-amber-500" /> Action Required
                      </h4>
                      <div className="p-4 bg-white border border-slate-100 rounded-2xl text-sm text-slate-600 leading-relaxed shadow-sm">
                        One or more sections contain non-statutory language. Request specialized quantification for Section F.
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="p-6 bg-slate-50/50 border-t border-[#EADDD7] flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                  <AiButton 
                    onClick={handleDraftResponse} 
                    isLoading={isDraftingResponse}
                    className="py-3 px-4 w-full"
                  >
                    Draft Response
                  </AiButton>
                  <button 
                    onClick={() => onToast("✓ Added to tribunal bundle")}
                    className="py-3 px-4 bg-white border border-[#EADDD7] text-slate-700 rounded-2xl text-sm font-bold hover:bg-white hover:border-brand-300 transition-all flex items-center justify-center gap-2"
                  >
                    Add to Bundle
                  </button>
                </div>
                {selectedDoc.type === 'Draft Plan' && (
                  <AiButton 
                    onClick={handleScanProvision} 
                    isLoading={isScanningProvision}
                    className="py-3 px-4 w-full bg-white border border-brand-200 text-brand-700 hover:bg-brand-50 shadow-none"
                  >
                    Scan Section F (Quantification)
                  </AiButton>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <Modal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        title="Upload Document"
      >
        <div className="space-y-6">
          <div className="p-4 bg-brand-50 border border-brand-100 rounded-2xl flex gap-3">
            <Info size={20} className="text-brand-600 shrink-0" />
            <p className="text-xs text-brand-800 leading-relaxed font-medium">
              PDF and Word files are fully supported. Text has already been extracted and is ready to analyse.
            </p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Document Name</label>
              <input 
                type="text" 
                value={newDocInfo.name}
                onChange={e => setNewDocInfo({ ...newDocInfo, name: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Document Type</label>
              <select 
                value={newDocInfo.type}
                onChange={e => setNewDocInfo({ ...newDocInfo, type: e.target.value })}
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20 appearance-none"
              >
                <option value="Draft Plan">Draft Plan</option>
                <option value="LA Letter">LA Letter</option>
                <option value="Professional Report">Professional Report</option>
              </select>
            </div>
          </div>
          <button 
            onClick={confirmUpload}
            className="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800 transition-all shadow-lg"
          >
            Confirm & Analyze
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={!!draftResponse}
        onClose={() => setDraftResponse(null)}
        title="Draft Response Letter"
      >
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{draftResponse || ''}</ReactMarkdown>
        </div>
        <button 
          onClick={() => {
            navigator.clipboard.writeText(draftResponse || '');
            onToast("✓ Copied to clipboard");
            setDraftResponse(null);
          }}
          className="mt-8 w-full py-4 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800 flex items-center justify-center gap-2"
        >
          Copy to Clipboard
        </button>
      </Modal>

      <Modal
        isOpen={!!provisionScanResult}
        onClose={() => setProvisionScanResult(null)}
        title="Section F Provision Scan"
      >
        <div className="space-y-4">
          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl flex gap-3">
             <AlertCircle size={20} className="text-amber-600 shrink-0" />
             <p className="text-xs text-amber-800 font-medium italic">
               LA's often use "vague language" to avoid committing resources. Statutory provision must be specific and quantified.
             </p>
          </div>
          <div className="prose prose-sm max-w-none">
            <ReactMarkdown>{provisionScanResult || ''}</ReactMarkdown>
          </div>
          <button 
            onClick={() => setProvisionScanResult(null)}
            className="mt-6 w-full py-4 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800"
          >
            Finished Review
          </button>
        </div>
      </Modal>

      <style>{`
        .prose h1, .prose h2, .prose h3 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 700; color: #1e293b; }
        .prose p { margin-bottom: 1em; }
        .prose ul { margin-bottom: 1em; padding-left: 1.5em; list-style-type: disc; }
        .prose li { margin-bottom: 0.5em; }
      `}</style>
    </div>
  );
}

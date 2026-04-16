import { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  AlertCircle, 
  CheckCircle2, 
  ChevronRight, 
  Loader2,
  Sparkles,
  Info
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import type { Case, CaseDoc } from '../types';
import { analyzeDocument } from '../lib/gemini';

export default function DocumentAnalysis({ appCase }: { appCase: Case }) {
  const [selectedDoc, setSelectedDoc] = useState<CaseDoc | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<string | null>(null);

  const handleAnalyze = async (doc: CaseDoc) => {
    setSelectedDoc(doc);
    setIsAnalyzing(true);
    setAnalysisResult(null);
    
    // In a real app, we'd fetch actual doc content. Simulating here.
    const mockContent = `Draft EHCP for Maya. Section F provision: "Maya will have access to support in the classroom as appropriate to her needs. The school will provide some sensory equipment where possible."`;
    const result = await analyzeDocument(mockContent, doc.type);
    
    setAnalysisResult(result);
    setIsAnalyzing(false);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 h-full min-h-[600px]">
      {/* Left: Document List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-2xl font-bold font-display italic tracking-tight">Case Library</h2>
          <button className="flex items-center gap-2 px-4 py-2 bg-white border border-[#EADDD7] rounded-xl text-sm font-bold shadow-sm hover:bg-slate-50 transition-all">
            <Upload size={16} /> Upload New
          </button>
        </div>

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
                </div>
              </div>
              <div className="flex items-center gap-3">
                {doc.status === 'flagged' && (
                  <div className="w-6 h-6 rounded-full bg-amber-500 flex items-center justify-center text-white">
                    <AlertCircle size={14} />
                  </div>
                )}
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

              <div className="p-6 bg-slate-50/50 border-t border-[#EADDD7] grid grid-cols-2 gap-4">
                <button className="py-3 px-4 bg-brand-900 text-white rounded-2xl text-sm font-bold shadow-lg shadow-brand-900/10 hover:bg-brand-800 transition-all flex items-center justify-center gap-2">
                  Draft Response
                </button>
                <button className="py-3 px-4 bg-white border border-[#EADDD7] text-slate-700 rounded-2xl text-sm font-bold hover:bg-white hover:border-brand-300 transition-all flex items-center justify-center gap-2">
                  Add to Bundle
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <style>{`
        .prose h1, .prose h2, .prose h3 { margin-top: 1.5em; margin-bottom: 0.5em; font-weight: 700; color: #1e293b; }
        .prose p { margin-bottom: 1em; }
        .prose ul { margin-bottom: 1em; padding-left: 1.5em; list-style-type: disc; }
        .prose li { margin-bottom: 0.5em; }
      `}</style>
    </div>
  );
}

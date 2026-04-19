import { useState } from 'react';
import { 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  FileText, 
  Send, 
  Users,
  Plus,
  Loader2,
  X,
  Gavel,
  Download,
  Copy
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import type { Case } from '../types';
import { askNavigator, getNextSteps } from '../lib/gemini';
import { htmlToPdf, buildLetterHtml } from '../lib/flowr';
import Modal from './ui/Modal';
import AiButton from './ui/AiButton';
import { Sparkles } from 'lucide-react';

export default function Dashboard({ 
  appCase, 
  onNavigate,
  onUpdateCase
}: { 
  appCase: Case; 
  onNavigate: (tab: string) => void;
  onUpdateCase: (updated: Partial<Case>) => void;
}) {
  const [isVagueDismissed, setIsVagueDismissed] = useState(false);
  const [isDraftingChallenge, setIsDraftingChallenge] = useState(false);
  const [isDraftingChaser, setIsDraftingChaser] = useState(false);
  const [aiDraft, setAiDraft] = useState<{ title: string; content: string } | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = useState(false);
  const [isUpgradeModalOpen, setIsUpgradeModalOpen] = useState(false);
  const [isAnalyzingStrategy, setIsAnalyzingStrategy] = useState(false);
  const [strategyResult, setStrategyResult] = useState<string | null>(null);
  
  const [showAddProf, setShowAddProf] = useState(false);
  const [newProf, setNewProf] = useState({ name: '', role: '' });
  const [team, setTeam] = useState([
    { name: 'Sarah Chen', role: 'Main Advocate', initial: 'SC', color: 'bg-brand-primary/5 text-brand-primary' },
    { name: 'Dr. Sarah Mills', role: 'Educational Psych', initial: 'SM', color: 'bg-emerald-50 text-emerald-600' },
    { name: 'John Doe', role: 'LA Case Officer', initial: 'JD', color: 'bg-slate-50 text-slate-600' },
  ]);

  const handleDraftChallenge = async () => {
    setIsDraftingChallenge(true);
    const draft = await askNavigator(`Draft a formal letter to ${appCase.laName} challenging the vague provision in Section F of ${appCase.childName}'s draft EHCP. The current wording says 'some support as needed' which is not quantified or specified as required by the SEND Code of Practice 2015. Write in the parent's voice — warm but legally firm. Cite the relevant legal standard.`);
    setAiDraft({ title: 'Section F Challenge Draft', content: draft });
    setIsDraftingChallenge(false);
  };

  const handleSendChaser = async () => {
    setIsDraftingChaser(true);
    const draft = await askNavigator(`Draft a formal chaser letter to the SEN Team at ${appCase.laName}. The 6-week statutory deadline for responding to our EHCP request has now passed by 2 days. Reference the Children and Families Act 2014 statutory timeline obligations. Tone: firm but professional.`);
    setAiDraft({ title: 'LA Response Chaser Draft', content: draft });
    setIsDraftingChaser(false);
  };

  const handleDownloadLetterPdf = async () => {
    if (!aiDraft) return;
    setIsDownloadingPdf(true);
    try {
      const html = buildLetterHtml({
        childName: appCase.childName,
        laName: appCase.laName,
        letterTitle: aiDraft.title,
        body: aiDraft.content,
        senderName: `Sarah (${appCase.childName}'s Parent)`,
      });
      await htmlToPdf(html, `${aiDraft.title.replace(/\s+/g, '_')}.pdf`);
    } catch (error) {
      console.error('Flowr error:', error);
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleAddProf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProf.name || !newProf.role) return;
    const initials = newProf.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
    const colors = ['bg-blue-50 text-blue-600', 'bg-purple-50 text-purple-600', 'bg-amber-50 text-amber-600', 'bg-rose-50 text-rose-600'];
    const randomColor = colors[Math.floor(Math.random() * colors.length)];
    setTeam([...team, { ...newProf, initial: initials, color: randomColor }]);
    setNewProf({ name: '', role: '' });
    setShowAddProf(false);
  };

  const handleAnalyzeStrategy = async () => {
    setIsAnalyzingStrategy(true);
    const result = await getNextSteps(appCase);
    setStrategyResult(result);
    setIsAnalyzingStrategy(false);
  };

  const getDaysRemaining = (deadline: string) => {
    const diff = new Date(deadline).getTime() - new Date().getTime();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const rawDaysLeft = getDaysRemaining(appCase.nextDeadline);
  const daysLeft = isNaN(rawDaysLeft) ? 14 : rawDaysLeft;
  const urgencyColor = daysLeft <= 7 
    ? 'text-red-600 bg-red-50 border-red-100' 
    : daysLeft <= 21 
      ? 'text-brand-accent bg-brand-accent/5 border-brand-accent/20' 
      : 'text-emerald-600 bg-emerald-50 border-emerald-100';

  const stages: string[] = [
    'Pre-request', 'Request Submitted', 'Assessment', 
    'Draft Plan', 'Finalized', 'Review/Appeals', 'Tribunal Prep'
  ];
  const currentIndex = stages.indexOf(appCase.currentStage);

  return (
    <div className="space-y-10 pb-20">
      {/* Top Section: Hero Dashboard */}
      <section className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
        {/* Core Status: The "Navigator" Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="md:col-span-8 bg-brand-primary p-10 rounded-[3rem] text-white relative overflow-hidden shadow-2xl shadow-brand-primary/20"
        >
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-brand-accent/10 rounded-full -ml-24 -mb-24 blur-3xl pointer-events-none" />
          
          <div className="relative z-10 flex flex-col h-full justify-between gap-12">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-sm font-bold text-white/40 uppercase tracking-[0.2em] mb-2">{appCase.laName} • Stage {currentIndex + 1}</p>
                <h1 className="text-4xl md:text-5xl text-display">Drafting {appCase.childName}'s Future</h1>
              </div>
              <div className="w-16 h-16 bg-white/10 backdrop-blur-xl rounded-2xl flex items-center justify-center border border-white/10">
                <FileText className="text-brand-accent" size={32} />
              </div>
            </div>

            <div className="flex flex-wrap gap-12 items-end">
              <div className="space-y-1">
                <p className="text-xs font-bold text-white/40 uppercase tracking-widest">Urgency Level</p>
                <p className="text-3xl font-black text-brand-accent">{daysLeft} Days <span className="text-base font-medium opacity-60">Left</span></p>
              </div>
              <div className="space-y-1 flex-1 min-w-[200px]">
                <div className="flex justify-between text-xs font-bold text-white/40 uppercase mb-2">
                  <span>Progress</span>
                  <span>{Math.round(((currentIndex + 1) / stages.length) * 100)}%</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${((currentIndex + 1) / stages.length) * 100}%` }}
                    className="h-full bg-brand-accent shadow-[0_0_15px_rgba(255,98,0,0.5)]"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Evidence Hub Card */}
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.1 }}
          className="md:col-span-4 bg-white p-10 rounded-[3rem] border border-brand-primary/5 card-shadow flex flex-col justify-between"
        >
          <div className="space-y-8">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-bold">Evidence Hub</h2>
              <div className="w-12 h-12 rounded-2xl bg-brand-bg flex items-center justify-center text-brand-primary">
                <Gavel size={24} />
              </div>
            </div>
            
            <div className="space-y-4">
              <div className="p-5 bg-brand-bg rounded-2xl border border-brand-primary/5 flex items-center justify-between group cursor-pointer hover:border-brand-accent/30 transition-all">
                <div>
                  <p className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest leading-none mb-1">Uploaded</p>
                  <p className="text-2xl font-black">{appCase.docs.length}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center group-hover:bg-brand-accent transition-colors">
                  <ArrowRight size={14} />
                </div>
              </div>
              <div className="p-5 bg-brand-bg rounded-2xl border border-brand-primary/5 flex items-center justify-between group cursor-pointer hover:border-brand-accent/30 transition-all">
                <div>
                  <p className="text-xs font-bold text-brand-primary/40 uppercase tracking-widest leading-none mb-1">Comms</p>
                  <p className="text-2xl font-black">{appCase.comms.length}</p>
                </div>
                <div className="w-8 h-8 rounded-full bg-brand-primary text-white flex items-center justify-center group-hover:bg-brand-accent transition-colors">
                  <ArrowRight size={14} />
                </div>
              </div>
            </div>
          </div>

          <button 
            onClick={() => onNavigate('documents')}
            className="w-full btn-primary text-sm uppercase tracking-widest py-4 mt-6"
          >
            Review Bundle
          </button>
        </motion.div>
      </section>

      {/* Main Grid: Intelligence and Actions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left: Intelligence Rail */}
        <div className="lg:col-span-2 space-y-10">
          <div className="space-y-6">
            <div className="flex justify-between items-end">
              <h2 className="text-3xl text-display">Active Priorities</h2>
              <p className="text-xs font-bold text-brand-primary/40 uppercase tracking-[0.2em]">{appCase.docs.length + 2} Tasks pending</p>
            </div>
            
            <div className="space-y-4">
              <AnimatePresence>
                {!isVagueDismissed && (
                  <motion.div 
                    initial={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20, height: 0, marginBottom: 0 }}
                    className="p-8 bg-white border border-brand-primary/5 rounded-[2.5rem] card-shadow flex gap-8 items-center"
                  >
                    <div className="w-16 h-16 bg-brand-accent/10 text-brand-accent rounded-[1.25rem] flex items-center justify-center shrink-0">
                      <AlertCircle size={32} />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-[10px] font-black text-brand-accent uppercase tracking-[0.2em]">Critical Warning</span>
                        <button onClick={() => setIsVagueDismissed(true)}><X size={16} className="text-slate-300 hover:text-red-500 transition-colors" /></button>
                      </div>
                      <h3 className="text-xl font-bold mb-2 leading-tight">Vague Provision Detected in Section F</h3>
                      <p className="text-sm text-slate-500 leading-relaxed max-w-xl">
                        Found phrases like <span className="font-bold text-brand-primary">"some support"</span>. The High Court (E v Newham 1994) requires provision to be specified and quantified.
                      </p>
                      <div className="mt-8 flex gap-4">
                        <button 
                          onClick={handleDraftChallenge}
                          disabled={isDraftingChallenge}
                          className="btn-accent flex items-center gap-3"
                        >
                          {isDraftingChallenge ? <Loader2 size={18} className="animate-spin" /> : <Sparkles size={18} />}
                          Generate Challenge Letter
                        </button>
                        <button className="px-6 py-3 bg-brand-bg rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-brand-primary/5 transition-all">View Legals</button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="p-8 bg-white border border-brand-primary/5 rounded-[2.5rem] card-shadow flex gap-8 items-center">
                <div className="w-16 h-16 bg-brand-primary/5 text-brand-primary rounded-[1.25rem] flex items-center justify-center shrink-0">
                  <Clock size={32} />
                </div>
                <div className="flex-1">
                  <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.2em]">Timeline Alert</span>
                  <h3 className="text-xl font-bold my-2 leading-tight">Response Chaser Needed</h3>
                  <p className="text-sm text-slate-500 leading-relaxed">
                    Statutory deadline passed for assessment response. Pro-active chase recommended.
                  </p>
                  <div className="mt-8">
                    <button 
                      onClick={handleSendChaser}
                      disabled={isDraftingChaser}
                      className="btn-primary flex items-center gap-3"
                    >
                      {isDraftingChaser ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                      Draft Chaser (Node Voice)
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Timeline Heat-map Style */}
          <div className="bg-brand-primary/95 p-12 rounded-[4rem] text-white overflow-hidden relative">
            <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_0%_0%,rgba(255,98,0,0.1),transparent)]" />
            <h3 className="text-2xl text-display mb-10 relative z-10">Strategic Chronology</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
              {[
                { date: 'Jun 2025', title: 'Plan Draft', desc: 'Section F Vague Flag', urgency: 'high' },
                { date: 'May 2025', title: 'Consultation', desc: 'EP/SALT Evidence Lock', urgency: 'done' },
                { date: 'Mar 2025', title: 'Assessment', desc: 'LA Request Sync', urgency: 'done' },
              ].map((item, i) => (
                <div key={i} className="space-y-4 group">
                  <div className={cn(
                    "w-full h-1 rounded-full mb-6",
                    item.urgency === 'high' ? "bg-brand-accent shadow-[0_0_10px_rgba(255,98,0,0.5)]" : "bg-white/20"
                  )} />
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">{item.date}</p>
                  <p className="text-xl font-bold group-hover:text-brand-accent transition-colors">{item.title}</p>
                  <p className="text-xs text-white/50 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Personal Legal Aide Rail */}
        <div className="space-y-10">
          <div className="bg-white p-10 rounded-[3rem] border border-brand-primary/5 card-shadow relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-bg rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10 space-y-8">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-brand-primary text-white rounded-2xl flex items-center justify-center shadow-lg">
                  <Sparkles size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-black text-brand-primary uppercase tracking-tight">AI Strategist</h3>
                  <div className="flex items-center gap-1.5">
                    <div className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    <span className="text-[10px] font-bold text-emerald-600 uppercase">System Calibrated</span>
                  </div>
                </div>
              </div>

              <div className="p-6 bg-brand-bg rounded-[2rem] border border-brand-primary/5">
                {strategyResult ? (
                  <div className="prose prose-sm leading-relaxed text-brand-primary/80">
                    <ReactMarkdown>{strategyResult}</ReactMarkdown>
                  </div>
                ) : (
                  <p className="text-sm text-brand-primary/60 italic leading-relaxed">
                    Ready to evaluate your current legal standing and suggest high-leverage next moves.
                  </p>
                )}
              </div>

              {!strategyResult ? (
                <button 
                  onClick={handleAnalyzeStrategy} 
                  disabled={isAnalyzingStrategy}
                  className="w-full btn-primary disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isAnalyzingStrategy ? <Loader2 className="animate-spin" /> : <Plus size={18} />}
                  Run Scenario Scan
                </button>
              ) : (
                <button 
                  onClick={() => setStrategyResult(null)}
                  className="w-full btn-accent/10 border border-brand-accent/20 text-brand-accent py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-brand-accent/5"
                >
                  Re-Scan Case
                </button>
              )}
            </div>
          </div>

          {/* Evidence Strength Meter: High-Value Edition */}
          <div className="bg-brand-bg p-10 rounded-[3rem] border border-brand-primary/5 flex flex-col justify-between h-[340px]">
            <div>
              <p className="text-xs font-black text-brand-primary/40 uppercase tracking-[0.2em] mb-4">Evidence Matrix</p>
              <div className="relative h-40 w-40 mx-auto">
                 {/* Circular Progress (Simplified for SVG or similar) */}
                 <svg className="w-full h-full transform -rotate-90">
                    <circle cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="8" fill="transparent" className="text-brand-primary/5" />
                    <motion.circle 
                      cx="80" cy="80" r="70" stroke="currentColor" strokeWidth="12" fill="transparent" 
                      strokeDasharray="440"
                      initial={{ strokeDashoffset: 440 }}
                      animate={{ strokeDashoffset: 440 - (440 * 0.84) }}
                      transition={{ duration: 2, ease: "easeOut" }}
                      className="text-brand-accent shadow-xl" 
                    />
                 </svg>
                 <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-4xl text-display leading-none">84</span>
                    <span className="text-[10px] font-black text-brand-primary/40 uppercase">Strong</span>
                 </div>
              </div>
            </div>
            <p className="text-center text-[10px] text-brand-primary/50 leading-relaxed px-4">
              Your EP report is robust but lacking specific SALT interventions. Scanning new uploads...
            </p>
          </div>

          {/* Tribunal Mode: The Monetization Gate */}
          <div className="bg-[#1a1a1a] p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden flex flex-col justify-between">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 pointer-events-none" />
            <div className="relative z-10 space-y-6">
              <div className="flex items-center gap-3">
                <Gavel className="text-brand-accent" size={24} />
                <h3 className="text-xl text-display">Tribunal Mode</h3>
              </div>
              <p className="text-sm text-white/40 leading-relaxed">
                Facing a SENDIST appeal? Unlock our specialized trial assistant and automated evidence bundles.
              </p>
            </div>
            <button 
              onClick={() => setIsUpgradeModalOpen(true)}
              className="mt-10 btn-accent py-4 w-full text-xs font-black uppercase tracking-widest"
            >
              Unlock Advocate Access
            </button>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={!!aiDraft} 
        onClose={() => setAiDraft(null)} 
        title={aiDraft?.title || 'Draft Letter'}
      >
        <div className="prose-sm max-w-none text-brand-primary leading-relaxed bg-brand-bg p-8 rounded-3xl border border-brand-primary/5">
          <ReactMarkdown>{aiDraft?.content || ''}</ReactMarkdown>
        </div>
        <div className="mt-10 flex gap-4">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(aiDraft?.content || '');
            }}
            className="flex-1 py-4 bg-white border border-brand-primary/5 text-brand-primary rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-brand-bg transition-all flex items-center justify-center gap-3 card-shadow"
          >
            <Copy size={18} /> Copy
          </button>
          <button 
            onClick={handleDownloadLetterPdf}
            disabled={isDownloadingPdf}
            className="flex-1 py-4 btn-primary flex items-center justify-center gap-3 shadow-xl"
          >
            {isDownloadingPdf 
              ? <><Loader2 size={18} className="animate-spin" /> Processing...</>
              : <><Download size={18} /> Get PDF</>
            }
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Access Denied"
      >
        <div className="text-center p-10">
          <div className="w-24 h-24 bg-brand-bg text-brand-accent rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-inner">
            <Gavel size={48} />
          </div>
          <h3 className="text-2xl text-display mb-4">Enterprise Grade Advocates Only</h3>
          <p className="text-brand-primary/50 leading-relaxed mb-10 max-w-sm mx-auto">
            Full tribunal preparation and legal simulation requires an Elite plan for regulatory compliance.
          </p>
          <button 
            onClick={() => setIsUpgradeModalOpen(false)}
            className="btn-primary w-full py-5 text-sm uppercase tracking-widest"
          >
            Join Waiting List
          </button>
        </div>
      </Modal>
    </div>
  );
}

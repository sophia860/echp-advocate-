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
    { name: 'Sarah Chen', role: 'Main Advocate', initial: 'SC', color: 'bg-indigo-50 text-indigo-600' },
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
      ? 'text-amber-600 bg-amber-50 border-amber-100' 
      : 'text-emerald-600 bg-emerald-50 border-emerald-100';

  const stages: string[] = [
    'Pre-request', 'Request Submitted', 'Assessment', 
    'Draft Plan', 'Finalized', 'Review/Appeals', 'Tribunal Prep'
  ];
  const currentIndex = stages.indexOf(appCase.currentStage);

  return (
    <div className="space-y-8 pb-12">
      {/* Journey Progress Bar */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-[#EADDD7] shadow-sm mb-2">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Case Journey</p>
          <span className="text-xs font-bold text-brand-600 bg-brand-50 px-3 py-1 rounded-full">
            Stage {currentIndex + 1} of {stages.length}
          </span>
        </div>
        <div className="flex items-center gap-1">
          {stages.map((stage, i) => (
            <div key={stage} className="flex-1 flex flex-col items-center gap-1.5">
              <div className={cn(
                "w-full h-2 rounded-full transition-all",
                i < currentIndex ? "bg-emerald-400" :
                i === currentIndex ? "bg-brand-500" :
                "bg-slate-100"
              )} />
              <span className={cn(
                "text-[9px] font-bold uppercase tracking-wider text-center leading-tight hidden md:block",
                i === currentIndex ? "text-brand-600" : "text-slate-300"
              )}>
                {stage}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Top Section: Status Cards */}
      <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-6 rounded-3xl border border-[#EADDD7] shadow-sm relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-brand-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-500" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-brand-600 uppercase tracking-widest mb-1">Current Stage</p>
            <h3 className="text-2xl font-bold text-slate-900 mb-4">{appCase.currentStage}</h3>
            <div className="flex items-center gap-2 text-sm text-slate-500">
               <div className={cn("inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-xs font-bold", urgencyColor)}>
                <Clock size={12} />
                {daysLeft > 0 ? `${daysLeft} days remaining` : `${Math.abs(daysLeft)} days overdue`}
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-6 rounded-3xl border border-[#EADDD7] shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Case Files</p>
              <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <FileText size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{appCase.docs.length} <span className="text-sm font-medium text-slate-400">Documents</span></h3>
          </div>
          <div className="mt-4 flex items-center gap-2 overflow-hidden">
            {appCase.docs.map(doc => (
              <div key={doc.id} className={cn(
                "w-2 h-2 rounded-full shrink-0",
                doc.status === 'flagged' ? "bg-amber-400" : "bg-emerald-400"
              )} />
            ))}
            <span className="text-xs text-slate-400 truncate">2 reviewed · 1 needs attention</span>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-white p-6 rounded-3xl border border-[#EADDD7] shadow-sm flex flex-col justify-between"
        >
          <div>
            <div className="flex justify-between items-start mb-4">
              <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">Communications</p>
              <div className="w-10 h-10 rounded-xl bg-brand-50 text-brand-600 flex items-center justify-center">
                <Send size={20} />
              </div>
            </div>
            <h3 className="text-3xl font-bold text-slate-900">{appCase.comms.length + 12} <span className="text-sm font-medium text-slate-400">Letters/Emails</span></h3>
          </div>
          <div className="mt-4">
             <button 
              onClick={() => onNavigate('comms')}
              className="text-xs font-bold text-brand-600 flex items-center gap-1 hover:underline"
             >
                View all records <ArrowRight size={12} />
             </button>
          </div>
        </motion.div>

        <motion.div 
          whileHover={{ y: -4 }}
          className="bg-brand-900 p-6 rounded-3xl shadow-xl shadow-brand-900/10 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.1),transparent)]" />
          <div className="relative z-10">
            <p className="text-sm font-bold text-white/60 uppercase tracking-widest mb-1">Evidence Strength</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-3xl font-black text-white">84%</h3>
              <span className="text-[10px] font-bold text-emerald-400 uppercase">Strong</span>
            </div>
            <div className="mt-4 w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: '84%' }}
                 transition={{ duration: 1.5, ease: "easeOut" }}
                 className="h-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.5)]" 
               />
            </div>
          </div>
          <p className="relative z-10 text-[10px] text-white/40 mt-4 leading-tight">
            Based on EP report quality and LA's recent Section F response.
          </p>
        </motion.div>
      </section>

      {/* Main Grid: Flags and Timeline */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Alerts & Tasks */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex justify-between items-end">
            <h2 className="text-2xl font-bold font-display italic tracking-tight">Active Flags</h2>
            <button className="text-sm font-bold text-slate-500 hover:text-brand-600 transition-colors">Mark all read</button>
          </div>
          
          <div className="space-y-4">
            <AnimatePresence>
              {!isVagueDismissed && (
                <motion.div 
                  initial={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0, overflow: 'hidden' }}
                  className="bg-amber-50 border border-amber-100 p-5 rounded-3xl flex gap-4"
                >
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-amber-500 shadow-sm shrink-0">
                    <AlertCircle size={24} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-slate-900">Vague Provision Flagged</p>
                    <p className="text-sm text-slate-600 mt-1">Section F of the draft EHCP uses non-specific language: "some support as needed". This must be quantified.</p>
                    <div className="mt-4 flex gap-3">
                      <button 
                        onClick={handleDraftChallenge}
                        disabled={isDraftingChallenge}
                        className="px-4 py-2 bg-amber-500 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-amber-600 transition-all flex items-center gap-2"
                      >
                        {isDraftingChallenge ? <Loader2 size={12} className="animate-spin" /> : null}
                        {isDraftingChallenge ? 'Drafting...' : 'Draft Challenge'}
                      </button>
                      <button 
                        onClick={() => setIsVagueDismissed(true)}
                        className="px-4 py-2 bg-white border border-amber-200 text-amber-700 rounded-xl text-xs font-bold hover:bg-amber-100 transition-all"
                      >
                        Dismiss
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            <div className="bg-white border border-[#EADDD7] p-5 rounded-3xl flex gap-4">
              <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center text-brand-600 shadow-sm shrink-0">
                <Clock size={24} />
              </div>
              <div className="flex-1">
                <p className="font-bold text-slate-900">LA Response Overdue</p>
                <p className="text-sm text-slate-600 mt-1">The 6-week statutory deadline for a response to your initial request passed 2 days ago.</p>
                <div className="mt-4 flex gap-3">
                  <button 
                    onClick={handleSendChaser}
                    disabled={isDraftingChaser}
                    className="px-4 py-2 bg-brand-900 text-white rounded-xl text-xs font-bold shadow-sm hover:bg-brand-800 transition-all flex items-center gap-2"
                  >
                    {isDraftingChaser ? <Loader2 size={12} className="animate-spin" /> : null}
                    {isDraftingChaser ? 'Drafting...' : 'Send Chaser'}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[2.5rem] border border-[#EADDD7] shadow-sm">
            <h3 className="text-xl font-bold mb-6">Case Chronology</h3>
            <div className="relative pl-8 space-y-8 before:absolute before:left-[11px] before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-100">
              {[
                { date: 'Jun 2025', title: 'Draft EHCP Received', desc: 'LA shared first draft after assessment.', status: 'current' },
                { date: 'May 2025', title: 'Assessment Completed', desc: 'EP and SALT reports submitted.', status: 'done' },
                { date: 'Mar 2025', title: 'EHCP Request Approved', desc: 'LA agreed to assess Maya.', status: 'done' },
              ].map((item, i) => (
                <div key={i} className="relative">
                  <div className={cn(
                    "absolute -left-10 top-1 w-6 h-6 rounded-full border-4 border-white shadow-sm z-10",
                    item.status === 'current' ? "bg-brand-500 scale-125" : "bg-emerald-500"
                  )} />
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">{item.date}</p>
                  <p className="font-bold text-slate-900">{item.title}</p>
                  <p className="text-sm text-slate-500 mt-1">{item.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Professional Team Sidebar */}
        <div className="space-y-6">
          {/* AI Strategist Card */}
          <div className="bg-brand-50 border border-brand-100 p-6 rounded-[2.5rem] shadow-sm overflow-hidden relative group">
            <div className="absolute top-0 right-0 w-24 h-24 bg-brand-100/50 rounded-full -mr-12 -mt-12 blur-2xl group-hover:scale-150 transition-transform duration-1000" />
            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-brand-900 rounded-2xl flex items-center justify-center text-white shadow-lg">
                  <Sparkles size={20} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-800">Case Strategist</h3>
                  <p className="text-[10px] text-brand-600 font-bold uppercase tracking-wider">AI Powered Insights</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-xs text-slate-600 leading-relaxed font-medium">
                  {strategyResult ? (
                    <div className="prose prose-sm leading-tight text-slate-700">
                      <ReactMarkdown>{strategyResult}</ReactMarkdown>
                    </div>
                  ) : (
                    "Analyzing your current documents and statutory deadlines to suggest the best route forward."
                  )}
                </p>
              </div>

              {!strategyResult ? (
                <AiButton 
                  onClick={handleAnalyzeStrategy} 
                  isLoading={isAnalyzingStrategy}
                  className="w-full py-3 justify-center text-xs"
                >
                  Analyze Next Steps
                </AiButton>
              ) : (
                <button 
                  onClick={() => setStrategyResult(null)}
                  className="w-full py-3 bg-white border border-brand-200 text-brand-700 rounded-2xl text-[10px] font-bold uppercase tracking-widest hover:bg-brand-50 transition-all"
                >
                  Recalculate Strategy
                </button>
              )}
            </div>
          </div>

          <div className="bg-white p-6 rounded-[2.5rem] border border-[#EADDD7] shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-bold">Your Team</h3>
              <Users size={18} className="text-slate-400" />
            </div>
            <div className="space-y-4">
              {team.map((person, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-bold text-sm", person.color)}>
                    {person.initial}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{person.name}</p>
                    <p className="text-xs text-slate-500 truncate">{person.role}</p>
                  </div>
                </div>
              ))}

              <AnimatePresence>
                {showAddProf && (
                  <motion.form 
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    onSubmit={handleAddProf}
                    className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-3"
                  >
                    <input 
                      autoFocus
                      type="text" 
                      placeholder="Name"
                      value={newProf.name}
                      onChange={e => setNewProf({...newProf, name: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <input 
                      type="text" 
                      placeholder="Role (e.g. SALT)"
                      value={newProf.role}
                      onChange={e => setNewProf({...newProf, role: e.target.value})}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-500/20"
                    />
                    <div className="flex gap-2">
                      <button type="submit" className="flex-1 py-2 bg-brand-900 text-white rounded-xl text-xs font-bold hover:bg-brand-800">Add</button>
                      <button type="button" onClick={() => setShowAddProf(false)} className="px-3 py-2 bg-white border border-slate-200 text-slate-400 rounded-xl text-xs font-bold hover:bg-slate-50">Cancel</button>
                    </div>
                  </motion.form>
                )}
              </AnimatePresence>

              {!showAddProf && (
                <button 
                  onClick={() => setShowAddProf(true)}
                  className="w-full mt-4 py-3 border border-dashed border-[#EADDD7] rounded-2xl text-slate-400 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
                >
                  <Plus size={16} /> Add Professional
                </button>
              )}
            </div>
          </div>

          <div className="bg-brand-900 p-6 rounded-[2.5rem] text-white shadow-xl shadow-brand-900/20 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700" />
            <div className="relative z-10">
              <h3 className="text-xl font-bold mb-2">Upgrade for Tribunal Mode</h3>
              <p className="text-sm text-brand-200 mb-6">Facing a tribunal? Unlock our specialized AI coach and bundle builder.</p>
              <button 
                onClick={() => setIsUpgradeModalOpen(true)}
                className="w-full py-3 bg-white text-brand-900 rounded-2xl text-sm font-bold shadow-lg shadow-black/10 hover:bg-brand-50 transition-all flex items-center justify-center gap-2"
              >
                 Get Started <ArrowRight size={16} />
              </button>
            </div>
          </div>
        </div>
      </div>

      <Modal 
        isOpen={!!aiDraft} 
        onClose={() => setAiDraft(null)} 
        title={aiDraft?.title || 'Draft Letter'}
      >
        <div className="prose prose-sm max-w-none">
          <ReactMarkdown>{aiDraft?.content || ''}</ReactMarkdown>
        </div>
        <div className="mt-8 flex gap-3">
          <button 
            onClick={() => {
              navigator.clipboard.writeText(aiDraft?.content || '');
            }}
            className="flex-1 py-4 bg-white border border-slate-200 text-slate-700 rounded-2xl font-bold hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
          >
            <Copy size={18} /> Copy Text
          </button>
          <button 
            onClick={handleDownloadLetterPdf}
            disabled={isDownloadingPdf}
            className="flex-1 py-4 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800 disabled:opacity-50 transition-all flex items-center justify-center gap-2 shadow-lg shadow-brand-900/10"
          >
            {isDownloadingPdf 
              ? <><Loader2 size={18} className="animate-spin" /> Generating PDF...</>
              : <><Download size={18} /> Download PDF</>
            }
          </button>
        </div>
      </Modal>

      <Modal
        isOpen={isUpgradeModalOpen}
        onClose={() => setIsUpgradeModalOpen(false)}
        title="Tribunal Mode — Coming Soon"
      >
        <div className="text-center p-6">
          <div className="w-16 h-16 bg-brand-50 text-brand-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
            <Gavel size={32} />
          </div>
          <p className="text-slate-600 leading-relaxed">
            Full tribunal preparation tools are coming soon. You'll be notified when this feature launches.
          </p>
          <button 
            onClick={() => setIsUpgradeModalOpen(false)}
            className="mt-8 w-full py-4 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
}

import { useState } from 'react';
import { 
  Plus, 
  Search, 
  MapPin, 
  Star, 
  ChevronRight, 
  Users,
  Video,
  Clock,
  Filter,
  Trash2,
  Phone,
  Sparkles,
  Copy,
  Loader2,
  Info,
  ArrowRight
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import Modal from './ui/Modal';
import { askNavigator } from '../lib/gemini';

interface Prof {
  id: string;
  name: string;
  role: string;
}

export default function ProfessionalFinder({ onToast }: { onToast: (msg: string) => void }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
  const [isContactModalOpen, setIsContactModalOpen] = useState(false);
  const [contactingProf, setContactingProf] = useState<{ name: string; role: string } | null>(null);
  const [contactDraft, setContactDraft] = useState('');
  const [isGeneratingContact, setIsGeneratingContact] = useState(false);
  const [newProf, setNewProf] = useState({ name: '', role: '' });
  const [team, setTeam] = useState<Prof[]>([
    { id: '1', name: 'Sarah Chen', role: 'Main Advocate' },
    { id: '2', name: 'Dr. Sarah Mills', role: 'Educational Psych' },
    { id: '3', name: 'John Doe', role: 'LA Case Officer' },
  ]);

  const handleAddProf = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProf.name || !newProf.role) return;
    setTeam([...team, { id: Math.random().toString(36).substr(2, 9), ...newProf }]);
    setNewProf({ name: '', role: '' });
    setIsAddModalOpen(false);
    onToast(`✓ ${newProf.name} added to your team`);
  };

  const removeProf = (id: string) => {
    setTeam(team.filter(p => p.id !== id));
    onToast("Professional removed from team");
  };

  const handleRequestContact = async (prof: { name: string, role: string }) => {
    setContactingProf(prof);
    setIsContactModalOpen(true);
    setIsGeneratingContact(true);
    setContactDraft('');
    
    const draft = await askNavigator(`Draft a professional initial contact email to ${prof.name}, who is an ${prof.role}. I am looking for a professional report for my child Maya's EHCP process. Briefly explain we are at the Draft Plan stage and need quantitative evidence for Section F. Tone: polite, professional, and clear.`);
    setContactDraft(draft);
    setIsGeneratingContact(false);
  };

  const professionals = [
    { name: 'Dr. James Okafor', role: 'Independent Ed Psychologist', tags: ['ASD', 'SpLD', 'SEMH'], location: 'London / Remote', turnaround: '3 weeks', rating: 4.9, reviews: 42, price: '£1,200 - £1,500' },
    { name: 'Dr. Priya Nair', role: 'ADHD Specialist', tags: ['ADHD', 'PDA', 'Gifted'], location: 'Midlands / Remote', turnaround: '4 weeks', rating: 4.8, reviews: 28, price: '£1,000 - £1,300' },
    { name: 'Sarah Chen', role: 'Independent SEN Advocate', tags: ['Tribunal', 'EHCP Request'], location: 'Remote Only', turnaround: '1 week', rating: 5.0, reviews: 156, price: '£60 - £100/hr' },
  ];

  return (
    <div className="space-y-12">
      {/* Team Command Header */}
      <div className="bg-brand-primary p-12 rounded-[4rem] text-white shadow-2xl relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-96 h-96 bg-brand-accent/10 rounded-full -mr-48 -mt-48 blur-3xl group-hover:scale-110 transition-transform duration-1000" />
        <div className="relative z-10 max-w-4xl">
          <div className="flex items-center gap-4 mb-6">
            <div className="w-12 h-12 bg-brand-accent rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-accent/20">
              <Users size={24} strokeWidth={2.5} />
            </div>
            <p className="text-[10px] font-black uppercase tracking-[0.4em] text-brand-accent">Strategic Alliance Protocol</p>
          </div>
          <h2 className="text-5xl text-display text-white mb-6">Your Professional Matrix</h2>
          <p className="text-white/40 mb-12 leading-relaxed text-lg font-medium max-w-2xl">
            Tribunal panels prioritize evidence less than 2 years old. Based on Section F requirements, we recommend updating your independent EP assets immediately.
          </p>
          <div className="flex flex-wrap gap-6 text-white">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-8 py-4 bg-brand-accent text-white rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand-accent/20 hover:bg-white hover:text-brand-primary transition-all flex items-center gap-3 active:scale-95"
            >
              <Plus size={18} strokeWidth={3} /> Recruit Asset
            </button>
            <button 
              onClick={() => setIsManageModalOpen(true)}
              className="px-8 py-4 bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-white/10 transition-all flex items-center gap-3"
            >
              Manage Active Unit <ArrowRight size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
        {/* Filters Pillar */}
        <div className="lg:col-span-3 space-y-8">
          <div className="bg-white p-10 rounded-[3rem] border border-brand-primary/5 shadow-xl glass">
            <div className="flex items-center justify-between mb-8">
               <h3 className="text-xl font-bold">Filters</h3>
               <Filter size={18} className="text-brand-primary/20" />
            </div>
            <div className="space-y-8">
              <div>
                <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-4 pl-2">Specialism</p>
                <div className="space-y-3">
                  {['ASD', 'ADHD', 'Dyslexia', 'SEMH', 'PDA'].map(tag => (
                    <label key={tag} className="flex items-center gap-4 cursor-pointer group p-3 hover:bg-brand-bg rounded-xl transition-all">
                      <input type="checkbox" className="w-5 h-5 rounded-[0.5rem] border-brand-primary/10 text-brand-accent focus:ring-brand-accent/20 transition-all" />
                      <span className="text-xs text-brand-primary/60 font-bold group-hover:text-brand-primary transition-colors">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-8 border-t border-brand-primary/5">
                <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] mb-4 pl-2">Sync Range</p>
                <div className="space-y-3">
                  {['Within 2 Weeks', 'Remote Only', 'Panel Veteran'].map(range => (
                    <label key={range} className="flex items-center gap-4 cursor-pointer group p-3 hover:bg-brand-bg rounded-xl transition-all">
                      <input type="checkbox" className="w-5 h-5 rounded-[0.5rem] border-brand-primary/10 text-brand-accent" />
                      <span className="text-xs text-brand-primary/60 font-bold group-hover:text-brand-primary uppercase tracking-tight">{range}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="p-8 bg-brand-primary/95 text-white rounded-[3rem] border border-white/5 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-brand-accent/10 rounded-full -mr-16 -mt-16 group-hover:scale-125 transition-transform duration-1000" />
            <div className="relative z-10 flex gap-6">
              <div className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center text-brand-accent shrink-0">
                <Info size={24} />
              </div>
              <div className="space-y-2">
                <p className="text-sm font-black uppercase tracking-[0.2em] text-brand-accent">Panel Logic</p>
                <p className="text-xs text-white/50 leading-relaxed font-medium">
                  Independent reports carry significantly more weight in tribunal if they cross-reference Section B and Section F directly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Specialists Matrix */}
        <div className="lg:col-span-9 space-y-6">
          <div className="flex items-end justify-between px-4">
            <div className="space-y-1">
              <h3 className="text-2xl font-bold">Recommended Assets</h3>
              <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em]">Verified Specialists Identified</p>
            </div>
            <p className="text-[10px] font-black text-brand-accent uppercase tracking-widest bg-brand-accent/5 px-3 py-1 rounded-full border border-brand-accent/10 italic">3 Matches Syncing</p>
          </div>
          
          <div className="space-y-6">
            {professionals.map((prof, i) => (
              <motion.div 
                whileHover={{ y: -4, scale: 1.005 }}
                key={i} 
                onClick={() => handleRequestContact(prof)}
                className="bg-white p-8 rounded-[4rem] border border-brand-primary/5 shadow-2xl flex flex-col md:flex-row gap-10 hover:border-brand-accent transition-all cursor-pointer group relative overflow-hidden"
              >
                <div className="absolute inset-0 z-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity">
                   <div className="absolute top-0 right-0 w-96 h-96 bg-brand-bg rounded-full -mr-48 -mt-48 blur-3xl" />
                </div>

                <div className="relative z-10 w-32 h-32 bg-brand-bg rounded-[2.5rem] flex items-center justify-center shrink-0 overflow-hidden border border-brand-primary/5 shadow-inner">
                   <img src={`https://picsum.photos/seed/${prof.name}/300/300`} alt={prof.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" referrerPolicy="no-referrer" />
                </div>
                
                <div className="relative z-10 flex-1 min-w-0 flex flex-col justify-center">
                   <div className="flex items-start justify-between mb-4">
                     <div>
                       <h4 className="text-2xl font-black text-brand-primary tracking-tight truncate mb-1">{prof.name}</h4>
                       <p className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em]">{prof.role}</p>
                     </div>
                     <div className="flex items-center gap-2 bg-brand-bg px-4 py-2 rounded-2xl text-brand-primary text-xs font-black border border-brand-primary/5">
                        <Star size={14} className="fill-brand-accent text-brand-accent" /> {prof.rating}
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-3 mb-6">
                     {prof.tags.map(tag => (
                       <span key={tag} className="px-3 py-1 bg-brand-bg/50 border border-brand-primary/5 text-brand-primary/40 rounded-full text-[9px] font-black uppercase tracking-widest italic group-hover:bg-white group-hover:text-brand-accent transition-all">
                         {tag}
                       </span>
                     ))}
                   </div>

                   <div className="flex flex-wrap gap-x-10 gap-y-3">
                     <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">
                        <MapPin size={16} className="text-brand-accent" strokeWidth={2.5} /> {prof.location}
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">
                        <Clock size={16} className="text-brand-accent" strokeWidth={2.5} /> {prof.turnaround}
                     </div>
                     <div className="flex items-center gap-2 text-[10px] font-black text-brand-primary/40 uppercase tracking-widest">
                        <Video size={16} className="text-brand-accent" strokeWidth={2.5} /> Virtual Consults
                     </div>
                   </div>
                </div>

                <div className="relative z-10 flex flex-col justify-between items-end md:border-l border-brand-primary/5 md:pl-10 shrink-0 min-w-[200px]">
                   <div className="text-right">
                      <p className="text-[10px] font-black text-brand-primary/20 uppercase tracking-[0.3em] mb-2">Sync Fee Range</p>
                      <p className="text-2xl font-black text-brand-primary font-mono tracking-tight">{prof.price}</p>
                   </div>
                   <div className="mt-6 w-full py-5 bg-brand-bg group-hover:bg-brand-accent text-brand-primary/40 group-hover:text-white rounded-[1.5rem] text-[10px] font-black uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-4">
                      Initiate Outreach <ChevronRight size={18} className="translate-x-0 group-hover:translate-x-1 transition-transform" />
                   </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Modals */}
      <Modal
        isOpen={isContactModalOpen}
        onClose={() => setIsContactModalOpen(false)}
        title="Asset Outreach Sync"
      >
        <div className="p-10 space-y-10">
          <div className="p-6 bg-brand-accent/5 border border-brand-accent/20 rounded-[2rem] flex gap-4">
            <Sparkles size={24} className="text-brand-accent shrink-0" />
            <p className="text-xs text-brand-primary/60 leading-relaxed font-black uppercase tracking-widest">
              Intelligence engine has prepared a high-impact narrative targeting Section F requirements.
            </p>
          </div>

          <div className={cn(
            "p-10 bg-brand-bg border border-brand-primary/5 rounded-[3rem] min-h-[300px] max-h-[500px] overflow-y-auto custom-scrollbar relative prose prose-brand prose-sm max-w-none text-brand-primary",
            isGeneratingContact && "flex items-center justify-center"
          )}>
            {isGeneratingContact ? (
              <div className="flex flex-col items-center gap-4 text-brand-accent">
                <Loader2 size={48} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] animate-pulse">Synthesizing Narrative...</span>
              </div>
            ) : (
              <ReactMarkdown>{contactDraft}</ReactMarkdown>
            )}
          </div>

          <div className="flex gap-4">
             <button 
              onClick={() => {
                navigator.clipboard.writeText(contactDraft);
                onToast("✓ Data Matrix Copied");
                setContactDraft('');
                setIsContactModalOpen(false);
              }}
              disabled={isGeneratingContact || !contactDraft}
              className="flex-1 py-6 btn-accent text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand-accent/20 disabled:opacity-20"
            >
              Copy Asset Outreach Letter
            </button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Recruit To Matrix"
      >
        <form onSubmit={handleAddProf} className="p-10 space-y-10">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Asset Full Name</label>
              <input 
                autoFocus
                type="text" 
                value={newProf.name}
                onChange={e => setNewProf({...newProf, name: e.target.value})}
                placeholder="Dr. Sarah Mills"
                className="w-full px-8 py-5 bg-brand-bg border border-brand-primary/5 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 transition-all text-brand-primary"
              />
            </div>
            <div className="space-y-3">
              <label className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] pl-2">Role / Sector</label>
              <input 
                type="text" 
                value={newProf.role}
                onChange={e => setNewProf({...newProf, role: e.target.value})}
                placeholder="Educational Psychologist"
                className="w-full px-8 py-5 bg-brand-bg border border-brand-primary/5 rounded-[1.5rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 transition-all text-brand-primary"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full py-6 btn-primary text-xs font-black uppercase tracking-widest shadow-2xl shadow-brand-primary/20"
          >
            Deploy To Matrix
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="Unit Management"
      >
        <div className="p-10 space-y-10">
          <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-4">
            {team.length === 0 ? (
               <div className="text-center py-20 text-brand-primary/10">
                 <Users size={64} strokeWidth={1} className="mx-auto mb-6" />
                 <p className="text-xs font-black uppercase tracking-widest">No assets active in matrix.</p>
               </div>
            ) : (
              team.map((person) => (
                <div key={person.id} className="p-6 bg-brand-bg border border-brand-primary/5 rounded-[2rem] flex items-center justify-between group hover:border-brand-accent/20 transition-all">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-white rounded-2xl border border-brand-primary/5 flex items-center justify-center text-brand-accent shadow-sm">
                      <Users size={24} />
                    </div>
                    <div>
                      <h5 className="text-sm font-black text-brand-primary tracking-tight">{person.name}</h5>
                      <p className="text-[9px] text-brand-accent font-black uppercase tracking-widest">{person.role}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="p-3 text-brand-primary/20 hover:text-brand-primary hover:bg-white rounded-xl transition-all">
                      <Phone size={18} />
                    </button>
                    <button 
                      onClick={() => removeProf(person.id)}
                      className="p-3 text-brand-primary/20 hover:text-rose-600 hover:bg-white rounded-xl transition-all"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
          <button 
            onClick={() => {
              setIsManageModalOpen(false);
              setIsAddModalOpen(true);
            }}
            className="w-full py-5 border border-dashed border-brand-primary/10 rounded-[1.5rem] text-brand-primary/20 text-[10px] font-black uppercase tracking-widest hover:bg-brand-bg hover:text-brand-primary transition-all flex items-center justify-center gap-3"
          >
            <Plus size={18} /> New Recruitment
          </button>
        </div>
      </Modal>
    </div>
  );
}

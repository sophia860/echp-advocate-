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
  Phone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';
import Modal from './ui/Modal';

interface Prof {
  id: string;
  name: string;
  role: string;
}

export default function ProfessionalFinder({ onToast }: { onToast: (msg: string) => void }) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isManageModalOpen, setIsManageModalOpen] = useState(false);
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

  const professionals = [
    { name: 'Dr. James Okafor', role: 'Independent Ed Psychologist', tags: ['ASD', 'SpLD', 'SEMH'], location: 'London / Remote', turnaround: '3 weeks', rating: 4.9, reviews: 42, price: '£1,200 - £1,500' },
    { name: 'Dr. Priya Nair', role: 'ADHD Specialist', tags: ['ADHD', 'PDA', 'Gifted'], location: 'Midlands / Remote', turnaround: '4 weeks', rating: 4.8, reviews: 28, price: '£1,000 - £1,300' },
    { name: 'Sarah Chen', role: 'Independent SEN Advocate', tags: ['Tribunal', 'EHCP Request'], location: 'Remote Only', turnaround: '1 week', rating: 5.0, reviews: 156, price: '£60 - £100/hr' },
  ];

  return (
    <div className="space-y-8">
      <div className="bg-brand-900 p-10 rounded-[3rem] text-white shadow-xl shadow-brand-900/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-32 -mt-32" />
        <div className="relative z-10 max-w-2xl">
          <h2 className="text-3xl font-display italic font-bold mb-4 tracking-tight">Your Professional Team</h2>
          <p className="text-brand-100 mb-8 leading-relaxed">
            Based on Maya's current stage (Draft Plan), we recommend updating your independent EP report. 
            Tribunal panels prioritize evidence less than 2 years old.
          </p>
          <div className="flex flex-wrap gap-4">
            <button 
              onClick={() => setIsAddModalOpen(true)}
              className="px-5 py-2.5 bg-white text-brand-900 rounded-xl text-sm font-bold shadow-lg hover:bg-brand-50 transition-all flex items-center gap-2"
            >
              <Plus size={18} /> Add Professional
            </button>
            <button 
              onClick={() => setIsManageModalOpen(true)}
              className="px-5 py-2.5 bg-white/10 backdrop-blur-md border border-white/20 text-white rounded-xl text-sm font-bold hover:bg-white/20 transition-all"
            >
              Manage Existing Team
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-8">
        {/* Filters Sidebar */}
        <div className="w-full md:w-64 space-y-6 shrink-0">
          <div className="bg-white p-6 rounded-[2.5rem] border border-[#EADDD7] shadow-sm">
            <div className="flex items-center justify-between mb-4">
               <h3 className="font-bold">Filters</h3>
               <Filter size={16} className="text-slate-400" />
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Specialism</p>
                <div className="space-y-2">
                  {['ASD', 'ADHD', 'Dyslexia', 'SEMH', 'PDA'].map(tag => (
                    <label key={tag} className="flex items-center gap-2 cursor-pointer group">
                      <input type="checkbox" className="w-4 h-4 rounded border-[#EADDD7] text-brand-600 focus:ring-brand-500" />
                      <span className="text-xs text-slate-600 font-medium group-hover:text-slate-900">{tag}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-50">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2">Availability</p>
                <div className="space-y-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-[#EADDD7]" />
                    <span className="text-xs text-slate-600">Within 2 weeks</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="w-4 h-4 rounded border-[#EADDD7]" />
                    <span className="text-xs text-slate-600">Remote only</span>
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 space-y-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-slate-900">Recommended for you</h3>
            <p className="text-xs text-slate-400 font-medium">3 specialists nearby</p>
          </div>
          
          <div className="space-y-4">
            {professionals.map((prof, i) => (
              <motion.div 
                whileHover={{ y: -2 }}
                key={i} 
                className="bg-white p-6 rounded-[2.5rem] border border-[#EADDD7] shadow-sm flex flex-col md:flex-row gap-6 hover:border-brand-300 transition-all cursor-pointer group"
              >
                <div className="w-24 h-24 bg-brand-50 rounded-3xl flex items-center justify-center shrink-0 overflow-hidden border border-brand-100">
                   <img src={`https://picsum.photos/seed/${prof.name}/150/150`} alt={prof.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                </div>
                
                <div className="flex-1 min-w-0">
                   <div className="flex items-start justify-between">
                     <div>
                       <h4 className="text-lg font-bold text-slate-900 group-hover:text-brand-900 transition-colors">{prof.name}</h4>
                       <p className="text-sm text-brand-600 font-medium mb-2">{prof.role}</p>
                     </div>
                     <div className="flex items-center gap-1 bg-brand-50 px-2 py-1 rounded-lg text-brand-700 text-xs font-bold">
                        <Star size={12} className="fill-brand-500 text-brand-500" /> {prof.rating}
                     </div>
                   </div>

                   <div className="flex flex-wrap gap-2 mb-4">
                     {prof.tags.map(tag => (
                       <span key={tag} className="px-2 py-0.5 bg-slate-50 text-slate-500 rounded-full text-[10px] font-bold uppercase tracking-tight italic">
                         {tag}
                       </span>
                     ))}
                   </div>

                   <div className="flex flex-wrap gap-x-6 gap-y-2">
                     <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <MapPin size={14} className="text-slate-300" /> {prof.location}
                     </div>
                     <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Clock size={14} className="text-slate-300" /> {prof.turnaround} turnaround
                     </div>
                     <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium">
                        <Video size={14} className="text-slate-300" /> Video consults
                     </div>
                   </div>
                </div>

                <div className="flex flex-col justify-between items-end border-l border-slate-50 pl-6 shrink-0 min-w-[140px]">
                   <div className="text-right">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Est. Cost</p>
                      <p className="font-bold text-slate-900">{prof.price}</p>
                   </div>
                   <button 
                     onClick={() => onToast(`✓ Contact request sent to ${prof.name}`)}
                     className="mt-4 px-4 py-2.5 bg-brand-900 text-white rounded-xl text-xs font-bold hover:bg-brand-800 transition-all flex items-center gap-2 shadow-lg shadow-brand-900/10"
                   >
                      Request Contact <ChevronRight size={14} />
                   </button>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      <Modal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add Team Member"
      >
        <form onSubmit={handleAddProf} className="space-y-6">
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Full Name</label>
              <input 
                autoFocus
                type="text" 
                value={newProf.name}
                onChange={e => setNewProf({...newProf, name: e.target.value})}
                placeholder="e.g. Dr. Sarah Mills"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest pl-1">Role / Specialism</label>
              <input 
                type="text" 
                value={newProf.role}
                onChange={e => setNewProf({...newProf, role: e.target.value})}
                placeholder="e.g. Educational Psychologist"
                className="w-full px-5 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500/20"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full py-4 bg-brand-900 text-white rounded-2xl font-bold hover:bg-brand-800 transition-all shadow-lg"
          >
            Add to Team
          </button>
        </form>
      </Modal>

      <Modal
        isOpen={isManageModalOpen}
        onClose={() => setIsManageModalOpen(false)}
        title="Manage Team"
      >
        <div className="space-y-4 max-h-[400px] overflow-y-auto custom-scrollbar pr-2">
          {team.length === 0 ? (
             <div className="text-center py-12 text-slate-400">
               <Users size={40} className="mx-auto mb-3 opacity-20" />
               <p className="text-sm font-medium">No team members added yet.</p>
             </div>
          ) : (
            team.map((person) => (
              <div key={person.id} className="p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-between group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white rounded-xl border border-slate-200 flex items-center justify-center text-brand-600">
                    <Users size={20} />
                  </div>
                  <div>
                    <h5 className="text-sm font-bold text-slate-900">{person.name}</h5>
                    <p className="text-xs text-slate-500 font-medium">{person.role}</p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button className="p-2 text-slate-400 hover:text-brand-600 hover:bg-white rounded-lg transition-all">
                    <Phone size={16} />
                  </button>
                  <button 
                    onClick={() => removeProf(person.id)}
                    className="p-2 text-slate-400 hover:text-rose-600 hover:bg-white rounded-lg transition-all"
                  >
                    <Trash2 size={16} />
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
          className="mt-6 w-full py-4 border border-dashed border-[#EADDD7] rounded-2xl text-slate-400 text-sm font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
        >
          <Plus size={16} /> Add Another
        </button>
      </Modal>
    </div>
  );
}

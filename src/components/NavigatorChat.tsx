import { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Sparkles, 
  User, 
  Bot, 
  Loader2, 
  Plus, 
  ArrowRight,
  Info,
  ShieldCheck,
  ChevronDown,
  Clock,
  FileText,
  MessageSquare
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import type { Case } from '../types';
import { askNavigator } from '../lib/gemini';

export default function NavigatorChat({ appCase }: { appCase: Case }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: `Ready to secure ${appCase.childName}'s provision. I've mapped the current statutory timeline against ${appCase.laName}'s recent conduct. We have 14 days until the finalisation threshold. \n\nHow shall we proceed? I can draft a Section F challenge or audit your latest EP report.` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = scrollRef.current;
        setShowScrollBottom(scrollHeight - scrollTop - clientHeight > 100);
      }
    };
    const current = scrollRef.current;
    current?.addEventListener('scroll', handleScroll);
    return () => current?.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    const history = messages
      .filter((m, i) => !(i === 0 && m.role === 'assistant'))
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

    const context = `
      Current Case Context:
      - Child: ${appCase.childName} (${appCase.age} years old)
      - LA: ${appCase.laName}
      - Stage: ${appCase.currentStage}
      - Deadline: ${appCase.nextDeadline} (${appCase.deadlineLabel})
      - Docs: ${appCase.docs.length} uploaded
      
      User's Query: ${userMsg}
    `;

    const response = await askNavigator(context, history);
    
    setMessages(prev => [...prev, { role: 'assistant', content: response }]);
    setIsLoading(false);
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-[3rem] border border-brand-primary/5 shadow-2xl overflow-hidden relative">
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-bg rounded-full -mr-64 -mt-64 blur-3xl opacity-50" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-brand-accent/5 rounded-full -ml-32 -mb-32 blur-3xl opacity-30" />
      </div>

      {/* Console Header */}
      <div className="relative z-10 p-8 border-b border-brand-primary/5 glass flex items-center justify-between">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <div className="w-16 h-16 bg-brand-primary rounded-[1.25rem] flex items-center justify-center text-white shadow-xl shadow-brand-primary/20 group-hover:scale-105 transition-transform">
              <Bot size={32} strokeWidth={1.5} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-emerald-500 border-4 border-white rounded-full shadow-sm" />
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h3 className="text-xl text-display">Legal Aide</h3>
              <span className="text-[10px] font-black text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-md uppercase tracking-widest border border-emerald-100">Live_Sync</span>
            </div>
            <p className="text-[10px] font-black text-brand-primary/30 uppercase tracking-[0.3em] mt-1">Cognitive Advantage System • EHCP Specialized</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           {[ShieldCheck, Clock].map((Icon, i) => (
             <div key={i} className="w-12 h-12 bg-brand-bg rounded-2xl flex items-center justify-center text-brand-primary/40 hover:text-brand-accent transition-colors cursor-pointer">
               <Icon size={24} strokeWidth={1.5} />
             </div>
           ))}
        </div>
      </div>

      {/* Message Feed */}
      <div 
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto p-10 space-y-12 custom-scrollbar"
      >
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1], delay: i * 0.1 }}
            key={i}
            className={cn(
              "flex gap-6 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-12 h-12 rounded-[1rem] flex items-center justify-center shrink-0 border-2 transition-all",
              msg.role === 'user' 
                ? "bg-white border-brand-primary/5 text-brand-primary shadow-sm" 
                : "bg-brand-primary border-brand-primary text-white shadow-xl shadow-brand-primary/20"
            )}>
              {msg.role === 'user' ? <User size={22} strokeWidth={1.5} /> : <Sparkles size={22} strokeWidth={1.5} />}
            </div>
            
            <div className={cn(
              "flex flex-col gap-3",
              msg.role === 'user' ? "items-end" : "items-start"
            )}>
               <div className="flex items-center gap-3 text-[10px] font-black uppercase tracking-[0.2em] text-brand-primary/20">
                {msg.role === 'user' ? 'Case Authorised' : 'Navigator Protocol'}
                <span className="opacity-50">• {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className={cn(
                "p-8 rounded-[2.5rem] relative shadow-lg text-brand-primary",
                msg.role === 'user' 
                  ? "bg-brand-bg border border-brand-primary/5 rounded-tr-none" 
                  : "bg-white border border-brand-primary/5 rounded-tl-none"
              )}>
                <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-p:text-brand-primary/80 prose-strong:text-brand-primary prose-strong:font-black">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-6 max-w-[85%] mr-auto">
            <div className="w-12 h-12 rounded-[1rem] bg-brand-primary border-2 border-brand-primary flex items-center justify-center text-white shrink-0 shadow-xl shadow-brand-primary/20">
              <Bot size={22} strokeWidth={1.5} />
            </div>
            <div className="p-8 bg-white border border-brand-primary/5 rounded-[2.5rem] rounded-tl-none shadow-lg flex items-center gap-6">
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }} 
                    transition={{ repeat: Infinity, duration: 1, delay: i * 0.2 }} 
                    className="w-2 h-2 bg-brand-accent rounded-full" 
                  />
                ))}
              </div>
              <span className="text-[10px] font-black text-brand-primary/40 uppercase tracking-[0.2em]">Synthesizing Data...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Prompt Suggestions */}
      <AnimatePresence>
        {messages.length === 1 && !isLoading && !input && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-wrap gap-3 px-10 pb-6"
          >
            {["Next statutory hurdle?", "Analyze Section F", "Audit EP Report", "LA Conduct Review"].map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="px-6 py-3 bg-brand-primary/5 border border-transparent rounded-full text-[10px] font-black text-brand-primary/60 uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all shadow-sm active:scale-95"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Command Input Area */}
      <div className="relative z-10 p-10 bg-brand-bg/50 border-t border-brand-primary/5 glass">
        <div className="max-w-5xl mx-auto flex gap-6">
          <div className="flex-1 relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query the case matrix..."
              className="w-full pl-10 pr-24 py-7 bg-white border border-brand-primary/5 rounded-[2rem] text-sm font-bold focus:outline-none focus:ring-4 focus:ring-brand-accent/5 focus:border-brand-accent/20 transition-all placeholder:text-brand-primary/20 shadow-xl"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-16 h-16 bg-brand-primary text-white rounded-[1.5rem] flex items-center justify-center shadow-2xl shadow-brand-primary/30 transition-all hover:bg-brand-accent hover:-translate-y-[55%] active:scale-95 disabled:opacity-20 disabled:grayscale"
            >
              <ArrowRight size={28} strokeWidth={2} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-10 mt-8 opacity-20 group">
           {[
             { Icon: ShieldCheck, label: 'SENDIST_RELIANCE' },
             { Icon: Clock, label: 'STATUTORY_SYNC_OK' },
             { Icon: MessageSquare, label: 'GEMINI_FLASH_2.0' }
           ].map((item, i) => (
             <div key={i} className="flex items-center gap-2 text-[8px] font-black text-brand-primary uppercase tracking-[0.3em] hover:opacity-100 transition-opacity">
               <item.Icon size={12} strokeWidth={2.5} /> {item.label}
             </div>
           ))}
        </div>
      </div>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(10, 37, 64, 0.05); border-radius: 10px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(10, 37, 64, 0.1); }
      `}</style>
    </div>
  );
}

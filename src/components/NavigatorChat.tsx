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
  FileText
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { cn } from '../lib/utils';
import type { Case } from '../types';
import { askNavigator } from '../lib/ai-client';

export default function NavigatorChat({ appCase }: { appCase: Case }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: `Good morning! I'm your EHCP Navigator. I've been reviewing ${appCase.childName}'s case. The LA's 15-week deadline for finalising the EHCP is in 14 days. How can I help you today?` }
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

    // Prepare history for Gemini
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

  const scrollToBottom = () => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  };

  const suggestions = [
    { label: "Check deadlines", icon: Clock },
    { label: "Review Draft Plan", icon: FileText },
    { label: "Section F wording", icon: ShieldCheck },
    { label: "Chaser letter", icon: Send }
  ];

  return (
    <div className="flex flex-col h-full bg-[#FAF9F6] rounded-[2.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 overflow-hidden relative">
      {/* High-tech Background Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03]" 
           style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

      {/* Chat Header */}
      <div className="relative z-10 p-6 border-b border-slate-100 bg-white/80 backdrop-blur-md flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="w-12 h-12 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-xl shadow-slate-900/20">
              <Bot size={24} />
            </div>
            <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-emerald-500 border-2 border-white rounded-full" />
          </div>
          <div>
            <h3 className="text-sm font-bold uppercase tracking-[0.2em] text-slate-400">System.Navigator</h3>
            <div className="flex items-center gap-2">
              <span className="text-lg font-black text-slate-900">EHCP Advocate AI</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden md:flex flex-col items-end">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Protocol</span>
            <span className="text-[10px] font-mono text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded uppercase">Encrypted_SEND.v2</span>
          </div>
          <div className="w-px h-8 bg-slate-100 mx-2" />
          <div className="p-2 transition-colors hover:bg-slate-50 cursor-pointer text-slate-400">
            <Info size={20} />
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="relative z-10 flex-1 overflow-y-auto p-6 md:p-8 space-y-10 custom-scrollbar"
      >
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={cn(
              "flex gap-5 max-w-[90%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border transition-all",
              msg.role === 'user' 
                ? "bg-slate-50 border-slate-200 text-slate-400" 
                : "bg-slate-900 border-slate-800 text-white shadow-lg glow-bot"
            )}>
              {msg.role === 'user' ? <User size={18} /> : <Bot size={18} />}
            </div>
            
            <div className="flex flex-col gap-2">
              <div className={cn(
                "flex items-center gap-3 text-[10px] uppercase font-bold tracking-[0.15em] mb-1",
                msg.role === 'user' ? "justify-end text-slate-400" : "text-slate-500"
              )}>
                {msg.role === 'user' ? 'Case Holder' : 'Navigator Engine'}
                <span className="font-mono opacity-50">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              
              <div className={cn(
                "p-6 rounded-2xl relative transition-all",
                msg.role === 'user' 
                  ? "bg-white border border-slate-200 text-black shadow-xl shadow-slate-200/20 rounded-tr-none" 
                  : "bg-white border border-slate-200 text-black shadow-xl shadow-slate-200/20 rounded-tl-none"
              )}>
                {msg.role === 'assistant' && (
                  <div className="absolute top-0 right-0 p-2 opacity-10">
                    <Sparkles size={16} />
                  </div>
                )}
                <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-p:text-black">
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-5 max-w-[90%] mr-auto">
            <div className="w-10 h-10 rounded-lg bg-slate-900 border border-slate-800 flex items-center justify-center text-white shrink-0 shadow-lg glow-bot">
              <Bot size={18} />
            </div>
            <div className="p-6 bg-white border border-slate-100 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-4">
              <div className="flex gap-1">
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.2 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
                <motion.div animate={{ scale: [1, 1.2, 1] }} transition={{ repeat: Infinity, duration: 1, delay: 0.4 }} className="w-1.5 h-1.5 bg-emerald-500 rounded-full" />
              </div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.2em]">Neural Processing...</span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Suggestion Chips */}
      <AnimatePresence>
        {messages.length === 1 && !isLoading && !input && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="relative z-10 flex flex-wrap gap-2 px-8 pb-4"
          >
            {["Next deadline?", "Challenge Section F", "Review EP Report", "Legal Timeline"].map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="px-5 py-2.5 bg-white border border-slate-200 rounded-full text-[10px] font-bold text-slate-600 uppercase tracking-widest hover:border-slate-900 hover:text-slate-900 transition-all shadow-sm active:scale-95"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="relative z-10 p-6 bg-white border-t border-slate-100">
        <div className="max-w-4xl mx-auto flex gap-4">
          <div className="flex-1 relative group">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Query Navigator system..."
              className="w-full pl-6 pr-14 py-5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-all font-medium text-black placeholder:text-slate-400 placeholder:uppercase placeholder:text-[10px] placeholder:tracking-widest"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 w-11 h-11 bg-slate-900 text-white rounded-xl flex items-center justify-center shadow-xl shadow-slate-900/20 transition-all hover:bg-black hover:-translate-y-[55%] active:scale-95 disabled:scale-100 disabled:opacity-20 disabled:grayscale"
            >
              <Send size={20} />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-center gap-6 mt-5 opacity-40">
           <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-800 uppercase tracking-[0.2em]">
             <ShieldCheck size={10} /> Compliance.SEND_2024
           </div>
           <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-800 uppercase tracking-[0.2em]">
             <Clock size={10} /> Real_Time_Sync
           </div>
           <div className="flex items-center gap-1.5 text-[8px] font-bold text-slate-800 uppercase tracking-[0.2em]">
             <Sparkles size={10} /> Gemini_Flash_Ready
           </div>
        </div>
      </div>

      <style>{`
        .glow-bot {
          box-shadow: 0 0 15px rgba(15, 23, 42, 0.2);
        }
        .prose p { 
          color: black !important;
          font-family: var(--font-sans); 
          font-weight: 500;
          font-size: 0.95rem;
          margin-bottom: 0.75rem; 
        }
        .prose strong { color: black; font-weight: 800; }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; margin-top: 0.5rem; }
        .prose li { margin-bottom: 0.5rem; color: #1e293b; }
      `}</style>
    </div>
  );
}

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
import { askNavigator } from '../lib/gemini';

export default function NavigatorChat({ appCase }: { appCase: Case }) {
  const [messages, setMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>([
    { role: 'assistant', content: `Good morning! I'm your EHCP Navigator. I've been reviewing ${appCase.childName}'s case. The LA's 15-week deadline for finalising the EHCP is in 14 days. How can I help you today?` }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBottom, setShowScrollBottom] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

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
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setIsLoading(true);

    // Prepare history for Gemini
    const history = messages.map(m => ({
      role: m.role === 'user' ? 'user' : 'model',
      parts: [{ text: m.content }]
    }));

    const response = await askNavigator(
      `Context: Child is ${appCase.childName}, Local Authority is ${appCase.laName}. Query: ${userMsg}`, 
      history
    );
    
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
    <div className="flex flex-col h-full bg-white rounded-[3rem] border border-[#EADDD7] shadow-xl shadow-brand-900/5 overflow-hidden relative">
      {/* Chat Header */}
      <div className="p-6 border-b border-[#EADDD7] bg-white flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-brand-900 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-brand-900/20">
            <Bot size={24} />
          </div>
          <div>
            <h3 className="text-lg font-bold">The Navigator</h3>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 bg-emerald-500 rounded-full" />
              <span className="text-xs text-slate-400 font-medium uppercase tracking-widest">Expert AI Advocate</span>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-brand-50 rounded-full border border-brand-100 text-[10px] font-bold text-brand-700 uppercase tracking-wider">
            <ShieldCheck size={14} /> SEND Code Aware
          </div>
        </div>
      </div>

      {/* Messages */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8 custom-scrollbar bg-[#FDF8F6]/30"
      >
        {messages.map((msg, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            key={i}
            className={cn(
              "flex gap-4 max-w-[85%]",
              msg.role === 'user' ? "ml-auto flex-row-reverse" : "mr-auto"
            )}
          >
            <div className={cn(
              "w-10 h-10 rounded-2xl flex items-center justify-center shrink-0 shadow-sm",
              msg.role === 'user' ? "bg-white text-slate-400" : "bg-brand-900 text-white"
            )}>
              {msg.role === 'user' ? <User size={20} /> : <Bot size={20} />}
            </div>
            <div className={cn(
              "p-5 rounded-[2rem]",
              msg.role === 'user' 
                ? "bg-brand-900 text-white rounded-tr-none shadow-lg shadow-brand-900/10" 
                : "bg-white border border-[#EADDD7] text-slate-800 rounded-tl-none shadow-sm"
            )}>
              <div className="prose prose-sm prose-brand prose-invert-user max-w-none">
                <ReactMarkdown>{msg.content}</ReactMarkdown>
              </div>
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex gap-4 max-w-[85%] mr-auto">
            <div className="w-10 h-10 rounded-2xl bg-brand-900 flex items-center justify-center text-white shrink-0 shadow-sm">
              <Bot size={20} />
            </div>
            <div className="p-5 bg-white border border-[#EADDD7] rounded-[2rem] rounded-tl-none shadow-sm flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-brand-600 font-bold text-xs uppercase tracking-widest animate-pulse">
                <Loader2 size={14} className="animate-spin" /> Navigator is thinking...
              </span>
            </div>
          </div>
        )}
        <AnimatePresence>
          {showScrollBottom && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              onClick={scrollToBottom}
              className="absolute bottom-8 right-8 bg-white border border-[#EADDD7] text-slate-400 hover:text-brand-600 p-2.5 rounded-full shadow-lg z-10 hover:bg-slate-50 transition-all"
            >
              <ChevronDown size={18} />
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Suggestion Chips */}
      <AnimatePresence>
        {messages.length === 1 && !isLoading && !input && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="flex flex-wrap gap-2 px-8 pb-4"
          >
            {["What's my next deadline?", "Draft a Section F challenge", "Review latest EP report", "Ask about LA delays"].map((s, i) => (
              <button
                key={i}
                onClick={() => setInput(s)}
                className="px-4 py-2 bg-brand-50 border border-brand-100 rounded-full text-xs font-bold text-brand-700 hover:bg-brand-100 transition-all"
              >
                {s}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Input */}
      <div className="p-6 bg-white border-t border-[#EADDD7]">
        <div className="max-w-4xl mx-auto flex gap-3">
          <div className="flex-1 relative">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask about your case, a document, or legal deadlines..."
              className="w-full pl-6 pr-14 py-4 bg-slate-50 border border-slate-200 rounded-[2rem] text-sm focus:outline-none focus:ring-4 focus:ring-brand-500/10 focus:border-brand-500 transition-all font-medium"
            />
            <button 
              onClick={handleSend}
              disabled={isLoading || !input.trim()}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 bg-brand-900 text-white rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105 active:scale-95 disabled:scale-100 disabled:opacity-50 disabled:bg-slate-300"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
        <p className="text-center mt-4 text-[10px] text-slate-400 font-medium uppercase tracking-[0.2em]">
          Powered by Gemini 2.0 Flash • Trained in SEND Code of Practice
        </p>
      </div>

      <style>{`
        .prose-invert-user p { color: white; margin: 0; }
        .prose p { margin: 0; }
        .prose strong { color: inherit; font-weight: 700; }
        .prose ul { margin-top: 0.5em; list-style-type: disc; padding-left: 1.25em; }
        .prose li { margin-bottom: 0.25em; }
      `}</style>
    </div>
  );
}

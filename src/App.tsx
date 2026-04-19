/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarClock,
  Camera,
  CheckCircle2,
  ChevronRight,
  FileText,
  Heart,
  Mic,
  PenSquare,
  Scale,
  ScrollText,
  Share2,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { cn } from './lib/utils';
import type { Case, Communication } from './types';
import Modal from './components/ui/Modal';
import Toast from './components/ui/Toast';

type CommandNode = {
  id: string;
  title: string;
  subtitle: string;
  status: 'calm' | 'focus' | 'urgent';
  note: string;
  evidence: string[];
};

type TemplateItem = {
  id: string;
  title: string;
  description: string;
  body: string;
};

const initialCase: Case = {
  childName: 'Maya',
  age: 7,
  laName: 'Kent County Council',
  currentStage: 'Draft Plan',
  nextDeadline: '2026-05-15',
  deadlineLabel: 'Draft plan response due',
  docs: [
    { id: '1', name: 'Draft EHCP', type: 'Plan', uploadDate: '3 days ago', status: 'flagged', flagsCount: 3 },
    { id: '2', name: 'EP report', type: 'Assessment', uploadDate: '1 week ago', status: 'reviewed' },
    { id: '3', name: 'Speech and language note', type: 'Therapy', uploadDate: 'Today', status: 'pending' },
  ],
  comms: [
    {
      id: '1',
      title: 'Section F challenge draft',
      to: 'SEN Team',
      status: 'draft',
      date: 'Today',
      content: 'Please specify and quantify the provision in Section F.',
      isAiGenerated: true,
    },
  ],
};

const starterNodes: CommandNode[] = [
  {
    id: 'profile',
    title: 'Child profile',
    subtitle: 'Section A warmth',
    status: 'calm',
    note: 'Maya is funny, affectionate, and thrives with structure. A good day means predictable routines, movement breaks, and language broken into short chunks.',
    evidence: ['good day notes', 'sensory profile'],
  },
  {
    id: 'needs',
    title: 'Needs',
    subtitle: 'Sections B and C',
    status: 'focus',
    note: 'Speech processing delays, sensory dysregulation, and anxiety around transitions are the strongest recurring themes across reports.',
    evidence: ['EP report', 'teacher notes'],
  },
  {
    id: 'evidence',
    title: 'Evidence log',
    subtitle: 'Uploads and OCR',
    status: 'focus',
    note: 'Twelve evidence items logged this month. Two more uploads would complete the provision bundle for the next review.',
    evidence: ['attendance photo', 'private SALT report', 'parent diary'],
  },
  {
    id: 'letters',
    title: 'Meetings and letters',
    subtitle: 'Scripts and drafts',
    status: 'urgent',
    note: 'Draft challenge letter needed to request quantified support in Section F before the response deadline.',
    evidence: ['draft objection', 'meeting agenda'],
  },
  {
    id: 'outcomes',
    title: 'Outcomes and provision',
    subtitle: 'Sections E and F',
    status: 'calm',
    note: 'Provision should name frequency, duration, and who delivers each intervention so it can actually be enforced.',
    evidence: ['OT recommendation'],
  },
  {
    id: 'appeal',
    title: 'LA responses and appeals',
    subtitle: 'Deadlines watched',
    status: 'urgent',
    note: 'Deadline guardian is watching the draft plan response date and tribunal prep window.',
    evidence: ['deadline tracker'],
  },
];

const templates: TemplateItem[] = [
  {
    id: 'section-a',
    title: 'Section A parental views',
    description: 'Warm prompts for daily life and aspirations',
    body: 'On a good day, Maya is at her best when adults understand her sensory needs and let her communicate in her own time. Our family wants school to feel safe, consistent, and achievable.',
  },
  {
    id: 'assessment-request',
    title: 'Needs assessment request',
    description: 'One-tap request letter',
    body: 'I am formally requesting an Education, Health and Care needs assessment because Maya continues to require provision beyond ordinarily available support.',
  },
  {
    id: 'draft-response',
    title: 'Response to draft EHCP',
    description: 'Ask for quantified provision',
    body: 'Please amend Section F so that support is specific, quantified, and enforceable. Phrases such as support as needed are too vague to secure provision.',
  },
  {
    id: 'meeting-agenda',
    title: 'Meeting agenda',
    description: 'Quick prep sheet for reviews',
    body: 'Agenda: current needs, missed provision, evidence summary, agreed amendments, and clear next actions with dates.',
  },
  {
    id: 'evidence-summary',
    title: 'Evidence summary',
    description: 'Bundle by EHCP section',
    body: 'Evidence grouped by needs, outcomes, and provision shows that Maya requires structured language support, sensory regulation input, and consistent adult scaffolding.',
  },
  {
    id: 'tribunal-checklist',
    title: 'Tribunal checklist',
    description: 'Calm step-by-step appeal prep',
    body: 'Checklist: final plan, refusal or decision letter, indexed evidence bundle, witness list, key issues, and desired wording changes.',
  },
];

function buildLetter(appCase: Case, selectedNode: CommandNode | undefined): string {
  const note = selectedNode?.note ?? 'We are asking for clearer support based on the evidence already provided.';

  return [
    `To: ${appCase.laName} SEN Team`,
    '',
    `Re: ${appCase.childName}'s EHCP`,
    '',
    'I am writing to ask for amendments to the current draft EHCP.',
    '',
    'Our concern is that the plan still does not fully and clearly describe need and provision in a quantified, enforceable way.',
    '',
    `Current focus: ${note}`,
    '',
    'Please ensure the final wording specifies what support will be delivered, by whom, how often, and for how long.',
    '',
    'Thank you for your attention and for responding within the statutory timescale.',
    '',
    `Parent of ${appCase.childName}`,
    'Made easy in EHCP App',
  ].join('\n');
}

export default function App() {
  const [appCase, setAppCase] = useState<Case>(initialCase);
  const [nodes, setNodes] = useState<CommandNode[]>(starterNodes);
  const [selectedNodeId, setSelectedNodeId] = useState('profile');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [zoom, setZoom] = useState(100);
  const [previewTitle, setPreviewTitle] = useState('');
  const [previewBody, setPreviewBody] = useState('');
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [toast, setToast] = useState({ message: '', isVisible: false });
  const [notifications, setNotifications] = useState([
    { id: '1', text: 'Section F still needs quantified wording', time: '2h ago' },
    { id: '2', text: 'Draft response deadline is coming up', time: 'today' },
    { id: '3', text: 'You have logged 12 pieces of evidence this month', time: 'this week' },
  ]);

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId),
    [nodes, selectedNodeId],
  );

  const showToast = (message: string) => {
    setToast({ message, isVisible: true });
    window.setTimeout(() => {
      setToast((prev) => ({ ...prev, isVisible: false }));
    }, 2600);
  };

  const daysLeft = Math.max(
    0,
    Math.ceil((new Date(appCase.nextDeadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)),
  );

  const progressPercent = Math.min(100, 40 + appCase.docs.length * 8 + appCase.comms.length * 6);

  const encouragement =
    appCase.docs.length >= 5
      ? `You have captured ${appCase.docs.length} pieces of evidence already — that is huge.`
      : 'A couple more uploads will make your bundle even stronger.';

  useEffect(() => {
    document.title = `${appCase.childName} • My Child's Command Centre`;
  }, [appCase.childName]);

  const updateSelectedNode = (nextNote: string) => {
    setNodes((prev) => prev.map((node) => (node.id === selectedNodeId ? { ...node, note: nextNote } : node)));
  };

  const addCommunication = (title: string, content: string) => {
    const newComm: Communication = {
      id: String(Date.now()),
      title,
      to: `${appCase.laName} SEN Team`,
      status: 'draft',
      date: 'Just now',
      content,
      isAiGenerated: true,
    };

    setAppCase((prev) => ({ ...prev, comms: [newComm, ...prev.comms] }));
  };

  const handleVoiceNote = () => {
    const voiceText = 'Voice note captured: school drop-off was calmer with visual prompts and extra processing time.';
    updateSelectedNode(`${selectedNode?.note ?? ''}\n\n${voiceText}`.trim());
    showToast('Voice note linked to the current case node.');
  };

  const handleUpload = () => {
    const docCount = appCase.docs.length + 1;
    const newDoc = {
      id: String(Date.now()),
      name: `Upload ${docCount} • Parent evidence`,
      type: 'Photo/PDF OCR',
      uploadDate: 'Just now',
      status: 'reviewed' as const,
    };

    setAppCase((prev) => ({ ...prev, docs: [newDoc, ...prev.docs] }));
    setNodes((prev) =>
      prev.map((node) =>
        node.id === selectedNodeId
          ? { ...node, evidence: [...node.evidence, `ocr upload ${docCount}`] }
          : node,
      ),
    );
    showToast('Upload scanned and suggested into the right case area.');
  };

  const handleNewNote = () => {
    updateSelectedNode(`${selectedNode?.note ?? ''}\n\nNew quick note: ask school for updated examples before the meeting.`.trim());
    showToast('Fresh note added to your workspace.');
  };

  const handleTemplateUse = (template: TemplateItem) => {
    const filled = `${template.body}\n\nPulled from ${appCase.childName}'s case summary and recent evidence.`;
    updateSelectedNode(filled);
    showToast(`${template.title} dropped into the active note.`);
  };

  const handleDraftLetter = () => {
    const letter = buildLetter(appCase, selectedNode);
    setPreviewTitle('Letter to the LA');
    setPreviewBody(letter);
    addCommunication('Letter to the LA', letter);
    setIsPreviewOpen(true);
  };

  const handleExport = () => {
    const exportText = [
      `Case summary for ${appCase.childName}`,
      '',
      `Current stage: ${appCase.currentStage}`,
      `Deadline: ${appCase.deadlineLabel} on ${appCase.nextDeadline}`,
      '',
      'Workspace nodes:',
      ...nodes.map((node) => `• ${node.title}: ${node.note}`),
      '',
      'Made easy in EHCP App',
    ].join('\n');

    setPreviewTitle('Share and export preview');
    setPreviewBody(exportText);
    setIsPreviewOpen(true);
    showToast('Share bundle prepared with a soft watermark.');
  };

  const statusStyles: Record<CommandNode['status'], string> = {
    calm: 'border-emerald-200 bg-emerald-50/80',
    focus: 'border-sky-200 bg-sky-50/80',
    urgent: 'border-amber-200 bg-amber-50/90',
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fdf7f4_0%,#f9f0ef_100%)] text-brand-primary">
      <div className="sticky top-0 z-40 border-b border-brand-primary/5 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3 sm:gap-4">
            <img
              src="https://picsum.photos/seed/ehcp-child/80/80"
              alt="Child profile"
              className="h-12 w-12 rounded-2xl border-2 border-rose-100 object-cover shadow-sm sm:h-14 sm:w-14"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-[11px] font-black uppercase tracking-[0.24em] text-rose-500">My Child's Command Centre</p>
              <h1 className="text-xl font-black sm:text-2xl">{appCase.childName}'s easy-breezy workspace</h1>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4">
            <div className="hidden rounded-2xl bg-emerald-50 px-4 py-3 text-right sm:block">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Progress streak</p>
              <p className="text-sm font-bold text-emerald-900">7 days logged 💪</p>
            </div>
            <div className="relative">
              <button
                onClick={() => setShowNotifications((prev) => !prev)}
                className="flex h-12 w-12 items-center justify-center rounded-2xl border border-brand-primary/5 bg-white text-brand-primary shadow-sm transition hover:-translate-y-0.5"
              >
                <Bell size={20} />
              </button>
              <AnimatePresence>
                {showNotifications && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    className="absolute right-0 mt-3 w-80 rounded-[2rem] border border-brand-primary/5 bg-white p-4 shadow-2xl"
                  >
                    <div className="mb-3 flex items-center justify-between">
                      <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/40">Deadline guardian</p>
                      <span className="rounded-full bg-amber-50 px-2 py-1 text-[10px] font-bold text-amber-700">{daysLeft} days left</span>
                    </div>
                    <div className="space-y-2">
                      {notifications.map((item) => (
                        <div key={item.id} className="rounded-2xl bg-brand-bg px-3 py-3 text-sm font-medium">
                          <div className="flex items-center justify-between gap-3">
                            <span>{item.text}</span>
                            <button
                              onClick={() => setNotifications((prev) => prev.filter((n) => n.id !== item.id))}
                              className="text-xs font-bold text-brand-primary/40 hover:text-brand-primary"
                            >
                              Clear
                            </button>
                          </div>
                          <p className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/30">{item.time}</p>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-7xl px-4 pb-32 pt-6 sm:px-6 lg:px-8">
        <section className="grid gap-4 lg:grid-cols-[1.4fr_0.9fr_0.8fr]">
          <motion.div
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-[2rem] bg-brand-primary p-5 text-white shadow-xl sm:p-6"
          >
            <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Today at a glance</p>
            <h2 className="mt-2 text-2xl font-black sm:text-3xl">Everything for your case, in one calm place</h2>
            <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/80">
              Mindmap, notes, templates, evidence, letters, and deadlines all live together so nothing gets lost.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Deadline</p>
                <p className="mt-1 text-lg font-bold">{daysLeft} days</p>
                <p className="text-sm text-white/70">{appCase.deadlineLabel}</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Evidence</p>
                <p className="mt-1 text-lg font-bold">{appCase.docs.length} items</p>
                <p className="text-sm text-white/70">Auto-linked to nodes</p>
              </div>
              <div className="rounded-2xl bg-white/10 p-4">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-white/60">Drafts ready</p>
                <p className="mt-1 text-lg font-bold">{appCase.comms.length}</p>
                <p className="text-sm text-white/70">Letters and scripts</p>
              </div>
            </div>
          </motion.div>

          <div className="rounded-[2rem] border border-brand-primary/5 bg-white p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-rose-50 p-3 text-rose-500">
                <Heart size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/35">Micro-win</p>
                <h3 className="text-lg font-black">You're doing brilliantly</h3>
              </div>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-brand-primary/70">{encouragement}</p>
            <div className="mt-4 h-2 overflow-hidden rounded-full bg-brand-bg">
              <div className="h-full rounded-full bg-rose-400" style={{ width: `${progressPercent}%` }} />
            </div>
            <p className="mt-2 text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/35">Case progress {progressPercent}%</p>
          </div>

          <div className="rounded-[2rem] border border-amber-100 bg-amber-50/80 p-5 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="rounded-2xl bg-white p-3 text-amber-600">
                <CalendarClock size={22} />
              </div>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-amber-700">Guardian bot</p>
                <h3 className="text-lg font-black text-amber-950">Action needed soon</h3>
              </div>
            </div>
            <ul className="mt-4 space-y-2 text-sm text-amber-950">
              <li>• Draft response window is active now</li>
              <li>• One challenge letter is ready to send</li>
              <li>• Tribunal checklist is preloaded</li>
            </ul>
          </div>
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.5fr_0.9fr]">
          <div className="space-y-6">
            <div className="rounded-[2rem] border border-brand-primary/5 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/35">Living case canvas</p>
                  <h2 className="text-2xl font-black">Mindmap and notepad fusion</h2>
                </div>
                <div className="flex items-center gap-3 rounded-2xl bg-brand-bg px-4 py-2">
                  <Scale size={16} className="text-brand-primary/50" />
                  <input
                    type="range"
                    min="80"
                    max="120"
                    value={zoom}
                    onChange={(e) => setZoom(Number(e.target.value))}
                    className="accent-rose-400"
                  />
                  <span className="text-xs font-bold text-brand-primary/60">{zoom}%</span>
                </div>
              </div>

              <div className="overflow-auto rounded-[1.5rem] bg-[linear-gradient(180deg,#fffaf9_0%,#fff_100%)] p-3 sm:p-4">
                <div
                  className="grid min-w-[680px] gap-3 md:grid-cols-2 xl:grid-cols-3"
                  style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top left' }}
                >
                  {nodes.map((node) => (
                    <button
                      key={node.id}
                      draggable
                      onClick={() => setSelectedNodeId(node.id)}
                      className={cn(
                        'rounded-[1.5rem] border p-4 text-left transition duration-200 hover:-translate-y-1 hover:shadow-md',
                        statusStyles[node.status],
                        selectedNodeId === node.id && 'ring-2 ring-rose-300',
                      )}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/40">{node.subtitle}</p>
                          <h3 className="mt-1 text-lg font-black">{node.title}</h3>
                        </div>
                        <span className="rounded-full bg-white/80 px-2 py-1 text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/45">tap</span>
                      </div>
                      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-brand-primary/75">{node.note}</p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {node.evidence.slice(0, 3).map((item) => (
                          <span key={item} className="rounded-full bg-white px-2 py-1 text-[10px] font-bold text-brand-primary/70">
                            {item}
                          </span>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-brand-primary/5 bg-white p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/35">Inline note pad</p>
                  <h2 className="text-2xl font-black">{selectedNode?.title ?? 'Case note'}</h2>
                </div>
                <div className="rounded-2xl bg-rose-50 px-3 py-2 text-xs font-bold text-rose-700">Auto-linked</div>
              </div>

              <textarea
                value={selectedNode?.note ?? ''}
                onChange={(e) => updateSelectedNode(e.target.value)}
                className="min-h-48 w-full rounded-[1.5rem] border border-brand-primary/10 bg-brand-bg px-4 py-4 text-sm font-medium leading-relaxed text-brand-primary outline-none focus:ring-2 focus:ring-rose-200"
              />

              <div className="mt-4 flex flex-wrap gap-2">
                {selectedNode?.evidence.map((item) => (
                  <span key={item} className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-700">
                    {item}
                  </span>
                ))}
              </div>
            </div>
          </div>

          <aside className="space-y-4 xl:sticky xl:top-28 xl:self-start">
            <div className="flex items-center justify-between xl:hidden">
              <h2 className="text-xl font-black">Tools</h2>
              <button
                onClick={() => setShowTools((prev) => !prev)}
                className="rounded-2xl border border-brand-primary/10 bg-white px-4 py-2 text-sm font-bold"
              >
                {showTools ? 'Hide' : 'Show'}
              </button>
            </div>

            <div className={cn('space-y-4', !showTools && 'hidden xl:block')}>
              <div className="rounded-[2rem] border border-brand-primary/5 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-sky-50 p-3 text-sky-600">
                    <ScrollText size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/35">Helpful templates vault</p>
                    <h3 className="text-lg font-black">20+ one-tap helpers</h3>
                  </div>
                </div>
                <div className="mt-4 space-y-2">
                  {templates.map((template) => (
                    <button
                      key={template.id}
                      onClick={() => handleTemplateUse(template)}
                      className="flex w-full items-center justify-between rounded-2xl bg-brand-bg px-3 py-3 text-left transition hover:bg-rose-50"
                    >
                      <div>
                        <p className="text-sm font-bold">{template.title}</p>
                        <p className="text-xs text-brand-primary/55">{template.description}</p>
                      </div>
                      <ChevronRight size={18} className="text-brand-primary/35" />
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[2rem] border border-brand-primary/5 bg-white p-4 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-violet-50 p-3 text-violet-600">
                    <Wand2 size={20} />
                  </div>
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/35">Advocacy tools</p>
                    <h3 className="text-lg font-black">One-tap drafting</h3>
                  </div>
                </div>
                <div className="mt-4 grid gap-2">
                  <button onClick={handleDraftLetter} className="btn-primary text-sm font-bold">Write my letter to LA</button>
                  <button onClick={handleExport} className="btn-accent text-sm font-bold">Export mindmap bundle</button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-brand-primary/5 bg-white p-4 shadow-sm">
                <p className="text-[10px] font-black uppercase tracking-[0.24em] text-brand-primary/35">Case health</p>
                <div className="mt-3 space-y-3 text-sm">
                  <div className="flex items-center justify-between rounded-2xl bg-brand-bg px-3 py-3">
                    <span>Evidence scanned</span>
                    <strong>{appCase.docs.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-brand-bg px-3 py-3">
                    <span>Letters drafted</span>
                    <strong>{appCase.comms.length}</strong>
                  </div>
                  <div className="flex items-center justify-between rounded-2xl bg-brand-bg px-3 py-3">
                    <span>Statutory watch</span>
                    <strong>{daysLeft} days</strong>
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </section>
      </main>

      <div className="fixed bottom-4 left-1/2 z-50 w-[calc(100%-1rem)] max-w-4xl -translate-x-1/2 rounded-[2rem] border border-brand-primary/10 bg-white/95 p-2 shadow-2xl backdrop-blur-xl sm:bottom-6 sm:w-auto sm:min-w-[760px]">
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          <button onClick={handleVoiceNote} className="flex items-center justify-center gap-2 rounded-[1.25rem] bg-rose-50 px-4 py-3 text-sm font-bold text-rose-700">
            <Mic size={18} /> Voice note
          </button>
          <button onClick={handleUpload} className="flex items-center justify-center gap-2 rounded-[1.25rem] bg-sky-50 px-4 py-3 text-sm font-bold text-sky-700">
            <Camera size={18} /> Quick upload
          </button>
          <button onClick={handleNewNote} className="flex items-center justify-center gap-2 rounded-[1.25rem] bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-700">
            <PenSquare size={18} /> New note
          </button>
          <button onClick={handleExport} className="flex items-center justify-center gap-2 rounded-[1.25rem] bg-amber-50 px-4 py-3 text-sm font-bold text-amber-700">
            <Share2 size={18} /> Export
          </button>
          <button onClick={handleDraftLetter} className="flex items-center justify-center gap-2 rounded-[1.25rem] bg-brand-primary px-4 py-3 text-sm font-bold text-white">
            <Sparkles size={18} /> Draft letter
          </button>
        </div>
      </div>

      <Modal isOpen={isPreviewOpen} onClose={() => setIsPreviewOpen(false)} title={previewTitle || 'Preview'}>
        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-brand-bg p-4 text-sm leading-relaxed whitespace-pre-wrap text-brand-primary/80">
            {previewBody}
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => {
                navigator.clipboard.writeText(previewBody);
                showToast('Preview copied to your clipboard.');
              }}
              className="btn-primary text-sm"
            >
              Copy text
            </button>
            <button
              onClick={() => {
                setIsPreviewOpen(false);
                showToast('Ready to share with the soft watermark included.');
              }}
              className="btn-accent text-sm"
            >
              Close preview
            </button>
          </div>
        </div>
      </Modal>

      <Toast message={toast.message} isVisible={toast.isVisible} />
    </div>
  );
}


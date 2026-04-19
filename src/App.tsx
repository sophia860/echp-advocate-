import { useEffect, useMemo, useState } from 'react';
import {
  ArrowRight,
  CalendarClock,
  CheckCircle2,
  FileText,
  Heart,
  Mic,
  Scale,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
} from 'lucide-react';
import { motion } from 'motion/react';

const encouragements = [
  'This evidence shows real resilience. It strengthens your child’s story beautifully.',
  'You are not behind. You are building a clear case, one step at a time.',
  'This is exactly the kind of detail that helps Section B and Section F land properly.',
];

const timeline = [
  {
    title: 'Your amazing child',
    detail: 'Strengths, sensory needs, and what a good day looks like.',
    status: 'ready',
  },
  {
    title: 'Evidence bundle',
    detail: 'Parent diary, SALT report, school notes, and daily wins.',
    status: 'growing',
  },
  {
    title: 'Draft response',
    detail: 'Advocate wording ready for clearer, quantified provision.',
    status: 'focus',
  },
  {
    title: 'Annual review / tribunal prep',
    detail: 'Deadlines tracked with calm next steps.',
    status: 'watched',
  },
];

const stories = [
  '“For the first time, I felt like someone understood both my child and the system.”',
  '“It turned my notes into evidence I could actually use in meetings.”',
  '“Less panic, more clarity. That alone changed everything.”',
];

const voiceMoments = [
  {
    transcript: '“School drop-off was calmer today when staff used visual prompts and gave extra processing time.”',
    tags: ['Section B: communication', 'Section F: provision', 'Daily win log'],
  },
  {
    transcript: '“She managed speech therapy better after a movement break and a quieter room.”',
    tags: ['Therapy tracker', 'Sensory evidence', 'Annual review prep'],
  },
  {
    transcript: '“The meeting felt rushed, but I clearly asked for quantified support and written follow-up.”',
    tags: ['Meeting script', 'LA response trail', 'Tribunal timeline'],
  },
];

const analyserFindings = [
  {
    title: 'Section F wording is too vague',
    summary: 'Phrases like “access to support” are weak because they do not say who helps, how often, or for how long.',
    fix: 'Suggested wording: “A named TA will deliver visual instruction support three times daily for 15 minutes each time.”',
  },
  {
    title: 'Need is described, but impact is missing',
    summary: 'The draft mentions regulation difficulties but does not show how that affects learning, transitions, or safety.',
    fix: 'Suggested wording: “Without structured adult support, transitions lead to distress and lost learning time several times each week.”',
  },
];

const communityWisdom = [
  'What worked for us: taking one page of evidence into meetings helped keep everyone focused.',
  'Parents often win more clarity by asking for frequency, duration, and who delivers support.',
  'Logging tiny daily wins makes annual reviews far less overwhelming later on.',
];

type FeatureKey = 'voice' | 'analyser' | 'report';

export default function App() {
  const [showDashboard, setShowDashboard] = useState(false);
  const [winsLogged, setWinsLogged] = useState(12);
  const [evidenceCount, setEvidenceCount] = useState(18);
  const [message, setMessage] = useState(encouragements[0]);
  const [activeFeature, setActiveFeature] = useState<FeatureKey>('voice');
  const [voiceIndex, setVoiceIndex] = useState(0);
  const [findingIndex, setFindingIndex] = useState(0);
  const [reportReady, setReportReady] = useState(false);

  useEffect(() => {
    document.title = 'Echo — The advocate who believes in your child';
  }, []);

  const beliefScore = useMemo(() => {
    return Math.min(100, 42 + winsLogged * 2 + evidenceCount);
  }, [winsLogged, evidenceCount]);

  const featurePanel = useMemo(() => {
    if (activeFeature === 'voice') {
      const moment = voiceMoments[voiceIndex];
      return {
        eyebrow: 'Voice evidence with AI tagging',
        title: 'Tell your story — Echo sorts it for you',
        description: moment.transcript,
        bullets: moment.tags,
        footer: 'Saved privately into the right evidence areas so nothing gets lost.',
      };
    }

    if (activeFeature === 'analyser') {
      const finding = analyserFindings[findingIndex];
      return {
        eyebrow: 'AI EHCP analyser',
        title: finding.title,
        description: finding.summary,
        bullets: ['Plain-English breakdown', 'Stronger legal-style wording', 'Missing sections flagged'],
        footer: finding.fix,
      };
    }

    return {
      eyebrow: 'One-click report builder',
      title: reportReady ? 'Your review pack is ready to export' : 'Turn chaos into a professional PDF',
      description: reportReady
        ? 'Echo has bundled parent views, evidence timeline, provision asks, and deadline notes into one calm report.'
        : 'Build a tribunal or annual review pack in seconds, not hours.',
      bullets: ['Annual review PDF', 'Tribunal-ready evidence timeline', 'Share safely with family or professionals'],
      footer: reportReady
        ? 'Everything is grouped clearly so you can walk into meetings feeling prepared.'
        : 'One tap creates a clear, polished summary of the fight so far.',
    };
  }, [activeFeature, findingIndex, reportReady, voiceIndex]);

  const updateSupportMessage = (nextIndex: number) => {
    setMessage(encouragements[nextIndex % encouragements.length]);
    setShowDashboard(true);
  };

  const handleVoiceEvidence = () => {
    setActiveFeature('voice');
    setVoiceIndex((prev) => (prev + 1) % voiceMoments.length);
    setEvidenceCount((prev) => prev + 1);
    updateSupportMessage(0);
  };

  const handleAnalyser = () => {
    setActiveFeature('analyser');
    setFindingIndex((prev) => (prev + 1) % analyserFindings.length);
    updateSupportMessage(2);
  };

  const handleReportBuilder = () => {
    setActiveFeature('report');
    setReportReady(true);
    setWinsLogged((prev) => prev + 1);
    updateSupportMessage(1);
  };

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f8f1e3_0%,#f7fbf8_45%,#ffffff_100%)] text-echo-ink">
      <header className="sticky top-0 z-50 border-b border-echo-teal/10 bg-white/80 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-echo-teal text-white shadow-lg shadow-echo-teal/20">
              <Heart size={20} fill="currentColor" />
            </div>
            <div>
              <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-echo-teal/70">Echo Advocate</p>
              <h1 className="text-lg font-semibold sm:text-xl">The advocate who believes in your child</h1>
            </div>
          </div>

          <div className="hidden items-center gap-3 md:flex">
            <div className="rounded-full bg-echo-sage/20 px-3 py-2 text-sm font-medium text-echo-teal">
              No login wall • calm preview first
            </div>
            <button
              onClick={() => setShowDashboard(true)}
              className="cta-primary"
            >
              I’m ready for backup
            </button>
          </div>
        </div>
      </header>

      <main>
        <section className="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 lg:grid-cols-[1.1fr_0.9fr] lg:px-8 lg:py-14">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
            <div className="inline-flex items-center gap-2 rounded-full border border-echo-gold/40 bg-white/90 px-4 py-2 text-sm font-medium text-echo-teal shadow-sm">
              <Sparkles size={16} className="text-echo-gold" />
              You’ve been fighting alone. Now you have backup.
            </div>

            <div className="space-y-4">
              <h2 className="max-w-2xl text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
                Echo believes in your child as much as you do.
              </h2>
              <p className="max-w-xl text-lg leading-8 text-echo-ink/78">
                If you’re trying to get an EHCP, manage reviews, or prepare for tribunal, this space turns your love,
                notes, and evidence into calm, powerful advocacy.
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button onClick={() => setShowDashboard(true)} className="cta-primary">
                I’m ready for backup
                <ArrowRight size={18} />
              </button>
              <a href="#dashboard" className="cta-secondary">
                See the advocate dashboard
              </a>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <div className="panel">
                <ShieldCheck className="mb-3 text-echo-teal" size={20} />
                <p className="font-semibold">Private by design</p>
                <p className="mt-1 text-sm text-echo-ink/70">Built to feel safe, calm, and trustworthy.</p>
              </div>
              <div className="panel">
                <Wand2 className="mb-3 text-echo-gold" size={20} />
                <p className="font-semibold">Advocate guidance</p>
                <p className="mt-1 text-sm text-echo-ink/70">Gentle prompts for Section B, F, reviews, and next steps.</p>
              </div>
              <div className="panel">
                <Scale className="mb-3 text-echo-teal" size={20} />
                <p className="font-semibold">Tribunal-ready clarity</p>
                <p className="mt-1 text-sm text-echo-ink/70">Evidence organised so you feel prepared, not buried.</p>
              </div>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="panel relative overflow-hidden p-5 sm:p-6">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(168,213,186,0.32),transparent_42%),radial-gradient(circle_at_bottom_left,rgba(232,185,35,0.18),transparent_35%)]" />
            <div className="relative space-y-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold text-echo-teal">Welcome to Echo</p>
                  <p className="text-2xl font-semibold">Your child is the hero here</p>
                </div>
                <div className="rounded-full bg-white px-3 py-2 text-sm font-medium text-echo-teal shadow-sm">
                  Secure preview
                </div>
              </div>

              <div className="rounded-[24px] bg-white/90 p-4 shadow-sm">
                <p className="text-sm text-echo-ink/70">Today’s belief statement</p>
                <p className="mt-2 text-lg font-semibold text-echo-ink">“We see your child’s potential. We’re here to help you prove it.”</p>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-[24px] bg-echo-teal p-4 text-white">
                  <p className="text-sm text-white/75">Belief garden</p>
                  <p className="mt-2 text-3xl font-semibold">{beliefScore}%</p>
                  <p className="mt-1 text-sm text-white/75">Growing with every upload, note, and small win.</p>
                </div>
                <div className="rounded-[24px] bg-echo-cream p-4">
                  <p className="text-sm text-echo-ink/70">Next smart move</p>
                  <p className="mt-2 font-semibold">Strengthen Section F wording with frequency and duration.</p>
                  <p className="mt-1 text-sm text-echo-ink/68">That makes support clearer and enforceable.</p>
                </div>
              </div>

              <div className="rounded-[24px] border border-dashed border-echo-teal/25 bg-white/80 p-4">
                <p className="text-sm font-medium text-echo-teal">Advocate voice</p>
                <p className="mt-2 text-sm leading-7 text-echo-ink/80">{message}</p>
              </div>
            </div>
          </motion.div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-4 sm:px-6 lg:px-8">
          <div className="grid gap-4 md:grid-cols-3">
            {stories.map((story) => (
              <div key={story} className="rounded-[24px] border border-echo-teal/10 bg-white px-5 py-4 text-sm text-echo-ink/72 shadow-sm">
                {story}
              </div>
            ))}
          </div>
        </section>

        <section id="dashboard" className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
          <div className="mb-6 flex items-end justify-between gap-4">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.2em] text-echo-teal/70">Dashboard preview</p>
              <h3 className="mt-2 text-3xl font-semibold">A calm command centre for hard days</h3>
            </div>
            <div className={`rounded-full px-4 py-2 text-sm font-medium ${showDashboard ? 'bg-echo-teal text-white' : 'bg-echo-sage/20 text-echo-teal'}`}>
              {showDashboard ? 'Backup opened' : 'Preview mode active'}
            </div>
          </div>

          <div className="grid gap-5 lg:grid-cols-[1.15fr_0.85fr]">
            <motion.div layout className="space-y-5">
              <div className="panel p-5 sm:p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="text-sm font-semibold text-echo-teal">Your amazing child</p>
                    <h4 className="mt-2 text-2xl font-semibold">Amira, age 8</h4>
                    <p className="mt-2 max-w-xl text-echo-ink/72">
                      Funny, determined, and full of spark. Best supported with visual prompts, movement breaks, and extra processing time.
                    </p>
                  </div>
                  <div className="rounded-[28px] bg-echo-cream px-5 py-4 text-sm text-echo-ink/75">
                    <div className="font-semibold text-echo-ink">Upcoming battle</div>
                    <div className="mt-2 flex items-center gap-2"><CalendarClock size={16} className="text-echo-teal" /> Annual review in 9 days</div>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                <button
                  onClick={() => {
                    setWinsLogged((prev) => prev + 1);
                    updateSupportMessage(1);
                  }}
                  className="panel text-left transition hover:-translate-y-0.5"
                >
                  <Heart className="mb-3 text-rose-500" size={20} />
                  <p className="font-semibold">Quick win log</p>
                  <p className="mt-1 text-sm text-echo-ink/70">Capture a tiny success without guilt or overthinking.</p>
                </button>

                <button onClick={handleVoiceEvidence} className="panel text-left transition hover:-translate-y-0.5">
                  <Mic className="mb-3 text-echo-gold" size={20} />
                  <p className="font-semibold">Voice evidence</p>
                  <p className="mt-1 text-sm text-echo-ink/70">Talk out loud. Echo transcribes and tags it for you.</p>
                </button>

                <button onClick={handleAnalyser} className="panel text-left transition hover:-translate-y-0.5">
                  <Wand2 className="mb-3 text-echo-teal" size={20} />
                  <p className="font-semibold">AI EHCP analyser</p>
                  <p className="mt-1 text-sm text-echo-ink/70">See what is vague, weak, or missing in plain English.</p>
                </button>

                <button onClick={handleReportBuilder} className="panel text-left transition hover:-translate-y-0.5">
                  <FileText className="mb-3 text-emerald-600" size={20} />
                  <p className="font-semibold">Report builder</p>
                  <p className="mt-1 text-sm text-echo-ink/70">Create a polished review or tribunal pack in one click.</p>
                </button>
              </div>

              <div className="panel p-5 sm:p-6">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-echo-teal">{featurePanel.eyebrow}</p>
                    <h4 className="mt-1 text-xl font-semibold">{featurePanel.title}</h4>
                  </div>
                  <Sparkles className="text-echo-gold" size={20} />
                </div>
                <p className="mt-3 text-echo-ink/78">{featurePanel.description}</p>
                <div className="mt-4 flex flex-wrap gap-2">
                  {featurePanel.bullets.map((bullet) => (
                    <span key={bullet} className="rounded-full bg-echo-sage/25 px-3 py-1 text-xs font-semibold text-echo-teal">
                      {bullet}
                    </span>
                  ))}
                </div>
                <div className="mt-4 rounded-[20px] bg-echo-sage/20 px-4 py-3 text-sm text-echo-ink/80">
                  {featurePanel.footer}
                </div>
              </div>
            </motion.div>

            <div className="space-y-5">
              <div className="panel p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-echo-teal">EHCP tracker</p>
                    <p className="mt-1 text-lg font-semibold">Visible progress, not guesswork</p>
                  </div>
                  <CheckCircle2 className="text-emerald-600" size={20} />
                </div>
                <div className="mt-4 space-y-3">
                  {timeline.map((item, index) => (
                    <div key={item.title} className="flex gap-3 rounded-[18px] bg-white/80 p-3">
                      <div className="mt-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-echo-sage/40 text-sm font-semibold text-echo-teal">
                        {index + 1}
                      </div>
                      <div>
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-echo-ink/70">{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel p-5 sm:p-6">
                <p className="text-sm font-semibold text-echo-teal">Your belief garden</p>
                <div className="mt-4 grid grid-cols-5 gap-2">
                  {Array.from({ length: 15 }).map((_, index) => {
                    const active = index < Math.round(beliefScore / 7);
                    return (
                      <div
                        key={index}
                        className={`flex h-11 items-center justify-center rounded-2xl text-lg ${
                          active ? 'bg-echo-sage/50' : 'bg-echo-cream'
                        }`}
                      >
                        {active ? '🌼' : '•'}
                      </div>
                    );
                  })}
                </div>
                <p className="mt-3 text-sm text-echo-ink/72">Every note, upload, and small win helps your child’s case bloom.</p>
              </div>

              <div className="panel p-5 sm:p-6">
                <div className="flex items-center gap-2 text-echo-teal">
                  <FileText size={18} />
                  <p className="font-semibold">One-click outputs</p>
                </div>
                <ul className="mt-3 space-y-2 text-sm text-echo-ink/74">
                  <li>• Draft annual review agenda</li>
                  <li>• Parent views for Section A</li>
                  <li>• Tribunal-ready evidence summary</li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-7xl px-4 pb-14 sm:px-6 lg:px-8">
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-echo-teal/70">More of the help parents are asking for</p>
            <h3 className="mt-2 text-3xl font-semibold">Practical backup for the real fight</h3>
          </div>

          <div className="grid gap-4 lg:grid-cols-3">
            <div className="panel p-5">
              <div className="mb-3 flex items-center gap-2 text-echo-teal">
                <Upload size={18} />
                <p className="font-semibold">Evidence vault</p>
              </div>
              <ul className="space-y-2 text-sm text-echo-ink/74">
                <li>• Photo, video, report, and email uploads</li>
                <li>• Auto-tagged into the right EHCP areas</li>
                <li>• Searchable timeline for reviews and tribunal</li>
              </ul>
            </div>

            <div className="panel p-5">
              <div className="mb-3 flex items-center gap-2 text-echo-teal">
                <CalendarClock size={18} />
                <p className="font-semibold">Calendar + reminders</p>
              </div>
              <ul className="space-y-2 text-sm text-echo-ink/74">
                <li>• Therapies, meetings, annual reviews, deadlines</li>
                <li>• Gentle prompts before submissions are due</li>
                <li>• “You’ve got backup” prep checklists on hard weeks</li>
              </ul>
            </div>

            <div className="panel p-5">
              <div className="mb-3 flex items-center gap-2 text-echo-teal">
                <Heart size={18} />
                <p className="font-semibold">Community wisdom</p>
              </div>
              <div className="space-y-2 text-sm text-echo-ink/74">
                {communityWisdom.map((item) => (
                  <div key={item} className="rounded-[18px] bg-echo-cream px-3 py-3">
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}


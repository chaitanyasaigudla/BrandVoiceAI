import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  ShieldCheck, Loader2, Sparkles, AlertTriangle, CheckCircle,
  Info, Copy, Trash2, Clipboard, History, ChevronDown, Check,
  Building2, ArrowRight, Zap, RefreshCw,
} from 'lucide-react';
import { cn, getScoreColor, getScoreLabel } from '@/lib/utils';
import { apiPost, apiGet } from '@/lib/api';
import { useBrand } from '@/context/BrandContext';

interface Issue {
  type: 'tone' | 'vocabulary' | 'style' | 'structure';
  severity: 'low' | 'medium' | 'high';
  description: string;
  suggestion?: string;
}

interface ConsistencyReportData {
  overallScore: number;
  toneScore: number;
  vocabularyScore: number;
  writingStyleScore: number;
  sentenceStructureScore: number;
  issues: Issue[];
  suggestions: string[];
}

const severityColor = {
  high:   'bg-danger-500/10 text-danger-600 border-danger-500/20',
  medium: 'bg-warning-500/10 text-warning-600 border-warning-500/20',
  low:    'bg-blue-500/10 text-blue-600 border-blue-500/20',
};

const platforms = [
  { id: 'INSTAGRAM', label: 'Instagram' },
  { id: 'LINKEDIN',  label: 'LinkedIn' },
  { id: 'TWITTER',   label: 'X / Twitter' },
  { id: 'EMAIL',     label: 'Email' },
  { id: 'BLOG',      label: 'Blog' },
  { id: 'ECOMMERCE', label: 'E-commerce' },
];

export function ConsistencyCheckerPage() {
  const { brands, activeBrand, switchBrand } = useBrand();

  const [content, setContent] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('INSTAGRAM');
  const [checking, setChecking] = useState(false);
  const [report, setReport] = useState<ConsistencyReportData | null>(null);
  const [improving, setImproving] = useState(false);
  const [improved, setImproved] = useState('');
  const [copied, setCopied] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Past content modal
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [pastContents, setPastContents] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  const activeBrandName = activeBrand?.name || 'Active Brand';

  // Fetch past generated content when opening modal
  const openHistoryModal = async () => {
    setShowHistoryModal(true);
    setLoadingHistory(true);
    try {
      const res: any = await apiGet('/content', {
        brandId: activeBrand?.id,
        limit: 15,
      });
      if (res && Array.isArray(res.items)) {
        setPastContents(res.items);
      }
    } catch (e: any) {
      console.warn('Could not load past content:', e.message);
    } finally {
      setLoadingHistory(false);
    }
  };

  const handleSelectPastContent = (itemContent: string) => {
    setContent(itemContent);
    setShowHistoryModal(false);
    setReport(null);
    setImproved('');
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        setContent(text);
      }
    } catch (e) {
      console.warn('Clipboard read failed:', e);
    }
  };

  const handleClear = () => {
    setContent('');
    setReport(null);
    setImproved('');
    setErrorMsg(null);
  };

  const handleCheck = async () => {
    if (!content.trim()) return;
    setChecking(true);
    setErrorMsg(null);
    setImproved('');

    try {
      const res: any = await apiPost('/consistency/check', {
        content: content.trim(),
        brandId: activeBrand?.id,
        platform: selectedPlatform,
      });
      setReport(res);
    } catch (err: any) {
      console.error('Check failed:', err);
      setErrorMsg(err.message || 'Consistency audit failed. Please try again.');
    } finally {
      setChecking(false);
    }
  };

  const handleImprove = async () => {
    if (!content.trim() || !report) return;
    setImproving(true);
    setErrorMsg(null);

    try {
      const res: any = await apiPost('/consistency/improve', {
        content,
        report,
        brandId: activeBrand?.id,
      });
      setImproved(res.improvedContent);
    } catch (err: any) {
      console.error('Improvement failed:', err);
      setErrorMsg(err.message || 'Could not improve content.');
    } finally {
      setImproving(false);
    }
  };

  const handleAcceptImprovement = () => {
    setContent(improved);
    setImproved('');
    // re-run check on improved content
    apiPost('/consistency/check', {
      content: improved,
      brandId: activeBrand?.id,
      platform: selectedPlatform,
    })
      .then((res: any) => setReport(res))
      .catch(() => {});
  };

  const loadSampleCompliant = () => {
    const preferred = activeBrand?.guidelines?.[0]?.preferredVocabulary || [];
    const keywords = preferred.length > 0 ? preferred.slice(0, 4).join(', ') : 'innovation, quality, and precision';
    setContent(
      `At ${activeBrandName}, we are dedicated to delivering authentic, exceptional value to our community. Driven by ${keywords}, our mission is to deliver excellence and earn lasting trust.`
    );
  };

  const loadSampleViolations = () => {
    const prohibited = activeBrand?.guidelines?.[0]?.prohibitedVocabulary || ['cheap', 'basic', 'obviously'];
    setContent(
      `This solution is very ${prohibited[0] || 'cheap'} and ${prohibited[1] || 'basic'}. It is ${prohibited[2] || 'obviously'} mediocre and simply doesn't care about customer experience or genuine quality.`
    );
  };

  const scores = report
    ? [
        { label: 'Tone Adherence',     score: report.toneScore,             weight: '35%' },
        { label: 'Vocabulary Alignment', score: report.vocabularyScore,     weight: '25%' },
        { label: 'Writing Style',      score: report.writingStyleScore,     weight: '25%' },
        { label: 'Content Structure',  score: report.sentenceStructureScore, weight: '15%' },
      ]
    : [];

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* ── Header & Brand Selector ────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Brand Consistency Checker</h1>
              <p className="text-muted-foreground text-xs sm:text-sm">
                Audit copy in real time against{' '}
                <span className="font-semibold text-brand-500">{activeBrandName}</span> voice guidelines
              </p>
            </div>
          </div>

          {/* Active Brand Switcher Pill */}
          <div className="flex items-center gap-2 bg-card border border-border px-3 py-1.5 rounded-xl self-start md:self-auto">
            <Building2 className="w-4 h-4 text-brand-500 shrink-0" />
            <span className="text-xs text-muted-foreground font-medium">Auditing For:</span>
            <select
              value={activeBrand?.id || ''}
              onChange={(e) => switchBrand(e.target.value)}
              className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
            >
              {brands.map((b) => (
                <option key={b.id} value={b.id} className="bg-card text-foreground">
                  {b.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </motion.div>

      {/* ── Main Workspace Grid ───────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        {/* Left Column (3/5): Input & Controls */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-3 space-y-4"
        >
          <div className="bg-card border border-border rounded-2xl p-5 space-y-4 shadow-sm">
            {/* Toolbar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-border">
              {/* Platform Selector */}
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-muted-foreground font-medium">Platform:</span>
                <select
                  value={selectedPlatform}
                  onChange={(e) => setSelectedPlatform(e.target.value)}
                  className="px-2.5 py-1 rounded-lg border border-border bg-background text-xs font-medium text-foreground focus:outline-none"
                >
                  {platforms.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.label}
                    </option>
                  ))}
                </select>
              </div>

              {/* Utility Action Buttons */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handlePaste}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-accent text-xs font-medium text-muted-foreground transition-colors"
                  title="Paste from clipboard"
                >
                  <Clipboard className="w-3.5 h-3.5" />
                  <span>Paste</span>
                </button>

                <button
                  type="button"
                  onClick={openHistoryModal}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-accent text-xs font-medium text-muted-foreground transition-colors"
                  title="Select from previously generated content"
                >
                  <History className="w-3.5 h-3.5" />
                  <span>Past Content</span>
                </button>

                <button
                  type="button"
                  onClick={handleClear}
                  disabled={!content}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-border hover:bg-accent text-xs font-medium text-muted-foreground disabled:opacity-40 transition-colors"
                  title="Clear editor"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Clear</span>
                </button>
              </div>
            </div>

            {/* Quick Test Samples */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] text-muted-foreground">Quick Test:</span>
              <button
                type="button"
                onClick={loadSampleCompliant}
                className="text-[11px] px-2.5 py-0.5 rounded-md bg-success-500/10 text-success-600 hover:bg-success-500/20 font-medium transition-colors"
              >
                ✨ On-Brand Sample
              </button>
              <button
                type="button"
                onClick={loadSampleViolations}
                className="text-[11px] px-2.5 py-0.5 rounded-md bg-danger-500/10 text-danger-600 hover:bg-danger-500/20 font-medium transition-colors"
              >
                ⚠️ Intentional Violations
              </button>
            </div>

            {/* Large Content Input */}
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={`Paste or type marketing copy here to audit against ${activeBrandName} voice rules...`}
              className="w-full min-h-[260px] p-4 rounded-xl border border-border bg-background text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed"
            />

            {errorMsg && (
              <p className="text-xs text-danger-500 bg-danger-500/10 p-2.5 rounded-xl border border-danger-500/20">
                {errorMsg}
              </p>
            )}

            {/* Footer with Character Count & Check Button */}
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-muted-foreground font-mono">
                {content.length} characters • {content.trim() ? content.trim().split(/\s+/).length : 0} words
              </span>

              <button
                onClick={handleCheck}
                disabled={!content.trim() || checking}
                className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-semibold transition-colors shadow-brand"
              >
                {checking ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                {checking ? 'Auditing with AI…' : 'Check Consistency'}
              </button>
            </div>
          </div>

          {/* ── Detected Issues Panel ────────────────────────────────────────── */}
          <AnimatePresence>
            {report && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-border rounded-2xl p-5 space-y-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-foreground text-sm">
                      Audit Findings ({report.issues.length})
                    </h3>
                  </div>

                  {report.issues.length > 0 && (
                    <button
                      onClick={handleImprove}
                      disabled={improving}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-semibold transition-colors shadow-brand"
                    >
                      {improving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {improving ? 'Rewriting…' : 'Improve with AI'}
                    </button>
                  )}
                </div>

                {report.issues.length === 0 ? (
                  <div className="p-4 rounded-xl bg-success-500/10 border border-success-500/20 flex items-center gap-2.5 text-success-600 text-sm font-medium">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span>Flawless brand compliance! No voice, vocabulary, or style discrepancies detected.</span>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {report.issues.map((issue, idx) => (
                      <div
                        key={idx}
                        className={cn('flex items-start gap-3 p-3 rounded-xl border', severityColor[issue.severity])}
                      >
                        <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold uppercase tracking-wider">
                              [{issue.type}]
                            </span>
                            <span className="text-xs font-semibold">{issue.description}</span>
                          </div>
                          {issue.suggestion && (
                            <p className="text-xs mt-1 opacity-90 leading-relaxed">
                              💡 <strong>Tip:</strong> {issue.suggestion}
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── AI-Improved Output ─────────────────────────────────────────── */}
          <AnimatePresence>
            {improved && (
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card border border-success-500/40 rounded-2xl p-5 space-y-3.5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-success-500" />
                    <h3 className="font-bold text-foreground text-sm">AI-Improved Version</h3>
                  </div>
                  <span className="text-[11px] font-bold text-success-600 bg-success-500/10 px-2.5 py-0.5 rounded-full">
                    Optimized for {activeBrandName}
                  </span>
                </div>

                <div className="text-sm text-foreground whitespace-pre-wrap leading-relaxed bg-success-500/5 p-4 rounded-xl border border-success-500/20 font-sans">
                  {improved}
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={handleAcceptImprovement}
                    className="flex-1 py-2.5 rounded-xl bg-success-500 hover:bg-success-600 text-white text-xs font-bold transition-colors shadow-sm"
                  >
                    Accept & Replace Copy
                  </button>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(improved);
                      setCopied(true);
                      setTimeout(() => setCopied(false), 2000);
                    }}
                    className="px-4 py-2.5 rounded-xl border border-border hover:bg-accent text-xs font-medium transition-colors flex items-center gap-1.5"
                  >
                    {copied ? <CheckCircle className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
                    {copied ? 'Copied' : 'Copy'}
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Right Column (2/5): Consistency Score Panel */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="xl:col-span-2 space-y-4"
        >
          <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
            <h3 className="font-bold text-foreground text-sm">Consistency Evaluation</h3>

            {!report ? (
              <div className="flex flex-col items-center justify-center py-12 text-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-muted/60 flex items-center justify-center">
                  <Info className="w-6 h-6 text-muted-foreground/60" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">No analysis performed yet</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                    Paste content into the editor and click "Check Consistency" to generate detailed scores.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {/* Big Overall Score Meter */}
                <div className="flex flex-col items-center justify-center py-2">
                  <div className={cn('text-6xl font-black tracking-tight', getScoreColor(report.overallScore))}>
                    {report.overallScore}
                  </div>
                  <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-1">
                    {getScoreLabel(report.overallScore)} Compliance
                  </p>
                </div>

                {/* Weighted Sub-Scores */}
                <div className="space-y-3 pt-3 border-t border-border">
                  {scores.map((s) => (
                    <div key={s.label}>
                      <div className="flex justify-between text-xs mb-1">
                        <span className="font-medium text-foreground">
                          {s.label} <span className="text-muted-foreground font-normal">({s.weight})</span>
                        </span>
                        <span className={cn('font-bold', getScoreColor(s.score))}>
                          {s.score}/100
                        </span>
                      </div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={cn(
                            'h-full transition-all duration-500 rounded-full',
                            s.score >= 80 ? 'bg-success-500' : s.score >= 60 ? 'bg-warning-500' : 'bg-danger-500'
                          )}
                          style={{ width: `${s.score}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Key Recommendations */}
                {report.suggestions.length > 0 && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <h4 className="text-xs font-bold text-foreground uppercase tracking-wide">
                      Recommendations
                    </h4>
                    <ul className="text-xs text-muted-foreground space-y-1.5 list-disc list-inside">
                      {report.suggestions.map((s, idx) => (
                        <li key={idx} className="leading-relaxed">
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
          </div>
        </motion.div>
      </div>

      {/* ── Select Past Content Modal ─────────────────────────────────────── */}
      <AnimatePresence>
        {showHistoryModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-2xl max-h-[80vh] flex flex-col"
            >
              <div className="flex items-center justify-between pb-2 border-b border-border">
                <div>
                  <h3 className="font-bold text-foreground text-sm">Select Past Content</h3>
                  <p className="text-xs text-muted-foreground">Load previously generated copy for {activeBrandName}</p>
                </div>
                <button
                  onClick={() => setShowHistoryModal(false)}
                  className="text-xs text-muted-foreground hover:text-foreground"
                >
                  ✕
                </button>
              </div>

              <div className="flex-1 overflow-y-auto space-y-2 py-1">
                {loadingHistory ? (
                  <div className="py-8 text-center text-xs text-muted-foreground flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Loading past content…
                  </div>
                ) : pastContents.length === 0 ? (
                  <div className="py-8 text-center text-xs text-muted-foreground">
                    No generated content found for this brand yet.
                  </div>
                ) : (
                  pastContents.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectPastContent(item.content)}
                      className="p-3 rounded-xl border border-border bg-background hover:bg-muted/70 cursor-pointer transition-colors space-y-1"
                    >
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="font-semibold text-brand-500 uppercase">{item.platform}</span>
                        <span className="text-muted-foreground">
                          Score: {item.consistencyScore || 90}
                        </span>
                      </div>
                      <p className="text-xs text-foreground line-clamp-2 leading-relaxed">
                        {item.content}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

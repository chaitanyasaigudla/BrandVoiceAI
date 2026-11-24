import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Instagram, Linkedin, Mail, FileText, ShoppingBag, RefreshCw,
  Sparkles, Copy, CheckCircle, RotateCcw,
  Loader2, Twitter, Building2, ShieldCheck, Plus, Check,
} from 'lucide-react';
import { cn, getScoreColor } from '@/lib/utils';
import { apiPost, apiPatch } from '@/lib/api';
import { useBrand } from '@/context/BrandContext';

const platforms = [
  { id: 'INSTAGRAM', label: 'Instagram', icon: Instagram, color: 'from-pink-500 to-orange-400' },
  { id: 'LINKEDIN',  label: 'LinkedIn',  icon: Linkedin,  color: 'from-blue-600 to-blue-400' },
  { id: 'TWITTER',   label: 'X / Twitter', icon: Twitter, color: 'from-gray-800 to-gray-600' },
  { id: 'EMAIL',     label: 'Email',     icon: Mail,      color: 'from-green-500 to-emerald-400' },
  { id: 'BLOG',      label: 'Blog',      icon: FileText,  color: 'from-purple-500 to-violet-400' },
  { id: 'ECOMMERCE', label: 'E-commerce',icon: ShoppingBag, color: 'from-yellow-500 to-amber-400' },
  { id: 'REWRITE',   label: 'Rewrite',   icon: RefreshCw, color: 'from-teal-500 to-cyan-400' },
];

const tones = ['Professional', 'Friendly', 'Persuasive', 'Informative', 'Inspirational', 'Urgent'];

const QUICK_CTAS = [
  'Shop Now',
  'Learn More',
  'Get Started',
  'Book a Demo',
  'Explore Collection',
  'Claim Offer',
  'Start Free Trial',
  'Find Your Fit',
];

export function ContentStudioPage() {
  const { brands, activeBrand, switchBrand } = useBrand();

  const [selectedPlatform, setSelectedPlatform] = useState('INSTAGRAM');
  const [selectedTone, setSelectedTone] = useState('Professional');
  const [topic, setTopic] = useState('');
  const [productDescription, setProductDescription] = useState('');
  const [campaign, setCampaign] = useState('');
  const [audience, setAudience] = useState('');
  const [keywords, setKeywords] = useState('');
  const [cta, setCta] = useState('');

  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState('');
  const [structured, setStructured] = useState<any>(null);
  const [variations, setVariations] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'primary' | 'var1' | 'var2'>('primary');
  const [viewMode, setViewMode] = useState<'structured' | 'raw'>('structured');
  const [contentId, setContentId] = useState<string | null>(null);
  const [score, setScore] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [approved, setApproved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // When active brand changes, dynamically load its audience and signature vocabulary if inputs are empty
  useEffect(() => {
    if (activeBrand) {
      if (activeBrand.targetAudience && !audience) {
        setAudience(activeBrand.targetAudience);
      }
      const preferred = activeBrand.guidelines?.[0]?.preferredVocabulary;
      if (Array.isArray(preferred) && preferred.length > 0 && !keywords) {
        setKeywords(preferred.slice(0, 4).join(', '));
      }
    }
  }, [activeBrand]);

  const handleGenerate = async () => {
    if (!topic.trim()) {
      setErrorMsg('Please specify a Product, Service, or Subject to generate content.');
      return;
    }

    setGenerating(true);
    setErrorMsg(null);
    setApproved(false);

    try {
      const res: any = await apiPost('/content/generate', {
        brandId: activeBrand?.id || undefined,
        platform: selectedPlatform,
        tone: selectedTone,
        topic: topic.trim(),
        productDescription: productDescription.trim() || undefined,
        campaign: campaign.trim() || undefined,
        audience: audience.trim() || undefined,
        keywords: keywords.trim() || undefined,
        cta: cta.trim() || undefined,
      });

      setGenerated(res.content);
      setStructured({
        headline: res.headline || '',
        mainCaption: res.mainCaption || '',
        keyBenefits: Array.isArray(res.keyBenefits) ? res.keyBenefits : [],
        cta: res.cta || cta || 'Learn More',
        hashtags: Array.isArray(res.hashtags) ? res.hashtags : [],
      });
      setVariations(res.variations || []);
      setScore(res.consistencyScore || 90);
      setContentId(res.id);
      setActiveTab('primary');
    } catch (err: any) {
      console.error('Generation failed:', err);
      setErrorMsg(err.message || 'Generation failed. Please try again.');
    } finally {
      setGenerating(false);
    }
  };

  const currentDisplayContent =
    activeTab === 'primary' ? generated : variations[activeTab === 'var1' ? 0 : 1] || generated;

  const handleCopy = () => {
    navigator.clipboard.writeText(currentDisplayContent);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleApprove = async () => {
    if (!contentId) return;
    try {
      await apiPatch(`/content/${contentId}/status`, { status: 'APPROVED' });
      setApproved(true);
      setTimeout(() => setApproved(false), 3000);
    } catch (err: any) {
      console.error('Failed to approve:', err);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col max-w-screen-xl mx-auto space-y-6">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">AI Content Studio</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Generate authentic, on-brand marketing copy for any product, service, or campaign.
            </p>
          </div>

          {/* Dynamic Active Brand Selector */}
          {brands.length > 0 && (
            <div className="flex items-center gap-2.5 bg-card border border-border px-3.5 py-2 rounded-xl shadow-sm">
              <div className="w-6 h-6 rounded-lg bg-brand-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
                {(activeBrand?.name || 'B').charAt(0).toUpperCase()}
              </div>
              <div className="flex flex-col">
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">
                  Active Brand
                </span>
                <select
                  value={activeBrand?.id || ''}
                  onChange={(e) => switchBrand(e.target.value)}
                  className="bg-transparent text-xs font-bold text-foreground focus:outline-none cursor-pointer pr-4"
                >
                  {brands.map((b) => (
                    <option key={b.id} value={b.id} className="bg-card text-foreground">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* ── Studio Grid ─────────────────────────────────────────────────────── */}
      <div className="flex-1 grid grid-cols-1 xl:grid-cols-2 gap-6 min-h-0">
        {/* ── Left Column: User-Defined Product & Configuration Inputs ───────── */}
        <motion.div
          initial={{ opacity: 0, x: -16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-5 space-y-4 overflow-y-auto shadow-sm"
        >
          {/* Destination Platform */}
          <div>
            <label className="text-xs font-semibold text-foreground uppercase tracking-wide mb-2 block">
              Destination Platform
            </label>
            <div className="grid grid-cols-4 sm:grid-cols-7 gap-1.5">
              {platforms.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setSelectedPlatform(p.id)}
                  className={cn(
                    'flex flex-col items-center gap-1 p-2 rounded-lg border text-xs font-medium transition-all',
                    selectedPlatform === p.id
                      ? 'border-brand-500 bg-brand-500/10 text-brand-500 shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-brand-500/40 hover:text-foreground'
                  )}
                >
                  <p.icon className="w-4 h-4" />
                  <span className="truncate w-full text-center text-[10px]">{p.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Product / Service Name (PRIMARY) */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-foreground uppercase tracking-wide">
                Product or Service Name <span className="text-brand-500">* (Primary Topic)</span>
              </label>
              <span className="text-[10px] text-muted-foreground">What are you marketing?</span>
            </div>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              placeholder="e.g. Handmade Ceramic Coffee Mug, Cloud AI Analytics Platform, Boutique Yoga Studio..."
              className="w-full px-3 py-2.5 rounded-xl border border-border bg-background text-sm font-semibold text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 transition-colors"
            />
          </div>

          {/* Product Details & Unique Value Proposition */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
              Product Details & Value Proposition (Optional)
            </label>
            <textarea
              rows={2}
              value={productDescription}
              onChange={(e) => setProductDescription(e.target.value)}
              placeholder="e.g. Crafted from durable stoneware with an ergonomic handle. Keeps beverages hot 30% longer and is microwave safe."
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none transition-colors"
            />
          </div>

          {/* Campaign Objective & Target Audience */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                Campaign / Theme
              </label>
              <input
                type="text"
                value={campaign}
                onChange={(e) => setCampaign(e.target.value)}
                placeholder="e.g. Summer Launch, Early Bird Special"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
                Target Audience
              </label>
              <input
                type="text"
                value={audience}
                onChange={(e) => setAudience(e.target.value)}
                placeholder="e.g. Coffee lovers, design enthusiasts"
                className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Tone Spectrum */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 block">
              Tone of Voice
            </label>
            <div className="flex flex-wrap gap-1.5">
              {tones.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setSelectedTone(t)}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-medium border transition-colors',
                    selectedTone === t
                      ? 'bg-brand-500 border-brand-500 text-white shadow-sm'
                      : 'border-border bg-background text-muted-foreground hover:border-brand-500/40 hover:text-foreground'
                  )}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Key Selling Points & Keywords */}
          <div>
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1 block">
              Key Selling Points & Keywords
            </label>
            <input
              type="text"
              value={keywords}
              onChange={(e) => setKeywords(e.target.value)}
              placeholder="e.g. ergonomic, heat-retention, artisanal, eco-friendly"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>

          {/* Context-Aware Call to Action */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                Call to Action
              </label>
              <span className="text-[10px] text-muted-foreground">Select or type custom</span>
            </div>
            <input
              type="text"
              value={cta}
              onChange={(e) => setCta(e.target.value)}
              placeholder="e.g. Shop Now, Order Today, Book a Free Demo"
              className="w-full px-3 py-2 rounded-xl border border-border bg-background text-xs font-medium text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500 mb-2"
            />
            {/* Quick-select pills */}
            <div className="flex flex-wrap gap-1.5">
              {QUICK_CTAS.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCta(c)}
                  className={cn(
                    'text-[10px] px-2.5 py-0.5 rounded-md border transition-colors',
                    cta === c
                      ? 'bg-brand-500 text-white border-brand-500'
                      : 'bg-muted/50 border-border text-muted-foreground hover:text-foreground hover:border-brand-500/40'
                  )}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          {errorMsg && (
            <p className="text-xs text-danger-500 bg-danger-500/10 p-2.5 rounded-xl border border-danger-500/20">
              {errorMsg}
            </p>
          )}

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={generating || !topic.trim()}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white font-medium transition-colors shadow-brand"
          >
            {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {generating ? 'Crafting On-Brand Copy…' : 'Generate Marketing Copy'}
          </button>
        </motion.div>

        {/* ── Right Column: Structured Output & Variations ────────────────── */}
        <motion.div
          initial={{ opacity: 0, x: 16 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-5 flex flex-col shadow-sm"
        >
          {/* Output Header */}
          <div className="flex items-center justify-between mb-3 pb-3 border-b border-border">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-foreground text-sm">Marketing Output</h3>
              {generated && (
                <div className="flex items-center bg-muted/60 p-0.5 rounded-lg border border-border">
                  <button
                    onClick={() => setViewMode('structured')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                      viewMode === 'structured' ? 'bg-brand-500 text-white' : 'text-muted-foreground'
                    )}
                  >
                    Structured
                  </button>
                  <button
                    onClick={() => setViewMode('raw')}
                    className={cn(
                      'px-2 py-0.5 rounded text-[11px] font-medium transition-colors',
                      viewMode === 'raw' ? 'bg-brand-500 text-white' : 'text-muted-foreground'
                    )}
                  >
                    Raw Copy
                  </button>
                </div>
              )}
            </div>

            {score !== null && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20">
                <ShieldCheck className="w-3.5 h-3.5 text-brand-500" />
                <span className={cn('text-xs font-bold', getScoreColor(score))}>Brand Score: {score}</span>
              </div>
            )}
          </div>

          {/* Variations Tabs */}
          {generated && (
            <div className="flex items-center gap-2 mb-3">
              <button
                onClick={() => setActiveTab('primary')}
                className={cn(
                  'px-2.5 py-1 text-xs rounded-lg font-medium transition-colors',
                  activeTab === 'primary' ? 'bg-brand-500 text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
                )}
              >
                Primary Copy
              </button>
              {variations.length > 0 && (
                <button
                  onClick={() => setActiveTab('var1')}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg font-medium transition-colors',
                    activeTab === 'var1' ? 'bg-brand-500 text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  Variation 1
                </button>
              )}
              {variations.length > 1 && (
                <button
                  onClick={() => setActiveTab('var2')}
                  className={cn(
                    'px-2.5 py-1 text-xs rounded-lg font-medium transition-colors',
                    activeTab === 'var2' ? 'bg-brand-500 text-white shadow-sm' : 'bg-muted text-muted-foreground hover:text-foreground'
                  )}
                >
                  Variation 2
                </button>
              )}
            </div>
          )}

          {/* Output Display Body */}
          <div className="flex-1 relative overflow-y-auto">
            {!generated && !generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center gap-3 p-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                  <Sparkles className="w-6 h-6" />
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">Ready to generate on-brand marketing copy</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm">
                    Enter any custom product or service on the left. The AI will adhere strictly to {activeBrand?.name || 'your brand'}'s voice and guidelines.
                  </p>
                </div>
              </div>
            )}

            {generating && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border-2 border-brand-500/30 border-t-brand-500 animate-spin" />
                <p className="text-sm font-medium text-foreground">Generating and validating copy…</p>
                <p className="text-xs text-muted-foreground">Adhering to {activeBrand?.name || 'Brand'} guidelines</p>
              </div>
            )}

            {generated && !generating && (
              <div className="space-y-4">
                {viewMode === 'structured' && activeTab === 'primary' && structured ? (
                  <div className="space-y-3.5">
                    {/* Headline */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-1">
                        📌 Hook / Headline
                      </p>
                      <h4 className="text-base font-bold text-foreground leading-snug">
                        {structured.headline}
                      </h4>
                    </div>

                    {/* Main Caption */}
                    <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                      <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-1">
                        📝 Main Copy Body
                      </p>
                      <p className="text-sm text-foreground leading-relaxed whitespace-pre-wrap">
                        {structured.mainCaption}
                      </p>
                    </div>

                    {/* Key Benefits */}
                    {structured.keyBenefits?.length > 0 && (
                      <div className="p-3.5 rounded-xl bg-muted/40 border border-border">
                        <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-2">
                          ✨ Key Benefits & Selling Points
                        </p>
                        <ul className="space-y-1.5">
                          {structured.keyBenefits.map((b: string, i: number) => (
                            <li key={i} className="text-xs text-foreground flex items-start gap-2">
                              <span className="text-success-500 font-bold shrink-0">•</span>
                              <span>{b}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {/* CTA & Hashtags Bar */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="p-3 rounded-xl bg-muted/40 border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          🎯 Call to Action
                        </p>
                        <span className="inline-block px-3 py-1 rounded-lg bg-brand-500 text-white text-xs font-semibold shadow-sm">
                          {structured.cta}
                        </span>
                      </div>

                      <div className="p-3 rounded-xl bg-muted/40 border border-border">
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-1">
                          🏷️ Platform Hashtags
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {structured.hashtags?.map((t: string) => (
                            <span
                              key={t}
                              className="text-[11px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 font-medium"
                            >
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Raw Full Copy View */
                  <textarea
                    className="w-full p-4 rounded-xl border border-border bg-background text-sm text-foreground resize-none focus:outline-none focus:ring-2 focus:ring-brand-500 font-sans leading-relaxed min-h-[340px]"
                    value={currentDisplayContent}
                    onChange={(e) => {
                      if (activeTab === 'primary') setGenerated(e.target.value);
                    }}
                  />
                )}
              </div>
            )}
          </div>

          {/* Action Bar */}
          {generated && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center gap-2 mt-4 pt-4 border-t border-border flex-wrap"
            >
              <button
                onClick={handleGenerate}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-accent transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Regenerate
              </button>
              <button
                onClick={handleCopy}
                className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-border text-xs font-medium hover:bg-accent transition-colors"
              >
                {copied ? <CheckCircle className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied Full Copy!' : 'Copy Full Copy'}
              </button>
              <div className="flex-1" />
              <button
                onClick={handleApprove}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-success-500 hover:bg-success-600 text-white text-xs font-medium transition-colors shadow-sm"
              >
                <CheckCircle className="w-3.5 h-3.5" /> {approved ? 'Approved & Saved to Memory!' : 'Approve & Save'}
              </button>
            </motion.div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

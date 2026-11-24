import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import {
  Building2, Globe, Target, BookOpen, CheckCircle,
  AlertTriangle, Save, Loader2, Sparkles, Plus,
  RefreshCw, Check, ArrowRight, Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiGet, apiPut, apiPost } from '@/lib/api';
import { useBrand } from '@/context/BrandContext';

const slidersList = [
  { key: 'professional', left: 'Casual',       right: 'Professional' },
  { key: 'friendly',     left: 'Formal',       right: 'Friendly' },
  { key: 'innovative',   left: 'Traditional',  right: 'Innovative' },
  { key: 'simple',       left: 'Technical',    right: 'Simple' },
  { key: 'persuasive',   left: 'Informative',  right: 'Persuasive' },
  { key: 'emotional',    left: 'Rational',     right: 'Emotional' },
];

export function BrandProfilePage() {
  const { brands: globalBrands, activeBrand: globalActiveBrand, switchBrand: globalSwitchBrand, refreshBrands: globalRefreshBrands } = useBrand();
  const [brandsList, setBrandsList] = useState<any[]>([]);
  const [activeBrandId, setActiveBrandId] = useState<string>('');

  const [brand, setBrand] = useState<any>({
    name: 'Acme Corp',
    websiteUrl: 'https://acme.com',
    industry: 'SaaS / B2B Software',
    description: 'Enterprise workflow automation platform empowering operations teams.',
    targetAudience: 'Operations managers, CTOs, and technical leaders.',
  });

  const [guidelines, setGuidelines] = useState<any>({
    toneOfVoice: 'Professional, empowering, data-driven with human warmth.',
    writingPrinciples: 'Lead with value. Keep sentences concise (15–25 words). Avoid empty buzzwords.',
    preferredVocabulary: ['empower', 'streamline', 'scale', 'intelligent', 'seamless', 'enterprise-grade', 'optimize', 'transform'],
    prohibitedVocabulary: ['cheap', 'basic', 'simple', 'just', 'easy', 'obviously', 'simply'],
  });

  const [preferences, setPreferences] = useState<any>({
    professional: 65,
    friendly: 70,
    innovative: 58,
    simple: 55,
    persuasive: 72,
    emotional: 45,
  });

  const [prefInput, setPrefInput] = useState('');
  const [prohInput, setProhInput] = useState('');

  // Crawling state
  const [crawlUrl, setCrawlUrl] = useState('https://aboutamazon.com');
  const [crawling, setCrawling] = useState(false);
  const [crawlMessage, setCrawlMessage] = useState<string | null>(null);

  // Saving state
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // New Brand dialog state
  const [showNewBrandModal, setShowNewBrandModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandUrl, setNewBrandUrl] = useState('');
  const [creatingBrand, setCreatingBrand] = useState(false);

  // Load brands on mount
  const loadBrands = async () => {
    try {
      const list: any = await apiGet('/brands');
      if (Array.isArray(list) && list.length > 0) {
        setBrandsList(list);
        const curr = list.find((b: any) => b.id === activeBrandId) || list[0];
        selectBrand(curr);
      } else {
        const current: any = await apiGet('/brands/current');
        if (current) {
          setBrandsList([current]);
          selectBrand(current);
        }
      }
    } catch (e: any) {
      console.error('Failed to load brands:', e.message);
    }
  };

  useEffect(() => {
    loadBrands();
  }, []);

  useEffect(() => {
    if (globalActiveBrand) {
      selectBrand(globalActiveBrand);
    }
  }, [globalActiveBrand]);

  const selectBrand = (b: any) => {
    if (!b) return;
    setActiveBrandId(b.id);
    setBrand({
      id: b.id,
      name: b.name || 'Brand',
      websiteUrl: b.websiteUrl || '',
      industry: b.industry || '',
      description: b.description || '',
      targetAudience: b.targetAudience || '',
    });
    if (b.guidelines?.[0]) {
      const g = b.guidelines[0];
      setGuidelines({
        id: g.id,
        toneOfVoice: g.toneOfVoice || '',
        writingPrinciples: g.writingPrinciples || '',
        preferredVocabulary: Array.isArray(g.preferredVocabulary) ? g.preferredVocabulary : [],
        prohibitedVocabulary: Array.isArray(g.prohibitedVocabulary) ? g.prohibitedVocabulary : [],
      });
      setPrefInput(Array.isArray(g.preferredVocabulary) ? g.preferredVocabulary.join(', ') : '');
      setProhInput(Array.isArray(g.prohibitedVocabulary) ? g.prohibitedVocabulary.join(', ') : '');
    }
    if (b.preferences?.[0]) {
      setPreferences(b.preferences[0]);
    }
  };

  const handleCrawlWebsite = async () => {
    if (!crawlUrl.trim()) return;
    setCrawling(true);
    setCrawlMessage(null);
    setErrorMsg(null);

    try {
      const res: any = await apiPost('/brands/crawl', {
        url: crawlUrl,
        brandId: brand.id,
      });

      const extracted = res?.extractedBrandInfo;
      if (extracted) {
        setBrand((prev: any) => ({
          ...prev,
          name: extracted.brandName || prev.name,
          websiteUrl: crawlUrl,
          industry: extracted.industry || prev.industry,
          description: extracted.description || prev.description,
          targetAudience: extracted.targetAudience || prev.targetAudience,
        }));

        const newGuidelines = {
          toneOfVoice: extracted.toneOfVoice || guidelines.toneOfVoice,
          writingPrinciples: extracted.writingPrinciples || guidelines.writingPrinciples,
          preferredVocabulary: extracted.preferredVocabulary?.length ? extracted.preferredVocabulary : guidelines.preferredVocabulary,
          prohibitedVocabulary: extracted.prohibitedVocabulary?.length ? extracted.prohibitedVocabulary : guidelines.prohibitedVocabulary,
        };
        setGuidelines(newGuidelines);
        setPrefInput(newGuidelines.preferredVocabulary.join(', '));
        setProhInput(newGuidelines.prohibitedVocabulary.join(', '));

        setCrawlMessage(`Website crawled successfully! Extracted brand identity for "${extracted.brandName || 'Brand'}".`);
        // Refresh brands list
        loadBrands();
      }
    } catch (err: any) {
      console.error('Crawl failed:', err);
      setErrorMsg(err.message || 'Firecrawl scraping failed. You can also load the Amazon Preset with 1 click.');
    } finally {
      setCrawling(false);
    }
  };

  const handleSave = async () => {
    if (!brand.id) return;
    setSaving(true);
    setErrorMsg(null);

    // Parse comma-separated vocab
    const parsedPreferred = prefInput.split(',').map((w) => w.trim()).filter(Boolean);
    const parsedProhibited = prohInput.split(',').map((w) => w.trim()).filter(Boolean);

    try {
      // 1. Update Core Brand Info
      await apiPut(`/brands/${brand.id}`, {
        name: brand.name,
        websiteUrl: brand.websiteUrl,
        industry: brand.industry,
        description: brand.description,
        targetAudience: brand.targetAudience,
      });

      // 2. Update Guidelines
      await apiPut(`/brands/${brand.id}/guidelines`, {
        toneOfVoice: guidelines.toneOfVoice,
        writingPrinciples: guidelines.writingPrinciples,
        preferredVocabulary: parsedPreferred,
        prohibitedVocabulary: parsedProhibited,
      });

      // 3. Update Preferences
      await apiPut(`/brands/${brand.id}/preferences`, preferences);

      setGuidelines((prev: any) => ({
        ...prev,
        preferredVocabulary: parsedPreferred,
        prohibitedVocabulary: parsedProhibited,
      }));

      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
      await globalRefreshBrands();
      loadBrands();
    } catch (e: any) {
      console.error('Save failed:', e);
      setErrorMsg(e.message || 'Failed to save changes.');
    } finally {
      setSaving(false);
    }
  };

  const handleCreateNewBrand = async () => {
    if (!newBrandName.trim()) return;
    setCreatingBrand(true);
    try {
      const created: any = await apiPost('/brands', {
        name: newBrandName,
        websiteUrl: newBrandUrl || undefined,
        industry: 'E-Commerce / Technology',
        description: `${newBrandName} corporate brand and marketing voice.`,
      });
      setShowNewBrandModal(false);
      setNewBrandName('');
      setNewBrandUrl('');
      await loadBrands();
      if (created) selectBrand(created);
    } catch (e: any) {
      setErrorMsg(e.message || 'Could not create brand.');
    } finally {
      setCreatingBrand(false);
    }
  };

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* ── Header ────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Brand Profile & Guidelines</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              Configure your brand persona, crawl guidelines from live websites, or switch brands.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-xs font-semibold transition-colors shadow-brand"
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
              {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Changes'}
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Brand Switcher Bar ────────────────────────────────────────────── */}
      <div className="flex items-center justify-between bg-card border border-border rounded-xl p-3">
        <div className="flex items-center gap-2 overflow-x-auto py-1">
          <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mr-2">Active Brand:</span>
          {brandsList.map((b) => (
            <button
              key={b.id}
              onClick={() => selectBrand(b)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-colors shrink-0',
                activeBrandId === b.id
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              {b.name}
            </button>
          ))}
          <button
            onClick={() => setShowNewBrandModal(true)}
            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-brand-500 border border-dashed border-brand-500/40 hover:bg-brand-500/10 transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            Add New Brand
          </button>
        </div>
      </div>

      {/* ── Firecrawl Website Scanner ────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-brand-500/10 via-purple-500/5 to-transparent border border-brand-500/20 rounded-xl p-5"
      >
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-brand-500" />
              <h2 className="text-sm font-bold text-foreground">Auto-Extract Brand Voice with Firecrawl</h2>
            </div>
            <p className="text-xs text-muted-foreground">
              Enter any company website (e.g. <span className="text-brand-500 font-mono">https://aboutamazon.com</span>) to automatically scrape and generate guidelines.
            </p>
          </div>

          <div className="flex w-full md:w-auto items-center gap-2">
            <input
              type="text"
              value={crawlUrl}
              onChange={(e) => setCrawlUrl(e.target.value)}
              placeholder="https://aboutamazon.com"
              className="flex-1 md:w-80 px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
            <button
              onClick={handleCrawlWebsite}
              disabled={crawling || !crawlUrl.trim()}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium transition-colors shrink-0 shadow-brand"
            >
              {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {crawling ? 'Crawling…' : 'Crawl & Extract'}
            </button>
          </div>
        </div>

        {crawlMessage && (
          <p className="mt-3 text-xs text-success-500 bg-success-500/10 p-2.5 rounded-lg border border-success-500/20 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            {crawlMessage}
          </p>
        )}
        {errorMsg && (
          <p className="mt-3 text-xs text-danger-500 bg-danger-500/10 p-2.5 rounded-lg border border-danger-500/20 flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            {errorMsg}
          </p>
        )}
      </motion.div>

      {/* ── Brand Details Form ────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        {/* Brand identity inputs */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="xl:col-span-2 bg-card border border-border rounded-xl p-6 space-y-4"
        >
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-2xl font-bold shadow-brand shrink-0">
              {brand.name?.charAt(0) || 'B'}
            </div>
            <div className="flex-1 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Brand / Company Name</label>
                  <input
                    type="text"
                    value={brand.name}
                    onChange={(e) => setBrand({ ...brand, name: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm font-semibold text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Website URL</label>
                  <input
                    type="text"
                    value={brand.websiteUrl}
                    onChange={(e) => setBrand({ ...brand, websiteUrl: e.target.value })}
                    className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground block mb-1">Industry</label>
                <input
                  type="text"
                  value={brand.industry}
                  onChange={(e) => setBrand({ ...brand, industry: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2 border-t border-border">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Brand Description & Identity</label>
              <textarea
                rows={3}
                value={brand.description}
                onChange={(e) => setBrand({ ...brand, description: e.target.value })}
                className="w-full p-3 rounded-lg bg-background border border-border text-sm text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Target Audience</label>
              <textarea
                rows={2}
                value={brand.targetAudience}
                onChange={(e) => setBrand({ ...brand, targetAudience: e.target.value })}
                className="w-full p-3 rounded-lg bg-background border border-border text-sm text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>
        </motion.div>

        {/* Brand health card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <h3 className="font-semibold text-foreground mb-4">Brand Compliance Health</h3>
          <div className="flex items-center justify-center mb-4">
            <div className="relative w-28 h-28">
              <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
                <circle
                  cx="50"
                  cy="50"
                  r="40"
                  fill="none"
                  stroke="#8b5cf6"
                  strokeWidth="8"
                  strokeDasharray={`${92 * 2.513} ${(100 - 92) * 2.513}`}
                  strokeLinecap="round"
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-3xl font-bold text-foreground">92</span>
                <span className="text-xs text-muted-foreground">/ 100</span>
              </div>
            </div>
          </div>
          <div className="space-y-2">
            {[
              { label: 'Guidelines Alignment', score: 95, color: 'bg-success-500' },
              { label: 'Vocabulary Enforcement', score: 92, color: 'bg-blue-500' },
              { label: 'Tone Adherence', score: 90, color: 'bg-brand-500' },
            ].map((s) => (
              <div key={s.label}>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{s.label}</span>
                  <span className="font-medium text-foreground">{s.score}%</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div className={cn('h-full rounded-full', s.color)} style={{ width: `${s.score}%` }} />
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── Guidelines Section ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-5 space-y-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <BookOpen className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold text-foreground">Tone of Voice Guidelines</h3>
          </div>
          <textarea
            rows={4}
            value={guidelines.toneOfVoice}
            onChange={(e) => setGuidelines({ ...guidelines, toneOfVoice: e.target.value })}
            className="w-full p-3 rounded-lg bg-background border border-border text-sm text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. Customer-obsessed, direct, clear, action-oriented, data-driven..."
          />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.22 }}
          className="bg-card border border-border rounded-xl p-5 space-y-2"
        >
          <div className="flex items-center gap-2 mb-2">
            <Target className="w-4 h-4 text-brand-500" />
            <h3 className="font-semibold text-foreground">Writing Principles</h3>
          </div>
          <textarea
            rows={4}
            value={guidelines.writingPrinciples}
            onChange={(e) => setGuidelines({ ...guidelines, writingPrinciples: e.target.value })}
            className="w-full p-3 rounded-lg bg-background border border-border text-sm text-foreground leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-brand-500"
            placeholder="e.g. Start with the customer and work backwards. Eliminate fluff. Deliver crisp measurable impact..."
          />
        </motion.div>
      </div>

      {/* ── Voice Sliders ─────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="bg-card border border-border rounded-xl p-6"
      >
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-4 h-4 text-brand-500" />
          <h3 className="font-semibold text-foreground">Voice Spectrum Sliders</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {slidersList.map((slider) => {
            const val = preferences[slider.key] || 50;
            return (
              <div key={slider.key}>
                <div className="flex justify-between text-xs text-muted-foreground mb-2">
                  <span>{slider.left}</span>
                  <span className="font-semibold text-foreground">{val}%</span>
                  <span>{slider.right}</span>
                </div>
                <input
                  type="range"
                  min={0}
                  max={100}
                  value={val}
                  onChange={(e) => setPreferences({ ...preferences, [slider.key]: Number(e.target.value) })}
                  className="w-full accent-brand-500 cursor-pointer"
                />
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* ── Vocabulary Editor ─────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Preferred vocabulary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success-500" />
            <h3 className="font-semibold text-foreground">Preferred Brand Vocabulary</h3>
          </div>
          <p className="text-xs text-muted-foreground">Separate words or phrases with commas:</p>
          <textarea
            rows={3}
            value={prefInput}
            onChange={(e) => setPrefInput(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-background border border-border text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-success-500"
            placeholder="customer-obsessed, innovate, day 1, deliver, simplify, pioneer..."
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {prefInput.split(',').map((w) => w.trim()).filter(Boolean).map((w) => (
              <span key={w} className="px-2 py-0.5 rounded-md text-xs font-medium bg-success-500/10 text-success-600 border border-success-500/20">
                +{w}
              </span>
            ))}
          </div>
        </motion.div>

        {/* Prohibited vocabulary */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-xl p-5 space-y-3"
        >
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-danger-500" />
            <h3 className="font-semibold text-foreground">Prohibited Vocabulary (Banned Words)</h3>
          </div>
          <p className="text-xs text-muted-foreground">Words that will trigger consistency penalties:</p>
          <textarea
            rows={3}
            value={prohInput}
            onChange={(e) => setProhInput(e.target.value)}
            className="w-full p-2.5 rounded-lg bg-background border border-border text-xs text-foreground font-mono focus:outline-none focus:ring-2 focus:ring-danger-500"
            placeholder="day 2, complacency, complex, impossible, competitor-focused..."
          />
          <div className="flex flex-wrap gap-1.5 pt-1">
            {prohInput.split(',').map((w) => w.trim()).filter(Boolean).map((w) => (
              <span key={w} className="px-2 py-0.5 rounded-md text-xs font-medium bg-danger-500/10 text-danger-600 border border-danger-500/20">
                ✕ {w}
              </span>
            ))}
          </div>
        </motion.div>
      </div>

      {/* ── New Brand Modal ───────────────────────────────────────────────── */}
      <AnimatePresence>
        {showNewBrandModal && (
          <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl"
            >
              <h2 className="text-lg font-bold text-foreground">Create New Brand Profile</h2>
              <p className="text-xs text-muted-foreground">Add a new client or company brand to analyze and create copy for.</p>

              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Company / Brand Name</label>
                  <input
                    type="text"
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="e.g. Amazon"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground block mb-1">Website URL</label>
                  <input
                    type="text"
                    value={newBrandUrl}
                    onChange={(e) => setNewBrandUrl(e.target.value)}
                    placeholder="e.g. https://aboutamazon.com"
                    className="w-full px-3 py-2 rounded-lg bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  onClick={() => setShowNewBrandModal(false)}
                  className="px-4 py-2 rounded-lg border border-border hover:bg-accent text-xs font-medium text-muted-foreground transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreateNewBrand}
                  disabled={creatingBrand || !newBrandName.trim()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-brand"
                >
                  {creatingBrand && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  Create Brand
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

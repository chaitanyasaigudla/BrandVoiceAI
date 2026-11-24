import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Globe, Mic2, BookOpen, ChevronRight, ChevronLeft, Check, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { apiPost, apiPut } from '@/lib/api';

const steps = [
  { id: 1, label: 'Company Info',    icon: Building2 },
  { id: 2, label: 'Website Crawl',   icon: Globe },
  { id: 3, label: 'Brand Voice',     icon: Mic2 },
  { id: 4, label: 'Guidelines',      icon: BookOpen },
];

export function OnboardingPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [crawling, setCrawling] = useState(false);
  const [crawled, setCrawled] = useState(false);
  const [crawlData, setCrawlData] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Form states
  const [companyName, setCompanyName] = useState('Acme Corp');
  const [websiteUrl, setWebsiteUrl] = useState('https://acme.com');
  const [industry, setIndustry] = useState('SaaS / B2B Software');
  const [description, setDescription] = useState('Enterprise workflow automation platform that empowers operations teams.');

  // Voice sliders
  const [sliders, setSliders] = useState({
    professional: 65,
    friendly: 70,
    innovative: 60,
    simple: 55,
  });

  // Guidelines state
  const [guidelines, setGuidelines] = useState({
    identity: 'Acme Corp is an enterprise workflow automation platform dedicated to empowering operations teams.',
    toneOfVoice: 'Professional yet approachable. Confident without being aggressive. Data-driven with human warmth.',
    writingPrinciples: 'Lead with value. Use active voice. Keep sentences concise (15–25 words). Avoid jargon.',
    preferredVocabulary: 'empower, streamline, scale, intelligent, seamless, enterprise-grade, optimize, transform',
    prohibitedVocabulary: 'cheap, basic, simple, just, easy, obviously, simply',
  });

  const handleCrawl = async () => {
    setCrawling(true);
    setErrorMsg(null);
    try {
      const res: any = await apiPost('/brands/crawl', { url: websiteUrl });
      setCrawlData(res);
      setCrawled(true);

      const info = res.extractedBrandInfo;
      if (info) {
        if (info.brandName) setCompanyName(info.brandName);
        if (info.industry) setIndustry(info.industry);
        if (info.description) setDescription(info.description);

        setGuidelines({
          identity: info.description || guidelines.identity,
          toneOfVoice: info.toneOfVoice || guidelines.toneOfVoice,
          writingPrinciples: info.writingPrinciples || guidelines.writingPrinciples,
          preferredVocabulary: info.preferredVocabulary?.join(', ') || guidelines.preferredVocabulary,
          prohibitedVocabulary: info.prohibitedVocabulary?.join(', ') || guidelines.prohibitedVocabulary,
        });
      }
    } catch (err: any) {
      console.error('Crawl failed:', err);
      setErrorMsg(err.message || 'Crawl failed. Please check the URL.');
    } finally {
      setCrawling(false);
    }
  };

  const handleComplete = async () => {
    try {
      navigate('/dashboard');
    } catch (e) {
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
      {/* Logo */}
      <div className="flex items-center gap-2 mb-8">
        <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
          <Zap className="w-4 h-4 text-white" />
        </div>
        <span className="font-bold text-foreground">BrandVoice AI</span>
      </div>

      {/* Step indicators */}
      <div className="flex items-center gap-0 mb-8">
        {steps.map((s, i) => (
          <div key={s.id} className="flex items-center">
            <div className={cn(
              'w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium transition-all',
              step > s.id  ? 'bg-success-500 text-white' :
              step === s.id ? 'bg-brand-500 text-white ring-4 ring-brand-500/20' :
              'bg-muted text-muted-foreground'
            )}>
              {step > s.id ? <Check className="w-4 h-4" /> : s.id}
            </div>
            <div className="hidden sm:block ml-2 mr-2">
              <p className={cn('text-xs font-medium', step === s.id ? 'text-brand-500' : 'text-muted-foreground')}>{s.label}</p>
            </div>
            {i < steps.length - 1 && <div className={cn('w-8 h-px mx-2', step > s.id ? 'bg-success-500' : 'bg-border')} />}
          </div>
        ))}
      </div>

      {/* Step content */}
      <div className="w-full max-w-lg">
        <AnimatePresence mode="wait">
          <motion.div key={step}
            initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}
            className="bg-card border border-border rounded-2xl p-6 space-y-5 shadow-card">

            {step === 1 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Tell us about your company</h2>
                  <p className="text-sm text-muted-foreground mt-1">This will be used to establish your brand identity</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Company Name</label>
                    <input type="text" value={companyName} onChange={e => setCompanyName(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Website URL</label>
                    <input type="url" value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Industry</label>
                    <input type="text" value={industry} onChange={e => setIndustry(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Company Description</label>
                    <textarea value={description} onChange={e => setDescription(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none min-h-[80px]" />
                  </div>
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Crawl your website with Firecrawl</h2>
                  <p className="text-sm text-muted-foreground mt-1">We'll automatically extract brand signals and guidelines</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1 block">Website URL</label>
                    <div className="flex gap-2">
                      <input value={websiteUrl} onChange={e => setWebsiteUrl(e.target.value)} type="url"
                        className="flex-1 px-3 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
                      <button onClick={handleCrawl} disabled={crawling}
                        className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white text-sm font-medium transition-colors shadow-brand">
                        {crawling ? <Loader2 className="w-4 h-4 animate-spin" /> : <Globe className="w-4 h-4" />}
                        {crawling ? 'Crawling…' : crawled ? 'Re-Crawl' : 'Crawl'}
                      </button>
                    </div>
                  </div>

                  {errorMsg && (
                    <p className="text-xs text-danger-500 bg-danger-500/10 p-2.5 rounded-lg border border-danger-500/20">{errorMsg}</p>
                  )}

                  {crawled && crawlData && (
                    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                      className="p-4 rounded-lg border border-success-500/30 bg-success-500/10 space-y-2">
                      <div className="flex items-center gap-2 text-success-600 font-medium text-sm">
                        <Check className="w-4 h-4" /> Crawl & AI Extraction Complete
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div className="p-2 rounded-lg bg-background border border-border">
                          <p className="font-bold text-foreground text-sm">{crawlData.pagesCrawled || 1}</p>
                          <p className="text-xs text-muted-foreground">Pages Crawled</p>
                        </div>
                        <div className="p-2 rounded-lg bg-background border border-border">
                          <p className="font-bold text-foreground text-sm">{crawlData.wordsExtracted || 350}</p>
                          <p className="text-xs text-muted-foreground">Words Analyzed</p>
                        </div>
                        <div className="p-2 rounded-lg bg-background border border-border">
                          <p className="font-bold text-foreground text-sm">{crawlData.extractedBrandInfo?.preferredVocabulary?.length || 8}</p>
                          <p className="text-xs text-muted-foreground">Brand Signals</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </>
            )}

            {step === 3 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Configure your brand voice</h2>
                  <p className="text-sm text-muted-foreground mt-1">Adjust sliders to define your tone spectrum</p>
                </div>
                <div className="space-y-4">
                  {[
                    { key: 'professional', left: 'Casual',      right: 'Professional' },
                    { key: 'friendly',     left: 'Formal',      right: 'Friendly' },
                    { key: 'innovative',   left: 'Traditional', right: 'Innovative' },
                    { key: 'simple',       left: 'Technical',   right: 'Simple' },
                  ].map(s => (
                    <div key={s.key}>
                      <div className="flex justify-between text-xs text-muted-foreground mb-2">
                        <span>{s.left}</span>
                        <span className="font-semibold text-foreground">{(sliders as any)[s.key]}%</span>
                        <span>{s.right}</span>
                      </div>
                      <input type="range" min={0} max={100} value={(sliders as any)[s.key]}
                        onChange={e => setSliders({ ...sliders, [s.key]: Number(e.target.value) })}
                        className="w-full accent-brand-500" />
                    </div>
                  ))}
                </div>
              </>
            )}

            {step === 4 && (
              <>
                <div>
                  <h2 className="text-xl font-bold text-foreground">Review brand guidelines</h2>
                  <p className="text-sm text-muted-foreground mt-1">AI-generated from your website and voice settings</p>
                </div>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {[
                    { title: 'Brand Identity',     body: guidelines.identity },
                    { title: 'Tone of Voice',       body: guidelines.toneOfVoice },
                    { title: 'Writing Principles',  body: guidelines.writingPrinciples },
                    { title: 'Preferred Vocabulary', body: guidelines.preferredVocabulary },
                    { title: 'Prohibited Words',    body: guidelines.prohibitedVocabulary },
                  ].map(item => (
                    <div key={item.title} className="p-3 rounded-lg bg-muted/50 border border-border">
                      <p className="text-xs font-semibold text-brand-500 uppercase tracking-wide mb-1">{item.title}</p>
                      <p className="text-sm text-foreground">{item.body}</p>
                    </div>
                  ))}
                </div>
              </>
            )}

            {/* Navigation */}
            <div className="flex items-center justify-between pt-2">
              <button onClick={() => setStep(s => Math.max(1, s - 1))} disabled={step === 1}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg border border-border hover:bg-accent disabled:opacity-40 text-sm transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
              <button onClick={() => step < 4 ? setStep(s => s + 1) : handleComplete()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-brand">
                {step === 4 ? 'Complete Setup' : 'Continue'}
                {step < 4 && <ChevronRight className="w-4 h-4" />}
                {step === 4 && <Check className="w-4 h-4" />}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

import { motion } from 'framer-motion';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles, ShieldCheck, Zap, Globe, Brain, CheckCircle2,
  ArrowRight, Instagram, Linkedin, Twitter, Mail, FileText,
  ShoppingBag, Check, Layers, BarChart3, Users, Star,
  ChevronRight, Building2, Sun, Moon,
} from 'lucide-react';
import { ThreeCanvas } from '@/components/landing/ThreeCanvas';
import { toggleTheme, getTheme } from '@/hooks/useTheme';

export function LandingPage() {
  const navigate = useNavigate();
  const token = localStorage.getItem('brandvoice-token');
  const [theme, setTheme] = useState(getTheme);

  const handleGetStarted = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/register');
    }
  };

  const handleSignIn = () => {
    if (token) {
      navigate('/dashboard');
    } else {
      navigate('/login');
    }
  };

  const scrollToFeatures = () => {
    const el = document.getElementById('features');
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="relative min-h-screen bg-[#070714] text-foreground overflow-x-hidden selection:bg-brand-500 selection:text-white">
      {/* ── 3D Canvas Background ─────────────────────────────────────────── */}
      <ThreeCanvas />

      {/* ── Public Top Navigation ────────────────────────────────────────── */}
      <header className="relative z-20 border-b border-white/5 bg-[#070714]/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white shadow-brand">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <span className="text-lg font-black tracking-tight text-white">BrandVoice</span>
              <span className="text-lg font-black tracking-tight text-brand-500"> AI</span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-300">
            <a href="#features" className="hover:text-white transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-white transition-colors">How It Works</a>
            <a href="#platforms" className="hover:text-white transition-colors">Platforms</a>
            <a href="#use-cases" className="hover:text-white transition-colors">Use Cases</a>
            <a href="#pricing" className="hover:text-white transition-colors">Pricing</a>
            <a href="#about" className="hover:text-white transition-colors">About</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setTheme(toggleTheme())}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
            <button
              onClick={handleSignIn}
              className="px-4 py-2 text-sm font-medium text-slate-300 hover:text-white transition-colors"
            >
              Sign In
            </button>
            <button
              onClick={handleGetStarted}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white text-sm font-semibold hover:opacity-95 transition-all shadow-brand hover:shadow-brand-hover"
            >
              <span>{token ? 'Go to Dashboard' : 'Get Started Free'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* ── 1. Hero Section ──────────────────────────────────────────────── */}
      <section className="relative z-10 pt-24 pb-28 px-6 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="space-y-6"
        >
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-brand-500/30 bg-brand-500/10 text-brand-400 text-xs font-semibold backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-brand-400" />
            <span>Next-Gen Enterprise Brand Voice Architecture</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-white tracking-tight leading-[1.1] max-w-4xl mx-auto">
            Every Brand Has a Voice.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-purple-300 to-pink-400">
              Make Yours Unforgettable.
            </span>
          </h1>

          {/* Description */}
          <p className="text-lg sm:text-xl text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Generate consistent, authentic and brand-aligned marketing content across every platform with Generative AI.
          </p>

          {/* Hero CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
            <button
              onClick={handleGetStarted}
              className="w-full sm:w-auto px-8 py-4 rounded-xl bg-brand-500 hover:bg-brand-600 text-white font-bold text-base transition-all shadow-brand flex items-center justify-center gap-2.5 hover:scale-[1.02]"
            >
              <span>Get Started</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={scrollToFeatures}
              className="w-full sm:w-auto px-8 py-4 rounded-xl border border-white/10 hover:border-white/20 bg-white/5 hover:bg-white/10 text-white font-semibold text-base transition-all backdrop-blur-md"
            >
              Explore Features
            </button>
          </div>

          {/* Social Proof Stats */}
          <div className="pt-12 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto border-t border-white/10 mt-12">
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">98%</p>
              <p className="text-xs text-slate-400 mt-0.5">Voice Consistency</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-brand-400">10x</p>
              <p className="text-xs text-slate-400 mt-0.5">Faster Content Output</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-white">6+</p>
              <p className="text-xs text-slate-400 mt-0.5">Publishing Channels</p>
            </div>
            <div>
              <p className="text-2xl sm:text-3xl font-black text-purple-400">1-Click</p>
              <p className="text-xs text-slate-400 mt-0.5">Firecrawl Web Extraction</p>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ── 2. Problem Statement ─────────────────────────────────────────── */}
      <section className="relative z-10 py-20 px-6 border-t border-white/5 bg-[#090919]/60">
        <div className="max-w-5xl mx-auto text-center space-y-4">
          <h2 className="text-xs font-bold uppercase tracking-widest text-brand-400">The Problem</h2>
          <h3 className="text-3xl sm:text-4xl font-extrabold text-white">
            Why Traditional Brand Marketing Breaks Down
          </h3>
          <p className="text-slate-400 text-sm sm:text-base max-w-2xl mx-auto leading-relaxed">
            As your business scales across channels and teams, your brand identity fragments.
          </p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 text-left">
            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-danger-500/10 text-danger-500 flex items-center justify-center font-bold text-lg mb-4">
                ✕
              </div>
              <h4 className="text-base font-bold text-white mb-2">Fragmented Tone</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                LinkedIn sounds formal, Instagram sounds like a teenager, and emails sound robotic. Inconsistency destroys buyer trust.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-warning-500/10 text-warning-500 flex items-center justify-center font-bold text-lg mb-4">
                ⏳
              </div>
              <h4 className="text-base font-bold text-white mb-2">Painful Manual Review</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Brand directors spend 20+ hours every week editing off-brand phrases, banned buzzwords, and misplaced calls to action.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 backdrop-blur-md">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center font-bold text-lg mb-4">
                📉
              </div>
              <h4 className="text-base font-bold text-white mb-2">Generic AI Slop</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Standard ChatGPT outputs sound like generic enterprise software with zero brand soul, irrelevant keywords, and placeholder links.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 3. Product Features ──────────────────────────────────────────── */}
      <section id="features" className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Core Architecture</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Six Pillars of BrandVoice AI
          </h2>
          <p className="text-slate-400 text-sm max-w-xl mx-auto">
            Everything your marketing and brand teams need to enforce perfect consistency at scale.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1 */}
          <div className="p-6 rounded-2xl bg-card/60 border border-border backdrop-blur-md hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Globe className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Website-to-Brand Intelligence</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Powered by <strong>Firecrawl</strong>. Enter any live website URL to automatically crawl, analyze, and extract core identity, tone sliders, and vocabulary.
            </p>
          </div>

          {/* Card 2 */}
          <div className="p-6 rounded-2xl bg-card/60 border border-border backdrop-blur-md hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Sparkles className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">AI Content Studio</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generate platform-optimized copy with <strong>Groq, OpenAI, and Gemini</strong>. Strictly focuses on your product with context-aware CTAs and zero placeholder leaks.
            </p>
          </div>

          {/* Card 3 */}
          <div className="p-6 rounded-2xl bg-card/60 border border-border backdrop-blur-md hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Brand Consistency Auditor</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Evaluates Tone (35%), Vocabulary (25%), Writing Style (25%), and Structure (15%). Detects prohibited words, long sentences, and unsupported claims.
            </p>
          </div>

          {/* Card 4 */}
          <div className="p-6 rounded-2xl bg-card/60 border border-border backdrop-blur-md hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">1-Click AI Content Improvement</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Instantly rewrite flagged copy into 95%+ compliant brand tone with a single click, resolving all vocabulary penalties and awkward sentence flow.
            </p>
          </div>

          {/* Card 5 */}
          <div className="p-6 rounded-2xl bg-card/60 border border-border backdrop-blur-md hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-pink-500/10 text-pink-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Brain className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Semantic Brand Memory (pgvector)</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Approved past content is embedded as 1536-dimensional vectors using <code>pgvector</code>, providing dynamic semantic memory for future generation context.
            </p>
          </div>

          {/* Card 6 */}
          <div className="p-6 rounded-2xl bg-card/60 border border-border backdrop-blur-md hover:border-brand-500/50 transition-all group">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 text-amber-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
              <Users className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Team Approval Workflow</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Collaborative multi-brand workflow with role-based permissions, approval audit trails, content library archives, and publishing analytics.
            </p>
          </div>
        </div>
      </section>

      {/* ── 4. How It Works ──────────────────────────────────────────────── */}
      <section id="how-it-works" className="relative z-10 py-20 px-6 border-t border-white/5 bg-[#090919]/60">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Workflow</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">How BrandVoice AI Works</h2>
            <p className="text-slate-400 text-sm max-w-lg mx-auto">
              From live website to multi-channel consistency in under 60 seconds.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-brand-500 text-white font-black text-sm flex items-center justify-center">
                1
              </div>
              <h4 className="text-base font-bold text-white">Ingest Any Brand</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Provide a website URL or select a preset. Firecrawl scrapes the brand signals instantly.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-purple-500 text-white font-black text-sm flex items-center justify-center">
                2
              </div>
              <h4 className="text-base font-bold text-white">Configure Guidelines</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Fine-tune voice sliders, preferred words, banned vocabulary, and writing principles.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-blue-500 text-white font-black text-sm flex items-center justify-center">
                3
              </div>
              <h4 className="text-base font-bold text-white">Generate High-Impact Copy</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Produce targeted posts for your product (Shoes, Tech, Coffee) across 6+ channels.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/[0.02] border border-white/10 space-y-3">
              <div className="w-8 h-8 rounded-lg bg-emerald-500 text-white font-black text-sm flex items-center justify-center">
                4
              </div>
              <h4 className="text-base font-bold text-white">Audit & Enforce</h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Run real-time consistency checks, auto-improve copy, and store winning copy in memory.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 5. Supported Platforms ───────────────────────────────────────── */}
      <section id="platforms" className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Omni-Channel</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Engineered for Every Marketing Channel
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Each platform has unique formatting, hook structures, and constraints. BrandVoice AI formats them natively.
          </p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {[
            { icon: Instagram, label: 'Instagram', desc: 'Hooks, emojis & hashtags' },
            { icon: Linkedin,  label: 'LinkedIn',  desc: 'Thought leadership copy' },
            { icon: Twitter,   label: 'X / Twitter', desc: 'Concise 280-char hooks' },
            { icon: Mail,      label: 'Email',     desc: 'Subject lines & CTAs' },
            { icon: FileText,  label: 'Blog',      desc: 'SEO articles & subheads' },
            { icon: ShoppingBag, label: 'E-Commerce', desc: 'Product selling points' },
          ].map((ch) => (
            <div key={ch.label} className="p-4 rounded-xl bg-card/60 border border-border text-center space-y-2 hover:border-brand-500/40 transition-colors">
              <div className="w-10 h-10 rounded-xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto">
                <ch.icon className="w-5 h-5" />
              </div>
              <p className="font-bold text-white text-xs sm:text-sm">{ch.label}</p>
              <p className="text-[11px] text-slate-400 leading-tight">{ch.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── 6. Industry Use Cases ────────────────────────────────────────── */}
      <section id="use-cases" className="relative z-10 py-20 px-6 border-t border-white/5 bg-[#090919]/60">
        <div className="max-w-5xl mx-auto space-y-12">
          <div className="text-center space-y-3">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Solutions</span>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">Built for High-Growth Industries</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>👟</span> E-Commerce & Consumer Brands
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Launch seasonal drops (e.g. Running Shoes, Apparel) with benefit-driven hooks and context-aware CTAs ("Find Your Fit", "Shop Now").
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>☁️</span> B2B & Enterprise SaaS
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Maintain enterprise credibility across whitepapers, LinkedIn posts, and product updates with data-driven value statements.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>🏢</span> Marketing Agencies
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Manage 20+ client brand profiles with strict tenant isolation, 1-click brand switching, and dedicated voice memories.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-white/[0.02] border border-white/10 space-y-2">
              <h4 className="text-base font-bold text-white flex items-center gap-2">
                <span>🚀</span> High-Growth Startups
              </h4>
              <p className="text-xs text-slate-400 leading-relaxed">
                Establish a consistent market presence before hiring an expensive brand agency. Scale from Day 1 with confidence.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ── 7. Pricing ───────────────────────────────────────────────── */}
      <section id="pricing" className="relative z-10 py-24 px-6 max-w-6xl mx-auto">
        <div className="text-center space-y-3 mb-16">
          <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Pricing</span>
          <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
            Simple, Transparent Pricing
          </h2>
          <p className="text-slate-400 text-sm max-w-lg mx-auto">
            Start free. Scale when you need to.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Free Tier */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <h4 className="text-lg font-bold text-white">Starter</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">Free</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">Perfect for testing BrandVoice AI with one brand.</p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> 1 Brand Profile</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> 50 Generations / Month</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> Consistency Checker</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> Content Library</li>
            </ul>
            <button onClick={handleGetStarted} className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all">
              Get Started
            </button>
          </div>

          {/* Pro Tier */}
          <div className="p-6 rounded-2xl bg-brand-500/5 border-2 border-brand-500/40 space-y-4 relative">
            <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 bg-brand-500 rounded-full text-[10px] font-bold text-white uppercase tracking-wider">
              Most Popular
            </div>
            <h4 className="text-lg font-bold text-white">Professional</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">$49</span>
              <span className="text-sm text-slate-400">/month</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">For growing teams managing multiple brands.</p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> 5 Brand Profiles</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> Unlimited Generations</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> Firecrawl Web Extraction</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> Brand Memory (pgvector)</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> Priority Support</li>
            </ul>
            <button onClick={handleGetStarted} className="w-full py-2.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-sm font-bold transition-all shadow-brand">
              Start Free Trial
            </button>
          </div>

          {/* Enterprise Tier */}
          <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
            <h4 className="text-lg font-bold text-white">Enterprise</h4>
            <div className="flex items-baseline gap-1">
              <span className="text-3xl font-black text-white">Custom</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">For agencies and large teams at scale.</p>
            <ul className="space-y-2 text-xs text-slate-300">
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> Unlimited Brands</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> Custom LLM Routing</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> SSO & RBAC</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> Dedicated Success Manager</li>
              <li className="flex items-center gap-2"><Check className="w-3.5 h-3.5 text-brand-400 flex-shrink-0" /> SLA & On-prem Option</li>
            </ul>
            <button onClick={handleSignIn} className="w-full py-2.5 rounded-xl border border-white/10 hover:border-white/20 text-white text-sm font-semibold transition-all">
              Contact Sales
            </button>
          </div>
        </div>
      </section>

      {/* ── 8. About the Architecture ────────────────────────────────────── */}
      <section id="about" className="relative z-10 py-20 px-6 max-w-5xl mx-auto">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-brand-500/10 via-purple-500/5 to-transparent border border-brand-500/20 backdrop-blur-xl">
          <div className="space-y-4 max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-widest text-brand-400">Enterprise Stack</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Under the Hood of BrandVoice AI
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Engineered with a modern enterprise foundation: <strong>PostgreSQL with pgvector</strong> for semantic vector memory, <strong>Firecrawl</strong> for intelligent website scraping, and an intelligent multi-LLM router powered by <strong>Groq (GPT-OSS-120B)</strong>, <strong>OpenAI (GPT-4o-mini)</strong>, and <strong>Google Gemini (2.5-flash)</strong>.
            </p>
          </div>
        </div>
      </section>

      {/* ── 9. Final Call to Action ──────────────────────────────────────── */}
      <section className="relative z-10 py-24 px-6 border-t border-white/10 text-center bg-[#070714]">
        <div className="max-w-4xl mx-auto space-y-6">
          <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
            Ready to Make Your Brand Voice Unforgettable?
          </h2>
          <p className="text-slate-400 text-sm sm:text-base max-w-xl mx-auto">
            Join modern marketing teams auditing, scaling, and protecting their brand identity.
          </p>

          <div className="pt-2">
            <button
              onClick={handleGetStarted}
              className="px-9 py-4 rounded-xl bg-gradient-to-r from-brand-500 to-purple-600 text-white font-bold text-base hover:opacity-95 transition-all shadow-brand hover:scale-105 inline-flex items-center gap-2"
            >
              <span>{token ? 'Launch App Dashboard' : 'Start Free Today'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </section>

      {/* ── 10. Footer ────────────────────────────────────────────────────── */}
      <footer className="relative z-10 py-12 px-6 border-t border-white/5 bg-[#050510] text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-brand-500 flex items-center justify-center text-white">
              <Zap className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-white">BrandVoice AI</span>
            <span>— The Enterprise Consistency Platform</span>
          </div>

          <div className="flex items-center gap-6">
            <span className="cursor-pointer hover:text-white" onClick={() => navigate('/login')}>Sign In</span>
            <span className="cursor-pointer hover:text-white" onClick={() => navigate('/register')}>Register</span>
            <span className="cursor-pointer hover:text-white" onClick={() => navigate('/dashboard')}>Dashboard</span>
          </div>

          <p className="text-slate-500">© 2026 BrandVoice AI. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}


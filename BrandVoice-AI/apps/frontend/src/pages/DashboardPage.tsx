import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileText, CheckCircle, XCircle, TrendingUp,
  Megaphone, Sparkles, ArrowUpRight, Clock, Zap,
  Building2, ShieldCheck, ArrowRight,
} from 'lucide-react';
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import { cn, formatRelativeTime, getScoreColor, getStatusColor } from '@/lib/utils';
import { apiGet } from '@/lib/api';
import { useBrand } from '@/context/BrandContext';

// Framer Motion variants
const container = { hidden: {}, show: { transition: { staggerChildren: 0.07 } } };
const cardItem  = { hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0, transition: { duration: 0.35 } } };

// Recharts tooltip style
const tooltipStyle = {
  background: '#191c2b',
  border: '1px solid #2b2f42',
  borderRadius: '8px',
  color: '#e8edf6',
  fontSize: '12px',
};

const defaultPlatformColors: Record<string, string> = {
  INSTAGRAM: '#ec4899',
  LINKEDIN: '#3b82f6',
  EMAIL: '#10b981',
  BLOG: '#8b5cf6',
  TWITTER: '#6b7280',
  ECOMMERCE: '#f59e0b',
  REWRITE: '#14b8a6',
};

export function DashboardPage() {
  const navigate = useNavigate();
  const { activeBrand } = useBrand();

  const [userName, setUserName] = useState('Marketer');
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalContent: 0,
    approvedContent: 0,
    rejectedContent: 0,
    avgConsistencyScore: 0,
    activeCampaigns: 0,
    contentThisMonth: 0,
  });
  const [recentContent, setRecentContent] = useState<any[]>([]);
  const [platformDist, setPlatformDist] = useState<any[]>([]);

  // Load user name
  useEffect(() => {
    try {
      const stored = localStorage.getItem('brandvoice-user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) setUserName(u.name);
      }
    } catch (e) {}
  }, []);

  // Fetch real analytics scoped to active brand and organization
  useEffect(() => {
    setLoading(true);
    const params = activeBrand?.id ? { brandId: activeBrand.id } : undefined;
    apiGet<any>('/analytics/dashboard', params)
      .then((res) => {
        if (res?.kpis) {
          setStats(res.kpis);
        }
        if (Array.isArray(res?.recentContent)) {
          setRecentContent(res.recentContent);
        }
        if (Array.isArray(res?.platformDistribution) && res.platformDistribution.length > 0) {
          setPlatformDist(
            res.platformDistribution.map((p: any) => ({
              platform: p.platform,
              count: p.count,
              color: defaultPlatformColors[p.platform] || '#8b5cf6',
            }))
          );
        } else {
          setPlatformDist([]);
        }
      })
      .catch((err) => {
        console.warn('Dashboard stats fetch:', err.message);
      })
      .finally(() => setLoading(false));
  }, [activeBrand?.id]);

  const kpis = [
    {
      label: 'Total Content',
      value: stats.totalContent,
      icon: FileText,
      delta: stats.totalContent > 0 ? '+100%' : '0',
      color: 'text-blue-500',
      bg: 'bg-blue-500/10',
    },
    {
      label: 'Approved',
      value: stats.approvedContent,
      icon: CheckCircle,
      delta: stats.approvedContent > 0 ? '+100%' : '0',
      color: 'text-success-500',
      bg: 'bg-success-500/10',
    },
    {
      label: 'Rejected',
      value: stats.rejectedContent,
      icon: XCircle,
      delta: '0',
      color: 'text-danger-500',
      bg: 'bg-danger-500/10',
    },
    {
      label: 'Avg. Consistency',
      value: stats.avgConsistencyScore > 0 ? `${stats.avgConsistencyScore}%` : 'N/A',
      icon: TrendingUp,
      delta: stats.avgConsistencyScore >= 80 ? 'Optimal' : stats.avgConsistencyScore > 0 ? 'Improving' : '0',
      color: 'text-brand-500',
      bg: 'bg-brand-500/10',
    },
    {
      label: 'Active Campaigns',
      value: stats.activeCampaigns,
      icon: Megaphone,
      delta: stats.activeCampaigns > 0 ? `+${stats.activeCampaigns}` : '0',
      color: 'text-warning-500',
      bg: 'bg-warning-500/10',
    },
    {
      label: 'This Month',
      value: stats.contentThisMonth,
      icon: Sparkles,
      delta: stats.contentThisMonth > 0 ? '+100%' : '0',
      color: 'text-purple-500',
      bg: 'bg-purple-500/10',
    },
  ];

  // Placeholder weekly timeline data that scales with real totalContent
  const contentOverTime = [
    { date: 'Mon', count: Math.floor(stats.totalContent * 0.1) },
    { date: 'Tue', count: Math.floor(stats.totalContent * 0.15) },
    { date: 'Wed', count: Math.floor(stats.totalContent * 0.2) },
    { date: 'Thu', count: Math.floor(stats.totalContent * 0.15) },
    { date: 'Fri', count: Math.floor(stats.totalContent * 0.25) },
    { date: 'Sat', count: Math.floor(stats.totalContent * 0.05) },
    { date: 'Sun', count: Math.ceil(stats.totalContent * 0.1) },
  ];

  const scoresTrend = stats.avgConsistencyScore > 0
    ? [
        { date: 'Tone', score: Math.min(100, stats.avgConsistencyScore + 2) },
        { date: 'Vocab', score: stats.avgConsistencyScore },
        { date: 'Style', score: Math.max(60, stats.avgConsistencyScore - 4) },
        { date: 'Structure', score: Math.min(100, stats.avgConsistencyScore + 1) },
      ]
    : [];

  const isBrandNewUser = stats.totalContent === 0;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">
              Welcome back, {userName} 👋
            </h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {activeBrand ? `Active profile: ${activeBrand.name}` : 'Your brand identity, marketing workflows, and consistency metrics.'}
            </p>
          </div>
          <button
            onClick={() => navigate('/studio')}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors shadow-brand"
          >
            <Zap className="w-4 h-4" />
            Generate Content
          </button>
        </div>
      </motion.div>

      {/* ── New User Onboarding Checklist Banner (Shown when 0 content) ──────── */}
      {isBrandNewUser && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-5 rounded-2xl bg-gradient-to-r from-brand-500/15 via-purple-500/10 to-blue-500/10 border border-brand-500/30 space-y-3"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center text-white shadow-brand shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground">Getting Started with BrandVoice AI</h3>
              <p className="text-xs text-muted-foreground">
                Follow these three simple steps to start creating authentic, on-brand marketing content.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-1">
            <div
              onClick={() => navigate('/brand')}
              className="p-3.5 rounded-xl bg-card/80 border border-border hover:border-brand-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Step 1</span>
                <Building2 className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
              </div>
              <p className="text-xs font-bold text-foreground">Configure Brand Voice</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Crawl your website or define tones, writing principles, and vocabulary.
              </p>
            </div>

            <div
              onClick={() => navigate('/studio')}
              className="p-3.5 rounded-xl bg-card/80 border border-border hover:border-brand-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Step 2</span>
                <Zap className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
              </div>
              <p className="text-xs font-bold text-foreground">Generate Marketing Copy</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Enter any product or service and generate platform-tailored copy.
              </p>
            </div>

            <div
              onClick={() => navigate('/consistency')}
              className="p-3.5 rounded-xl bg-card/80 border border-border hover:border-brand-500/50 transition-all cursor-pointer group"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold text-brand-500 uppercase tracking-wider">Step 3</span>
                <ShieldCheck className="w-4 h-4 text-muted-foreground group-hover:text-brand-500 transition-colors" />
              </div>
              <p className="text-xs font-bold text-foreground">Audit Brand Consistency</p>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Audit copy across tone, vocabulary, style, and structure dimensions.
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* ── KPI Cards ───────────────────────────────────────────────────────── */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4"
      >
        {kpis.map((kpi) => (
          <motion.div
            key={kpi.label}
            variants={cardItem}
            className="bg-card border border-border rounded-2xl p-4 shadow-sm"
          >
            <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center mb-3', kpi.bg)}>
              <kpi.icon className={cn('w-4 h-4', kpi.color)} />
            </div>
            <div className="text-2xl font-bold text-foreground">{kpi.value}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{kpi.label}</div>
            <div className="flex items-center gap-1 mt-2">
              <ArrowUpRight className="w-3 h-3 text-success-500" />
              <span className="text-[11px] font-semibold text-success-500">{kpi.delta}</span>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* ── Charts Row ──────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-4">
        {/* Generation Volume Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="xl:col-span-2 bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-foreground text-sm">Content Activity</h2>
              <p className="text-xs text-muted-foreground">Weekly volume across all marketing channels</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <AreaChart data={contentOverTime} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} cursor={{ stroke: '#8b5cf6', strokeWidth: 1 }} />
              <Area type="monotone" dataKey="count" stroke="#8b5cf6" strokeWidth={2} fill="url(#areaGrad)" name="Content" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        {/* Platform Share Pie Chart */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm flex flex-col justify-between"
        >
          <div>
            <h2 className="font-bold text-foreground text-sm">Platform Distribution</h2>
            <p className="text-xs text-muted-foreground mb-3">Share by marketing channel</p>
          </div>

          {platformDist.length > 0 ? (
            <>
              <ResponsiveContainer width="100%" height={150}>
                <PieChart>
                  <Pie
                    data={platformDist}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={65}
                    paddingAngle={3}
                    dataKey="count"
                    nameKey="platform"
                  >
                    {platformDist.map((entry) => (
                      <Cell key={entry.platform} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={tooltipStyle} />
                </PieChart>
              </ResponsiveContainer>
              <div className="grid grid-cols-2 gap-1.5 mt-2">
                {platformDist.map((p) => (
                  <div key={p.platform} className="flex items-center gap-1.5 text-xs">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: p.color }} />
                    <span className="text-muted-foreground truncate">{p.platform}</span>
                    <span className="font-semibold text-foreground ml-auto">{p.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-10 text-center space-y-2">
              <p className="text-xs text-muted-foreground">No channels active yet</p>
              <button
                onClick={() => navigate('/studio')}
                className="text-xs text-brand-500 hover:text-brand-400 font-semibold"
              >
                Create your first post →
              </button>
            </div>
          )}
        </motion.div>
      </div>

      {/* ── Bottom Row: Score Breakdown & Recent Content ────────────────────── */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
        {/* Consistency Breakdown */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <h2 className="font-bold text-foreground text-sm mb-1">Consistency Score Health</h2>
          <p className="text-xs text-muted-foreground mb-4">Adherence to active brand guidelines</p>

          {scoresTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={scoresTrend} barSize={24} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tooltipStyle} />
                <Bar dataKey="score" fill="#8b5cf6" radius={4} name="Score" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="py-14 text-center space-y-2">
              <ShieldCheck className="w-8 h-8 text-muted-foreground mx-auto opacity-50" />
              <p className="text-xs text-muted-foreground">Run a consistency check to track your voice metrics</p>
              <button
                onClick={() => navigate('/consistency')}
                className="text-xs text-brand-500 hover:text-brand-400 font-semibold"
              >
                Go to Consistency Checker →
              </button>
            </div>
          )}
        </motion.div>

        {/* Real Recent Content */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-2xl p-5 shadow-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-foreground text-sm">Recent Brand Content</h2>
            <button
              onClick={() => navigate('/library')}
              className="text-xs text-brand-500 hover:text-brand-400 font-semibold transition-colors"
            >
              View all in Library →
            </button>
          </div>

          <div className="space-y-2.5">
            {recentContent.length > 0 ? (
              recentContent.map((c) => (
                <div
                  key={c.id}
                  onClick={() => navigate('/library')}
                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-accent/40 border border-transparent hover:border-border transition-colors cursor-pointer"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-foreground truncate">{c.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Clock className="w-3 h-3 text-muted-foreground" />
                      <span className="text-[10px] text-muted-foreground">{formatRelativeTime(c.time)}</span>
                      <span className="text-[10px] text-muted-foreground">•</span>
                      <span className="text-[10px] font-medium text-brand-500">{c.platform}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={cn('text-xs font-bold', getScoreColor(c.score))}>{c.score}%</span>
                    <span className={cn('px-2 py-0.5 rounded-full text-[10px] font-semibold border', getStatusColor(c.status))}>
                      {c.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="py-12 text-center space-y-2.5">
                <p className="text-xs text-muted-foreground">No recent content generated yet</p>
                <button
                  onClick={() => navigate('/studio')}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-500 text-white text-xs font-semibold shadow-brand hover:bg-brand-600 transition-colors"
                >
                  <Zap className="w-3.5 h-3.5" />
                  Generate Your First Post
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}

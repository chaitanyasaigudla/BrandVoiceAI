import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { useBrand } from '@/context/BrandContext';
import { apiGet } from '@/lib/api';
import {
  AreaChart, Area, BarChart, Bar, LineChart, Line,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';

const tooltipStyle = {
  background: '#1e1b4b',
  border: '1px solid #312e81',
  borderRadius: '8px',
  color: '#e0e7ff',
  fontSize: '12px',
};

const gridStroke = 'rgba(255,255,255,0.06)';
const tickStyle = { fontSize: 11, fill: '#94a3b8' };

export function AnalyticsPage() {
  const { activeBrand } = useBrand();
  const [monthly, setMonthly] = useState<Array<{ month: string; generated: number; approved: number; rejected: number }>>([]);
  const [scores, setScores] = useState<Array<{ week: string; score: number }>>([]);
  const [platforms, setPlatforms] = useState<Array<{ platform: string; count: number }>>([]);
  const [kpis, setKpis] = useState({ totalContent: 0, approvedContent: 0, rejectedContent: 0, avgConsistencyScore: 0, contentThisMonth: 0 });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const params = activeBrand?.id ? { brandId: activeBrand.id } : undefined;
    setError(null);
    Promise.all([
      apiGet<any>('/analytics/dashboard', params),
      apiGet<any>('/analytics/trends', params),
    ])
      .then(([dashboard, trends]) => {
        if (dashboard?.kpis) setKpis(dashboard.kpis);
        setMonthly(trends?.monthly || []);
        setScores(trends?.weeklyScores || []);
        setPlatforms(trends?.platforms || []);
      })
      .catch((err: Error) => setError(err.message));
  }, [activeBrand?.id]);

  const cards = [
    { label: 'Total content', value: kpis.totalContent },
    { label: 'Approved', value: kpis.approvedContent },
    { label: 'Rejected', value: kpis.rejectedContent },
    { label: 'This month', value: kpis.contentThisMonth },
    { label: 'Avg consistency', value: `${kpis.avgConsistencyScore}%` },
  ];

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl font-bold text-foreground">Analytics</h1>
        <p className="text-muted-foreground text-sm mt-0.5">
          Live counts for {activeBrand?.name || 'your brands'}
        </p>
      </motion.div>

      {error && <p className="text-sm text-danger-500">{error}</p>}

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {cards.map((card) => (
          <div key={card.label} className="bg-card border border-border rounded-xl p-4">
            <p className="text-xs text-muted-foreground">{card.label}</p>
            <p className="text-2xl font-bold text-foreground mt-1">{card.value}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-1">Content generation</h2>
          <p className="text-xs text-muted-foreground mb-4">Last six months from saved content</p>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={monthly} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="month" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: '11px' }} />
              <Area type="monotone" dataKey="generated" stroke="#8b5cf6" fill="#8b5cf633" strokeWidth={2} name="Generated" />
              <Area type="monotone" dataKey="approved" stroke="#10b981" fill="#10b98133" strokeWidth={2} name="Approved" />
              <Area type="monotone" dataKey="rejected" stroke="#ef4444" fill="none" strokeWidth={1.5} name="Rejected" />
            </AreaChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-1">Consistency score trend</h2>
          <p className="text-xs text-muted-foreground mb-4">Average score by week</p>
          <ResponsiveContainer width="100%" height={240}>
            <LineChart data={scores.length ? scores : [{ week: '—', score: 0 }]} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="week" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Line type="monotone" dataKey="score" stroke="#8b5cf6" strokeWidth={2.5} dot={{ r: 3 }} name="Avg score" />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="xl:col-span-2 bg-card border border-border rounded-xl p-5">
          <h2 className="font-semibold text-foreground mb-1">Platform distribution</h2>
          <p className="text-xs text-muted-foreground mb-4">Content saved in the last six months</p>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={platforms} barSize={18} margin={{ top: 4, right: 4, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={gridStroke} />
              <XAxis dataKey="platform" tick={tickStyle} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={tickStyle} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill="#8b5cf6" radius={3} name="Pieces" />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      </div>
    </div>
  );
}

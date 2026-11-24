import { motion } from 'framer-motion';
import { Megaphone, Plus, Target, CalendarDays, FileText, TrendingUp } from 'lucide-react';
import { cn, formatDate } from '@/lib/utils';

const campaigns = [
  { id: '1', name: 'Q4 Product Launch', objective: 'Product awareness and trial sign-ups', audience: 'Operations managers at mid-market', contentCount: 18, startDate: '2026-10-01', endDate: '2026-12-31', isActive: true, avgScore: 86 },
  { id: '2', name: 'Black Friday Sale',  objective: 'Drive conversions and upgrade existing users', audience: 'Existing free-plan users', contentCount: 12, startDate: '2026-11-20', endDate: '2026-11-30', isActive: true, avgScore: 79 },
  { id: '3', name: 'Thought Leadership', objective: 'Build brand authority on LinkedIn', audience: 'CTOs and VP Engineering', contentCount: 24, startDate: '2026-09-01', endDate: '2026-12-31', isActive: true, avgScore: 91 },
  { id: '4', name: 'Summer Webinar Series', objective: 'Lead generation via educational content', audience: 'Marketing professionals', contentCount: 9, startDate: '2026-06-01', endDate: '2026-08-31', isActive: false, avgScore: 83 },
];

export function CampaignsPage() {
  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Campaigns</h1>
            <p className="text-muted-foreground text-sm mt-0.5">Organize and track your content campaigns</p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors shadow-brand">
            <Plus className="w-4 h-4" /> New Campaign
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {campaigns.map((campaign, i) => (
          <motion.div key={campaign.id}
            initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card border border-border rounded-xl p-5 card-interactive cursor-pointer">

            <div className="flex items-start justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500/20 to-blue-500/20 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-brand-500" />
              </div>
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium',
                campaign.isActive ? 'bg-success-500/10 text-success-600' : 'bg-muted text-muted-foreground')}>
                {campaign.isActive ? 'Active' : 'Ended'}
              </span>
            </div>

            <h3 className="font-semibold text-foreground mb-1">{campaign.name}</h3>

            <div className="space-y-2 mt-3">
              <div className="flex items-start gap-2">
                <Target className="w-3.5 h-3.5 text-muted-foreground mt-0.5 shrink-0" />
                <p className="text-xs text-muted-foreground line-clamp-2">{campaign.objective}</p>
              </div>
              <div className="flex items-center gap-2">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                <p className="text-xs text-muted-foreground">{formatDate(campaign.startDate)} → {formatDate(campaign.endDate)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
              <div className="flex items-center gap-1.5 text-sm">
                <FileText className="w-3.5 h-3.5 text-muted-foreground" />
                <span className="text-muted-foreground">{campaign.contentCount} pieces</span>
              </div>
              <div className="flex items-center gap-1.5 text-sm">
                <TrendingUp className="w-3.5 h-3.5 text-brand-500" />
                <span className="font-bold text-brand-500">{campaign.avgScore} avg</span>
              </div>
            </div>
          </motion.div>
        ))}

        {/* Add new campaign placeholder */}
        <motion.button
          initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: campaigns.length * 0.08 }}
          className="bg-card border-2 border-dashed border-border rounded-xl p-5 flex flex-col items-center justify-center gap-3 hover:border-brand-500/50 hover:bg-brand-500/5 transition-colors min-h-[220px]">
          <div className="w-10 h-10 rounded-full bg-brand-500/10 flex items-center justify-center">
            <Plus className="w-5 h-5 text-brand-500" />
          </div>
          <div className="text-center">
            <p className="font-medium text-foreground">New Campaign</p>
            <p className="text-xs text-muted-foreground mt-0.5">Group content by campaign objective</p>
          </div>
        </motion.button>
      </div>
    </div>
  );
}

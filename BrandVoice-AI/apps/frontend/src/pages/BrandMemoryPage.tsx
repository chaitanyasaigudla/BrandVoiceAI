import { motion } from 'framer-motion';
import { useState, useEffect, useCallback } from 'react';
import { Brain, CheckCircle, XCircle, Star, Clock, Search, SlidersHorizontal, Loader2 } from 'lucide-react';
import { cn, formatRelativeTime } from '@/lib/utils';
import { apiGet, apiPost } from '@/lib/api';
import { useBrand } from '@/context/BrandContext';

const tabs = ['All', 'Approved', 'Rejected', 'Preferences', 'Search'];

interface MemoryItem {
  id: string;
  content: string;
  type: string;
  platform?: string;
  createdAt: string;
  similarity?: number;
}

export function BrandMemoryPage() {
  const { activeBrand } = useBrand();
  const [activeTab, setActiveTab] = useState('All');
  const [query, setQuery] = useState('');
  const [records, setRecords] = useState<MemoryItem[]>([]);
  const [searchResults, setSearchResults] = useState<MemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [searching, setSearching] = useState(false);
  const [counts, setCounts] = useState({ approved: 0, rejected: 0, total: 0 });

  const fetchRecords = useCallback(async (type?: string) => {
    setLoading(true);
    try {
      const params: Record<string, any> = { limit: 50 };
      if (activeBrand?.id) params.brandId = activeBrand.id;
      if (type && type !== 'All') params.type = type.toLowerCase();
      const data: any = await apiGet('/memory', params);
      const items: MemoryItem[] = Array.isArray(data) ? data : [];
      setRecords(items);
      if (!type || type === 'All') {
        setCounts({
          total: items.length,
          approved: items.filter((i) => i.type === 'approved').length,
          rejected: items.filter((i) => i.type === 'rejected').length,
        });
      }
    } catch (e: any) {
      console.warn('Memory fetch failed:', e.message);
    } finally {
      setLoading(false);
    }
  }, [activeBrand?.id]);

  useEffect(() => {
    const type = activeTab === 'Search' || activeTab === 'Preferences' ? 'All' : activeTab;
    fetchRecords(type);
  }, [activeTab, fetchRecords]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    setSearching(true);
    setActiveTab('Search');
    try {
      const params: any = { query: query.trim() };
      if (activeBrand?.id) params.brandId = activeBrand.id;
      const data: any = await apiPost('/memory/search', params);
      setSearchResults(Array.isArray(data) ? data : []);
    } catch (e: any) {
      console.warn('Semantic search failed:', e.message);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const preferences = activeBrand?.preferences?.[0];
  const guideline = activeBrand?.guidelines?.[0];

  const prefCards = [
    { key: 'Preferred Tone', value: guideline?.toneOfVoice || 'Professional, approachable' },
    { key: 'Writing Principles', value: guideline?.writingPrinciples || 'Lead with value. Punchy active voice.' },
    { key: 'Preferred Vocabulary', value: guideline?.preferredVocabulary?.join(', ') || 'empower, streamline, scale' },
    { key: 'Prohibited Vocabulary', value: guideline?.prohibitedVocabulary?.join(', ') || 'cheap, basic, just' },
    { key: 'Professional', value: preferences?.professional ? `${preferences.professional}%` : '65%' },
    { key: 'Friendly', value: preferences?.friendly ? `${preferences.friendly}%` : '70%' },
  ];

  const displayItems = activeTab === 'Search' ? searchResults : records;

  return (
    <div className="p-6 space-y-6 max-w-screen-xl mx-auto">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center">
              <Brain className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">Brand Memory</h1>
              <p className="text-muted-foreground text-sm">Persistent knowledge powering your AI generations</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5 text-success-500" /> {counts.approved} approved</span>
            <span className="flex items-center gap-1.5"><XCircle className="w-3.5 h-3.5 text-danger-500" /> {counts.rejected} rejected</span>
          </div>
        </div>
      </motion.div>

      {/* Search bar */}
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={query} onChange={e => setQuery(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
            placeholder="Semantic search across memory…"
            className="w-full pl-9 pr-4 py-2.5 rounded-lg border border-input bg-background text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" />
        </div>
        <button onClick={handleSearch} disabled={searching || !query.trim()}
          className="flex items-center gap-2 px-4 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-sm font-medium transition-colors">
          {searching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          Search
        </button>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border">
        {tabs.map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={cn('px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
              activeTab === tab
                ? 'border-brand-500 text-brand-500'
                : 'border-transparent text-muted-foreground hover:text-foreground')}>
            {tab}
          </button>
        ))}
      </div>

      {/* Content */}
      <motion.div key={activeTab} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}>
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-brand-500" />
          </div>
        )}

        {!loading && activeTab === 'Preferences' && (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {prefCards.map(pref => (
              <div key={pref.key} className="bg-card border border-border rounded-xl p-4">
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">{pref.key}</p>
                <p className="text-sm text-foreground font-medium">{pref.value}</p>
              </div>
            ))}
          </div>
        )}

        {!loading && activeTab !== 'Preferences' && displayItems.length === 0 && (
          <div className="text-center py-16">
            <Brain className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
            <p className="text-sm text-muted-foreground">
              {activeTab === 'Search' ? 'No semantic matches found. Try a different query.' : 'No memory records yet. Generate and approve content to build brand memory.'}
            </p>
          </div>
        )}

        {!loading && activeTab !== 'Preferences' && displayItems.length > 0 && (
          <div className="space-y-3">
            {displayItems.map(item => (
              <div key={item.id} className={cn(
                'bg-card border rounded-xl p-5 card-interactive',
                item.type === 'rejected' ? 'border-danger-500/20' : 'border-border'
              )}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-foreground leading-relaxed line-clamp-3">{item.content}</p>
                    <div className="flex items-center gap-3 mt-3">
                      {item.platform && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 font-medium">{item.platform}</span>
                      )}
                      <span className={cn(
                        'text-xs px-2 py-0.5 rounded-full font-medium',
                        item.type === 'approved' ? 'bg-success-500/10 text-success-500' :
                        item.type === 'rejected' ? 'bg-danger-500/10 text-danger-500' :
                        'bg-blue-500/10 text-blue-500'
                      )}>{item.type}</span>
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="w-3 h-3" /> {formatRelativeTime(item.createdAt)}
                      </span>
                      {item.similarity != null && (
                        <span className="text-xs font-medium text-brand-500">
                          <Star className="w-3 h-3 inline mr-0.5" />
                          {Math.round(item.similarity * 100)}% match
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {item.type === 'approved' && <CheckCircle className="w-5 h-5 text-success-500" />}
                    {item.type === 'rejected' && <XCircle className="w-5 h-5 text-danger-500" />}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

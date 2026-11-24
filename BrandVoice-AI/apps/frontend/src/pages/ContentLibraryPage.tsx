import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search, Filter, Instagram, Linkedin, Mail, FileText, Twitter, ShoppingBag,
  CheckCircle, XCircle, Sparkles, Copy, Check, ExternalLink, Building2,
  Calendar, ShieldCheck, Tag, Zap, RefreshCw,
} from 'lucide-react';
import { cn, formatDate, getStatusColor, getScoreColor } from '@/lib/utils';
import { apiGet, apiPatch, apiPut, apiDelete } from '@/lib/api';
import { useBrand } from '@/context/BrandContext';

const platformIcon: Record<string, typeof Instagram> = {
  INSTAGRAM: Instagram,
  LINKEDIN: Linkedin,
  EMAIL: Mail,
  BLOG: FileText,
  TWITTER: Twitter,
  ECOMMERCE: ShoppingBag,
};

const statuses = ['All', 'DRAFT', 'GENERATED', 'IN_REVIEW', 'APPROVED', 'REJECTED'];
const platforms = ['All', 'INSTAGRAM', 'LINKEDIN', 'EMAIL', 'BLOG', 'TWITTER', 'ECOMMERCE'];

export function ContentLibraryPage() {
  const navigate = useNavigate();
  const { brands, activeBrand } = useBrand();

  const [contentList, setContentList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [platformFilter, setPlatformFilter] = useState('All');
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>('active');
  const [selectedItem, setSelectedItem] = useState<any | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleEdit = () => {
    if (!selectedItem) return;
    setEditingContent(selectedItem.content);
    setIsEditing(true);
  };

  const handleSaveEdit = async () => {
    if (!selectedItem) return;
    setIsSaving(true);
    try {
      await apiPut(`/content/${selectedItem.id}`, { content: editingContent, title: selectedItem.title });
      setIsEditing(false);
      fetchContent();
      setSelectedItem({ ...selectedItem, content: editingContent });
    } catch (e: any) {
      console.error('Save edit failed:', e.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this content?')) return;
    try {
      await apiDelete(`/content/${id}`);
      setSelectedItem(null);
      fetchContent();
    } catch (e: any) {
      console.error('Delete failed:', e.message);
    }
  };

  const fetchContent = () => {
    setLoading(true);
    const params: Record<string, any> = {};
    if (selectedBrandFilter === 'active' && activeBrand?.id) {
      params.brandId = activeBrand.id;
    } else if (selectedBrandFilter !== 'all' && selectedBrandFilter !== 'active') {
      params.brandId = selectedBrandFilter;
    }

    apiGet<any>('/content', params)
      .then((res) => {
        if (res?.items) {
          setContentList(
            res.items.map((i: any) => ({
              id: i.id,
              title: i.title || `${i.platform} Post`,
              platform: i.platform,
              contentType: i.contentType,
              status: i.status,
              score: i.consistencyScore || 85,
              campaign: i.metadata?.campaign || 'Product Campaign',
              date: i.createdAt,
              content: i.content,
              headline: i.metadata?.headline || '',
              keyBenefits: Array.isArray(i.metadata?.keyBenefits) ? i.metadata.keyBenefits : [],
              cta: i.metadata?.cta || '',
              hashtags: Array.isArray(i.metadata?.hashtags) ? i.metadata.hashtags : [],
              brandId: i.brandId,
            }))
          );
        }
      })
      .catch((err) => console.log('Content list fetch:', err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchContent();
  }, [selectedBrandFilter, activeBrand?.id]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    try {
      await apiPatch(`/content/${id}/status`, { status: newStatus });
      fetchContent();
      if (selectedItem?.id === id) {
        setSelectedItem({ ...selectedItem, status: newStatus });
      }
    } catch (e: any) {
      console.error('Update status failed:', e);
    }
  };

  const handleCopyText = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filtered = contentList.filter((c) => {
    const matchStatus = statusFilter === 'All' || c.status === statusFilter;
    const matchPlatform = platformFilter === 'All' || c.platform === platformFilter;
    const matchSearch =
      !search ||
      (c.title || '').toLowerCase().includes(search.toLowerCase()) ||
      (c.content || '').toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchPlatform && matchSearch;
  });

  return (
    <div className="p-6 space-y-5 max-w-screen-xl mx-auto">
      {/* ── Header ──────────────────────────────────────────────────────────── */}
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Content Library</h1>
            <p className="text-muted-foreground text-sm mt-0.5">
              {contentList.length} marketing assets generated & aligned with your brand guidelines.
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Brand Filter Dropdown */}
            {brands.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-card text-xs">
                <Building2 className="w-3.5 h-3.5 text-brand-500 shrink-0" />
                <select
                  value={selectedBrandFilter}
                  onChange={(e) => setSelectedBrandFilter(e.target.value)}
                  className="bg-transparent text-xs font-semibold text-foreground focus:outline-none cursor-pointer"
                >
                  <option value="active" className="bg-card text-foreground">
                    Active: {activeBrand?.name || 'Current'}
                  </option>
                  <option value="all" className="bg-card text-foreground">
                    All My Brands ({brands.length})
                  </option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.id} className="bg-card text-foreground">
                      {b.name}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              onClick={() => fetchContent()}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border hover:bg-accent text-xs font-medium transition-colors"
            >
              <RefreshCw className={cn('w-3.5 h-3.5', loading && 'animate-spin')} />
              <span>Refresh</span>
            </button>

            <button
              onClick={() => navigate('/studio')}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold transition-colors shadow-brand"
            >
              <Zap className="w-3.5 h-3.5" />
              <span>Create Copy</span>
            </button>
          </div>
        </div>
      </motion.div>

      {/* ── Filters Bar ─────────────────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center"
      >
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by product, headline, or keywords…"
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-border bg-background text-xs text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </div>

        {/* Status filters */}
        <div className="flex gap-1.5 flex-wrap items-center">
          <span className="text-[11px] font-semibold text-muted-foreground uppercase mr-1">Status:</span>
          {statuses.map((s) => (
            <button
              key={s}
              onClick={() => setStatusFilter(s)}
              className={cn(
                'px-2.5 py-1 rounded-lg text-xs font-medium transition-colors',
                statusFilter === s
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-muted/50 text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              {s === 'All' ? 'All' : s.replace('_', ' ')}
            </button>
          ))}
        </div>
      </motion.div>

      {/* ── Platform Tabs ───────────────────────────────────────────────────── */}
      <div className="flex gap-1.5 border-b border-border overflow-x-auto pb-1">
        {platforms.map((p) => (
          <button
            key={p}
            onClick={() => setPlatformFilter(p)}
            className={cn(
              'px-3 py-1.5 text-xs font-semibold rounded-lg transition-all shrink-0',
              platformFilter === p
                ? 'bg-brand-500/10 text-brand-500 font-bold border border-brand-500/20'
                : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
            )}
          >
            {p === 'All' ? 'All Channels' : p}
          </button>
        ))}
      </div>

      {/* ── Table of Content Items ─────────────────────────────────────────── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm"
      >
        <table className="w-full text-left">
          <thead>
            <tr className="border-b border-border bg-muted/20">
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Product & Copy Headline
              </th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden md:table-cell">
                Platform
              </th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden sm:table-cell">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Consistency
              </th>
              <th className="px-4 py-3 text-xs font-bold text-muted-foreground uppercase tracking-wider hidden xl:table-cell">
                Generated
              </th>
              <th className="px-4 py-3 text-right text-xs font-bold text-muted-foreground uppercase">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((item, i) => {
              const Icon = platformIcon[item.platform] ?? FileText;
              return (
                <tr
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="hover:bg-accent/40 transition-colors cursor-pointer group"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center shrink-0">
                        <Icon className="w-4 h-4 text-brand-500" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-brand-500 transition-colors truncate max-w-sm">
                          {item.title}
                        </p>
                        <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                          {item.content}
                        </p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs font-medium text-muted-foreground">{item.platform}</span>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={cn('px-2.5 py-0.5 rounded-full text-[11px] font-semibold border', getStatusColor(item.status))}>
                      {item.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={cn('text-xs font-bold', getScoreColor(item.score))}>
                      {item.score}%
                    </span>
                  </td>
                  <td className="px-4 py-3 hidden xl:table-cell">
                    <span className="text-xs text-muted-foreground">{formatDate(item.date)}</span>
                  </td>
                  <td className="px-4 py-3 text-right" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleCopyText(item.content, item.id)}
                        className="p-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        title="Copy content"
                      >
                        {copiedId === item.id ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(item.id, 'APPROVED')}
                        title="Approve"
                        className={cn(
                          'p-1.5 rounded-lg border transition-colors',
                          item.status === 'APPROVED'
                            ? 'bg-success-500/10 text-success-500 border-success-500/20'
                            : 'border-border text-muted-foreground hover:text-success-500 hover:bg-success-500/10'
                        )}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Empty state */}
        {filtered.length === 0 && (
          <div className="py-16 text-center space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-brand-500/10 flex items-center justify-center text-brand-500 mx-auto">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <p className="font-bold text-foreground text-sm">No content found</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                You haven't generated any content matching this filter yet. Create your first marketing copy in the AI Content Studio!
              </p>
            </div>
            <button
              onClick={() => navigate('/studio')}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 text-white text-xs font-semibold shadow-brand transition-colors"
            >
              <Zap className="w-3.5 h-3.5" />
              Generate Content in Studio
            </button>
          </div>
        )}
      </motion.div>

      {/* ── Content Detail Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {selectedItem && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setSelectedItem(null)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl max-w-xl w-full p-6 space-y-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between pb-3 border-b border-border">
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedItem.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-medium text-brand-500">{selectedItem.platform}</span>
                    <span className="text-muted-foreground">•</span>
                    <span className={cn('text-xs font-bold', getScoreColor(selectedItem.score))}>
                      Brand Score: {selectedItem.score}%
                    </span>
                  </div>
                </div>
                <span className={cn('px-2.5 py-1 rounded-full text-xs font-semibold border', getStatusColor(selectedItem.status))}>
                  {selectedItem.status}
                </span>
              </div>

              {/* Structured Breakdown if available */}
              {selectedItem.headline && (
                <div className="p-3 rounded-xl bg-muted/30 border border-border">
                  <p className="text-[10px] font-bold text-brand-500 uppercase tracking-wider mb-0.5">Headline</p>
                  <p className="text-xs font-bold text-foreground">{selectedItem.headline}</p>
                </div>
              )}

              {/* Main Copy */}
              <div className="space-y-1">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Marketing Copy</p>
                <div className="bg-muted/40 p-3.5 rounded-xl text-xs text-foreground whitespace-pre-wrap font-sans leading-relaxed max-h-64 overflow-y-auto border border-border">
                  {selectedItem.content}
                </div>
              </div>

              {/* Call to action & hashtags */}
              <div className="flex flex-wrap gap-2 items-center justify-between pt-1">
                {selectedItem.cta && (
                  <span className="text-xs px-2.5 py-1 rounded-lg bg-brand-500 text-white font-semibold">
                    CTA: {selectedItem.cta}
                  </span>
                )}
                {selectedItem.hashtags?.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedItem.hashtags.map((h: string) => (
                      <span key={h} className="text-[10px] px-2 py-0.5 rounded bg-brand-500/10 text-brand-500 font-medium">
                        {h}
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Editable area */}
              {isEditing ? (
                <div className="space-y-3">
                  <textarea
                    value={editingContent}
                    onChange={(e) => setEditingContent(e.target.value)}
                    rows={8}
                    className="w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground resize-y focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                  <div className="flex gap-2 justify-end">
                    <button onClick={() => setIsEditing(false)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg border border-border hover:bg-accent transition-colors">
                      Cancel
                    </button>
                    <button onClick={handleSaveEdit} disabled={isSaving}
                      className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-brand-500 text-white hover:bg-brand-600 disabled:opacity-50 transition-colors">
                      {isSaving ? 'Saving…' : 'Save Changes'}
                    </button>
                  </div>
                </div>
              ) : null}

              {/* Actions */}
              <div className="flex flex-wrap gap-2 justify-end pt-3 border-t border-border">
                <button
                  onClick={() => handleCopyText(selectedItem.content, selectedItem.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-border hover:bg-accent transition-colors"
                >
                  {copiedId === selectedItem.id ? <Check className="w-3.5 h-3.5 text-success-500" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedId === selectedItem.id ? 'Copied!' : 'Copy'}
                </button>
                {!isEditing && (
                  <button
                    onClick={handleEdit}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-border hover:bg-accent transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5" /> Edit
                  </button>
                )}
                {selectedItem.status !== 'REJECTED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedItem.id, 'REJECTED')}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-danger-500/30 text-danger-500 hover:bg-danger-500/10 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                )}
                <button
                  onClick={() => handleDelete(selectedItem.id)}
                  className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium rounded-xl border border-danger-500/30 text-danger-500 hover:bg-danger-500/10 transition-colors"
                >
                  Delete
                </button>
                {selectedItem.status !== 'APPROVED' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedItem.id, 'APPROVED')}
                    className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl bg-success-500 text-white hover:bg-success-600 transition-colors shadow-sm"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                )}
                <button
                  onClick={() => setSelectedItem(null)}
                  className="px-4 py-2 text-xs font-semibold rounded-xl bg-brand-500 text-white hover:bg-brand-600 transition-colors shadow-brand"
                >
                  Done
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

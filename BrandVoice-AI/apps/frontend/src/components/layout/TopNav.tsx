import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell, Search, Sun, Moon, ChevronDown, Check,
  Plus, Settings, Building2, Zap, Globe, Sparkles, Loader2,
  User, LogOut,
} from 'lucide-react';
import { toggleTheme, getTheme } from '@/hooks/useTheme';
import { cn } from '@/lib/utils';
import { useBrand } from '@/context/BrandContext';
import { apiGet, apiPost } from '@/lib/api';
import { AnimatePresence, motion } from 'framer-motion';

export function TopNav() {
  const navigate = useNavigate();
  const [theme, setTheme] = useState<'light' | 'dark'>(getTheme());
  const { brands, activeBrand, switchBrand, createBrand, isLoading } = useBrand();

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [currentUser, setCurrentUser] = useState<{ name: string; email: string; organizationName?: string }>({
    name: 'User',
    email: '',
  });

  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newBrandName, setNewBrandName] = useState('');
  const [newBrandUrl, setNewBrandUrl] = useState('');
  const [newBrandIndustry, setNewBrandIndustry] = useState('E-Commerce / Consumer Goods');
  const [isCreating, setIsCreating] = useState(false);

  const dropdownRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  // Load current user profile from storage and /auth/me
  useEffect(() => {
    try {
      const stored = localStorage.getItem('brandvoice-user');
      if (stored) {
        const u = JSON.parse(stored);
        if (u.name) setCurrentUser(u);
      }
    } catch (e) {}

    apiGet('/auth/me')
      .then((res: any) => {
        if (res?.user) {
          setCurrentUser({
            name: res.user.name || 'User',
            email: res.user.email || '',
            organizationName: res.user.organization?.name,
          });
        }
      })
      .catch(() => {});
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleToggle = () => {
    const next = toggleTheme();
    setTheme(next);
  };

  const handleSignOut = async () => {
    try {
      await apiPost('/auth/logout');
    } catch {
      // ignore errors
    }
    localStorage.removeItem('brandvoice-token');
    localStorage.removeItem('brandvoice-user');
    localStorage.removeItem('brandvoice_active_brand_id');
    window.dispatchEvent(new Event('auth-change'));
    window.location.href = '/login';
  };

  const handleSelectBrand = (id: string) => {
    switchBrand(id);
    setDropdownOpen(false);
  };

  const handleCreateNewBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName.trim()) return;
    setIsCreating(true);
    try {
      await createBrand({
        name: newBrandName.trim(),
        websiteUrl: newBrandUrl.trim() || undefined,
        industry: newBrandIndustry,
        description: `${newBrandName.trim()} brand voice and multi-channel marketing content.`,
      });
      setShowCreateModal(false);
      setNewBrandName('');
      setNewBrandUrl('');
      setDropdownOpen(false);
    } catch (err: any) {
      console.error('Failed to create brand:', err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const brandDisplayName = activeBrand?.name || currentUser.organizationName || 'My Brand';
  const brandInitial = brandDisplayName.charAt(0).toUpperCase();

  const userInitials = (currentUser.name || 'User')
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'U';

  return (
    <>
      <header className="h-16 border-b border-border bg-background/90 backdrop-blur-md flex items-center px-4 sm:px-6 gap-3 shrink-0 z-20 sticky top-0">
        {/* ── Brand Switcher Dropdown Trigger ───────────────────────────── */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setDropdownOpen(!dropdownOpen)}
            className={cn(
              'flex items-center gap-2.5 px-3 py-1.5 rounded-xl border border-border transition-all text-sm font-medium',
              dropdownOpen ? 'bg-accent border-brand-500/50 ring-2 ring-brand-500/20' : 'bg-card/70 hover:bg-accent'
            )}
          >
            <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-brand shrink-0">
              {brandInitial}
            </div>
            <div className="flex flex-col text-left max-w-[130px] sm:max-w-[180px]">
              <span className="truncate text-xs sm:text-sm font-semibold text-foreground leading-tight">
                {brandDisplayName}
              </span>
              <span className="truncate text-[10px] text-muted-foreground hidden sm:inline">
                {activeBrand?.industry || 'Brand Profile'}
              </span>
            </div>
            <ChevronDown
              className={cn('w-3.5 h-3.5 text-muted-foreground transition-transform ml-1', dropdownOpen && 'rotate-180')}
            />
          </button>

          {/* ── Dropdown Menu ─────────────────────────────────────────── */}
          <AnimatePresence>
            {dropdownOpen && (
              <motion.div
                initial={{ opacity: 0, y: 6, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.98 }}
                transition={{ duration: 0.15 }}
                className="absolute left-0 top-full mt-2 w-72 rounded-2xl bg-card border border-border shadow-xl p-2 z-50 overflow-hidden"
              >
                <div className="px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  Available Brands ({brands.length})
                </div>

                <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                  {brands.map((b) => {
                    const isActive = b.id === activeBrand?.id;
                    const initial = (b.name || 'B').charAt(0).toUpperCase();

                    return (
                      <button
                        key={b.id}
                        onClick={() => handleSelectBrand(b.id)}
                        className={cn(
                          'w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-colors text-xs',
                          isActive ? 'bg-brand-500/10 text-brand-500 font-semibold' : 'hover:bg-muted text-foreground'
                        )}
                      >
                        <div
                          className={cn(
                            'w-7 h-7 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                            isActive ? 'bg-brand-500 text-white' : 'bg-muted text-muted-foreground border border-border'
                          )}
                        >
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="truncate font-medium">{b.name}</p>
                          <p className="truncate text-[10px] text-muted-foreground">
                            {b.industry || b.websiteUrl || 'Brand Profile'}
                          </p>
                        </div>
                        {isActive && <Check className="w-4 h-4 text-brand-500 shrink-0" />}
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2 mt-1 border-t border-border space-y-1">
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setShowCreateModal(true);
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-brand-500 hover:bg-brand-500/10 transition-colors"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Create New Brand</span>
                  </button>

                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      navigate('/brand');
                    }}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    <span>Manage All Brands</span>
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* ── Search Bar ──────────────────────────────────────────────── */}
        <div className="flex-1 max-w-md hidden md:flex">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder={`Search ${brandDisplayName} content, campaigns, guidelines…`}
              className={cn(
                'w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-border',
                'bg-muted/40 text-foreground placeholder:text-muted-foreground',
                'focus:outline-none focus:ring-2 focus:ring-brand-500/40',
                'transition-colors'
              )}
            />
          </div>
        </div>

        <div className="flex-1 md:hidden" />

        {/* ── Right Actions ───────────────────────────────────────────── */}
        <div className="flex items-center gap-1.5">
          {/* Active Voice Pill */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-500 text-xs font-medium">
            <div className="w-1.5 h-1.5 rounded-full bg-brand-500 animate-pulse" />
            <span className="truncate max-w-[140px]">{brandDisplayName} Active</span>
          </div>

          {/* Theme toggle */}
          <button
            onClick={handleToggle}
            className="p-2 rounded-xl hover:bg-accent transition-colors"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-muted-foreground" /> : <Moon className="w-4 h-4 text-muted-foreground" />}
          </button>

          {/* User Profile Menu */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(!userMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-xl hover:bg-accent transition-colors focus:outline-none"
              title={currentUser.name}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-brand-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-sm">
                {userInitials}
              </div>
            </button>

            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 6, scale: 0.98 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 4, scale: 0.98 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-64 rounded-2xl bg-card border border-border shadow-2xl p-2 z-50 overflow-hidden"
                >
                  <div className="px-3 py-2 border-b border-border mb-1">
                    <p className="text-xs font-bold text-foreground truncate">{currentUser.name}</p>
                    <p className="text-[11px] text-muted-foreground truncate">{currentUser.email || 'Authenticated User'}</p>
                    {currentUser.organizationName && (
                      <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full bg-brand-500/10 text-brand-500 font-medium">
                        {currentUser.organizationName}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      navigate('/settings');
                    }}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors text-left"
                  >
                    <Settings className="w-3.5 h-3.5 text-muted-foreground" />
                    <span>Workspace Settings</span>
                  </button>

                  <button
                    onClick={handleSignOut}
                    className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium text-danger-500 hover:bg-danger-500/10 transition-colors text-left"
                  >
                    <LogOut className="w-3.5 h-3.5 text-danger-500" />
                    <span>Sign Out</span>
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </header>

      {/* ── Create Brand Modal ────────────────────────────────────────────── */}
      <AnimatePresence>
        {showCreateModal && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-card border border-border rounded-2xl p-6 max-w-md w-full space-y-4 shadow-2xl"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-500/10 flex items-center justify-center text-brand-500">
                  <Building2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-foreground">Create New Brand</h3>
                  <p className="text-xs text-muted-foreground">Add a new company profile to your workspace</p>
                </div>
              </div>

              <form onSubmit={handleCreateNewBrand} className="space-y-3.5">
                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1">
                    Company / Brand Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={newBrandName}
                    onChange={(e) => setNewBrandName(e.target.value)}
                    placeholder="e.g. Roadster, Amazon, Nike"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1">
                    Website URL
                  </label>
                  <input
                    type="text"
                    value={newBrandUrl}
                    onChange={(e) => setNewBrandUrl(e.target.value)}
                    placeholder="e.g. https://aboutamazon.com"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-foreground uppercase tracking-wide block mb-1">
                    Industry
                  </label>
                  <input
                    type="text"
                    value={newBrandIndustry}
                    onChange={(e) => setNewBrandIndustry(e.target.value)}
                    placeholder="e.g. Automotive, Fashion, E-Commerce, SaaS"
                    className="w-full px-3 py-2 rounded-xl bg-background border border-border text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setShowCreateModal(false)}
                    className="px-4 py-2 rounded-xl border border-border text-xs font-medium text-muted-foreground hover:bg-accent transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newBrandName.trim()}
                    className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-500 hover:bg-brand-600 disabled:opacity-50 text-white text-xs font-medium transition-colors shadow-brand"
                  >
                    {isCreating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                    Create & Switch
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}

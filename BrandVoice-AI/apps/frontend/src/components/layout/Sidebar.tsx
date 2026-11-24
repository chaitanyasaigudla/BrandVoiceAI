import { NavLink, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import {
  LayoutDashboard, Sparkles, Brain, ShieldCheck,
  Library, Megaphone, BarChart3, Settings, Zap,
  ChevronLeft, ChevronRight, Building2,
} from 'lucide-react';
import { useState } from 'react';
import { useBrand } from '@/context/BrandContext';

const navItems = [
  { icon: LayoutDashboard, label: 'Overview',           path: '/dashboard' },
  { icon: Building2,       label: 'Brand Profile',      path: '/brand' },
  { icon: Sparkles,        label: 'AI Content Studio',  path: '/studio' },
  { icon: Brain,           label: 'Brand Memory',       path: '/memory' },
  { icon: ShieldCheck,     label: 'Consistency Checker',path: '/consistency' },
  { icon: Library,         label: 'Content Library',    path: '/library' },
  { icon: Megaphone,       label: 'Campaigns',          path: '/campaigns' },
  { icon: BarChart3,       label: 'Analytics',          path: '/analytics' },
  { icon: Settings,        label: 'Settings',           path: '/settings' },
];

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();
  const { activeBrand } = useBrand();

  return (
    <motion.aside
      initial={false}
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.22, ease: 'easeInOut' }}
      className="relative flex flex-col h-full border-r border-border bg-card overflow-hidden shrink-0"
    >
      {/* ── Logo ─────────────────────────────────────────────────────── */}
      <div className="flex items-center h-16 px-4 border-b border-border shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand-500 to-blue-600 flex items-center justify-center shrink-0 shadow-brand">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.18 }}
                className="overflow-hidden whitespace-nowrap"
              >
                <span className="text-sm font-bold text-foreground">BrandVoice</span>
                <span className="text-sm font-bold text-brand-500"> AI</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* ── Navigation ───────────────────────────────────────────────── */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden px-2 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive =
            location.pathname === item.path ||
            (item.path !== '/dashboard' && location.pathname.startsWith(item.path));

          return (
            <NavLink key={item.path} to={item.path}>
              {() => (
                <div
                  className={cn(
                    'relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-all duration-150 cursor-pointer group',
                    isActive
                      ? 'bg-brand-500/10 text-brand-500'
                      : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                  )}
                >
                  {/* Active left indicator */}
                  {isActive && (
                    <motion.span
                      layoutId="nav-indicator"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 bg-brand-500 rounded-r-full"
                      transition={{ duration: 0.18 }}
                    />
                  )}

                  <item.icon className={cn('w-4 h-4 shrink-0', isActive ? 'text-brand-500' : '')} />

                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.12 }}
                        className="font-medium truncate"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>

                  {/* Tooltip shown when collapsed */}
                  {collapsed && (
                    <span className="
                      absolute left-full ml-2 px-2 py-1 rounded-md text-xs font-medium
                      bg-popover text-popover-foreground border border-border shadow-md
                      opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none
                      whitespace-nowrap z-50
                    ">
                      {item.label}
                    </span>
                  )}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* ── Active Brand Footer Badge ───────────────────────────────── */}
      {!collapsed && activeBrand && (
        <div className="p-3 mx-2 mb-2 rounded-xl bg-brand-500/10 border border-brand-500/20 flex items-center gap-2.5">
          <div className="w-6 h-6 rounded-md bg-brand-500 text-white font-bold text-xs flex items-center justify-center shrink-0">
            {activeBrand.name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-semibold text-foreground truncate">{activeBrand.name}</p>
            <p className="text-[10px] text-muted-foreground truncate">{activeBrand.industry || 'Active Profile'}</p>
          </div>
        </div>
      )}

      {/* ── Collapse toggle ───────────────────────────────────────────── */}
      <div className="p-2 border-t border-border">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 rounded-lg p-2 text-muted-foreground hover:bg-accent hover:text-foreground transition-colors text-sm"
        >
          {collapsed
            ? <ChevronRight className="w-4 h-4" />
            : <><ChevronLeft className="w-4 h-4" /><span className="text-xs">Collapse</span></>
          }
        </button>
      </div>
    </motion.aside>
  );
}

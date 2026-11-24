import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Home, Zap } from 'lucide-react';

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 flex items-center justify-center mx-auto">
          <Zap className="w-8 h-8 text-brand-500" />
        </div>
        <div>
          <h1 className="text-6xl font-bold text-foreground">404</h1>
          <p className="text-xl font-semibold text-foreground mt-2">Page not found</p>
          <p className="text-muted-foreground mt-2">This page doesn't exist or was moved.</p>
        </div>
        <Link to="/dashboard"
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 text-white text-sm font-medium transition-colors">
          <Home className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </motion.div>
    </div>
  );
}

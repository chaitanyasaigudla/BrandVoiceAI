import { Outlet, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap } from 'lucide-react';

export function AuthLayout() {
  return (
    <div className="min-h-screen flex bg-background">
      {/* Left – branding panel */}
      <div className="hidden lg:flex flex-col w-1/2 bg-gradient-to-br from-brand-900 via-brand-800 to-blue-900 p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-500/20 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full bg-blue-500/20 blur-3xl" />

        {/* Logo */}
        <div className="flex items-center gap-3 relative z-10">
          <div className="w-10 h-10 rounded-xl bg-white/10 backdrop-blur flex items-center justify-center shadow-brand">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold text-white">BrandVoice AI</span>
        </div>

        {/* Tagline */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.6 }}
          className="mt-auto relative z-10"
        >
          <h1 className="text-4xl font-bold text-white leading-tight mb-4">
            One brand voice.<br />
            Every platform.<br />
            <span className="text-brand-300">Always consistent.</span>
          </h1>
          <p className="text-brand-200/80 text-lg leading-relaxed">
            Generate on-brand marketing content for Instagram, LinkedIn, blogs, emails,
            and more — powered by AI that knows your brand as well as you do.
          </p>

          {/* Feature bullets */}
          <div className="mt-8 space-y-3">
            {[
              'AI content generation across 6+ platforms',
              'Persistent brand memory & editorial preferences',
              'Real-time brand consistency scoring',
            ].map((f) => (
              <div key={f} className="flex items-center gap-3">
                <div className="w-5 h-5 rounded-full bg-brand-500/30 flex items-center justify-center shrink-0">
                  <div className="w-2 h-2 rounded-full bg-brand-400" />
                </div>
                <span className="text-brand-100/90 text-sm">{f}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Right – auth form */}
      <div className="flex-1 flex flex-col items-center justify-center p-8">
        {/* Mobile logo */}
        <Link to="/" className="flex items-center gap-2 mb-8 lg:hidden">
          <div className="w-8 h-8 rounded-lg bg-brand-500 flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground">BrandVoice AI</span>
        </Link>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="w-full max-w-md"
        >
          <Outlet />
        </motion.div>
      </div>
    </div>
  );
}

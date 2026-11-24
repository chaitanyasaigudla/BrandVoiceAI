import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { apiPost } from '@/lib/api';

const schema = z.object({
  email:    z.string().email('Enter a valid email'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof schema>;

export function LoginPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      email: 'demo@brandvoice.ai',
      password: 'password123',
    },
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const res: any = await apiPost('/auth/login', data);
      const token = res?.token || res?.data?.token;
      if (token) {
        localStorage.setItem('brandvoice-token', token);
      }
      if (res?.user) {
        localStorage.setItem('brandvoice-user', JSON.stringify({
          ...res.user,
          organizationName: res.organization?.name,
        }));
      }
      if (res?.brand?.id) {
        localStorage.setItem('brandvoice_active_brand_id', res.brand.id);
      } else {
        localStorage.removeItem('brandvoice_active_brand_id');
      }
      window.dispatchEvent(new Event('auth-change'));
      navigate('/dashboard');
    } catch (err: any) {
      setApiError(err.message || 'Invalid email or password');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Welcome back</h2>
        <p className="text-muted-foreground text-sm mt-1">Sign in to your BrandVoice AI workspace</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {apiError && (
          <div className="p-3 text-xs rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-500">
            {apiError}
          </div>
        )}

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Email</label>
          <input
            type="email"
            placeholder="you@company.com"
            {...register('email')}
            className={cn(
              'w-full px-3 py-2.5 rounded-lg border text-sm bg-background text-foreground',
              'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
              errors.email ? 'border-destructive' : 'border-input'
            )}
          />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-foreground">Password</label>
          </div>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={cn(
                'w-full px-3 py-2.5 rounded-lg border text-sm bg-background text-foreground pr-10',
                'placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors',
                errors.password ? 'border-destructive' : 'border-input'
              )}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
          {errors.password && <p className="text-xs text-destructive">{errors.password.message}</p>}
        </div>

        {/* Demo credentials note */}
        <div className="p-2.5 rounded-lg bg-muted text-xs text-muted-foreground flex justify-between items-center">
          <span>Demo: <strong>demo@brandvoice.ai</strong> / <strong>password123</strong></span>
          <button
            type="button"
            onClick={() => {
              setValue('email', 'demo@brandvoice.ai');
              setValue('password', 'password123');
            }}
            className="text-brand-500 hover:underline font-medium"
          >
            Auto-fill
          </button>
        </div>

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm transition-colors shadow-brand"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Signing in…' : 'Sign In'}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Don&apos;t have an account?{' '}
        <Link to="/register" className="text-brand-500 hover:text-brand-400 font-medium">
          Create account
        </Link>
      </div>
    </div>
  );
}

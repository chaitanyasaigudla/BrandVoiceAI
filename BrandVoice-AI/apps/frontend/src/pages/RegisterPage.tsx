import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';
import { apiPost } from '@/lib/api';

const schema = z.object({
  name:             z.string().min(2, 'Name must be at least 2 characters'),
  email:            z.string().email('Enter a valid email'),
  organizationName: z.string().min(2, 'Organization name required'),
  password:         z.string().min(8, 'Password must be at least 8 characters').regex(/[A-Za-z]/, 'Include a letter').regex(/[0-9]/, 'Include a number'),
});

type FormData = z.infer<typeof schema>;

export function RegisterPage() {
  const navigate = useNavigate();
  const [showPass, setShowPass] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setApiError(null);
    try {
      const res: any = await apiPost('/auth/register', data);
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
      navigate('/onboarding');
    } catch (err: any) {
      setApiError(err.message || 'Registration failed');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-foreground">Create your workspace</h2>
        <p className="text-muted-foreground text-sm mt-1">Start building consistent brand content with AI</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {apiError && (
          <div className="p-3 text-xs rounded-lg bg-danger-500/10 border border-danger-500/20 text-danger-500">
            {apiError}
          </div>
        )}

        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Your name</label>
            <input type="text" placeholder="Jane Smith" {...register('name')}
              className={cn('w-full px-3 py-2.5 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors', errors.name ? 'border-destructive' : 'border-input')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Organization</label>
            <input type="text" placeholder="Acme Corp" {...register('organizationName')}
              className={cn('w-full px-3 py-2.5 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors', errors.organizationName ? 'border-destructive' : 'border-input')} />
            {errors.organizationName && <p className="text-xs text-destructive">{errors.organizationName.message}</p>}
          </div>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Work email</label>
          <input type="email" placeholder="you@company.com" {...register('email')}
            className={cn('w-full px-3 py-2.5 rounded-lg border text-sm bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors', errors.email ? 'border-destructive' : 'border-input')} />
          {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium text-foreground">Password</label>
          <div className="relative">
            <input
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              {...register('password')}
              className={cn('w-full px-3 py-2.5 rounded-lg border text-sm bg-background text-foreground pr-10 placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring transition-colors', errors.password ? 'border-destructive' : 'border-input')}
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

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-lg bg-brand-500 hover:bg-brand-600 disabled:opacity-60 text-white font-medium text-sm transition-colors shadow-brand"
        >
          {isSubmitting && <Loader2 className="w-4 h-4 animate-spin" />}
          {isSubmitting ? 'Creating workspace…' : 'Create Workspace'}
        </button>
      </form>

      <div className="text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-500 hover:text-brand-400 font-medium">
          Sign in
        </Link>
      </div>
    </div>
  );
}

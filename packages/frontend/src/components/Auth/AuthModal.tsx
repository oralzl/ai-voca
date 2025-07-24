/**
 * @fileoverview 认证模态框组件
 * @module AuthModal
 * @description 包装登录和注册表单的模态框组件，支持表单切换
 */

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, Mail, Lock, User, ArrowLeft, CheckCircle, RefreshCw } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialType?: 'login' | 'register' | 'reset' | 'verify-email'
}

const loginSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
});

const registerSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
  password: z.string().min(6, '密码至少需要6个字符'),
  confirmPassword: z.string(),
  displayName: z.string().min(2, '昵称至少需要2个字符'),
}).refine((data) => data.password === data.confirmPassword, {
  message: '两次输入的密码不一致',
  path: ['confirmPassword'],
});

const resetSchema = z.object({
  email: z.string().email('请输入有效的邮箱地址'),
});

export function AuthModal({ isOpen, onClose, initialType = 'login' }: AuthModalProps) {
  const [modalType, setModalType] = useState<'login' | 'register' | 'reset' | 'verify-email'>(initialType);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);
  const [registerLoading, setRegisterLoading] = useState(false);
  const [resetLoading, setResetLoading] = useState(false);
  const [userEmail, setUserEmail] = useState('');
  const { signIn, signUp, resetPassword } = useAuth();

  const loginForm = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const registerForm = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { email: '', password: '', confirmPassword: '', displayName: '' },
  });

  const resetForm = useForm({
    resolver: zodResolver(resetSchema),
    defaultValues: { email: '' },
  });

  const handleLogin = async (data: z.infer<typeof loginSchema>) => {
    setLoginLoading(true);
    try {
      const { error } = await signIn(data.email, data.password);
      if (!error) {
        onClose();
        loginForm.reset();
      } else {
        loginForm.setError('root', { message: error.message || '登录失败，请重试' });
      }
    } finally {
      setLoginLoading(false);
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setRegisterLoading(true);
    setUserEmail(data.email);
    try {
      const { error } = await signUp(data.email, data.password, data.displayName);
      if (!error) {
        setModalType('verify-email');
        registerForm.reset();
      } else {
        registerForm.setError('root', { message: error.message || '注册失败，请重试' });
      }
    } finally {
      setRegisterLoading(false);
    }
  };

  const handleResetPassword = async (data: z.infer<typeof resetSchema>) => {
    setResetLoading(true);
    try {
      const { error } = await resetPassword(data.email);
      if (!error) {
        setModalType('login');
        resetForm.reset();
        // 可以添加成功提示
      } else {
        resetForm.setError('root', { message: error.message || '发送重置邮件失败，请重试' });
      }
    } finally {
      setResetLoading(false);
    }
  };

  const handleClose = () => {
    onClose();
    setModalType('login');
    setUserEmail('');
    loginForm.reset();
    registerForm.reset();
    resetForm.reset();
  };

  const renderLoginForm = () => (
    <form onSubmit={loginForm.handleSubmit(handleLogin)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="email">邮箱</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="email"
            type="email"
            placeholder="请输入你的邮箱"
            className="pl-10"
            disabled={loginLoading}
            {...loginForm.register('email')}
          />
        </div>
        {loginForm.formState.errors.email && (
          <p className="text-sm text-destructive">{loginForm.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="password">密码</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入你的密码"
            className="pl-10 pr-10"
            disabled={loginLoading}
            {...loginForm.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={loginLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {loginForm.formState.errors.password && (
          <p className="text-sm text-destructive">{loginForm.formState.errors.password.message}</p>
        )}
      </div>

      {loginForm.formState.errors.root && (
        <p className="text-sm text-destructive">{loginForm.formState.errors.root.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={loginLoading}>
        {loginLoading ? '登录中...' : '登录'}
      </Button>

      <div className="flex items-center justify-between text-sm">
        <button
          type="button"
          onClick={() => setModalType('reset')}
          className="text-primary hover:underline"
        >
          忘记密码？
        </button>
        <button
          type="button"
          onClick={() => setModalType('register')}
          className="text-primary hover:underline"
        >
          创建新账户
        </button>
      </div>
    </form>
  );

  const renderRegisterForm = () => (
    <form onSubmit={registerForm.handleSubmit(handleRegister)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="register-email">邮箱</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="register-email"
            type="email"
            placeholder="请输入你的邮箱"
            className="pl-10"
            disabled={registerLoading}
            {...registerForm.register('email')}
          />
        </div>
        {registerForm.formState.errors.email && (
          <p className="text-sm text-destructive">{registerForm.formState.errors.email.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-displayName">昵称</Label>
        <div className="relative">
          <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="register-displayName"
            type="text"
            placeholder="请输入你的昵称"
            className="pl-10"
            disabled={registerLoading}
            {...registerForm.register('displayName')}
          />
        </div>
        {registerForm.formState.errors.displayName && (
          <p className="text-sm text-destructive">{registerForm.formState.errors.displayName.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-password">密码</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="register-password"
            type={showPassword ? 'text' : 'password'}
            placeholder="请输入密码（至少6位）"
            className="pl-10 pr-10"
            disabled={registerLoading}
            {...registerForm.register('password')}
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            disabled={registerLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {registerForm.formState.errors.password && (
          <p className="text-sm text-destructive">{registerForm.formState.errors.password.message}</p>
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="register-confirmPassword">确认密码</Label>
        <div className="relative">
          <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="register-confirmPassword"
            type={showConfirmPassword ? 'text' : 'password'}
            placeholder="请再次输入密码"
            className="pl-10 pr-10"
            disabled={registerLoading}
            {...registerForm.register('confirmPassword')}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            disabled={registerLoading}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
        {registerForm.formState.errors.confirmPassword && (
          <p className="text-sm text-destructive">{registerForm.formState.errors.confirmPassword.message}</p>
        )}
      </div>

      {registerForm.formState.errors.root && (
        <p className="text-sm text-destructive">{registerForm.formState.errors.root.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={registerLoading}>
        {registerLoading ? '注册中...' : '注册'}
      </Button>

      <div className="text-center text-sm">
        <span className="text-muted-foreground">已有账户？</span>
        <button
          type="button"
          onClick={() => setModalType('login')}
          className="text-primary hover:underline ml-1"
        >
          立即登录
        </button>
      </div>
    </form>
  );

  const renderResetForm = () => (
    <form onSubmit={resetForm.handleSubmit(handleResetPassword)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="reset-email">邮箱</Label>
        <div className="relative">
          <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            id="reset-email"
            type="email"
            placeholder="请输入你的邮箱"
            className="pl-10"
            disabled={resetLoading}
            {...resetForm.register('email')}
          />
        </div>
        {resetForm.formState.errors.email && (
          <p className="text-sm text-destructive">{resetForm.formState.errors.email.message}</p>
        )}
      </div>

      {resetForm.formState.errors.root && (
        <p className="text-sm text-destructive">{resetForm.formState.errors.root.message}</p>
      )}

      <Button type="submit" className="w-full" disabled={resetLoading}>
        {resetLoading ? '发送中...' : '发送重置邮件'}
      </Button>

      <div className="text-center text-sm">
        <button
          type="button"
          onClick={() => setModalType('login')}
          className="text-primary hover:underline flex items-center justify-center gap-1"
        >
          <ArrowLeft className="w-4 h-4" />
          返回登录
        </button>
      </div>
    </form>
  );

  const renderVerifyEmailPage = () => (
    <div className="text-center space-y-6">
      <div className="flex justify-center">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
          <CheckCircle className="w-8 h-8 text-green-600" />
        </div>
      </div>
      
      <div className="space-y-2">
        <h3 className="text-lg font-semibold">注册成功！</h3>
        <p className="text-muted-foreground">
          我们已经向 <span className="font-medium text-foreground">{userEmail}</span> 发送了验证邮件
        </p>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg text-left space-y-2">
        <h4 className="font-medium text-blue-900">接下来请：</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• 检查您的邮箱（包括垃圾邮件文件夹）</li>
          <li>• 点击邮件中的验证链接</li>
          <li>• 验证完成后即可登录使用</li>
        </ul>
      </div>

      <div className="flex flex-col gap-3">
        <Button 
          onClick={() => {
            // 重新发送验证邮件的逻辑可以在这里添加
            setModalType('register');
          }}
          variant="outline"
          className="w-full"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          重新发送验证邮件
        </Button>
        
        <Button 
          onClick={() => setModalType('login')}
          className="w-full"
        >
          我已验证，去登录
        </Button>
      </div>

      <div className="text-center text-sm text-muted-foreground">
        没有收到邮件？请检查垃圾邮件文件夹或
        <button
          type="button"
          onClick={() => setModalType('register')}
          className="text-primary hover:underline ml-1"
        >
          重新注册
        </button>
      </div>
    </div>
  );

  const getModalTitle = () => {
    switch (modalType) {
      case 'login':
        return '登录账户';
      case 'register':
        return '创建账户';
      case 'reset':
        return '重置密码';
      case 'verify-email':
        return '验证邮箱';
      default:
        return '认证';
    }
  };

  const getModalDescription = () => {
    switch (modalType) {
      case 'login':
        return '欢迎回来，请登录你的账户';
      case 'register':
        return '创建你的 AI-Voca-2 账户，开始智能学习之旅';
      case 'reset':
        return '输入你的邮箱地址，我们将发送密码重置链接';
      case 'verify-email':
        return '请查看您的邮箱完成验证';
      default:
        return '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{getModalTitle()}</DialogTitle>
          <DialogDescription>{getModalDescription()}</DialogDescription>
        </DialogHeader>
        <Separator />
        {modalType === 'login' && renderLoginForm()}
        {modalType === 'register' && renderRegisterForm()}
        {modalType === 'reset' && renderResetForm()}
        {modalType === 'verify-email' && renderVerifyEmailPage()}
      </DialogContent>
    </Dialog>
  );
}
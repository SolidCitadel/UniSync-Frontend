import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { authApi } from '@/api/authApi';
import type { User } from '@/types';

interface LoginDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onLoginSuccess: (user: User) => void;
}

export default function LoginDialog({ open, onOpenChange, onLoginSuccess }: LoginDialogProps) {
  const [isSignUp, setIsSignUp] = useState(false);

  // Login form
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // SignUp form
  const [signUpName, setSignUpName] = useState('');
  const [signUpEmail, setSignUpEmail] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpConfirmPassword, setSignUpConfirmPassword] = useState('');

  // Validation states
  const [emailValid, setEmailValid] = useState<boolean | null>(null);
  const [passwordValid, setPasswordValid] = useState<boolean | null>(null);
  const [passwordMatch, setPasswordMatch] = useState<boolean | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleLogin 시작');
    if (loginEmail && loginPassword) {
      try {
        console.log('로그인 시도:', { email: loginEmail });
        const response = await authApi.login({
          email: loginEmail,
          password: loginPassword,
        });
        console.log('로그인 성공:', response);
        toast.success('로그인 성공!');
        onLoginSuccess(response.user);
        onOpenChange(false);
        // Reset form
        setLoginEmail('');
        setLoginPassword('');
      } catch (error: any) {
        console.error('로그인 에러:', error);
        console.error('에러 응답:', error.response);
        const errorMessage = error.message || '로그인에 실패했습니다.';
        console.error('에러 메시지:', errorMessage);
        toast.error(errorMessage);
      }
    } else {
      console.log('입력값 누락:', { email: loginEmail, password: loginPassword });
      toast.error('이메일과 비밀번호를 입력해주세요.');
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('handleSignUp 시작');
    if (signUpName && signUpEmail && signUpPassword && signUpConfirmPassword) {
      if (signUpPassword !== signUpConfirmPassword) {
        setPasswordMatch(false);
        toast.error('비밀번호가 일치하지 않습니다.');
        return;
      }

      // Validate password format
      const hasMinLength = signUpPassword.length >= 8;
      const hasUpperCase = /[A-Z]/.test(signUpPassword);
      const hasLowerCase = /[a-z]/.test(signUpPassword);
      const hasNumber = /[0-9]/.test(signUpPassword);

      if (!hasMinLength || !hasUpperCase || !hasLowerCase || !hasNumber) {
        toast.error('비밀번호는 8자 이상이며, 대문자, 소문자, 숫자를 포함해야 합니다.');
        return;
      }
      setPasswordMatch(true);

      try {
        console.log('회원가입 시도:', { name: signUpName, email: signUpEmail });
        const response = await authApi.signup({
          name: signUpName,
          email: signUpEmail,
          password: signUpPassword,
        });
        console.log('회원가입 성공:', response);
        toast.success('회원가입 성공!');
        onLoginSuccess(response.user);
        onOpenChange(false);
        // Reset form
        setSignUpName('');
        setSignUpEmail('');
        setSignUpPassword('');
        setSignUpConfirmPassword('');
        setIsSignUp(false);
      } catch (error: any) {
        console.error('회원가입 에러:', error);
        console.error('에러 응답:', error.response);
        const errorMessage = error.message || '회원가입에 실패했습니다.';
        console.error('에러 메시지:', errorMessage);
        toast.error(errorMessage);
      }
    } else {
      console.log('입력값 누락:', { name: signUpName, email: signUpEmail, password: signUpPassword, confirmPassword: signUpConfirmPassword });
      toast.error('모든 필드를 입력해주세요.');
    }
  };

  // Email validation
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSignUpEmail(value);
    if (value.includes('@')) {
      setEmailValid(true);
    } else if (value.length > 0) {
      setEmailValid(false);
    } else {
      setEmailValid(null);
    }
  };

  // Password validation
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSignUpPassword(value);

    // Check: 8+ chars, uppercase, lowercase, number
    const hasMinLength = value.length >= 8;
    const hasUpperCase = /[A-Z]/.test(value);
    const hasLowerCase = /[a-z]/.test(value);
    const hasNumber = /[0-9]/.test(value);

    if (hasMinLength && hasUpperCase && hasLowerCase && hasNumber) {
      setPasswordValid(true);
    } else if (value.length > 0) {
      setPasswordValid(false);
    } else {
      setPasswordValid(null);
    }
  };

  // Password match validation
  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSignUpConfirmPassword(value);
    if (value === signUpPassword && value.length > 0) {
      setPasswordMatch(true);
    } else if (value.length > 0) {
      setPasswordMatch(false);
    } else {
      setPasswordMatch(null);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[440px] p-0 gap-0">
        {!isSignUp ? (
          // Login Form
          <>
            <DialogHeader className="px-7 pt-10 pb-6">
              <DialogTitle className="text-[20px] text-center text-black">
                로그인
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleLogin} className="px-7 pb-10">
              {/* Email Field */}
              <div className="mb-4">
                <Input
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={loginEmail}
                  onChange={(e) => setLoginEmail(e.target.value)}
                  className="h-[50px] bg-[rgba(217,217,217,0.2)] border-0 rounded-[15px] text-[18px] placeholder:text-[rgba(0,0,0,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>

              {/* Password Field */}
              <div className="mb-6">
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={loginPassword}
                  onChange={(e) => setLoginPassword(e.target.value)}
                  className="h-[50px] bg-[rgba(217,217,217,0.2)] border-0 rounded-[15px] text-[18px] placeholder:text-[rgba(0,0,0,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>

              {/* Sign Up Button (outlined) */}
              <Button
                type="button"
                onClick={() => setIsSignUp(true)}
                className="w-full h-[44px] bg-white hover:bg-gray-50 text-[#2c7fff] text-[18px] rounded-[15px] border border-[#2c7fff] mb-3 shadow-none"
              >
                회원가입
              </Button>

              {/* Login Button */}
              <Button
                type="submit"
                className="w-full h-[44px] bg-[#2c7fff] hover:bg-[#2569e6] text-white text-[18px] rounded-[15px] shadow-none"
              >
                로그인
              </Button>
            </form>
          </>
        ) : (
          // Sign Up Form
          <>
            <DialogHeader className="px-7 pt-10 pb-6">
              <DialogTitle className="text-[20px] text-center text-black">
                회원가입
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSignUp} className="px-7 pb-10">
              {/* Name Field */}
              <div className="mb-5">
                <label className="block text-[16px] text-black mb-2">
                  이름
                </label>
                <Input
                  type="text"
                  placeholder="이름을 입력하세요"
                  value={signUpName}
                  onChange={(e) => setSignUpName(e.target.value)}
                  className="h-[50px] bg-[rgba(217,217,217,0.2)] border-0 rounded-[15px] text-[18px] placeholder:text-[rgba(0,0,0,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
              </div>

              {/* Email Field */}
              <div className="mb-5">
                <label className="block text-[16px] text-black mb-2">
                  이메일
                </label>
                <Input
                  type="email"
                  placeholder="이메일을 입력하세요"
                  value={signUpEmail}
                  onChange={handleEmailChange}
                  className="h-[50px] bg-[rgba(217,217,217,0.2)] border-0 rounded-[15px] text-[18px] placeholder:text-[rgba(0,0,0,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
                {emailValid === true && (
                  <p className="text-[#24b400] text-[12px] mt-1">
                    사용 가능한 이메일입니다.
                  </p>
                )}
                {emailValid === false && (
                  <p className="text-[#ff0707] text-[12px] mt-1">
                    유효한 이메일을 입력하세요.
                  </p>
                )}
              </div>

              {/* Password Field */}
              <div className="mb-5">
                <label className="block text-[16px] text-black mb-2">
                  비밀번호
                </label>
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={signUpPassword}
                  onChange={handlePasswordChange}
                  className="h-[50px] bg-[rgba(217,217,217,0.2)] border-0 rounded-[15px] text-[18px] placeholder:text-[rgba(0,0,0,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
                {passwordValid === true && (
                  <p className="text-[#24b400] text-[12px] mt-1">
                    사용 가능한 비밀번호입니다.
                  </p>
                )}
                {passwordValid === false && (
                  <p className="text-[#ff0707] text-[12px] mt-1">
                    비밀번호는 8자 이상이며, 대문자, 소문자, 숫자를 포함해야 합니다.
                  </p>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="mb-6">
                <label className="block text-[16px] text-black mb-2">
                  비밀번호 확인
                </label>
                <Input
                  type="password"
                  placeholder="비밀번호를 입력하세요"
                  value={signUpConfirmPassword}
                  onChange={handleConfirmPasswordChange}
                  className="h-[50px] bg-[rgba(217,217,217,0.2)] border-0 rounded-[15px] text-[18px] placeholder:text-[rgba(0,0,0,0.3)] focus-visible:ring-0 focus-visible:ring-offset-0"
                  required
                />
                {passwordMatch === false && (
                  <p className="text-[#ff0707] text-[12px] mt-1">
                    비밀번호가 일치하지 않습니다.
                  </p>
                )}
                {passwordMatch === true && (
                  <p className="text-[#24b400] text-[12px] mt-1">
                    비밀번호가 일치합니다.
                  </p>
                )}
              </div>

              {/* Sign Up Button */}
              <Button
                type="submit"
                className="w-full h-[44px] bg-[#2c7fff] hover:bg-[#2569e6] text-white text-[18px] rounded-[15px] shadow-none mb-3"
              >
                회원가입
              </Button>

              {/* Back to Login */}
              <button
                type="button"
                onClick={() => setIsSignUp(false)}
                className="w-full text-center text-sm text-gray-600 hover:text-[#2c7fff] transition-colors"
              >
                이미 계정이 있으신가요? <span className="text-[#2c7fff]">로그인</span>
              </button>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}

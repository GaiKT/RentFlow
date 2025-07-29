"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { customToast } from "@/lib/toast";
import { useAuth } from "@/lib/auth-context";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft } from "lucide-react";
import ThemeSwitcher from "@/components/theme-switcher";
import Image from "next/image";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login, user, loading } = useAuth();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && user) {
      router.push("/dashboard");
      return;
    }
  }, [user, loading, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const success = await login(email, password);
      
      if (success) {
        customToast.loginSuccess();
      } else {
        customToast.error("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading while checking authentication
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base-200">
        <div className="text-center">
          <span className="loading loading-spinner loading-lg text-primary"></span>
          <p className="mt-4 text-base-content/70">กำลังตรวจสอบสิทธิ์...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      {/* Theme Switcher - Top Right */}
      <div className="absolute top-6 right-6">
        <ThemeSwitcher />
      </div>
      
      <div className="relative w-full max-w-lg">
        {/* Back Button */}
        <Link 
          href="/" 
          className="btn btn-ghost btn-sm mb-6 text-base-content/70 hover:text-base-content group"
        >
          <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
          กลับสู่หน้าหลัก
        </Link>

        {/* Login Card */}
        <div className="card bg-base-100/80 backdrop-blur-sm shadow-2xl border border-base-300/50">
          <div className="card-body p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
                <Image src="/icons/insurance.png" alt="RentFlow" width={50} height={50} />
              </div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  เข้าสู่ระบบ
                </span>
              </h1>
              <p className="text-base-content/60 text-lg">
                ยินดีต้อนรับกลับสู่ RentFlow
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-primary" />
                    อีเมล
                  </span>
                </label>
                <input
                  type="email"
                  placeholder="กรอกอีเมลของคุณ"
                  className="input input-bordered w-full focus:input-primary transition-all duration-300 bg-base-200/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-primary" />
                    รหัสผ่าน
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านของคุณ"
                    className="input input-bordered w-full pr-12 focus:input-primary transition-all duration-300 bg-base-200/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/50 hover:text-primary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Login Button */}
              <button
                type="submit"
                className={`btn btn-primary btn-lg w-full mt-8 bg-gradient-to-r from-primary to-secondary border-none hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner loading-xs"></span>
                    กำลังเข้าสู่ระบบ...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5 mr-2" />
                    เข้าสู่ระบบ
                  </>
                )}
              </button>
            </form>

            {/* Divider */}
            <div className="divider my-8">
              <span className="text-base-content/40 text-sm">หรือ</span>
            </div>

            {/* Footer Links */}
            <div className="text-center space-y-4">
              <p className="text-base-content/70">
                ยังไม่มีบัญชี?{" "}
                <Link href="/register" className="link link-primary font-semibold hover:link-hover">
                  สมัครสมาชิก
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-info/10 to-accent/10 rounded-xl border border-info/20 backdrop-blur-sm">
          <div className="text-center text-sm">
            <div className="badge badge-info badge-sm mb-2">DEMO</div>
            <p className="text-base-content/70">
              สามารถสมัครบัญชีใหม่หรือใช้บัญชีที่สร้างไว้แล้ว
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

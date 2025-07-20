"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { customToast } from "@/lib/toast";
import { Eye, EyeOff, LogIn, Mail, Lock, ArrowLeft } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        customToast.loginSuccess();
        router.push("/dashboard");
      } else {
        customToast.error(data.message || "เกิดข้อผิดพลาดในการเข้าสู่ระบบ");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-base-200 via-base-300 to-base-200 flex items-center justify-center p-4">
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] opacity-20"></div>
      
      <div className="relative w-full max-w-md">
        {/* Back Button */}
        <Link 
          href="/" 
          className="btn btn-ghost btn-sm mb-4 text-base-content/70 hover:text-base-content"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          กลับสู่หน้าหลัก
        </Link>

        {/* Login Card */}
        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="avatar mb-4">
                <div className="w-16 rounded-full bg-gradient-to-r from-primary to-secondary text-white flex items-center justify-center">
                  <LogIn className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                เข้าสู่ระบบ
              </h2>
              <p className="text-base-content/70 mt-2">
                ยินดีต้อนรับกลับสู่ระบบจัดการห้องพัก
              </p>
            </div>

            {/* Login Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email Field */}
              <fieldset>
                <legend className="fieldset-legend font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4" />
                  อีเมล
                </legend>
                <input
                  type="email"
                  placeholder="example@email.com"
                  className="input input-bordered w-full validator focus:input-primary transition-all duration-300"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </fieldset>

              {/* Password Field */}
              <fieldset>
                <legend className="fieldset-legend font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  รหัสผ่าน
                </legend>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="รหัสผ่าน"
                    className="input input-bordered w-full validator pr-12 focus:input-primary transition-all duration-300"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-base-content transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </fieldset>

              {/* Login Button */}
              <div className="mt-8">
                <button
                  type="submit"
                  className={`btn btn-primary btn-lg w-full bg-gradient-to-r from-primary to-secondary border-none hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner w-5 h-5"></span>
                      กำลังเข้าสู่ระบบ...
                    </>
                  ) : (
                    <>
                      <LogIn className="w-5 h-5 mr-2" />
                      เข้าสู่ระบบ
                    </>
                  )}
                </button>
              </div>
            </form>

            {/* Divider */}
            <div className="divider my-8 text-base-content/50">หรือ</div>

            {/* Footer Links */}
            <div className="text-center space-y-4">
              <p className="text-sm text-base-content/70">
                ยังไม่มีบัญชี?{" "}
                <Link href="/register" className="link link-primary font-medium hover:link-hover">
                  สมัครสมาชิก
                </Link>
              </p>
              <Link href="/" className="link link-secondary text-sm hover:link-hover">
                กลับสู่หน้าหลัก
              </Link>
            </div>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-info/10 rounded-lg border border-info/20">
          <div className="text-center text-sm text-info">
            <strong>Demo:</strong> สามารถสมัครบัญชีใหม่หรือใช้บัญชีที่สร้างไว้แล้ว
          </div>
        </div>
      </div>
    </div>
  );
}

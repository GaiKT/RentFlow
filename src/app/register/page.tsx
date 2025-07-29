"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { customToast } from "@/lib/toast";
import { Eye, EyeOff, UserPlus, Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";
import ThemeSwitcher from "@/components/theme-switcher";
import Image from "next/image";

export default function RegisterPage() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate password match
    if (formData.password !== formData.confirmPassword) {
      customToast.error("รหัสผ่านไม่ตรงกัน");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        customToast.success("สมัครสมาชิกสำเร็จ! กำลังไปหน้าเข้าสู่ระบบ...");
        setTimeout(() => {
          router.push("/login");
        }, 1500);
      } else {
        customToast.error(data.message || "เกิดข้อผิดพลาดในการสมัครสมาชิก");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = (password: string) => {
    let strength = 0;
    if (password.length >= 8) strength++;
    if (/[A-Z]/.test(password)) strength++;
    if (/[0-9]/.test(password)) strength++;
    if (/[^A-Za-z0-9]/.test(password)) strength++;
    return strength;
  };

  const getPasswordStrengthColor = (strength: number) => {
    if (strength <= 1) return "error";
    if (strength <= 2) return "warning";
    if (strength <= 3) return "info";
    return "success";
  };

  const getPasswordStrengthText = (strength: number) => {
    if (strength <= 1) return "อ่อน";
    if (strength <= 2) return "ปานกลาง";
    if (strength <= 3) return "ดี";
    return "แข็งแรง";
  };

  const currentPasswordStrength = passwordStrength(formData.password);

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary/5 via-base-100 to-primary/5 flex items-center justify-center p-4">
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

        {/* Register Card */}
        <div className="card bg-base-100/80 backdrop-blur-sm shadow-2xl border border-base-300/50">
          <div className="card-body p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-gradient-to-br from-secondary to-primary flex items-center justify-center shadow-lg">
                <Image src="/icons/insurance.png" alt="RentFlow" width={50} height={50} />
              </div>
              <h1 className="text-4xl font-bold mb-2">
                <span className="bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                  สมัครสมาชิก
                </span>
              </h1>
              <p className="text-base-content/60 text-lg">
                เริ่มต้นจัดการห้องพักของคุณวันนี้
              </p>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <User className="w-4 h-4 text-secondary" />
                    ชื่อ-นามสกุล
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="กรอกชื่อ-นามสกุลของคุณ"
                  className="input input-bordered w-full focus:input-secondary transition-all duration-300 bg-base-200/50"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email Field */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Mail className="w-4 h-4 text-secondary" />
                    อีเมล
                  </span>
                </label>
                <input
                  type="email"
                  name="email"
                  placeholder="กรอกอีเมลของคุณ"
                  className="input input-bordered w-full focus:input-secondary transition-all duration-300 bg-base-200/50"
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Password Field */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-secondary" />
                    รหัสผ่าน
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="กรอกรหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                    className="input input-bordered w-full pr-12 focus:input-secondary transition-all duration-300 bg-base-200/50"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/50 hover:text-secondary transition-colors"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/70">ความแข็งแรงของรหัสผ่าน:</span>
                      <span className={`text-sm font-semibold text-${getPasswordStrengthColor(currentPasswordStrength)}`}>
                        {getPasswordStrengthText(currentPasswordStrength)}
                      </span>
                    </div>
                    <progress 
                      className={`progress progress-${getPasswordStrengthColor(currentPasswordStrength)} w-full h-2`} 
                      value={currentPasswordStrength} 
                      max="4"
                    ></progress>
                    <div className="grid grid-cols-2 gap-2 text-xs text-base-content/60">
                      <div className={`flex items-center gap-1 ${formData.password.length >= 8 ? 'text-success' : ''}`}>
                        {formData.password.length >= 8 ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current opacity-30"></div>}
                        8+ ตัวอักษร
                      </div>
                      <div className={`flex items-center gap-1 ${/[A-Z]/.test(formData.password) ? 'text-success' : ''}`}>
                        {/[A-Z]/.test(formData.password) ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current opacity-30"></div>}
                        ตัวใหญ่
                      </div>
                      <div className={`flex items-center gap-1 ${/[0-9]/.test(formData.password) ? 'text-success' : ''}`}>
                        {/[0-9]/.test(formData.password) ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current opacity-30"></div>}
                        ตัวเลข
                      </div>
                      <div className={`flex items-center gap-1 ${/[^A-Za-z0-9]/.test(formData.password) ? 'text-success' : ''}`}>
                        {/[^A-Za-z0-9]/.test(formData.password) ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-current opacity-30"></div>}
                        สัญลักษณ์
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-secondary" />
                    ยืนยันรหัสผ่าน
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="กรอกรหัสผ่านอีกครั้ง"
                    className="input input-bordered w-full pr-12 focus:input-secondary transition-all duration-300 bg-base-200/50"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/50 hover:text-secondary transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {formData.confirmPassword && formData.password !== formData.confirmPassword && (
                  <label className="label">
                    <span className="label-text-alt text-error">รหัสผ่านไม่ตรงกัน</span>
                  </label>
                )}
              </div>

              {/* Register Button */}
              <button
                type="submit"
                className={`btn btn-secondary btn-lg w-full mt-8 bg-gradient-to-r from-secondary to-primary border-none hover:shadow-xl transition-all duration-300 transform hover:-translate-y-0.5`}
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <span className="loading loading-spinner w-5 h-5"></span>
                    กำลังสมัครสมาชิก...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5 mr-2" />
                    สมัครสมาชิก
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
                มีบัญชีอยู่แล้ว?{" "}
                <Link href="/login" className="link link-secondary font-semibold hover:link-hover">
                  เข้าสู่ระบบ
                </Link>
              </p>
            </div>
          </div>
        </div>

        {/* Demo Info */}
        <div className="mt-6 p-4 bg-gradient-to-r from-success/10 to-info/10 rounded-xl border border-success/20 backdrop-blur-sm">
          <div className="text-center text-sm">
            <div className="badge badge-success badge-sm mb-2">ฟรี</div>
            <p className="text-base-content/70">
              สมัครสมาชิกฟรี ไม่มีค่าใช้จ่ายเพิ่มเติม
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

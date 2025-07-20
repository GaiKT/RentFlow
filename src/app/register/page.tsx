"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { customToast } from "@/lib/toast";
import { Eye, EyeOff, UserPlus, Mail, Lock, User, ArrowLeft, CheckCircle } from "lucide-react";

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

        {/* Register Card */}
        <div className="card bg-base-100 shadow-2xl border border-base-300">
          <div className="card-body p-8">
            {/* Header */}
            <div className="text-center mb-8">
              <div className="avatar mb-4">
                <div className="w-16 rounded-full bg-gradient-to-r from-secondary to-primary text-white flex items-center justify-center">
                  <UserPlus className="w-8 h-8" />
                </div>
              </div>
              <h2 className="text-3xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent">
                สมัครสมาชิก
              </h2>
              <p className="text-base-content/70 mt-2">
                เริ่มต้นจัดการห้องพักของคุณวันนี้
              </p>
            </div>

            {/* Register Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Name Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <User className="w-4 h-4" />
                    ชื่อ-นามสกุล
                  </span>
                </label>
                <input
                  type="text"
                  name="name"
                  placeholder="ชื่อ-นามสกุล"
                  className="input input-bordered w-full focus:input-primary transition-all duration-300"
                  value={formData.name}
                  onChange={handleChange}
                  required
                />
              </div>

              {/* Email Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Mail className="w-4 h-4" />
                    อีเมล
                  </span>
                </label>
                <div className="relative">
                    <input
                    type="email"
                    name="email"
                    placeholder="example@email.com"
                    className="input input-bordered w-full focus:input-primary transition-all duration-300"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    />
                </div>
              </div>

              {/* Password Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    รหัสผ่าน
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    placeholder="รหัสผ่าน (อย่างน้อย 6 ตัวอักษร)"
                    className="input input-bordered w-full pr-12 focus:input-primary transition-all duration-300"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={6}
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
                
                {/* Password Strength Indicator */}
                {formData.password && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="text-xs text-base-content/70">ความแข็งแรงของรหัสผ่าน:</div>
                      <div className={`text-xs font-medium text-${getPasswordStrengthColor(currentPasswordStrength)}`}>
                        {getPasswordStrengthText(currentPasswordStrength)}
                      </div>
                    </div>
                    <div className="flex gap-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1 flex-1 rounded ${
                            level <= currentPasswordStrength 
                              ? `bg-${getPasswordStrengthColor(currentPasswordStrength)}` 
                              : 'bg-base-300'
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm Password Field */}
              <div className="form-control">
                <label className="label">
                  <span className="label-text font-medium flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    ยืนยันรหัสผ่าน
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    name="confirmPassword"
                    placeholder="ยืนยันรหัสผ่าน"
                    className={`input input-bordered w-full pr-12 transition-all duration-300 ${
                      formData.confirmPassword && formData.password !== formData.confirmPassword
                        ? "input-error"
                        : formData.confirmPassword && formData.password === formData.confirmPassword
                        ? "input-success"
                        : "focus:input-primary"
                    }`}
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-base-content transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Match Indicator */}
                {formData.confirmPassword && (
                  <div className="mt-1">
                    {formData.password === formData.confirmPassword ? (
                      <div className="flex items-center gap-1 text-success text-xs">
                        <CheckCircle className="w-3 h-3" />
                        รหัสผ่านตรงกัน
                      </div>
                    ) : (
                      <div className="text-error text-xs">
                        รหัสผ่านไม่ตรงกัน
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Register Button */}
              <div className="form-control mt-8">
                <button
                  type="submit"
                  className={`btn btn-primary btn-lg w-full bg-gradient-to-r from-secondary to-primary border-none hover:shadow-lg transition-all duration-300 transform hover:-translate-y-1`}
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
              </div>
            </form>

            {/* Divider */}
            <div className="divider my-8 text-base-content/50">หรือ</div>

            {/* Footer Links */}
            <div className="text-center space-y-4">
              <p className="text-sm text-base-content/70">
                มีบัญชีแล้ว?{" "}
                <Link href="/login" className="link link-primary font-medium hover:link-hover">
                  เข้าสู่ระบบ
                </Link>
              </p>
              <Link href="/" className="link link-secondary text-sm hover:link-hover">
                กลับสู่หน้าหลัก
              </Link>
            </div>
          </div>
        </div>

        {/* Terms Notice */}
        <div className="mt-6 p-4 bg-warning/10 rounded-lg border border-warning/20">
          <div className="text-center text-sm text-warning">
            การสมัครสมาชิกถือว่าคุณยอมรับเงื่อนไขการใช้งานและนโยบายความเป็นส่วนตัว
          </div>
        </div>
      </div>
    </div>
  );
}

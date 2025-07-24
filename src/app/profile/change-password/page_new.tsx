"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import { 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowLeft, 
  Shield,
  Check,
  X,
  AlertTriangle
} from "lucide-react";

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  
  const router = useRouter();

  const getPasswordStrength = (password: string) => {
    if (password.length === 0) return { strength: 0, text: "", color: "" };
    if (password.length < 6) return { strength: 1, text: "อ่อน", color: "text-error" };
    if (password.length < 8) return { strength: 2, text: "ปานกลาง", color: "text-warning" };
    if (password.match(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)) {
      return { strength: 3, text: "แข็งแกร่ง", color: "text-success" };
    }
    return { strength: 2, text: "ปานกลาง", color: "text-warning" };
  };

  const passwordStrength = getPasswordStrength(newPassword);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Validation
    if (newPassword !== confirmPassword) {
      customToast.error("รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน");
      setIsLoading(false);
      return;
    }

    if (newPassword.length < 6) {
      customToast.error("รหัสผ่านใหม่ต้องมีความยาวอย่างน้อย 6 ตัวอักษร");
      setIsLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/change-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`,
        },
        body: JSON.stringify({
          currentPassword,
          newPassword,
          confirmPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        customToast.passwordChanged();
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        
        // Redirect after 2 seconds
        setTimeout(() => {
          router.push("/profile");
        }, 2000);
      } else {
        customToast.error(data.message || "เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/profile" className="btn btn-ghost btn-circle group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <Shield className="w-6 h-6 text-warning" />
                <h1 className="text-4xl font-bold">เปลี่ยนรหัสผ่าน</h1>
              </div>
              <div className="breadcrumbs text-sm">
                <ul>
                  <li><Link href="/dashboard">หน้าแรก</Link></li>
                  <li><Link href="/profile">โปรไฟล์</Link></li>
                  <li>เปลี่ยนรหัสผ่าน</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Security Info Banner */}
          <div className="alert bg-gradient-to-r from-warning/10 to-error/10 border border-warning/20 shadow-lg">
            <Shield className="w-5 h-5 text-warning" />
            <div>
              <h3 className="font-bold">การรักษาความปลอดภัย</h3>
              <div className="text-sm opacity-80">
                เพื่อความปลอดภัยของบัญชี กรุณาเลือกรหัสผ่านที่แข็งแรงและไม่เคยใช้ที่อื่น
              </div>
            </div>
          </div>
        </div>

        {/* Change Password Form */}
        <div className="card bg-base-100/80 backdrop-blur-sm shadow-2xl border border-base-300/50">
          <div className="card-body p-8">
            <h2 className="card-title text-xl mb-6 text-warning">
              <Lock className="w-6 h-6" />
              แก้ไขรหัสผ่าน
            </h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-warning" />
                    รหัสผ่านปัจจุบัน
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านปัจจุบันของคุณ"
                    className="input input-bordered w-full pr-12 focus:input-warning transition-all duration-300 bg-base-200/50"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/50 hover:text-warning transition-colors"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* New Password */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-success" />
                    รหัสผ่านใหม่
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านใหม่ (อย่างน้อย 6 ตัวอักษร)"
                    className="input input-bordered w-full pr-12 focus:input-success transition-all duration-300 bg-base-200/50"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/50 hover:text-success transition-colors"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-3 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-base-content/70">ความแข็งแรงของรหัสผ่าน:</span>
                      <span className={`text-sm font-semibold ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                    <progress 
                      className={`progress w-full h-2 ${
                        passwordStrength.strength === 1 ? 'progress-error' :
                        passwordStrength.strength === 2 ? 'progress-warning' : 'progress-success'
                      }`} 
                      value={passwordStrength.strength} 
                      max="3"
                    />
                    <div className="grid grid-cols-2 gap-2 text-xs text-base-content/60">
                      <div className={`flex items-center gap-1 ${newPassword.length >= 6 ? 'text-success' : ''}`}>
                        {newPassword.length >= 6 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        อย่างน้อย 6 ตัวอักษร
                      </div>
                      <div className={`flex items-center gap-1 ${newPassword.length >= 8 ? 'text-success' : ''}`}>
                        {newPassword.length >= 8 ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        8+ ตัวอักษร (แนะนำ)
                      </div>
                      <div className={`flex items-center gap-1 ${/[A-Z]/.test(newPassword) ? 'text-success' : ''}`}>
                        {/[A-Z]/.test(newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        ตัวอักษรตัวใหญ่
                      </div>
                      <div className={`flex items-center gap-1 ${/[0-9]/.test(newPassword) ? 'text-success' : ''}`}>
                        {/[0-9]/.test(newPassword) ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                        ตัวเลข
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Confirm New Password */}
              <div>
                <label className="label">
                  <span className="label-text font-semibold flex items-center gap-2">
                    <Lock className="w-4 h-4 text-success" />
                    ยืนยันรหัสผ่านใหม่
                  </span>
                </label>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    className="input input-bordered w-full pr-12 focus:input-success transition-all duration-300 bg-base-200/50"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-base-content/50 hover:text-success transition-colors"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    {showConfirmPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {confirmPassword && newPassword !== confirmPassword && (
                  <label className="label">
                    <span className="label-text-alt text-error flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      รหัสผ่านไม่ตรงกัน
                    </span>
                  </label>
                )}
              </div>

              {/* Submit Button */}
              <div className="divider"></div>
              <div className="flex flex-col sm:flex-row gap-4">
                <button
                  type="submit"
                  className="btn btn-warning flex-1 shadow-lg"
                  disabled={isLoading || newPassword !== confirmPassword || newPassword.length < 6}
                >
                  {isLoading ? (
                    <>
                      <span className="loading loading-spinner w-5 h-5"></span>
                      กำลังเปลี่ยนรหัสผ่าน...
                    </>
                  ) : (
                    <>
                      <Shield className="w-5 h-5" />
                      เปลี่ยนรหัสผ่าน
                    </>
                  )}
                </button>
                <Link href="/profile" className="btn btn-outline flex-1">
                  <ArrowLeft className="w-4 h-4" />
                  ยกเลิก
                </Link>
              </div>
            </form>
          </div>
        </div>

        {/* Security Tips */}
        <div className="card bg-gradient-to-br from-info/10 to-accent/10 border border-info/20 shadow-xl mt-6">
          <div className="card-body">
            <h3 className="card-title text-info mb-4">
              <Shield className="w-5 h-5" />
              เคล็ดลับความปลอดภัย
            </h3>
            <div className="space-y-2 text-sm">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-info mt-2 flex-shrink-0"></div>
                <p>ใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-info mt-2 flex-shrink-0"></div>
                <p>ผสมผสานตัวอักษรตัวใหญ่ ตัวเล็ก ตัวเลข และสัญลักษณ์</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-info mt-2 flex-shrink-0"></div>
                <p>ไม่ควรใช้ข้อมูลส่วนตัว เช่น ชื่อ วันเกิด ในรหัสผ่าน</p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-info mt-2 flex-shrink-0"></div>
                <p>ไม่ควรใช้รหัสผ่านเดียวกันกับเว็บไซต์อื่น</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

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
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/user/change-password", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
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
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/profile" className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับสู่โปรไฟล์
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-base-content">เปลี่ยนรหัสผ่าน</h1>
            <p className="text-base-content/70">อัปเดตรหัสผ่านของคุณเพื่อความปลอดภัย</p>
          </div>
        </div>

        <div className="card bg-base-100 shadow-xl">
          <div className="card-body">
            {/* Security Notice */}
            <div className="alert alert-info mb-6">
              <Shield className="w-5 h-5" />
              <div>
                <h4 className="font-bold">เคล็ดลับความปลอดภัย</h4>
                <div className="text-sm mt-1">
                  ใช้รหัสผ่านที่มีความยาวอย่างน้อย 8 ตัวอักษร ประกอบด้วยตัวอักษรพิมพ์เล็ก พิมพ์ใหญ่ และตัวเลข
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Current Password */}
              <fieldset>
                <legend className="fieldset-legend font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  รหัสผ่านปัจจุบัน
                </legend>
                <div className="relative">
                  <input
                    type={showCurrentPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านปัจจุบัน"
                    className="input input-bordered w-full validator pr-12 focus:input-primary"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-base-content transition-colors"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  >
                    {showCurrentPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </fieldset>

              {/* New Password */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  รหัสผ่านใหม่
                </legend>
                <div className="relative">
                  <input
                    type={showNewPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านใหม่"
                    className="input input-bordered w-full pr-12 focus:input-primary validator"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-base-content/50 hover:text-base-content transition-colors"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                  >
                    {showNewPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                
                {/* Password Strength Indicator */}
                {newPassword && (
                  <div className="mt-2">
                    <div className="flex items-center gap-2">
                      <div className="flex-1">
                        <progress 
                          className={`progress w-full ${
                            passwordStrength.strength === 1 ? 'progress-error' :
                            passwordStrength.strength === 2 ? 'progress-warning' :
                            passwordStrength.strength === 3 ? 'progress-success' : ''
                          }`}
                          value={passwordStrength.strength} 
                          max="3"
                        ></progress>
                      </div>
                      <span className={`text-sm font-medium ${passwordStrength.color}`}>
                        {passwordStrength.text}
                      </span>
                    </div>
                  </div>
                )}
              </fieldset>

              {/* Confirm Password */}
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  ยืนยันรหัสผ่านใหม่
                </legend>
                <div className="relative">
                  <input
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="กรอกรหัสผ่านใหม่อีกครั้ง"
                    className={`input input-bordered w-full pr-12 focus:input-primary validator ${
                      confirmPassword && newPassword !== confirmPassword ? 'input-error' : ''
                    }`}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                {confirmPassword && (
                  <div className="mt-1">
                    {newPassword === confirmPassword ? (
                      <span className="text-xs text-success flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        รหัสผ่านตรงกัน
                      </span>
                    ) : (
                      <span className="text-xs text-error flex items-center gap-1">
                        <X className="w-3 h-3" />
                        รหัสผ่านไม่ตรงกัน
                      </span>
                    )}
                  </div>
                )}
              </fieldset>

              {/* Submit Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  className="btn btn-primary btn-lg w-full"
                  disabled={isLoading || newPassword !== confirmPassword || !currentPassword || !newPassword}
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
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

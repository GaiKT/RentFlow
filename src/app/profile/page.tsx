"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { customToast } from "@/lib/toast";
import { 
  User, 
  Mail, 
  Phone, 
  Camera, 
  Save, 
  ArrowLeft, 
  Lock,
  Upload,
  X,
  Check
} from "lucide-react";

interface UserProfile {
  id: string;
  name: string;
  email: string;
  phone?: string;
  profileImage?: string;
  role: string;
  createdAt: string;
}

export default function ProfilePage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  
  // Form fields
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [profileImage, setProfileImage] = useState("");
  
  const router = useRouter();

  const fetchProfile = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        router.push("/login");
        return;
      }

      const response = await fetch("/api/user/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        setName(data.user.name || "");
        setPhone(data.user.phone || "");
        setProfileImage(data.user.profileImage || "");
      } else {
        customToast.error("ไม่สามารถดึงข้อมูลโปรไฟล์ได้");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);

    try {
      const token = localStorage.getItem("token");
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/upload/profile-image", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();

      if (response.ok) {
        const newImageUrl = data.imageUrl;
        setProfileImage(newImageUrl);
        
        // อัปเดตรูปโปรไฟล์ในฐานข้อมูลทันที
        const updateResponse = await fetch("/api/user/profile", {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            name,
            phone,
            profileImage: newImageUrl,
          }),
        });

        if (updateResponse.ok) {
          const updateData = await updateResponse.json();
          setUser(updateData.user);
        }
        
        customToast.uploaded("รูปโปรไฟล์");
      } else {
        customToast.error(data.message || "เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการอัปโหลดรูปภาพ");
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdating(true);

    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/user/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name,
          phone,
          profileImage,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setUser(data.user);
        customToast.profileUpdated();
      } else {
        customToast.error(data.message || "เกิดข้อผิดพลาดในการอัปเดตโปรไฟล์");
      }
    } catch {
      customToast.error("เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์");
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5 flex items-center justify-center">
        <div className="card bg-base-100/80 backdrop-blur-sm shadow-2xl border border-base-300/50 w-96">
          <div className="card-body items-center text-center">
            <span className="loading loading-spinner loading-lg text-primary"></span>
            <p className="text-base-content/70 mt-4">กำลังโหลดข้อมูลโปรไฟล์...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-base-100 to-secondary/5">
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-4">
            <Link href="/dashboard" className="btn btn-ghost btn-circle group">
              <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            </Link>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <User className="w-6 h-6 text-primary" />
                <h1 className="text-4xl font-bold">จัดการโปรไฟล์</h1>
              </div>
              <div className="breadcrumbs text-sm">
                <ul>
                  <li><Link href="/dashboard">หน้าแรก</Link></li>
                  <li>โปรไฟล์ผู้ใช้</li>
                </ul>
              </div>
            </div>
          </div>

          {/* User Info Banner */}
          <div className="alert bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 shadow-lg">
            <User className="w-5 h-5 text-primary" />
            <div>
              <h3 className="font-bold">สวัสดี, {user.name}!</h3>
              <div className="text-sm opacity-80">
                <Mail className="w-4 h-4 inline mr-1" />
                {user.email} | สมาชิกตั้งแต่ {new Date(user.createdAt).toLocaleDateString('th-TH')}
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
          {/* Profile Image Section */}
          <div className="xl:col-span-1">
            <div className="card bg-base-100/80 backdrop-blur-sm shadow-2xl border border-base-300/50">
              <div className="card-body text-center">
                <h2 className="card-title justify-center mb-6">
                  <Camera className="w-5 h-5 text-primary" />
                  รูปโปรไฟล์
                </h2>

                {/* Profile Image */}
                <div className="mb-6">
                  <div className="avatar mx-auto mb-4">
                    <div className="w-32 h-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                      {profileImage ? (
                        <img 
                          src={profileImage} 
                          alt="Profile" 
                          className="object-cover w-full h-full rounded-full"
                        />
                      ) : (
                        <div className="bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white">
                          <User className="w-16 h-32" />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <label className="btn btn-primary btn-sm relative cursor-pointer">
                      <Upload className="w-4 h-4 mr-2" />
                      {isUploading ? 'กำลังอัปโหลด...' : 'เปลี่ยนรูปโปรไฟล์'}
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleImageUpload}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        disabled={isUploading}
                      />
                    </label>
                    
                    {isUploading && (
                      <div className="flex items-center justify-center gap-2 text-sm text-primary">
                        <span className="loading loading-spinner loading-sm"></span>
                        กำลังอัปโหลดรูปภาพ...
                      </div>
                    )}
                  </div>
                </div>

                <div className="divider"></div>
                
                {/* User Info */}
                <div className="space-y-4">
                  <div className="bg-base-200/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Mail className="w-4 h-4 text-primary" />
                      <span className="font-semibold">อีเมล</span>
                    </div>
                    <p className="text-base-content/70">{user.email}</p>
                  </div>
                  
                  <div className="bg-base-200/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <User className="w-4 h-4 text-primary" />
                      <span className="font-semibold">บทบาท</span>
                    </div>
                    <div className={`badge ${user.role === "ADMIN" ? 'badge-error' : 'badge-info'} gap-2`}>
                      {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ผู้ใช้"}
                    </div>
                  </div>
                  
                  <div className="bg-base-200/50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Check className="w-4 h-4 text-primary" />
                      <span className="font-semibold">สมาชิกตั้งแต่</span>
                    </div>
                    <p className="text-base-content/70">
                      {new Date(user.createdAt).toLocaleDateString("th-TH", {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card bg-gradient-to-br from-warning/10 to-error/10 border border-warning/20 shadow-xl mt-6">
              <div className="card-body">
                <h3 className="card-title text-warning mb-4">
                  <Lock className="w-5 h-5" />
                  การรักษาความปลอดภัย
                </h3>
                <div className="space-y-2">
                  <Link 
                    href="/profile/change-password" 
                    className="btn btn-outline btn-warning w-full justify-start"
                  >
                    <Lock className="w-4 h-4" />
                    เปลี่ยนรหัสผ่าน
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form Section */}
          <div className="xl:col-span-2">
            <div className="card bg-base-100/80 backdrop-blur-sm shadow-2xl border border-base-300/50">
              <div className="card-body">
                <h3 className="card-title text-xl mb-6 text-primary">
                  <User className="w-6 h-6" />
                  แก้ไขข้อมูลส่วนตัว
                </h3>

                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Name Field */}
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold flex items-center gap-2">
                          <User className="w-4 h-4 text-primary" />
                          ชื่อ-นามสกุล
                        </span>
                      </label>
                      <input
                        type="text"
                        placeholder="กรอกชื่อ-นามสกุลของคุณ"
                        className="input input-bordered w-full focus:input-primary transition-all duration-300 bg-base-200/50"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required
                        minLength={2}
                      />
                    </div>

                    {/* Phone Field */}
                    <div>
                      <label className="label">
                        <span className="label-text font-semibold flex items-center gap-2">
                          <Phone className="w-4 h-4 text-primary" />
                          เบอร์โทรศัพท์
                        </span>
                      </label>
                      <input
                        type="tel"
                        placeholder="กรอกเบอร์โทรศัพท์ของคุณ"
                        className="input input-bordered w-full focus:input-primary transition-all duration-300 bg-base-200/50"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                      />
                    </div>
                  </div>

                  {/* Email Field (Read-only) */}
                  <div>
                    <label className="label">
                      <span className="label-text font-semibold flex items-center gap-2">
                        <Mail className="w-4 h-4 text-base-content/50" />
                        อีเมล
                      </span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered w-full bg-base-300/50 cursor-not-allowed"
                      value={user.email}
                      disabled
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        ไม่สามารถเปลี่ยนอีเมลได้
                      </span>
                    </label>
                  </div>

                  {/* Action Buttons */}
                  <div className="divider"></div>
                  <div className="flex flex-col sm:flex-row gap-4">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1 shadow-lg"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <span className="loading loading-spinner w-5 h-5"></span>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="w-5 h-5" />
                          บันทึกการเปลี่ยนแปลง
                        </>
                      )}
                    </button>
                    <Link href="/dashboard" className="btn btn-outline flex-1">
                      <ArrowLeft className="w-4 h-4" />
                      กลับไปแดชบอร์ด
                    </Link>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

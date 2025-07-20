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
      <div className="min-h-screen bg-base-200 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="loading loading-spinner loading-lg text-primary"></div>
          <p className="text-base-content/70">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-base-200">
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link href="/dashboard" className="btn btn-ghost btn-sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            กลับสู่แดชบอร์ด
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-base-content">โปรไฟล์ผู้ใช้</h1>
            <p className="text-base-content/70">จัดการข้อมูลส่วนตัวของคุณ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Image Section */}
          <div className="lg:col-span-1">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body text-center">
                <h3 className="card-title justify-center mb-4">รูปโปรไฟล์</h3>
                
                <div className="avatar mb-4">
                  <div className="w-32 rounded-full ring ring-primary ring-offset-base-100 ring-offset-2">
                    {profileImage ? (
                      <img src={profileImage} alt="Profile" className="rounded-full" />
                    ) : (
                      <div className="bg-neutral text-neutral-content rounded-full flex items-center justify-center">
                        <User className="w-16 h-16" />
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="file-input file-input-bordered file-input-primary w-full max-w-xs"
                    disabled={isUploading}
                  />
                  
                  {isUploading && (
                    <div className="flex items-center justify-center gap-2 text-sm text-primary">
                      <span className="loading loading-spinner loading-sm"></span>
                      กำลังอัปโหลด...
                    </div>
                  )}
                </div>

                <div className="divider"></div>
                
                <div className="text-left space-y-2">
                  <p className="text-sm text-base-content/70">
                    <strong>อีเมล:</strong> {user.email}
                  </p>
                  <p className="text-sm text-base-content/70">
                    <strong>บทบาท:</strong> {user.role === "ADMIN" ? "ผู้ดูแลระบบ" : "ผู้ใช้"}
                  </p>
                  <p className="text-sm text-base-content/70">
                    <strong>สมัครเมื่อ:</strong> {new Date(user.createdAt).toLocaleDateString("th-TH")}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Profile Form Section */}
          <div className="lg:col-span-2">
            <div className="card bg-base-100 shadow-xl">
              <div className="card-body">
                <h3 className="card-title mb-6">ข้อมูลส่วนตัว</h3>

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
                      placeholder="กรอกชื่อ-นามสกุล"
                      className="input input-bordered focus:input-primary"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      minLength={2}
                    />
                  </div>

                  {/* Email Field (Read-only) */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <Mail className="w-4 h-4" />
                        อีเมล
                      </span>
                    </label>
                    <input
                      type="email"
                      className="input input-bordered bg-base-200 cursor-not-allowed"
                      value={user.email}
                      disabled
                    />
                    <label className="label">
                      <span className="label-text-alt text-base-content/60">
                        ไม่สามารถเปลี่ยนอีเมลได้
                      </span>
                    </label>
                  </div>

                  {/* Phone Field */}
                  <div className="form-control">
                    <label className="label">
                      <span className="label-text font-medium flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        เบอร์โทรศัพท์
                      </span>
                    </label>
                    <input
                      type="tel"
                      placeholder="กรอกเบอร์โทรศัพท์ (ไม่บังคับ)"
                      className="input input-bordered focus:input-primary"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                    />
                  </div>

                  {/* Action Buttons */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="submit"
                      className="btn btn-primary flex-1"
                      disabled={isUpdating}
                    >
                      {isUpdating ? (
                        <>
                          <span className="loading loading-spinner w-4 h-4"></span>
                          กำลังบันทึก...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          บันทึกการเปลี่ยนแปลง
                        </>
                      )}
                    </button>
                    
                    <Link href="/profile/change-password" className="btn btn-outline btn-warning">
                      <Lock className="w-4 h-4" />
                      เปลี่ยนรหัสผ่าน
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

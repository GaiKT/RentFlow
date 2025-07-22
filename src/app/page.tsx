import Link from "next/link";
import { Building, FileText, Receipt, Bell, Star, Shield, Clock, Users } from "lucide-react";
import ThemeSwitcher from "@/components/theme-switcher";

export default function Home() {
  const features = [
    {
      icon: <Building className="w-12 h-12" />,
      title: "จัดการห้องพัก",
      description: "เพิ่ม แก้ไข และจัดการข้อมูลห้องพัก พร้อมติดตามสถานะแบบเรียลไทม์",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: <FileText className="w-12 h-12" />,
      title: "จัดการสัญญา",
      description: "อัปโหลด ดาวน์โหลด และจัดเก็บเอกสารสัญญาแบบดิจิทัลอย่างปลอดภัย",
      color: "from-green-500 to-green-600"
    },
    {
      icon: <Receipt className="w-12 h-12" />,
      title: "ใบแจ้งหนี้ & ใบเสร็จ",
      description: "สร้างและพิมพ์ใบแจ้งหนี้และใบเสร็จรับเงินอัตโนมัติด้วยเทมเพลตสวยงาม",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: <Bell className="w-12 h-12" />,
      title: "การแจ้งเตือน",
      description: "แจ้งเตือนสัญญาใกล้หมดอายุและถึงเวลาเก็บค่าเช่าแบบอัตโนมัติ",
      color: "from-purple-500 to-purple-600"
    },
  ];

  const benefits = [
    {
      icon: <Shield className="w-8 h-8 text-primary" />,
      title: "ความปลอดภัย",
      description: "ข้อมูลของคุณได้รับการป้องกันด้วยระบบรักษาความปลอดภัยระดับสูง"
    },
    {
      icon: <Clock className="w-8 h-8 text-secondary" />,
      title: "ประหยัดเวลา",
      description: "ลดเวลาการทำงานด้วยระบบอัตโนมัติและการจัดการที่มีประสิทธิภาพ"
    },
    {
      icon: <Users className="w-8 h-8 text-accent" />,
      title: "ใช้งานง่าย",
      description: "อินเทอร์เฟซที่เข้าใจง่าย เหมาะสำหรับทุกคนไม่ว่าจะมีประสบการณ์หรือไม่"
    },
  ];

  return (
    <div className="min-h-screen bg-base-200">
      {/* Navigation */}
      <div className="navbar bg-base-100/80 backdrop-blur-md shadow-lg fixed top-0 z-50 border-b border-base-300/50">
        <div className="navbar-start">
          <Link href="/" className="btn btn-ghost text-xl font-bold text-primary">
            <Building className="w-6 h-6 mr-2" />
            ระบบจัดการห้องพัก
          </Link>
        </div>
        <div className="navbar-end gap-2">
          <ThemeSwitcher />
          <Link href="/login" className="btn btn-primary">
            เข้าสู่ระบบ
          </Link>
          <Link href="/register" className="btn btn-outline btn-primary">
            สมัครสมาชิก
          </Link>
        </div>
      </div>

      {/* Hero Section */}
      <div className="hero min-h-screen bg-gradient-to-br from-primary via-secondary to-accent relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="absolute inset-0 bg-grid-white/10 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))]"></div>
        
        <div className="hero-content text-center text-white relative z-10">
          <div className="max-w-4xl">
            <div className="mb-8">
              <div className="inline-flex items-center gap-2 bg-white/20 backdrop-blur-sm px-4 py-2 rounded-full text-sm mb-6">
                <Star className="w-4 h-4 text-yellow-300" />
                <span>ระบบจัดการห้องพักอันดับ 1</span>
              </div>
              
              <h1 className="mb-8 text-5xl lg:text-7xl font-bold leading-tight">
                จัดการห้องพัก
                <br />
                <span className="bg-gradient-to-r from-yellow-300 to-orange-300 bg-clip-text text-transparent">
                  อย่างมืออาชีพ
                </span>
              </h1>
              
              <p className="mb-8 text-xl lg:text-2xl text-white/90 max-w-3xl mx-auto leading-relaxed">
                จัดการห้องพัก สัญญา ใบแจ้งหนี้ และใบเสร็จรับเงิน ได้อย่างง่ายดาย
                <br />
                พร้อมระบบแจ้งเตือนอัตโนมัติและรายงานที่ครบถ้วน
              </p>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Link 
                href="/register" 
                className="btn btn-lg bg-white text-primary border-none hover:bg-white/90 shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                เริ่มต้นใช้งานฟรี
                <svg className="w-5 h-5 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </Link>
              
              <Link 
                href="/login" 
                className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary hover:border-white transform hover:scale-105 transition-all duration-300"
              >
                เข้าสู่ระบบ
              </Link>
            </div>

            <div className="mt-16 flex flex-wrap justify-center gap-8 text-white/80">
              <div className="text-center">
                <div className="text-3xl font-bold">500+</div>
                <div className="text-sm">ผู้ใช้งาน</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">10K+</div>
                <div className="text-sm">ห้องพักที่จัดการ</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold">99.9%</div>
                <div className="text-sm">อัพไทม์</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="py-24 bg-base-100">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
              ฟีเจอร์ครบครัน
            </h2>
            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
              เครื่องมือที่ออกแบบมาเพื่อการจัดการห้องพักที่มีประสิทธิภาพสูงสุด
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div 
                key={index}
                className="group card bg-base-200 shadow-xl hover:shadow-2xl transition-all duration-500 transform hover:-translate-y-4 border border-base-300/50"
              >
                <div className="card-body text-center p-8">
                  <div className={`mx-auto w-20 h-20 rounded-2xl bg-gradient-to-r ${feature.color} text-white flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                    {feature.icon}
                  </div>
                  <h3 className="card-title justify-center text-xl font-bold mb-4">
                    {feature.title}
                  </h3>
                  <p className="text-base-content/70 leading-relaxed">
                    {feature.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Benefits Section */}
      <div className="py-24 bg-gradient-to-br from-base-200 to-base-300">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              ทำไมต้องเลือกเรา?
            </h2>
            <p className="text-xl text-base-content/70 max-w-2xl mx-auto">
              เราเข้าใจความต้องการของเจ้าของห้องพักและสร้างโซลูชันที่ตอบโจทย์จริง
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {benefits.map((benefit, index) => (
              <div key={index} className="card bg-base-100 shadow-xl hover:shadow-2xl transition-all duration-300">
                <div className="card-body text-center p-8">
                  <div className="mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="text-xl font-bold mb-4">{benefit.title}</h3>
                  <p className="text-base-content/70">{benefit.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-24 bg-gradient-to-r from-primary to-secondary">
        <div className="container mx-auto px-4 text-center">
          <div className="max-w-3xl mx-auto text-white">
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              พร้อมเริ่มต้นแล้วหรือยัง?
            </h2>
            <p className="text-xl mb-8 text-white/90">
              สมัครสมาชิกวันนี้และเริ่มจัดการห้องพักของคุณอย่างมืออาชีพ
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                href="/register" 
                className="btn btn-lg bg-white text-primary border-none hover:bg-white/90 shadow-xl"
              >
                เริ่มต้นใช้งานฟรี
              </Link>
              <Link 
                href="/login" 
                className="btn btn-lg btn-outline border-white text-white hover:bg-white hover:text-primary"
              >
                เข้าสู่ระบบ
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="footer footer-center p-10 bg-base-300 text-base-content border-t border-base-300">
        <div>
          <div className="flex items-center gap-2 text-2xl font-bold text-primary mb-4">
            <Building className="w-8 h-8" />
            ระบบจัดการห้องพัก
          </div>
          <p className="font-semibold">
            Rental Property Management System
          </p>
          <p className="text-base-content/70">
            ระบบจัดการห้องพักที่ทันสมัยและใช้งานง่าย
          </p>
          <p className="text-sm text-base-content/60 mt-4">
            Copyright © 2025 - สงวนลิขสิทธิ์ | Made with ❤️ in Thailand
          </p>
        </div>
      </footer>
    </div>
  );
}

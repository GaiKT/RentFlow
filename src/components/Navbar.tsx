"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Building, 
  FileText, 
  Receipt, 
  DollarSign, 
  Bell, 
  Settings, 
  LogOut,
  Menu,
  X
} from "lucide-react";
import { useState } from "react";
import ThemeSwitcher from "./theme-switcher";
import NotificationDropdown from "./NotificationDropdown";
import { useNotifications } from "@/hooks/useNotifications";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  profileImage?: string;
}

interface NavbarProps {
  user: User;
  onLogout: () => void;
  notificationCount?: number;
}

export function Navbar({ user, onLogout }: NavbarProps) {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const {
    notifications,
    stats,
    loading,
    markAsRead,
    markAllAsRead,
    deleteNotification,
  } = useNotifications();

  const navigation = [
    { name: "หน้าหลัก", href: "/dashboard", icon: Home },
    { name: "ห้องพัก", href: "/dashboard/rooms", icon: Building },
    { name: "สัญญา", href: "/dashboard/contracts", icon: FileText },
    { name: "ใบแจ้งหนี้", href: "/dashboard/invoices", icon: DollarSign },
    { name: "ใบเสร็จ", href: "/dashboard/receipts", icon: Receipt },
    { name: "บันทึกกิจกรรม", href: "/dashboard/activity-logs", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return pathname === href;
    }
    return pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop Navbar */}
      <div className="navbar bg-base-100 shadow-lg border-b border-base-300 sticky top-0 z-[60]">
        <div className="navbar-start">
          <Link href="/dashboard" className="btn btn-ghost text-xl font-bold text-primary">
            <Building className="w-6 h-6 mr-2" />
            RentFlow
          </Link>
        </div>

        {/* Desktop Navigation */}
        <div className="navbar-center hidden lg:flex">
          <ul className="menu menu-horizontal px-1 gap-2">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className={`btn btn-ghost btn-sm ${
                      isActive(item.href) 
                        ? "bg-primary text-primary-content" 
                        : "text-base-content hover:bg-base-200"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        <div className="navbar-end">
          {/* Theme Switcher */}
          <ThemeSwitcher />

          {/* Notifications */}
          <NotificationDropdown />

          {/* User Menu */}
          <div className="dropdown dropdown-end">
            <label tabIndex={0} className="btn btn-ghost btn-circle avatar">
              <div className="w-10 rounded-full overflow-hidden">
                {user?.profileImage ? (
                  <img 
                    src={user.profileImage} 
                    alt={user.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full bg-primary text-primary-content flex items-center justify-center font-semibold">
                    {user?.name?.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
            </label>
            <ul
              tabIndex={0}
              className="menu menu-sm dropdown-content mt-3 z-[70] p-2 shadow-xl bg-base-100 rounded-box w-64 border border-base-300"
            >
              <li className="px-4 py-2 border-b border-base-300">
                <div className="flex flex-col">
                  <span className="font-semibold">{user?.name}</span>
                  <span className="text-sm text-base-content/70">{user?.email}</span>
                  <span className="badge badge-primary badge-sm mt-1">{user?.role}</span>
                </div>
              </li>
              <li>
                <Link href="/profile" className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  ตั้งค่าบัญชี
                </Link>
              </li>
              <li>
                <button onClick={onLogout} className="flex items-center gap-2 text-error">
                  <LogOut className="w-4 h-4" />
                  ออกจากระบบ
                </button>
              </li>
            </ul>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="btn btn-ghost btn-circle lg:hidden ml-2"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileMenuOpen && (
        <div className="lg:hidden bg-base-100 border-b border-base-300 shadow-lg">
          <ul className="menu menu-vertical w-full p-4">
            {navigation.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.href} className="w-full">
                  <Link
                    href={item.href}
                    className={`flex items-center gap-3 ${
                      isActive(item.href) 
                        ? "bg-primary text-primary-content" 
                        : "text-base-content"
                    }`}
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </>
  );
}

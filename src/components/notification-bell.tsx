"use client";

import { useState, useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Bell,
  Check,
  TrendingUp,
  TrendingDown,
  MessageCircle,
  Heart,
  CreditCard,
  Info,
  CheckCheck,
} from "lucide-react";
import { formatArabicDate } from "@/lib/format";

type Notification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link: string | null;
  isRead: boolean;
  createdAt: string;
};

const NOTIF_ICONS: Record<string, typeof Bell> = {
  transaction: TrendingUp,
  comment: MessageCircle,
  favorite: Heart,
  payment: CreditCard,
  listing: Info,
  system: Bell,
};

const NOTIF_COLORS: Record<string, string> = {
  transaction: "bg-blue-100 text-blue-700",
  comment: "bg-green-100 text-green-700",
  favorite: "bg-red-100 text-red-700",
  payment: "bg-purple-100 text-purple-700",
  listing: "bg-amber-100 text-amber-700",
  system: "bg-gray-100 text-gray-700",
};

export function NotificationBell() {
  const { data: session } = useSession();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch("/api/notifications?limit=20");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    if (session?.user) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      fetchNotifications();
      // Poll every 30 seconds for new notifications
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [session]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [open]);

  const handleMarkAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await fetch(`/api/notifications/${id}`, { method: "PATCH" });
  };

  const handleMarkAllAsRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await fetch("/api/notifications/read-all", { method: "PATCH" });
    toast({ title: "تم تحديد الكل كمقروء", duration: 1500 });
  };

  if (!session?.user) return null;

  return (
    <div className="relative" ref={dropdownRef}>
      <Button
        variant="ghost"
        size="icon"
        className="text-primary-foreground hover:bg-primary-foreground/10 relative"
        aria-label="الإشعارات"
        title="الإشعارات"
        onClick={() => {
          setOpen(!open);
          if (!open) {
            setLoading(true);
            fetchNotifications().finally(() => setLoading(false));
          }
        }}
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -left-0.5 bg-destructive text-white text-xs font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </Button>

      {open && (
        <div className="absolute left-0 top-full mt-2 w-80 sm:w-96 bg-popover text-popover-foreground rounded-lg shadow-xl border border-border z-50 overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between p-3 border-b">
            <h3 className="font-cairo font-bold flex items-center gap-2">
              <Bell className="h-4 w-4" />
              الإشعارات
              {unreadCount > 0 && (
                <Badge className="bg-destructive text-white text-xs">
                  {unreadCount} جديد
                </Badge>
              )}
            </h3>
            {unreadCount > 0 && (
              <Button
                variant="ghost"
                size="sm"
                className="h-7 text-xs"
                onClick={handleMarkAllAsRead}
              >
                <CheckCheck className="h-3 w-3 ml-1" />
                تحديد الكل كمقروء
              </Button>
            )}
          </div>

          {/* List */}
          <ScrollArea className="max-h-[60vh]">
            {loading ? (
              <div className="p-8 text-center text-sm text-muted-foreground">
                جارٍ التحميل...
              </div>
            ) : notifications.length === 0 ? (
              <div className="p-8 text-center">
                <Bell className="h-10 w-10 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm text-muted-foreground">لا توجد إشعارات</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {notifications.map((n) => {
                  const Icon = NOTIF_ICONS[n.type] || Bell;
                  const color = NOTIF_COLORS[n.type] || NOTIF_COLORS.system;
                  return (
                    <div
                      key={n.id}
                      className={`p-3 hover:bg-muted/50 cursor-pointer transition-colors ${
                        !n.isRead ? "bg-primary/5" : ""
                      }`}
                      onClick={() => {
                        if (!n.isRead) handleMarkAsRead(n.id);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <div className={`${color} rounded-full p-1.5 shrink-0`}>
                          <Icon className="h-3.5 w-3.5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-cairo font-bold text-sm leading-snug">
                              {n.title}
                            </span>
                            {!n.isRead && (
                              <span className="w-2 h-2 bg-primary rounded-full shrink-0 mt-1" />
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                            {n.message}
                          </p>
                          <div className="text-[10px] text-muted-foreground mt-1">
                            {formatArabicDate(new Date(n.createdAt))}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>
      )}
    </div>
  );
}

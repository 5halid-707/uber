"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Car, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black px-4">
      <div className="text-center text-white max-w-md">
        <div className="w-20 h-20 bg-white rounded-2xl flex items-center justify-center mx-auto mb-6">
          <Car className="w-12 h-12 text-black" />
        </div>
        <h1 className="text-8xl font-bold mb-4">404</h1>
        <h2 className="text-2xl font-bold mb-3">الصفحة غير موجودة</h2>
        <p className="text-zinc-400 mb-8">
          عذراً، الصفحة التي تبحث عنها غير موجودة أو تم نقلها.
        </p>
        <Link href="/">
          <Button className="bg-white text-black hover:bg-zinc-200 h-12 px-8">
            <Home className="w-4 h-4 ml-2" />
            العودة للرئيسية
          </Button>
        </Link>
      </div>
    </div>
  );
}

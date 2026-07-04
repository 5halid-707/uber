import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "الجوال أو البريد", type: "text" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const { identifier, password } = credentials;

        const user = await db.user.findFirst({
          where: {
            OR: [{ phone: identifier }, { email: identifier }],
          },
        });

        if (!user) {
          throw new Error("المستخدم غير موجود. الرجاء إنشاء حساب أولاً.");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("كلمة المرور غير صحيحة");
        }

        return {
          id: user.id,
          name: user.username,
          email: user.email || user.phone,
          phone: user.phone,
          image: user.avatar || null,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as { phone?: string }).phone;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin || false;
        token.isVerified = (user as { isVerified?: boolean }).isVerified || false;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { id?: string }).id = token.id as string;
        (session.user as { phone?: string }).phone = token.phone as string;
        (session.user as { isAdmin?: boolean }).isAdmin = token.isAdmin as boolean;
        (session.user as { isVerified?: boolean }).isVerified = token.isVerified as boolean;
      }
      return session;
    },
  },
  pages: {
    signIn: "/",
    error: "/",
  },
  secret: process.env.NEXTAUTH_SECRET,
  debug: false,
};

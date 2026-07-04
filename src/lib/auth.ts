import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { logActivity } from "@/lib/activity";
import { sendEmail, welcomeEmail, getAdminEmail, newUserRegistrationEmail } from "@/lib/email";

export const authOptions: NextAuthOptions = {
  // Use Prisma Adapter for Google OAuth (stores accounts/sessions in DB)
  adapter: PrismaAdapter(db),
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  providers: [
    // Email + Password provider
    CredentialsProvider({
      name: "credentials",
      credentials: {
        identifier: { label: "البريد الإلكتروني", type: "email" },
        password: { label: "كلمة المرور", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) {
          return null;
        }

        const { identifier, password } = credentials;
        const identifierLower = identifier.toLowerCase().trim();

        // Find user by email
        const user = await db.user.findFirst({
          where: {
            OR: [
              { email: identifierLower },
              { phone: identifier },
            ],
          },
        });

        if (!user) {
          throw new Error("المستخدم غير موجود. الرجاء إنشاء حساب أولاً.");
        }

        if (!user.password) {
          throw new Error("هذا الحساب مسجل عبر Google. الرجاء تسجيل الدخول بـ Google.");
        }

        const isValid = await bcrypt.compare(password, user.password);
        if (!isValid) {
          throw new Error("كلمة المرور غير صحيحة");
        }

        await logActivity({
          userId: user.id,
          action: "login",
          description: `تسجيل دخول: ${user.username}`,
        });

        return {
          id: user.id,
          name: user.username,
          email: user.email,
          phone: user.phone,
          image: user.avatar || null,
          isAdmin: user.isAdmin,
          isVerified: user.isVerified,
        };
      },
    }),
    // Google OAuth provider
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_CLIENT_ID !== "placeholder_google_client_id"
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ user, account, profile }) {
      // For Google sign-in, create user if doesn't exist (handled by adapter)
      if (account?.provider === "google" && user.email) {
        const existingUser = await db.user.findUnique({
          where: { email: user.email.toLowerCase() },
        });

        if (existingUser) {
          await logActivity({
            userId: existingUser.id,
            action: "login_google",
            description: `تسجيل دخول بـ Google: ${existingUser.username}`,
          });
        } else {
          // New user via Google - notify admin
          const adminEmail = await getAdminEmail();
          const newUser = await db.user.findUnique({
            where: { email: user.email.toLowerCase() },
          });
          if (newUser) {
            await logActivity({
              userId: newUser.id,
              action: "register_google",
              description: `تسجيل جديد بـ Google: ${newUser.username}`,
            });
            // Send welcome email to user
            await sendEmail(welcomeEmail({ username: newUser.username, email: newUser.email }));
            // Notify admin
            await sendEmail(newUserRegistrationEmail(adminEmail, {
              username: newUser.username,
              email: newUser.email,
              phone: newUser.phone,
              city: newUser.city,
              createdAt: newUser.createdAt,
            }));
          }
        }
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.phone = (user as { phone?: string }).phone;
        token.isAdmin = (user as { isAdmin?: boolean }).isAdmin || false;
        token.isVerified = (user as { isVerified?: boolean }).isVerified || false;

        // For Google sign-in, fetch user from DB to get isAdmin
        if ((user as { isAdmin?: boolean }).isAdmin === undefined && user.email) {
          const dbUser = await db.user.findUnique({
            where: { email: user.email.toLowerCase() },
            select: { isAdmin: true, isVerified: true, phone: true },
          });
          token.isAdmin = dbUser?.isAdmin || false;
          token.isVerified = dbUser?.isVerified || false;
          token.phone = dbUser?.phone;
        }
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

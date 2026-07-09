import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const db = new PrismaClient();

async function main() {
  const hash = await bcrypt.hash("123456", 10);
  const adminHash = await bcrypt.hash("Admin@2026", 10);

  const admin = await db.user.upsert({
    where: { email: "grouthhacker@gmail.com" },
    update: { password: adminHash, isAdmin: true, isVerified: true },
    create: {
      name: "المالك",
      email: "grouthhacker@gmail.com",
      phone: "0500000000",
      password: adminHash,
      isAdmin: true,
      isVerified: true,
      city: "الرياض",
    },
  });
  console.log("✅ Admin:", admin.email);

  const rider = await db.user.upsert({
    where: { email: "saad@example.com" },
    update: {},
    create: {
      name: "سعد العمري",
      email: "saad@example.com",
      phone: "0501111111",
      password: hash,
      isVerified: true,
      city: "الرياض",
      walletBalance: 500,
    },
  });
  console.log("✅ Rider:", rider.email);

  const driverUser = await db.user.upsert({
    where: { email: "ahmed@driver.com" },
    update: {},
    create: {
      name: "أحمد السائق",
      email: "ahmed@driver.com",
      phone: "0502222222",
      password: hash,
      isVerified: true,
      isDriver: true,
      city: "جدة",
    },
  });
  console.log("✅ Driver user:", driverUser.email);

  await db.driver.upsert({
    where: { userId: driverUser.id },
    update: {},
    create: {
      userId: driverUser.id,
      carModel: "تويوتا كامري 2024",
      carPlate: "ABC 1234",
      carColor: "أبيض",
      licenseNumber: "LIC-2024-001",
      isOnline: true,
      isVerified: true,
      isApproved: true,
      approvalStatus: "approved",
    },
  });
  console.log("✅ Driver profile created");

  console.log("\n--- Accounts ---");
  console.log("Admin:  grouthhacker@gmail.com / Admin@2026");
  console.log("Rider:  saad@example.com / 123456");
  console.log("Driver: ahmed@driver.com / 123456");
}

main()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());

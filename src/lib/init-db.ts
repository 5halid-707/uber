import { db } from './db'
import bcrypt from 'bcryptjs'
import { SQL_STATEMENTS } from './sql-schema'

let initPromise: Promise<void> | null = null

async function ensureSchema() {
  try {
    await db.user.count()
  } catch (e) {
    console.log('[init-db] Creating', SQL_STATEMENTS.length, 'tables...')
    for (const sql of SQL_STATEMENTS) {
      try { await db.$executeRawUnsafe(sql) } catch (e: any) {}
    }
    console.log('[init-db] Tables created')
  }
}

async function seedIfEmpty() {
  const userCount = await db.user.count()
  if (userCount > 0) return
  console.log('[init-db] Seeding...')

  const adminPass = await bcrypt.hash('Admin@2026', 10)
  const admin = await db.user.create({
    data: {
      name: '\u062e\u0627\u0644\u062f \u0627\u0644\u062d\u0631\u0628\u064a',
      email: 'khalid-alharbi@zohomail.sa',
      phone: '0575015019',
      password: adminPass,
      city: '\u062c\u062f\u0629',
      region: '\u0645\u0646\u0637\u0642\u0629 \u0645\u0643\u0629',
      walletBalance: 0,
      isAdmin: true,
      isDriver: false,
      isVerified: true,
      rating: 5.0,
      tripsCount: 0,
    },
  })

  // Demo driver
  const driverPass = await bcrypt.hash('123456', 10)
  await db.user.create({
    data: {
      name: '\u0623\u062d\u0645\u062f \u0627\u0644\u0633\u0639\u0648\u062f\u064a',
      email: 'ahmed@driver.com',
      phone: '0551234567',
      password: driverPass,
      city: '\u0627\u0644\u0631\u064a\u0627\u0636',
      region: '\u0645\u0646\u0637\u0642\u0629 \u0627\u0644\u0631\u064a\u0627\u0636',
      walletBalance: 250,
      isAdmin: false,
      isDriver: true,
      isVerified: true,
      rating: 4.8,
      tripsCount: 142,
    },
  })

  // Demo user
  await db.user.create({
    data: {
      name: '\u0633\u0639\u062f \u0627\u0644\u0642\u062d\u0637\u0627\u0646\u064a',
      email: 'saad@example.com',
      phone: '0567654321',
      password: driverPass,
      city: '\u062c\u062f\u0629',
      region: '\u0645\u0646\u0637\u0642\u0629 \u0645\u0643\u0629',
      walletBalance: 50,
      isAdmin: false,
      isDriver: false,
      isVerified: true,
      rating: 4.5,
      tripsCount: 23,
    },
  })

  // Seed service prices
  const services = [
    { serviceType: 'ride_city', basePrice: 10, perKm: 1.5, minPrice: 10, isActive: true },
    { serviceType: 'ride_airport', basePrice: 25, perKm: 2.0, minPrice: 25, isActive: true },
    { serviceType: 'delivery_food', basePrice: 8, perKm: 1.0, minPrice: 8, isActive: true },
    { serviceType: 'delivery_package', basePrice: 12, perKm: 1.5, minPrice: 12, isActive: true },
    { serviceType: 'trucking', basePrice: 50, perKm: 3.0, minPrice: 50, isActive: true },
  ]
  for (const s of services) {
    try { await db.servicePrice.create({ data: s }) } catch(e) {}
  }

  // Site settings
  try {
    await db.siteSettings.create({
      data: {
        supportEmail: 'khalid-alharbi@zohomail.sa',
        adminEmail: 'khalid-alharbi@zohomail.sa',
        phone: '+966575015019',
        whatsapp: '966575015019',
        customerService: '920000000',
      },
    })
  } catch(e) {}

  console.log('[init-db] Seed complete: admin + driver + user + services')
}

export async function initDb(): Promise<void> {
  if (initPromise) return initPromise
  initPromise = (async () => {
    try { await ensureSchema(); await seedIfEmpty() }
    catch (e) { initPromise = null; console.error('[init-db] failed:', e) }
  })()
  return initPromise
}

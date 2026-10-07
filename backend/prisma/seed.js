// ============================================================================
// DEVELOPMENT SEED - VETERINARY DIRECTORY (Phase 7)
//
// These are FICTIONAL development records used to populate the Veterinary
// Directory while the platform is being built.
//
// - Every person here is invented. None of these are real veterinarians,
//   government officers or real people.
// - Contact details are placeholders: emails use the reserved example.com
//   domain and phone numbers use obvious dummy digits.
// - No government body is claimed or implied, and no real credentials,
//   registration numbers or affiliations are invented.
// - Records are NOT linked to login accounts (userId stays null), so seeding
//   never creates a real user or affects authentication.
//
// Run with:  npm run seed   (or: npx prisma db seed)
//
// Safe to run more than once - it does nothing if demo records already exist.
// ============================================================================
const prisma = require('../src/config/prisma');

const DEMO_EMAIL_DOMAIN = '@example.com';

// Name, professional type, province, district, specialisation, availability.
const DEMO_PROFESSIONALS = [
  {
    name: 'Dr Tendai Marange',
    professionalType: 'Veterinary Surgeon',
    phone: '+263 77 000 0001',
    email: 'tendai.marange@example.com',
    province: 'Harare',
    district: 'Harare',
    specialisation: 'Cattle',
    availability: 'Weekdays 08:00 - 16:00',
  },
  {
    name: 'Rudo Chikwanha',
    professionalType: 'Veterinary Surgeon',
    phone: '+263 77 000 0002',
    email: 'rudo.chikwanha@example.com',
    province: 'Harare',
    district: 'Mashonaland East',
    specialisation: 'Poultry',
    availability: 'Monday to Friday, mornings',
  },
  {
    name: 'Farai Zhou',
    professionalType: 'Animal Health Technician',
    phone: '+263 77 000 0003',
    email: 'farai.zhou@example.com',
    province: 'Harare',
    district: 'Harare',
    specialisation: 'Pigs',
    availability: 'Weekdays 07:00 - 15:00',
  },
  {
    name: 'Blessing Nyathi',
    professionalType: 'Veterinary Officer',
    phone: '+263 77 000 0004',
    email: 'blessing.nyathi@example.com',
    province: 'Mashonaland East',
    district: 'Marondera',
    specialisation: 'Cattle and goats',
    availability: 'Weekdays, on call in emergencies',
  },
  {
    name: 'Tatenda Moyo',
    professionalType: 'Extension Officer',
    phone: '+263 77 000 0005',
    email: 'tatenda.moyo@example.com',
    province: 'Mashonaland East',
    district: 'Mutare',
    specialisation: 'Livestock health (general)',
    availability: 'Field visits - contact by phone',
  },
  {
    name: 'Ruvimbo Chirwa',
    professionalType: 'Veterinary Officer',
    phone: '+263 77 000 0006',
    email: 'ruvimbo.chirwa@example.com',
    province: 'Manicaland',
    district: 'Mutare',
    specialisation: 'Goats',
    availability: 'Weekdays 08:00 - 16:30',
  },
  {
    name: 'Memory Sibanda',
    professionalType: 'Animal Health Technician',
    phone: '+263 77 000 0007',
    email: 'memory.sibanda@example.com',
    province: 'Manicaland',
    district: 'Chipinge',
    specialisation: 'Sheep',
    availability: 'Monday, Wednesday, Friday',
  },
  {
    name: 'Chenairo Mutasa',
    professionalType: 'Veterinary Surgeon',
    phone: '+263 77 000 0008',
    email: 'chenairo.mutasa@example.com',
    province: 'Masvingo',
    district: 'Masvingo',
    specialisation: 'Cattle',
    availability: 'Weekdays 08:00 - 17:00',
  },
  {
    name: 'Rutendo Dube',
    professionalType: 'Veterinary Officer',
    phone: '+263 77 000 0009',
    email: 'rutendo.dube@example.com',
    province: 'Masvingo',
    district: 'Chiredzi',
    specialisation: 'Poultry',
    availability: 'Weekdays, weekends on call',
  },
  {
    name: 'Blessing Katsande',
    professionalType: 'Extension Officer',
    phone: '+263 77 000 0010',
    email: 'blessing.katsande@example.com',
    province: 'Midlands',
    district: 'Gweru',
    specialisation: 'Livestock health (general)',
    availability: 'Field visits - contact by phone',
  },
  {
    name: 'Nyasha Mpofu',
    professionalType: 'Veterinary Officer',
    phone: '+263 77 000 0011',
    email: 'nyasha.mpofu@example.com',
    province: 'Midlands',
    district: 'Kwekwe',
    specialisation: 'Beef and dairy cattle',
    availability: 'Weekdays 08:00 - 16:00',
  },
  {
    name: 'Tafara Banda',
    professionalType: 'Animal Health Technician',
    phone: '+263 77 000 0012',
    email: 'tafara.banda@example.com',
    province: 'Midlands',
    district: 'Shurugwi',
    specialisation: 'Goats and sheep',
    availability: 'Tuesday to Saturday, mornings',
  },
];

const run = async () => {
  console.log('==========================================================');
  console.log(' DEVELOPMENT SEED - VETERINARY DIRECTORY');
  console.log(' All records are FICTIONAL demo data, not real people.');
  console.log('==========================================================\n');

  const existing = await prisma.veterinaryProfessional.count({
    where: { email: { endsWith: DEMO_EMAIL_DOMAIN } },
  });

  if (existing > 0) {
    console.log(`Directory demo records already present (${existing}). Nothing to do.`);
    return;
  }

  // createMany is a single round trip and never touches the User table.
  const result = await prisma.veterinaryProfessional.createMany({
    data: DEMO_PROFESSIONALS.map((professional) => ({
      ...professional,
      isActive: true,
    })),
  })

  console.log(`Created ${result.count} demo professionals.`);
  const byProvince = await prisma.veterinaryProfessional.groupBy({
    by: ['province'],
    where: { email: { endsWith: DEMO_EMAIL_DOMAIN } },
    _count: { _all: true },
  })
  byProvince.forEach((row) => console.log(`  ${row.province}: ${row._count._all}`));
};

run()
  .catch((error) => {
    console.error('Seed failed:', error);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
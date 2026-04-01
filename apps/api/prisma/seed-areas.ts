import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const bangaloreAreas = [
  // ── South Bangalore ──
  { name: 'Koramangala', zone: 'South', pincodes: ['560034', '560095'], latitude: 12.9352, longitude: 77.6245 },
  { name: 'HSR Layout', zone: 'South', pincodes: ['560102'], latitude: 12.9116, longitude: 77.6389 },
  { name: 'BTM Layout', zone: 'South', pincodes: ['560029', '560076'], latitude: 12.9166, longitude: 77.6101 },
  { name: 'JP Nagar', zone: 'South', pincodes: ['560078', '560062'], latitude: 12.9063, longitude: 77.5857 },
  { name: 'Jayanagar', zone: 'South', pincodes: ['560041', '560011', '560069', '560070'], latitude: 12.9308, longitude: 77.5838 },
  { name: 'Banashankari', zone: 'South', pincodes: ['560050', '560070', '560085'], latitude: 12.9255, longitude: 77.5468 },
  { name: 'Basavanagudi', zone: 'South', pincodes: ['560004', '560019'], latitude: 12.9422, longitude: 77.5737 },
  { name: 'Bannerghatta Road', zone: 'South', pincodes: ['560076', '560083'], latitude: 12.8878, longitude: 77.5974 },
  { name: 'Electronic City', zone: 'South', pincodes: ['560100', '560099'], latitude: 12.8399, longitude: 77.6770 },
  { name: 'Bommanahalli', zone: 'South', pincodes: ['560068'], latitude: 12.8900, longitude: 77.6184 },
  { name: 'Arekere', zone: 'South', pincodes: ['560076'], latitude: 12.8930, longitude: 77.6040 },
  { name: 'Begur', zone: 'South', pincodes: ['560068', '560114'], latitude: 12.8725, longitude: 77.6230 },
  { name: 'Hulimavu', zone: 'South', pincodes: ['560076'], latitude: 12.8780, longitude: 77.6010 },
  { name: 'Kudlu Gate', zone: 'South', pincodes: ['560068'], latitude: 12.8830, longitude: 77.6430 },

  // ── East Bangalore ──
  { name: 'Indiranagar', zone: 'East', pincodes: ['560038', '560008'], latitude: 12.9784, longitude: 77.6408 },
  { name: 'Whitefield', zone: 'East', pincodes: ['560066', '560048'], latitude: 12.9698, longitude: 77.7500 },
  { name: 'Marathahalli', zone: 'East', pincodes: ['560037'], latitude: 12.9591, longitude: 77.7019 },
  { name: 'Bellandur', zone: 'East', pincodes: ['560103'], latitude: 12.9260, longitude: 77.6762 },
  { name: 'Sarjapur Road', zone: 'East', pincodes: ['560035', '560102'], latitude: 12.9107, longitude: 77.6868 },
  { name: 'Varthur', zone: 'East', pincodes: ['560087'], latitude: 12.9372, longitude: 77.7441 },
  { name: 'KR Puram', zone: 'East', pincodes: ['560036'], latitude: 12.9996, longitude: 77.6972 },
  { name: 'Domlur', zone: 'East', pincodes: ['560071'], latitude: 12.9610, longitude: 77.6387 },
  { name: 'Old Airport Road', zone: 'East', pincodes: ['560017', '560008'], latitude: 12.9631, longitude: 77.6471 },
  { name: 'HAL', zone: 'East', pincodes: ['560017'], latitude: 12.9584, longitude: 77.6588 },
  { name: 'Brookefield', zone: 'East', pincodes: ['560037'], latitude: 12.9690, longitude: 77.7140 },
  { name: 'Hoodi', zone: 'East', pincodes: ['560048'], latitude: 12.9894, longitude: 77.7148 },
  { name: 'Kadugodi', zone: 'East', pincodes: ['560067'], latitude: 12.9896, longitude: 77.7590 },
  { name: 'Mahadevapura', zone: 'East', pincodes: ['560048'], latitude: 12.9892, longitude: 77.6870 },

  // ── North Bangalore ──
  { name: 'Hebbal', zone: 'North', pincodes: ['560024', '560032'], latitude: 13.0350, longitude: 77.5970 },
  { name: 'Yelahanka', zone: 'North', pincodes: ['560064', '560065'], latitude: 13.1007, longitude: 77.5963 },
  { name: 'Thanisandra', zone: 'North', pincodes: ['560077'], latitude: 13.0590, longitude: 77.6360 },
  { name: 'Sahakara Nagar', zone: 'North', pincodes: ['560092'], latitude: 13.0598, longitude: 77.5800 },
  { name: 'RT Nagar', zone: 'North', pincodes: ['560032'], latitude: 13.0219, longitude: 77.5938 },
  { name: 'Hennur', zone: 'North', pincodes: ['560043', '560077'], latitude: 13.0450, longitude: 77.6420 },
  { name: 'Kalyan Nagar', zone: 'North', pincodes: ['560043'], latitude: 13.0252, longitude: 77.6406 },
  { name: 'Banaswadi', zone: 'North', pincodes: ['560043'], latitude: 13.0105, longitude: 77.6473 },
  { name: 'Nagavara', zone: 'North', pincodes: ['560045'], latitude: 13.0400, longitude: 77.6190 },
  { name: 'Jakkur', zone: 'North', pincodes: ['560064'], latitude: 13.0730, longitude: 77.6060 },
  { name: 'Devanahalli', zone: 'North', pincodes: ['562110'], latitude: 13.2473, longitude: 77.7120 },
  { name: 'Bagalur', zone: 'North', pincodes: ['562149'], latitude: 13.1340, longitude: 77.6770 },

  // ── West Bangalore ──
  { name: 'Rajajinagar', zone: 'West', pincodes: ['560010', '560021'], latitude: 12.9911, longitude: 77.5534 },
  { name: 'Malleswaram', zone: 'West', pincodes: ['560003', '560055'], latitude: 13.0035, longitude: 77.5710 },
  { name: 'Vijayanagar', zone: 'West', pincodes: ['560040'], latitude: 12.9716, longitude: 77.5303 },
  { name: 'Nagarbhavi', zone: 'West', pincodes: ['560072', '560056'], latitude: 12.9597, longitude: 77.5091 },
  { name: 'Kengeri', zone: 'West', pincodes: ['560060'], latitude: 12.9136, longitude: 77.4860 },
  { name: 'RR Nagar', zone: 'West', pincodes: ['560098'], latitude: 12.9283, longitude: 77.5107 },
  { name: 'Yeshwanthpur', zone: 'West', pincodes: ['560022'], latitude: 13.0274, longitude: 77.5508 },
  { name: 'Peenya', zone: 'West', pincodes: ['560058'], latitude: 13.0317, longitude: 77.5170 },
  { name: 'Basaveshwara Nagar', zone: 'West', pincodes: ['560079'], latitude: 12.9884, longitude: 77.5390 },
  { name: 'Mahalakshmi Layout', zone: 'West', pincodes: ['560086'], latitude: 12.9920, longitude: 77.5490 },

  // ── Central Bangalore ──
  { name: 'MG Road', zone: 'Central', pincodes: ['560001', '560025'], latitude: 12.9754, longitude: 77.6066 },
  { name: 'Shivajinagar', zone: 'Central', pincodes: ['560001', '560051'], latitude: 12.9857, longitude: 77.6046 },
  { name: 'Shantinagar', zone: 'Central', pincodes: ['560027'], latitude: 12.9565, longitude: 77.5993 },
  { name: 'Richmond Town', zone: 'Central', pincodes: ['560025'], latitude: 12.9631, longitude: 77.5996 },
  { name: 'Frazer Town', zone: 'Central', pincodes: ['560005'], latitude: 12.9963, longitude: 77.6131 },
  { name: 'Ulsoor', zone: 'Central', pincodes: ['560008'], latitude: 12.9817, longitude: 77.6206 },
  { name: 'Vasanth Nagar', zone: 'Central', pincodes: ['560052'], latitude: 12.9910, longitude: 77.5920 },
  { name: 'Cunningham Road', zone: 'Central', pincodes: ['560052'], latitude: 12.9883, longitude: 77.5856 },
  { name: 'Sadashivanagar', zone: 'Central', pincodes: ['560080'], latitude: 13.0070, longitude: 77.5780 },
  { name: 'Seshadripuram', zone: 'Central', pincodes: ['560020'], latitude: 12.9930, longitude: 77.5730 },
];

async function seed() {
  console.log('Seeding Bangalore service areas...');

  for (const area of bangaloreAreas) {
    await prisma.serviceArea.upsert({
      where: {
        name_city: { name: area.name, city: 'Bangalore' },
      },
      update: {
        zone: area.zone,
        pincodes: area.pincodes,
        latitude: area.latitude,
        longitude: area.longitude,
        isActive: true,
      },
      create: {
        name: area.name,
        zone: area.zone,
        city: 'Bangalore',
        state: 'Karnataka',
        pincodes: area.pincodes,
        latitude: area.latitude,
        longitude: area.longitude,
      },
    });
  }

  console.log(`Seeded ${bangaloreAreas.length} areas across Bangalore.`);
}

seed()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

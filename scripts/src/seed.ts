import bcrypt from "bcryptjs";
import { db, usersTable, complexesTable, materialsTable, eventsTable, recyclingRecordsTable } from "@workspace/db";

async function seed() {
  console.log("Seeding EcoRecicla Bogotá database...");

  // Seed complexes
  const [c1, c2, c3] = await db.insert(complexesTable).values([
    {
      name: "Torres del Parque",
      address: "Carrera 5 # 26-37",
      neighborhood: "La Candelaria",
      administrator: "Carlos Mendoza",
      phone: "601-3456789",
      email: "admin@torresparque.com",
      status: "active",
    },
    {
      name: "Conjunto Residencial El Nogal",
      address: "Calle 79B # 7-94",
      neighborhood: "El Nogal",
      administrator: "Lucía Vargas",
      phone: "601-2109876",
      email: "admin@elnogal.com",
      status: "active",
    },
    {
      name: "Urbanización Los Cedros",
      address: "Transversal 17 # 125-40",
      neighborhood: "Los Cedros",
      administrator: "Andrés Castillo",
      phone: "601-6543210",
      email: "admin@loscedros.com",
      status: "inactive",
    },
  ]).returning().onConflictDoNothing();

  console.log("✓ Complexes seeded");

  // Seed admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  const residentHash = await bcrypt.hash("resident123", 10);

  const [admin, r1, r2, r3] = await db.insert(usersTable).values([
    {
      fullName: "Administrador Principal",
      documentNumber: "1000000001",
      email: "admin@ecorecicla.com",
      phone: "3001234567",
      role: "admin",
      status: "active",
      passwordHash: adminHash,
    },
    {
      fullName: "María García López",
      documentNumber: "1023456789",
      email: "maria.garcia@email.com",
      phone: "3109876543",
      apartment: "301",
      complexId: c1?.id,
      role: "resident",
      status: "active",
      passwordHash: residentHash,
    },
    {
      fullName: "Juan Carlos Rodríguez",
      documentNumber: "1098765432",
      email: "juan.rodriguez@email.com",
      phone: "3204567890",
      apartment: "102",
      complexId: c1?.id,
      role: "resident",
      status: "active",
      passwordHash: residentHash,
    },
    {
      fullName: "Ana Sofía Martínez",
      documentNumber: "1045678901",
      email: "ana.martinez@email.com",
      phone: "3156789012",
      apartment: "405",
      complexId: c2?.id,
      role: "resident",
      status: "active",
      passwordHash: residentHash,
    },
  ]).returning().onConflictDoNothing();

  console.log("✓ Users seeded");

  // Seed materials
  const materials = await db.insert(materialsTable).values([
    {
      name: "Plástico",
      description: "Envases, botellas PET, bolsas plásticas y empaques",
      recyclingInstructions: "Limpiar los envases, retirar tapas y etiquetas cuando sea posible. Aplastar para reducir volumen.",
      binColor: "blue",
    },
    {
      name: "Papel",
      description: "Periódicos, revistas, cuadernos, papel de oficina",
      recyclingInstructions: "Mantener seco y limpio. No mezclar con papel húmedo o sucio. Retirar grapas y clips metálicos.",
      binColor: "gray",
    },
    {
      name: "Vidrio",
      description: "Botellas, frascos, envases de vidrio",
      recyclingInstructions: "Limpiar el vidrio. No mezclar con vidrio roto a menos que sea en contenedor especial. No incluir espejos ni cristales.",
      binColor: "green",
    },
    {
      name: "Cartón",
      description: "Cajas de cartón, empaques de electrodomésticos, tubos de papel",
      recyclingInstructions: "Aplanar las cajas antes de desechar. Retirar cintas adhesivas y grapas. Mantener seco.",
      binColor: "brown",
    },
    {
      name: "Metal",
      description: "Latas de aluminio, latas de conservas, chapas metálicas",
      recyclingInstructions: "Limpiar las latas. Aplastar para reducir volumen. Separar según tipo de metal si es posible.",
      binColor: "yellow",
    },
    {
      name: "Residuos Orgánicos",
      description: "Restos de comida, frutas, verduras, café, hojas",
      recyclingInstructions: "Separar de otros residuos. Ideal para compostaje. No incluir carnes ni lácteos en compostaje doméstico.",
      binColor: "green",
    },
    {
      name: "Residuos Electrónicos",
      description: "Celulares, computadores, electrodomésticos pequeños, pilas y baterías",
      recyclingInstructions: "Llevar a puntos especiales de recolección. No mezclar con residuos ordinarios. Incluir cables y cargadores.",
      binColor: "orange",
    },
  ]).returning().onConflictDoNothing();

  console.log("✓ Materials seeded");

  if (!c1 || !c2 || !r1 || !r2 || !r3 || materials.length === 0) {
    console.log("Some entities already existed or failed, skipping events/records seed");
    console.log("✅ Seed complete!");
    process.exit(0);
  }

  const [plastic, , , , metal, organic] = materials;

  // Seed collection events
  await db.insert(eventsTable).values([
    {
      eventName: "Jornada de Reciclaje Enero",
      complexId: c1.id,
      date: "2026-01-15",
      hour: "08:00",
      responsiblePerson: "Carlos Mendoza",
      location: "Parqueadero Principal, Bloque A",
      description: "Primera jornada de reciclaje del año. Traer todo el material acumulado.",
      status: "completed",
    },
    {
      eventName: "Recolección de Electrónicos",
      complexId: c2.id,
      date: "2026-02-20",
      hour: "09:00",
      responsiblePerson: "Lucía Vargas",
      location: "Zona común, Planta baja",
      description: "Jornada especial para recolección de residuos electrónicos.",
      status: "completed",
    },
    {
      eventName: "Gran Jornada de Reciclaje",
      complexId: c1.id,
      date: "2026-08-10",
      hour: "07:30",
      responsiblePerson: "Administrador Principal",
      location: "Toda la zona común",
      description: "Jornada masiva de reciclaje con premios para los residentes más activos.",
      status: "scheduled",
    },
  ]).onConflictDoNothing();

  console.log("✓ Events seeded");

  // Seed recycling records
  const today = new Date();
  const dates = [
    "2026-01-10", "2026-02-05", "2026-02-18",
    "2026-03-12", "2026-04-20", "2026-05-08",
    "2026-06-15", "2026-07-01", "2026-07-22",
  ];

  const recordsToInsert = [
    { residentId: r1.id, complexId: c1.id, materialId: plastic.id, weightKg: "2.500", date: dates[0], observation: "Botellas PET limpias", responsibleUserId: admin?.id },
    { residentId: r2.id, complexId: c1.id, materialId: metal.id, weightKg: "1.200", date: dates[1], observation: "Latas de aluminio", responsibleUserId: admin?.id },
    { residentId: r3.id, complexId: c2.id, materialId: organic.id, weightKg: "5.000", date: dates[2], observation: "Compost preparado", responsibleUserId: admin?.id },
    { residentId: r1.id, complexId: c1.id, materialId: plastic.id, weightKg: "3.100", date: dates[3], observation: null, responsibleUserId: admin?.id },
    { residentId: r2.id, complexId: c1.id, materialId: metal.id, weightKg: "0.800", date: dates[4], observation: "Chapas y latas", responsibleUserId: admin?.id },
    { residentId: r3.id, complexId: c2.id, materialId: plastic.id, weightKg: "4.250", date: dates[5], observation: "Botellas PET y recipientes", responsibleUserId: admin?.id },
    { residentId: r1.id, complexId: c1.id, materialId: organic.id, weightKg: "6.500", date: dates[6], observation: null, responsibleUserId: admin?.id },
    { residentId: r2.id, complexId: c1.id, materialId: plastic.id, weightKg: "2.000", date: dates[7], observation: "Envases varios", responsibleUserId: admin?.id },
    { residentId: r3.id, complexId: c2.id, materialId: metal.id, weightKg: "1.500", date: dates[8], observation: "Latas y metales mezclados", responsibleUserId: admin?.id },
  ];

  await db.insert(recyclingRecordsTable).values(recordsToInsert).onConflictDoNothing();
  console.log("✓ Recycling records seeded");

  console.log("\n✅ Seed complete!");
  console.log("Admin login: admin@ecorecicla.com / admin123");
  console.log("Resident login: maria.garcia@email.com / resident123");
  process.exit(0);
}

seed().catch((err) => {
  console.error("Seed error:", err);
  process.exit(1);
});

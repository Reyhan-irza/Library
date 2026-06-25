import { db, staffTable, categoriesTable, racksTable, booksTable, membersTable } from "@workspace/db";

async function seed() {
  console.log("Seeding...");

  const existingStaff = await db.select().from(staffTable);
  if (existingStaff.length === 0) {
    await db.insert(staffTable).values([
      { username: "admin", password: "admin", name: "Administrator", email: "admin@smkn2lb.sch.id", role: "admin" },
      { username: "pustakawan", password: "pustaka123", name: "Petugas Perpustakaan", email: "pustakawan@smkn2lb.sch.id", role: "librarian" },
    ]);
    console.log("Staff seeded");
  }

  const existingCats = await db.select().from(categoriesTable);
  if (existingCats.length === 0) {
    await db.insert(categoriesTable).values([
      { name: "Fiksi", description: "Novel dan cerita fiksi" },
      { name: "Non-Fiksi", description: "Buku pengetahuan umum" },
      { name: "Sains & Teknologi", description: "Ilmu pengetahuan dan teknologi" },
      { name: "Sejarah", description: "Buku sejarah dan budaya" },
      { name: "Pendidikan", description: "Buku pelajaran dan pendidikan" },
    ]);
    console.log("Categories seeded");
  }

  const existingRacks = await db.select().from(racksTable);
  if (existingRacks.length === 0) {
    await db.insert(racksTable).values([
      { name: "Rak A", location: "Baris 1", description: "Fiksi & Novel" },
      { name: "Rak B", location: "Baris 2", description: "Non-Fiksi & Ensiklopedia" },
      { name: "Rak C", location: "Baris 3", description: "Sains & Teknologi" },
      { name: "Rak D", location: "Baris 4", description: "Buku Pelajaran" },
    ]);
    console.log("Racks seeded");
  }

  const existingBooks = await db.select().from(booksTable);
  if (existingBooks.length === 0) {
    await db.insert(booksTable).values([
      { isbn: "978-602-01-0001-1", title: "Laskar Pelangi", author: "Andrea Hirata", publisher: "Bentang Pustaka", year: 2005, stock: 5, categoryId: 1, rackId: 1 },
      { isbn: "978-602-01-0002-2", title: "Bumi Manusia", author: "Pramoedya Ananta Toer", publisher: "Lentera Dipantara", year: 1980, stock: 3, categoryId: 1, rackId: 1 },
      { isbn: "978-602-01-0003-3", title: "Fisika Dasar", author: "Halliday & Resnick", publisher: "Erlangga", year: 2018, stock: 10, categoryId: 3, rackId: 3 },
      { isbn: "978-602-01-0004-4", title: "Sejarah Indonesia Modern", author: "M.C. Ricklefs", publisher: "Gadjah Mada Press", year: 2010, stock: 4, categoryId: 4, rackId: 2 },
      { isbn: "978-602-01-0005-5", title: "Matematika SMK", author: "Kasmina", publisher: "Erlangga", year: 2020, stock: 15, categoryId: 5, rackId: 4 },
    ]);
    console.log("Books seeded");
  }

  const existingMembers = await db.select().from(membersTable);
  if (existingMembers.length === 0) {
    await db.insert(membersTable).values([
      { memberNumber: "MB240001", name: "Budi Santoso", email: "budi@student.sch.id", phone: "08123456789", className: "XII TKJ 1", status: "active" },
      { memberNumber: "MB240002", name: "Siti Rahayu", email: "siti@student.sch.id", phone: "08234567890", className: "XI RPL 2", status: "active" },
      { memberNumber: "MB240003", name: "Ahmad Fauzi", email: "ahmad@student.sch.id", phone: "08345678901", className: "X MM 1", status: "active" },
    ]);
    console.log("Members seeded");
  }

  console.log("Seeding complete!");
  process.exit(0);
}

seed().catch((err) => { console.error(err); process.exit(1); });

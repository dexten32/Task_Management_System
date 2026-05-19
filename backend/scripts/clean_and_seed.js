const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const prisma = new PrismaClient();

async function main() {
  console.log('🧹 Cleaning existing database records...');
  
  // 1. Delete logs first due to foreign key constraints
  await prisma.taskLog.deleteMany({});
  console.log('🗑️ Deleted all TaskLogs.');

  // 2. Delete Tasks
  await prisma.task.deleteMany({});
  console.log('🗑️ Deleted all Tasks.');

  // 3. Delete Users
  await prisma.user.deleteMany({});
  console.log('🗑️ Deleted all Users.');

  // 4. Delete Departments
  await prisma.department.deleteMany({});
  console.log('🗑️ Deleted all Departments.');

  console.log('🌱 Seeding fresh approved users...');
  
  // Define secure user passwords
  const adminPassword = 'adminpassword123';
  const managerPassword = 'managerpassword123';
  const employeePassword = 'employeepassword123';

  const hashedAdmin = await bcrypt.hash(adminPassword, 10);
  const hashedManager = await bcrypt.hash(managerPassword, 10);
  const hashedEmployee = await bcrypt.hash(employeePassword, 10);

  // A. Create Admin (no department)
  await prisma.user.create({
    data: {
      email: 'admin@tasksync.com',
      name: 'System Admin',
      password: hashedAdmin,
      role: 'ADMIN',
      approved: true,
      isDeleted: false,
    }
  });
  console.log('👤 Admin user created successfully.');

  // B. Create a default department
  const dept = await prisma.department.create({
    data: {
      name: 'Engineering'
    }
  });
  console.log('🏢 Engineering department created successfully.');

  // C. Create Manager (assigned to Engineering)
  await prisma.user.create({
    data: {
      email: 'manager@tasksync.com',
      name: 'Operations Manager',
      password: hashedManager,
      role: 'MANAGER',
      approved: true,
      isDeleted: false,
      departmentId: dept.id,
    }
  });
  console.log('👤 Manager user created successfully.');

  // D. Create Employee (assigned to Engineering)
  await prisma.user.create({
    data: {
      email: 'employee@tasksync.com',
      name: 'Productive Employee',
      password: hashedEmployee,
      role: 'EMPLOYEE',
      approved: true,
      isDeleted: false,
      departmentId: dept.id,
    }
  });
  console.log('👤 Employee user created successfully.');

  console.log('✅ Seeding complete!');

  // Store credentials to text file
  const credentialsText = `==================================================
TMSYNC FRESH DATABASE USER CREDENTIALS
==================================================

1. ADMIN USER
   Email:    admin@tasksync.com
   Password: ${adminPassword}
   Role:     ADMIN
   Approved: Yes

2. MANAGER USER
   Email:    manager@tasksync.com
   Password: ${managerPassword}
   Role:     MANAGER
   Approved: Yes
   Dept:     Engineering

3. EMPLOYEE USER
   Email:    employee@tasksync.com
   Password: ${employeePassword}
   Role:     EMPLOYEE
   Approved: Yes
   Dept:     Engineering

==================================================
`;

  fs.writeFileSync('g:/www.tmsync.in/database_credentials.txt', credentialsText);
  console.log('📁 Credentials saved successfully.');
}

main()
  .catch(e => {
    console.error('❌ Failed to clean and seed database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

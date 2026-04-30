import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

async function upsertUser(user, passwordHash) {
  return prisma.user.upsert({
    where: { email: user.email },
    update: {
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone ?? null,
      role: user.role,
      accountStatus: "ACTIVE",
      academicId: user.academicId,
      department: user.department ?? null,
      academicYear: user.academicYear ?? null,
      preferredTrack: user.preferredTrack ?? null,
      bio: user.bio ?? null,
      githubUsername: user.githubUsername ?? null,
      linkedinUrl: user.linkedinUrl ?? null,
      passwordHash,
      isEmailVerified: true,
    },
    create: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone ?? null,
      role: user.role,
      accountStatus: "ACTIVE",
      academicId: user.academicId,
      department: user.department ?? null,
      academicYear: user.academicYear ?? null,
      preferredTrack: user.preferredTrack ?? null,
      bio: user.bio ?? null,
      githubUsername: user.githubUsername ?? null,
      linkedinUrl: user.linkedinUrl ?? null,
      passwordHash,
      isEmailVerified: true,
    },
  });
}

async function main() {
  const password = "demo123";
  const passwordHash = await bcrypt.hash(password, 10);

  console.log("Seeding users...");
  const demoUsers = [
    {
      firstName: "Sarah",
      lastName: "Admin",
      email: "admin@university.edu",
      role: "ADMIN",
      academicId: "ADMIN-0001",
      phone: "01000000001",
      department: "COMPUTER_SCIENCE",
      academicYear: "YEAR_5",
      preferredTrack: "SOFTWARE_ARCHITECTURE",
      bio: "Platform administrator responsible for managing GPMS users and system access.",
    },
    {
      firstName: "Ahmed",
      lastName: "Hassan",
      email: "ahmed.hassan@university.edu",
      role: "DOCTOR",
      academicId: "STAFF-0002",
      phone: "01000000002",
      department: "COMPUTER_SCIENCE",
      academicYear: "YEAR_5",
      preferredTrack: "CLOUD_ENGINEERING",
      bio: "Graduation project supervisor focused on scalable systems and cloud-native architecture.",
    },
    {
      firstName: "Mona",
      lastName: "Zaki",
      email: "mona.zaki@university.edu",
      role: "DOCTOR",
      academicId: "STAFF-0004",
      phone: "01000000004",
      department: "SOFTWARE_ENGINEERING",
      academicYear: "YEAR_5",
      preferredTrack: "SOFTWARE_ARCHITECTURE",
      bio: "Professor specializing in software engineering methodologies and agile processes.",
    },
    {
      firstName: "Layla",
      lastName: "Ibrahim",
      email: "layla.ibrahim@university.edu",
      role: "TA",
      academicId: "STAFF-0003",
      phone: "01000000003",
      department: "SOFTWARE_ENGINEERING",
      academicYear: "YEAR_5",
      preferredTrack: "QUALITY_ASSURANCE",
      bio: "TA supporting teams with testing strategy, release quality, and sprint execution.",
    },
    {
      firstName: "Omar",
      lastName: "Kamal",
      email: "omar.kamal@university.edu",
      role: "TA",
      academicId: "STAFF-0005",
      phone: "01000000005",
      department: "COMPUTER_SCIENCE",
      academicYear: "YEAR_5",
      preferredTrack: "BACKEND_DEVELOPMENT",
      bio: "Graduate assistant focusing on distributed systems and backend technologies.",
    },
    {
      firstName: "Mariam",
      lastName: "Salah",
      email: "mariam.salah@student.edu",
      role: "LEADER",
      academicId: "CS2021010",
      phone: "01000001010",
      department: "COMPUTER_SCIENCE",
      academicYear: "YEAR_4",
      preferredTrack: "FRONTEND_DEVELOPMENT",
      bio: "Team leader passionate about product design, frontend architecture, and polished user experience.",
      githubUsername: "mariam-salah",
    },
    {
      firstName: "Nour",
      lastName: "Hassan",
      email: "nour.hassan@student.edu",
      role: "LEADER",
      academicId: "CS2021002",
      phone: "01000001002",
      department: "COMPUTER_SCIENCE",
      academicYear: "YEAR_4",
      preferredTrack: "FULLSTACK_DEVELOPMENT",
      bio: "AI-focused team leader who enjoys translating research ideas into practical student products.",
      githubUsername: "nour-hassan",
    },
    {
      firstName: "Karim",
      lastName: "Mostafa",
      email: "karim.mostafa@student.edu",
      role: "LEADER",
      academicId: "CS2021003",
      phone: "01000001003",
      department: "SOFTWARE_ENGINEERING",
      academicYear: "YEAR_4",
      preferredTrack: "BACKEND_DEVELOPMENT",
      bio: "Backend-focused leader currently looking for the right project idea and teammates.",
      githubUsername: "karim-mostafa",
    },
    {
      firstName: "Ali",
      lastName: "Mahmoud",
      email: "ali.mahmoud@student.edu",
      role: "STUDENT",
      academicId: "CS2021011",
      phone: "01000001011",
      department: "SOFTWARE_ENGINEERING",
      academicYear: "YEAR_4",
      preferredTrack: "BACKEND_DEVELOPMENT",
      bio: "Backend student who enjoys API design, database modeling, and clean service architecture.",
      githubUsername: "ali-mahmoud",
    },
    {
      firstName: "Salma",
      lastName: "Youssef",
      email: "salma.youssef@student.edu",
      role: "STUDENT",
      academicId: "CS2021012",
      phone: "01000001012",
      department: "INFORMATION_TECHNOLOGY",
      academicYear: "YEAR_4",
      preferredTrack: "FRONTEND_DEVELOPMENT",
      bio: "Frontend student who loves accessible UI, smooth interactions, and thoughtful design systems.",
      githubUsername: "salma-youssef",
    },
    {
      firstName: "Hassan",
      lastName: "Omar",
      email: "hassan.omar@student.edu",
      role: "STUDENT",
      academicId: "CS2021013",
      phone: "01000001013",
      department: "CYBERSECURITY_INFOSEC",
      academicYear: "YEAR_4",
      preferredTrack: "DEVOPS",
      bio: "Security-minded student interested in deployment pipelines, infrastructure, and secure coding.",
      githubUsername: "hassan-omar",
    },
    {
      firstName: "Amira",
      lastName: "Khalil",
      email: "amira.khalil@student.edu",
      role: "STUDENT",
      academicId: "CS2021015",
      phone: "01000001015",
      department: "INFORMATION_SYSTEMS",
      academicYear: "YEAR_4",
      preferredTrack: "FULLSTACK_DEVELOPMENT",
      bio: "Full-stack student exploring collaboration opportunities and strong product-oriented teams.",
      githubUsername: "amira-khalil",
    },
    {
      firstName: "Hana",
      lastName: "Adel",
      email: "hana.adel@student.edu",
      role: "STUDENT",
      academicId: "CS2021014",
      phone: "01000001014",
      department: "COMPUTER_SCIENCE",
      academicYear: "YEAR_4",
      preferredTrack: "FRONTEND_DEVELOPMENT",
      bio: "Frontend student interested in collaborative projects, storytelling, and polished interfaces.",
      githubUsername: "hana-adel",
    },
  ];

  const users = {};
  for (const user of demoUsers) {
    const savedUser = await upsertUser(user, passwordHash);
    users[user.email] = savedUser;
  }

  console.log("Cleaning up existing team data...");
  await prisma.submission.deleteMany();
  await prisma.weeklyReport.deleteMany();
  await prisma.task.deleteMany();
  await prisma.gitHubSyncCursor.deleteMany();
  await prisma.gitHubWebhookDelivery.deleteMany();
  await prisma.gitHubTeamRepository.deleteMany();
  await prisma.gitHubUserConnection.deleteMany();
  await prisma.teamSupervisorRequest.deleteMany();
  await prisma.teamJoinRequest.deleteMany();
  await prisma.teamInvitation.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.team.deleteMany();

  console.log("Seeding teams...");
  const smartCampus = await prisma.team.create({
    data: {
      name: "Smart Campus",
      bio: "A connected campus platform for announcements, navigation, and smart facility usage insights.",
      leaderId: users["mariam.salah@student.edu"].id,
      doctorId: users["ahmed.hassan@university.edu"].id,
      taId: users["layla.ibrahim@university.edu"].id,
      inviteCode: "SMART-25A1",
      maxMembers: 5,
      visibility: "PUBLIC",
      allowJoinRequests: true,
      stage: "IMPLEMENTATION",
      stack: ["Next.js", "Node.js", "PostgreSQL", "Tailwind CSS"],
    },
  });

  const aiStudyAssistant = await prisma.team.create({
    data: {
      name: "AI Study Assistant",
      bio: "An AI-powered graduation project assistant that helps students organize materials and learning plans.",
      leaderId: users["nour.hassan@student.edu"].id,
      doctorId: users["ahmed.hassan@university.edu"].id,
      taId: users["layla.ibrahim@university.edu"].id,
      inviteCode: "AISTUD-Y2B",
      maxMembers: 4,
      visibility: "PRIVATE",
      allowJoinRequests: false,
      stage: "DESIGN",
      stack: ["Python", "FastAPI", "React", "OpenAI"],
    },
  });

  const cyberGuard = await prisma.team.create({
    data: {
      name: "CyberGuard",
      bio: "A real-time network security monitoring and threat detection system for small businesses.",
      leaderId: users["karim.mostafa@student.edu"].id,
      inviteCode: "CYBER-G9X",
      maxMembers: 5,
      visibility: "PUBLIC",
      allowJoinRequests: true,
      stage: "REQUIREMENTS",
      stack: ["Go", "Python", "ELK Stack", "Docker"],
    },
  });

  console.log("Seeding team members...");
  await prisma.teamMember.createMany({
    data: [
      { teamId: smartCampus.id, userId: users["ali.mahmoud@student.edu"].id },
      { teamId: smartCampus.id, userId: users["salma.youssef@student.edu"].id },
      { teamId: aiStudyAssistant.id, userId: users["hassan.omar@student.edu"].id },
    ],
  });

  console.log("Seeding team interactions...");
  await prisma.teamInvitation.create({
    data: {
      teamId: aiStudyAssistant.id,
      invitedUserId: users["amira.khalil@student.edu"].id,
      invitedById: users["nour.hassan@student.edu"].id,
      status: "PENDING",
    },
  });

  await prisma.teamJoinRequest.create({
    data: {
      teamId: smartCampus.id,
      userId: users["hana.adel@student.edu"].id,
      message: "I’d love to contribute on the frontend and help shape the student experience side of this project.",
      status: "PENDING",
    },
  });

  console.log("Seeding supervisor requests...");
  await prisma.teamSupervisorRequest.create({
    data: {
      teamId: cyberGuard.id,
      supervisorId: users["mona.zaki@university.edu"].id,
      requestedById: users["karim.mostafa@student.edu"].id,
      supervisorRole: "DOCTOR",
      projectName: "CyberGuard Threat Detection",
      projectDescription: "We are building a system that uses machine learning to detect network anomalies and alert administrators in real-time.",
      technologies: ["Python", "TensorFlow", "Scapy"],
      status: "PENDING",
    },
  });

  await prisma.teamSupervisorRequest.create({
    data: {
      teamId: cyberGuard.id,
      supervisorId: users["omar.kamal@university.edu"].id,
      requestedById: users["karim.mostafa@student.edu"].id,
      supervisorRole: "TA",
      projectName: "CyberGuard Threat Detection",
      projectDescription: "Seeking TA guidance for the backend architecture and data processing pipeline.",
      technologies: ["Go", "Kafka", "PostgreSQL"],
      status: "ACCEPTED",
      respondedAt: new Date(),
    },
  });

  console.log("Seeding GitHub data...");
  const gitHubRepo = await prisma.gitHubTeamRepository.create({
    data: {
      teamId: smartCampus.id,
      ownerLogin: "university-projects",
      ownerType: "ORGANIZATION",
      repoName: "smart-campus-gp",
      fullName: "university-projects/smart-campus-gp",
      defaultBranch: "main",
      visibility: "PUBLIC",
      repoUrl: "https://github.com/university-projects/smart-campus-gp",
      connectionStatus: "ACTIVE",
      syncStatus: "IDLE",
      lastSyncAt: new Date(),
    },
  });

  await prisma.gitHubUserConnection.create({
    data: {
      userId: users["mariam.salah@student.edu"].id,
      githubUserId: "12345678",
      login: "mariam-salah",
      displayName: "Mariam Salah",
      avatarUrl: "https://avatars.githubusercontent.com/u/12345678?v=4",
      accessTokenEncrypted: "encrypted-token-placeholder",
      isActive: true,
    },
  });

  console.log("Seeding tasks...");
  const tasks = [
    {
      teamId: smartCampus.id,
      title: "Design System Implementation",
      description: "Establish core UI components using Tailwind CSS and Radix UI.",
      status: "DONE",
      priority: "HIGH",
      assigneeUserId: users["mariam.salah@student.edu"].id,
      labels: ["UI/UX", "Frontend"],
    },
    {
      teamId: smartCampus.id,
      title: "Authentication Flow",
      description: "Implement JWT-based auth with refresh tokens and protected routes.",
      status: "IN_PROGRESS",
      priority: "CRITICAL",
      assigneeUserId: users["ali.mahmoud@student.edu"].id,
      labels: ["Security", "Backend"],
    },
    {
      teamId: smartCampus.id,
      title: "Interactive Campus Map",
      description: "Integrate Mapbox API to show facility locations and real-time navigation.",
      status: "TODO",
      priority: "MEDIUM",
      assigneeUserId: users["salma.youssef@student.edu"].id,
      labels: ["Feature", "API"],
    },
    {
      teamId: aiStudyAssistant.id,
      title: "OpenAI Integration",
      description: "Connect to GPT-4 API and implement initial prompt engineering for study plans.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      assigneeUserId: users["nour.hassan@student.edu"].id,
      labels: ["AI", "Backend"],
    },
    {
      teamId: aiStudyAssistant.id,
      title: "Database Schema Design",
      description: "Finalize the data models for student profiles, materials, and learning paths.",
      status: "DONE",
      priority: "MEDIUM",
      assigneeUserId: users["hassan.omar@student.edu"].id,
      labels: ["Database"],
    },
  ];

  for (const task of tasks) {
    await prisma.task.create({ data: task });
  }

  console.log("Seeding weekly reports...");
  await prisma.weeklyReport.create({
    data: {
      teamId: smartCampus.id,
      submittedById: users["mariam.salah@student.edu"].id,
      weekLabel: "Week 1 - Project Kickoff",
      periodStart: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      periodEnd: new Date(),
      summaryFinal: "Successfully initialized the repository, set up the development environment, and finalized the core requirements document. Team roles have been assigned and the initial design system is under development.",
      isSubmitted: true,
      submittedAt: new Date(),
    },
  });

  console.log("Seeding submissions...");
  await prisma.submission.create({
    data: {
      teamId: smartCampus.id,
      deliverableType: "SRS",
      sdlcPhase: "REQUIREMENTS",
      sourceType: "MANUAL_UPLOAD",
      artifactUrl: "https://example.com/docs/smart-campus-srs.pdf",
      version: 1,
      submittedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
      deadline: new Date(),
      late: false,
      feedback: "Well-structured document. Please ensure the sequence diagrams are updated in the next version.",
      grade: 95,
    },
  });

  await prisma.submission.create({
    data: {
      teamId: smartCampus.id,
      deliverableType: "UML",
      sdlcPhase: "DESIGN",
      sourceType: "MANUAL_UPLOAD",
      artifactUrl: "https://example.com/docs/smart-campus-uml.pdf",
      version: 1,
      submittedAt: new Date(),
      deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      late: false,
    },
  });

  console.log("Seed completed successfully!");
}

main()
  .then(async () => {
    console.log("You can login using password: demo123");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

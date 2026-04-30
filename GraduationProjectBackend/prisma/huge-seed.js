import { PrismaClient } from "../src/generated/prisma/index.js";
import bcrypt from "bcrypt";
import { faker } from "@faker-js/faker";

const prisma = new PrismaClient();

const DEPARTMENTS = [
  "COMPUTER_SCIENCE",
  "SOFTWARE_ENGINEERING",
  "INFORMATION_TECHNOLOGY",
  "COMPUTER_ENGINEERING",
  "DATA_SCIENCE",
  "ARTIFICIAL_INTELLIGENCE",
  "CYBERSECURITY_INFOSEC",
  "INFORMATION_SYSTEMS",
  "BIOINFORMATICS",
];

const ACADEMIC_YEARS = ["YEAR_1", "YEAR_2", "YEAR_3", "YEAR_4", "YEAR_5"];

const PREFERRED_TRACKS = [
  "FRONTEND_DEVELOPMENT",
  "BACKEND_DEVELOPMENT",
  "FULLSTACK_DEVELOPMENT",
  "MOBILE_APP_DEVELOPMENT",
  "DEVOPS",
  "CLOUD_ENGINEERING",
  "SOFTWARE_ARCHITECTURE",
  "QUALITY_ASSURANCE",
  "GAME_DEVELOPMENT",
];

const ROLES = ["STUDENT", "LEADER", "TA", "DOCTOR", "ADMIN"];
const TEAM_STAGES = ["REQUIREMENTS", "DESIGN", "IMPLEMENTATION", "TESTING", "DEPLOYMENT", "MAINTENANCE"];
const TASK_STATUSES = ["BACKLOG", "TODO", "IN_PROGRESS", "REVIEW", "APPROVED", "DONE"];
const TASK_PRIORITIES = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
const TASK_TYPES = ["CODE", "DOCUMENTATION", "DESIGN", "RESEARCH", "MEETING", "PRESENTATION", "OTHER"];
const DELIVERABLE_TO_PHASE = {
  SRS: "REQUIREMENTS",
  UML: "DESIGN",
  PROTOTYPE: "IMPLEMENTATION",
  CODE: "IMPLEMENTATION",
  TEST_PLAN: "TESTING",
  FINAL_REPORT: "DEPLOYMENT",
  PRESENTATION: "DEPLOYMENT",
};


async function main() {
  const password = "demo123";
  const passwordHash = await bcrypt.hash(password, 10);

  console.log("Cleaning up existing data...");
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
  await prisma.user.deleteMany();

  console.log("Seeding users...");
  const users = [];

  // Create 1 Admin
  const admin = await prisma.user.create({
    data: {
      firstName: "Admin",
      lastName: "User",
      email: "admin@university.edu",
      role: "ADMIN",
      academicId: "ADMIN-0001",
      phone: "01012345678",
      passwordHash,
      isEmailVerified: true,
      accountStatus: "ACTIVE",
      department: "COMPUTER_SCIENCE",
      academicYear: "YEAR_5",
      preferredTrack: "SOFTWARE_ARCHITECTURE",
    },
  });
  users.push(admin);

  // Create 10 Doctors
  const doctors = [];
  for (let i = 0; i < 10; i++) {
    const doctor = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `doctor${i}@university.edu`,
        role: "DOCTOR",
        academicId: `STAFF-D-${1000 + i}`,
        phone: faker.phone.number(),
        passwordHash,
        isEmailVerified: true,
        accountStatus: "ACTIVE",
        department: faker.helpers.arrayElement(DEPARTMENTS),
        academicYear: "YEAR_5",
        preferredTrack: faker.helpers.arrayElement(PREFERRED_TRACKS),
        bio: faker.lorem.sentence(),
      },
    });
    doctors.push(doctor);
    users.push(doctor);
  }

  // Create 10 TAs
  const tas = [];
  for (let i = 0; i < 10; i++) {
    const ta = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `ta${i}@university.edu`,
        role: "TA",
        academicId: `STAFF-TA-${2000 + i}`,
        phone: faker.phone.number(),
        passwordHash,
        isEmailVerified: true,
        accountStatus: "ACTIVE",
        department: faker.helpers.arrayElement(DEPARTMENTS),
        academicYear: "YEAR_5",
        preferredTrack: faker.helpers.arrayElement(PREFERRED_TRACKS),
        bio: faker.lorem.sentence(),
      },
    });
    tas.push(ta);
    users.push(ta);
  }

  // Create 200 Students (some will be leaders)
  const students = [];
  for (let i = 0; i < 200; i++) {
    const student = await prisma.user.create({
      data: {
        firstName: faker.person.firstName(),
        lastName: faker.person.lastName(),
        email: `student${i}@student.edu`,
        role: "STUDENT",
        academicId: `STU-${3000 + i}`,
        phone: faker.phone.number(),
        passwordHash,
        isEmailVerified: true,
        accountStatus: "ACTIVE",
        department: faker.helpers.arrayElement(DEPARTMENTS),
        academicYear: faker.helpers.arrayElement(ACADEMIC_YEARS),
        preferredTrack: faker.helpers.arrayElement(PREFERRED_TRACKS),
        bio: faker.lorem.sentence(),
      },
    });
    students.push(student);
    users.push(student);
  }

  console.log("Seeding teams...");
  const teams = [];
  // Create 30 Teams
  for (let i = 0; i < 30; i++) {
    // Pick a student to be the leader (and update their role)
    const leaderIndex = i * 4; // Simple way to pick distinct leaders
    const leader = students[leaderIndex];
    
    await prisma.user.update({
      where: { id: leader.id },
      data: { role: "LEADER" }
    });

    const team = await prisma.team.create({
      data: {
        name: faker.company.name() + " Project",
        bio: faker.company.catchPhrase(),
        leaderId: leader.id,
        doctorId: faker.helpers.arrayElement(doctors).id,
        taId: faker.helpers.arrayElement(tas).id,
        inviteCode: faker.string.alphanumeric(8).toUpperCase(),
        maxMembers: 5,
        visibility: faker.helpers.arrayElement(["PUBLIC", "PRIVATE"]),
        stage: faker.helpers.arrayElement(TEAM_STAGES),
        stack: [faker.helpers.arrayElement(["React", "Next.js", "Vue"]), faker.helpers.arrayElement(["Node.js", "Python", "Go"]), "PostgreSQL"],
      },
    });
    teams.push(team);

    // Add 1-3 members to each team
    const numMembers = faker.number.int({ min: 1, max: 3 });
    const members = [];
    for (let j = 1; j <= numMembers; j++) {
      const member = students[leaderIndex + j];
      if (member) {
        await prisma.teamMember.create({
          data: {
            teamId: team.id,
            userId: member.id,
          },
        });
        members.push(member);
      }
    }

    // Seed tasks for this team
    console.log(`Seeding tasks for team: ${team.name}...`);
    const allTeamUsers = [leader, ...members];
    for (let k = 0; k < 40; k++) {
      await prisma.task.create({
        data: {
          teamId: team.id,
          title: faker.hacker.phrase(),
          description: faker.lorem.paragraph(),
          status: faker.helpers.arrayElement(TASK_STATUSES),
          priority: faker.helpers.arrayElement(TASK_PRIORITIES),
          taskType: faker.helpers.arrayElement(TASK_TYPES),
          assigneeUserId: faker.helpers.arrayElement(allTeamUsers).id,
          createdByUserId: leader.id,
          labels: [faker.hacker.adjective(), faker.hacker.noun()],
          dueDate: faker.date.future(),
          createdAt: faker.date.past(),
        },
      });
    }

    // Seed some weekly reports
    for (let w = 1; w <= 8; w++) {
        await prisma.weeklyReport.create({
            data: {
                teamId: team.id,
                submittedById: leader.id,
                weekLabel: `Week ${w}`,
                summaryFinal: faker.lorem.sentences(3),
                isSubmitted: true,
                submittedAt: faker.date.recent(),
            }
        });
    }

    // Seed some submissions
    const deliverableTypes = ["SRS", "UML", "PROTOTYPE", "CODE", "TEST_PLAN"];
    for (const type of deliverableTypes) {
        if (Math.random() > 0.5) {
            await prisma.submission.create({
                data: {
                    teamId: team.id,
                    deliverableType: type,
                    sdlcPhase: DELIVERABLE_TO_PHASE[type],
                    artifactUrl: faker.internet.url(),
                    grade: faker.number.int({ min: 60, max: 100 }),
                    feedback: faker.lorem.sentence(),
                    submittedAt: faker.date.recent(),
                }
            });
        }
    }
  }

  console.log("Seeding interactions...");
  // Add some random invitations and join requests
  for (let i = 0; i < 50; i++) {
    const team = faker.helpers.arrayElement(teams);
    const student = faker.helpers.arrayElement(students);
    
    // Check if student is already in a team or is leader
    const isMember = await prisma.teamMember.findFirst({ where: { userId: student.id } });
    const isLeader = await prisma.team.findFirst({ where: { leaderId: student.id } });

    if (!isMember && !isLeader) {
        if (Math.random() > 0.5) {
            await prisma.teamJoinRequest.create({
                data: {
                    teamId: team.id,
                    userId: student.id,
                    message: faker.lorem.sentence(),
                    status: "PENDING",
                }
            }).catch(() => {});
        } else {
            const leader = await prisma.user.findUnique({ where: { id: team.leaderId } });
            await prisma.teamInvitation.create({
                data: {
                    teamId: team.id,
                    invitedUserId: student.id,
                    invitedById: leader.id,
                    status: "PENDING",
                }
            }).catch(() => {});
        }
    }
  }

  // Seed supervisor requests
  for (let i = 0; i < 20; i++) {
      const team = faker.helpers.arrayElement(teams);
      const doctor = faker.helpers.arrayElement(doctors);
      const ta = faker.helpers.arrayElement(tas);

      await prisma.teamSupervisorRequest.create({
          data: {
              teamId: team.id,
              supervisorId: doctor.id,
              requestedById: team.leaderId,
              supervisorRole: "DOCTOR",
              projectName: team.name,
              projectDescription: team.bio,
              status: faker.helpers.arrayElement(["PENDING", "ACCEPTED", "DECLINED"]),
          }
      }).catch(() => {});

      await prisma.teamSupervisorRequest.create({
          data: {
              teamId: team.id,
              supervisorId: ta.id,
              requestedById: team.leaderId,
              supervisorRole: "TA",
              projectName: team.name,
              projectDescription: team.bio,
              status: faker.helpers.arrayElement(["PENDING", "ACCEPTED", "DECLINED"]),
          }
      }).catch(() => {});
  }

  console.log("Seed completed successfully!");
  console.log(`Created:
    - 1 Admin
    - 10 Doctors
    - 10 TAs
    - 200 Students
    - 30 Teams
    - 1200 Tasks
    - 240 Weekly Reports
    - ~50 Interactions (Invitations/Join Requests)
    - ~40 Supervisor Requests
  `);

}

main()
  .then(async () => {
    console.log("Huge data seeding finished.");
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error("Seed failed:", error);
    await prisma.$disconnect();
    process.exit(1);
  });

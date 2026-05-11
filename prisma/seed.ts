import { Gender, PrismaClient, RefugeeDocumentType, Role, StudentStatus, VideoProvider, VideoVisibility } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const school = await prisma.school.upsert({
    where: { code: "MON-RLC" },
    update: {
      shortName: "Mon RLC",
      logoUrl: "",
      primaryColor: "#17211b",
      secondaryColor: "#b46a45",
      address: "Sentul, Kuala Lumpur, Malaysia",
      phone: "+60 12 000 0000",
      email: "admin@monrlc.example",
      website: "https://monrlc.example",
      subdomain: "monrlc",
      customDomain: "learn.monrlc.example"
    },
    create: {
      name: "Mon Refugee Learning Centre",
      shortName: "Mon RLC",
      code: "MON-RLC",
      logoUrl: "",
      primaryColor: "#17211b",
      secondaryColor: "#b46a45",
      address: "Sentul, Kuala Lumpur, Malaysia",
      phone: "+60 12 000 0000",
      email: "admin@monrlc.example",
      website: "https://monrlc.example",
      subdomain: "monrlc",
      customDomain: "learn.monrlc.example",
      city: "Kuala Lumpur",
      country: "Malaysia",
      timezone: "Asia/Kuala_Lumpur"
    }
  });

  const schoolAdmin = await prisma.user.upsert({
    where: { email: "admin@monrlc.example" },
    update: {},
    create: {
      schoolId: school.id,
      email: "admin@monrlc.example",
      name: "School Administrator",
      role: Role.SCHOOL_ADMIN,
      passwordHash: "replace-with-hashed-password"
    }
  });

  const teacher = await prisma.user.upsert({
    where: { email: "teacher@monrlc.example" },
    update: {},
    create: {
      schoolId: school.id,
      email: "teacher@monrlc.example",
      name: "Lead Teacher",
      role: Role.TEACHER,
      passwordHash: "replace-with-hashed-password"
    }
  });

  await prisma.user.upsert({
    where: { email: "case.manager@monrlc.example" },
    update: {
      caseManagerApproved: true
    },
    create: {
      schoolId: school.id,
      email: "case.manager@monrlc.example",
      name: "Case Manager",
      role: Role.CASE_MANAGER,
      caseManagerApproved: true,
      passwordHash: "replace-with-hashed-password"
    }
  });

  await prisma.user.upsert({
    where: { email: "super.admin@schoolos.example" },
    update: {},
    create: {
      email: "super.admin@schoolos.example",
      name: "Platform Super Admin",
      role: Role.SUPER_ADMIN,
      passwordHash: "replace-with-hashed-password"
    }
  });

  const primaryClass = await prisma.class.upsert({
    where: {
      schoolId_name_academicYear: {
        schoolId: school.id,
        name: "Primary A",
        academicYear: "2026"
      }
    },
    update: {},
    create: {
      schoolId: school.id,
      teacherId: teacher.id,
      name: "Primary A",
      gradeLevel: "Primary",
      academicYear: "2026",
      room: "Room 1"
    }
  });

  const bridgeClass = await prisma.class.upsert({
    where: {
      schoolId_name_academicYear: {
        schoolId: school.id,
        name: "Bridge English",
        academicYear: "2026"
      }
    },
    update: {},
    create: {
      schoolId: school.id,
      teacherId: teacher.id,
      name: "Bridge English",
      gradeLevel: "Bridge",
      academicYear: "2026",
      room: "Room 2"
    }
  });

  const mathClass = await prisma.class.upsert({
    where: {
      schoolId_name_academicYear: {
        schoolId: school.id,
        name: "Math Level 2",
        academicYear: "2026"
      }
    },
    update: {},
    create: {
      schoolId: school.id,
      teacherId: teacher.id,
      name: "Math Level 2",
      gradeLevel: "Primary",
      academicYear: "2026",
      room: "Room 3"
    }
  });

  const students = await Promise.all(
    [
      {
        studentNumber: "MON-001",
        legalName: "Aye Chan",
        preferredName: "Aye",
        gender: Gender.FEMALE,
        guardianName: "Daw Mya",
        documentType: RefugeeDocumentType.UNHCR_CARD,
        documentNumber: "UNHCR-2026-001"
      },
      {
        studentNumber: "MON-002",
        legalName: "Min Thu",
        preferredName: "Min",
        gender: Gender.MALE,
        guardianName: "Nai Soe",
        documentType: RefugeeDocumentType.ASYLUM_SEEKER_CERTIFICATE,
        documentNumber: "ASC-88219"
      },
      {
        studentNumber: "MON-003",
        legalName: "Nilar Win",
        preferredName: "Nilar",
        gender: Gender.FEMALE,
        guardianName: "Daw Khin",
        documentType: RefugeeDocumentType.UNHCR_CARD,
        documentNumber: "UNHCR-2026-003"
      },
      {
        studentNumber: "MON-004",
        legalName: "Htun Lin",
        preferredName: "Htun",
        gender: Gender.MALE,
        guardianName: "Nai Tun",
        status: StudentStatus.TRANSFERRED
      }
    ].map((student) =>
      prisma.student.upsert({
        where: {
          schoolId_studentNumber: {
            schoolId: school.id,
            studentNumber: student.studentNumber
          }
        },
        update: {
          legalName: student.legalName,
          preferredName: student.preferredName,
          gender: student.gender,
          status: student.status ?? StudentStatus.ACTIVE,
          guardianName: student.guardianName,
          guardianRelationship: student.gender === Gender.FEMALE ? "Mother" : "Father",
          guardianPhone: "+60 12 000 0000",
          emergencyContactName: "Emergency Contact",
          emergencyContactPhone: "+60 13 000 0000",
          emergencyRelationship: "Relative",
          unhcrStatus: student.documentType ? "Registered" : undefined,
          documentType: student.documentType,
          documentNumber: student.documentNumber,
          documentExpiryDate: student.documentType ? new Date("2027-12-31") : undefined
        },
        create: {
          schoolId: school.id,
          studentNumber: student.studentNumber,
          legalName: student.legalName,
          preferredName: student.preferredName,
          gender: student.gender,
          status: student.status ?? StudentStatus.ACTIVE,
          guardianName: student.guardianName,
          guardianRelationship: student.gender === Gender.FEMALE ? "Mother" : "Father",
          guardianPhone: "+60 12 000 0000",
          emergencyContactName: "Emergency Contact",
          emergencyContactPhone: "+60 13 000 0000",
          emergencyRelationship: "Relative",
          unhcrStatus: student.documentType ? "Registered" : undefined,
          documentType: student.documentType,
          documentNumber: student.documentNumber,
          documentExpiryDate: student.documentType ? new Date("2027-12-31") : undefined
        }
      })
    )
  );

  await Promise.all(
    students.map((student, index) =>
      prisma.enrollment.upsert({
        where: {
          schoolId_studentId_classId_startDate: {
            schoolId: school.id,
            studentId: student.id,
            classId: index < 2 ? primaryClass.id : bridgeClass.id,
            startDate: new Date("2026-01-12")
          }
        },
        update: {},
        create: {
          schoolId: school.id,
          studentId: student.id,
          classId: index < 2 ? primaryClass.id : bridgeClass.id,
          startDate: new Date("2026-01-12")
        }
      })
    )
  );

  await Promise.all(
    students.map((student, index) =>
      prisma.attendance.upsert({
        where: {
          schoolId_studentId_classId_date: {
            schoolId: school.id,
            studentId: student.id,
            classId: index < 2 ? primaryClass.id : bridgeClass.id,
            date: new Date("2026-05-11")
          }
        },
        update: {},
        create: {
          schoolId: school.id,
          studentId: student.id,
          classId: index < 2 ? primaryClass.id : bridgeClass.id,
          recordedById: teacher.id,
          date: new Date("2026-05-11"),
          status: index === 3 ? "LATE" : "PRESENT",
          note: index === 3 ? "Arrived after morning circle." : undefined
        }
      })
    )
  );

  await Promise.all(
    [
      {
        title: "English Starter Reader",
        author: "Refugee SchoolOS Curriculum Team",
        description: "A beginner reading pack with classroom vocabulary, picture prompts, and short practice passages.",
        category: "Reader",
        subject: "English",
        readingLevel: "Beginner",
        language: "English",
        fileUrl: "/demo-files/english-starter-reader.pdf"
      },
      {
        title: "Math Foundations Workbook",
        author: "Mon Refugee Learning Centre",
        description: "Printable number sense, addition, subtraction, and fractions practice for mixed-age classrooms.",
        category: "Workbook",
        subject: "Math",
        readingLevel: "Primary",
        language: "English",
        fileUrl: "/demo-files/math-foundations-workbook.pdf"
      },
      {
        title: "Health and Safety Picture Guide",
        author: "Community Education Network",
        description: "Visual guide for hygiene, safe travel, emergency contacts, and school wellbeing routines.",
        category: "Guide",
        subject: "Life Skills",
        readingLevel: "Beginner",
        language: "Burmese",
        fileUrl: "/demo-files/health-safety-picture-guide.pdf"
      }
    ].map((book) =>
      prisma.libraryBook.upsert({
        where: {
          id: `seed-${book.title.toLowerCase().replaceAll(" ", "-")}`
        },
        update: {
          ...book,
          schoolId: school.id,
          uploadedById: teacher.id
        },
        create: {
          id: `seed-${book.title.toLowerCase().replaceAll(" ", "-")}`,
          ...book,
          schoolId: school.id,
          uploadedById: teacher.id
        }
      })
    )
  );

  const videoLessons = await Promise.all(
    [
      {
        id: "seed-video-english-greetings",
        classId: primaryClass.id,
        subjectId: "subject-english",
        title: "English Greetings and Classroom Words",
        description: "A short introduction to greetings, classroom routines, and common teacher instructions.",
        videoUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
        videoProvider: VideoProvider.YOUTUBE,
        durationMinutes: 12,
        visibility: VideoVisibility.CLASS_ONLY
      },
      {
        id: "seed-video-math-fractions",
        classId: mathClass.id,
        subjectId: "subject-math",
        title: "Fractions with Paper Shapes",
        description: "Teacher-led fraction explanation using folded paper, shapes, and classroom practice questions.",
        videoUrl: "https://vimeo.com/76979871",
        videoProvider: VideoProvider.VIMEO,
        durationMinutes: 18,
        visibility: VideoVisibility.CLASS_ONLY
      },
      {
        id: "seed-video-safety-routines",
        classId: bridgeClass.id,
        subjectId: "subject-life-skills",
        title: "School Safety Routines",
        description: "Private school video for safe travel, emergency contact routines, and respectful classroom care.",
        videoUrl: "https://schoolos.local/videos/safety-routines.mp4",
        videoProvider: VideoProvider.PRIVATE,
        durationMinutes: 9,
        visibility: VideoVisibility.SCHOOL
      }
    ].map((video) =>
      prisma.videoLesson.upsert({
        where: { id: video.id },
        update: {
          schoolId: school.id,
          classId: video.classId,
          subjectId: video.subjectId,
          title: video.title,
          description: video.description,
          videoUrl: video.videoUrl,
          videoProvider: video.videoProvider,
          durationMinutes: video.durationMinutes,
          visibility: video.visibility,
          uploadedById: teacher.id
        },
        create: {
          ...video,
          schoolId: school.id,
          uploadedById: teacher.id
        }
      })
    )
  );

  await prisma.videoProgress.upsert({
    where: {
      schoolId_videoLessonId_studentId: {
        schoolId: school.id,
        videoLessonId: videoLessons[0].id,
        studentId: students[0].id
      }
    },
    update: {
      watchedSeconds: 480,
      completed: false,
      lastWatchedAt: new Date("2026-05-10T08:30:00.000Z")
    },
    create: {
      schoolId: school.id,
      videoLessonId: videoLessons[0].id,
      studentId: students[0].id,
      watchedSeconds: 480,
      completed: false,
      lastWatchedAt: new Date("2026-05-10T08:30:00.000Z")
    }
  });

  console.log(`Seeded ${school.name} with admin ${schoolAdmin.email}.`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEFAULT_THEMES } from "../lib/themes-seed";

const prisma = new PrismaClient();

async function main() {
  console.log("→ Seeding themes…");
  for (const t of DEFAULT_THEMES) {
    await prisma.theme.upsert({
      where: { slug: t.slug },
      create: t,
      update: t,
    });
  }

  console.log("→ Seeding users…");
  const password = await bcrypt.hash("password123", 10);

  const hosts = [
    {
      email: "minji@talk.dev",
      name: "Min-ji Kang",
      bio: "안녕하세요! 서울에 사는 25살 대학원생입니다. 영화와 카페 투어를 좋아해요. 처음 한국어를 배우는 분도 편하게 와 주세요 :)",
      avatar: "https://i.pravatar.cc/300?img=47",
      country: "South Korea",
      hourlyRate: 25000,
      specialties: "자기소개,일상회화,K-Drama",
    },
    {
      email: "junho@talk.dev",
      name: "Jun-ho Park",
      bio: "10년차 IT 개발자입니다. 비즈니스 한국어와 IT 용어를 잘 가르쳐요. Coffee chat 환영!",
      avatar: "https://i.pravatar.cc/300?img=12",
      country: "South Korea",
      hourlyRate: 40000,
      specialties: "비즈니스,IT,발음교정",
    },
    {
      email: "sora@talk.dev",
      name: "So-ra Lee",
      bio: "K-Pop 덕후이자 보컬 트레이너 출신. 노래로 배우는 한국어! 발음에 자신 없는 분 환영해요.",
      avatar: "https://i.pravatar.cc/300?img=45",
      country: "South Korea",
      hourlyRate: 30000,
      specialties: "K-Pop,발음,슬랭",
    },
    {
      email: "hyuk@talk.dev",
      name: "Hyuk Kim",
      bio: "부산 출신, 식당을 운영하고 있어요. 한국 음식과 사투리 배우고 싶은 분 모집!",
      avatar: "https://i.pravatar.cc/300?img=33",
      country: "South Korea",
      hourlyRate: 22000,
      specialties: "음식,사투리,여행",
    },
  ];

  const hostRecords = [];
  for (const h of hosts) {
    const u = await prisma.user.upsert({
      where: { email: h.email },
      create: { ...h, password, role: "KOREAN" },
      update: { ...h, role: "KOREAN" },
    });
    hostRecords.push(u);
  }

  const guests = [
    {
      email: "emma@talk.dev",
      name: "Emma Wilson",
      bio: "Hi! I'm from London. Been learning Korean for 1 year, love K-Drama and Korean food.",
      avatar: "https://i.pravatar.cc/300?img=44",
      country: "United Kingdom",
      nativeLanguage: "English",
    },
    {
      email: "kenji@talk.dev",
      name: "Kenji Tanaka",
      bio: "東京から。韓国旅行のために韓国語を勉強中。",
      avatar: "https://i.pravatar.cc/300?img=14",
      country: "Japan",
      nativeLanguage: "Japanese",
    },
  ];

  const guestRecords = [];
  for (const g of guests) {
    const u = await prisma.user.upsert({
      where: { email: g.email },
      create: { ...g, password, role: "FOREIGNER" },
      update: { ...g, role: "FOREIGNER" },
    });
    guestRecords.push(u);
  }

  console.log("→ Seeding availabilities…");
  for (const host of hostRecords) {
    await prisma.availability.deleteMany({ where: { userId: host.id } });
    // Weekday evenings 19-22 + weekend afternoons 14-18
    for (const dow of [1, 2, 3, 4]) {
      await prisma.availability.create({
        data: { userId: host.id, dayOfWeek: dow, startHour: 19, endHour: 22 },
      });
    }
    for (const dow of [0, 6]) {
      await prisma.availability.create({
        data: { userId: host.id, dayOfWeek: dow, startHour: 14, endHour: 18 },
      });
    }
  }

  console.log("→ Seeding reviews…");
  await prisma.review.deleteMany({});
  // Create a few past completed bookings + reviews
  const sampleReviews: Array<[number, number, string]> = [
    [0, 0, "정말 친절하고 발음 교정을 꼼꼼히 해주셨어요. 최고!"],
    [0, 1, "Super fun session! Min-ji teaches with great energy."],
    [1, 0, "비즈니스 표현을 체계적으로 배웠습니다. 추천!"],
    [2, 1, "Learned so many K-pop expressions. Highly recommended."],
    [2, 0, "노래로 배우니까 머리에 쏙쏙 들어와요."],
    [3, 0, "부산 사투리도 배웠어요. 음식 이야기로 시간 가는 줄 모름."],
  ];
  for (const [hostIdx, guestIdx, comment] of sampleReviews) {
    const host = hostRecords[hostIdx];
    const guest = guestRecords[guestIdx];
    const past = new Date(Date.now() - (Math.random() * 30 + 5) * 24 * 60 * 60 * 1000);
    const end = new Date(past.getTime() + 60 * 60 * 1000);
    const booking = await prisma.booking.create({
      data: {
        hostId: host.id,
        guestId: guest.id,
        startTime: past,
        endTime: end,
        amount: host.hourlyRate ?? 25000,
        status: "COMPLETED",
        customTopic: "샘플 세션",
      },
    });
    await prisma.review.create({
      data: {
        bookingId: booking.id,
        reviewerId: guest.id,
        revieweeId: host.id,
        rating: 4 + Math.floor(Math.random() * 2),
        comment,
      },
    });
  }

  console.log("✓ Done.");
  console.log("Test accounts (password: password123):");
  console.log("  Korean hosts: minji@talk.dev, junho@talk.dev, sora@talk.dev, hyuk@talk.dev");
  console.log("  Foreign guests: emma@talk.dev, kenji@talk.dev");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

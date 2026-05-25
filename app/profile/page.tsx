import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { ProfileForm } from "./ProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login?callbackUrl=/profile");
  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold mb-6">프로필 편집</h1>
      <ProfileForm
        initial={{
          name: user.name,
          bio: user.bio ?? "",
          avatar: user.avatar ?? "",
          country: user.country ?? "",
          nativeLanguage: user.nativeLanguage ?? "",
          hourlyRate: user.hourlyRate ?? 25000,
          specialties: user.specialties ?? "",
          role: user.role as "KOREAN" | "FOREIGNER",
        }}
      />
    </div>
  );
}

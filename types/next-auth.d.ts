import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      image?: string | null;
      role: "KOREAN" | "FOREIGNER";
    };
  }
  interface User {
    role: "KOREAN" | "FOREIGNER";
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    role: "KOREAN" | "FOREIGNER";
  }
}

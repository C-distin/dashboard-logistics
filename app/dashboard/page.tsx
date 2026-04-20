import { headers } from "next/headers";
import { auth } from "@/lib/auth/auth";

export default async function Dashboard() {
  const session = await auth.api.getSession({
    headers: await headers(),
  });

  return (
    <main className="min-h-full flex flex-col items-center justify-center">
      <section className="relative w-full bg-purple-700 overflow-hidden min-h-130 flex flex-col items-center justify-center">
        <h1 className="text-white text-6xl font-bold">Dashboard</h1>
      </section>
      <section className="w-full py-24 px-8 md:px-16 bg-white">
        <p>Welcome, {session?.user.name}</p>
      </section>
    </main>
  );
}

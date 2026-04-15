import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireSession, getUserProfile } from "@/lib/auth-server";
import GhostBadge from "@/components/GhostBadge";

export default async function PublicProfilePage({
  params,
}: {
  params: { userId: string };
}) {
  const session = await requireSession().catch(() => null);
  if (!session) redirect("/login");

  const user = await getUserProfile(params.userId);
  if (!user) notFound();

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/dashboard"
          className="text-sm text-gray-500 hover:text-gray-700 inline-block mb-4"
        >
          ← Back
        </Link>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
          <div className="flex items-start gap-4 mb-6">
            {user.photoURL ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.photoURL}
                alt=""
                className="w-20 h-20 rounded-full"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center text-3xl">
                🦡
              </div>
            )}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {user.displayName}
              </h1>
              <p className="text-sm text-gray-500">
                {user.major} · {user.year}
              </p>
              <GhostBadge punishment={user.punishment} />
            </div>
          </div>

          <div className="space-y-5">
            <Section title="Classes">
              {user.currentClasses.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {user.currentClasses.map((c) => (
                    <span
                      key={c}
                      className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded"
                    >
                      {c}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-sm">—</p>
              )}
            </Section>

            <Section title="Hobbies">
              <p className="text-gray-700 text-sm">
                {user.hobbies.join(", ") || "—"}
              </p>
            </Section>

            <Section title="Meeting vibes">
              <p className="text-gray-700 text-sm">
                {user.meetPreferences.join(", ") || "—"}
              </p>
            </Section>

            {user.extractedResume && (
              <>
                <Section title="Skills">
                  <div className="flex flex-wrap gap-1.5">
                    {user.extractedResume.skills.map((s) => (
                      <span
                        key={s}
                        className="text-xs bg-red-50 text-red-700 border border-red-100 px-3 py-1 rounded-full"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Section>
                <Section title="Projects">
                  <ul className="text-gray-700 text-sm space-y-1">
                    {user.extractedResume.projects.map((p) => (
                      <li key={p}>· {p}</li>
                    ))}
                  </ul>
                </Section>
                <Section title="Clubs">
                  <p className="text-gray-700 text-sm">
                    {user.extractedResume.clubs.join(", ") || "—"}
                  </p>
                </Section>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
        {title}
      </p>
      {children}
    </div>
  );
}

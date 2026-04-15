import Link from "next/link";

const steps = [
  {
    number: "01",
    title: "Fill Your Profile",
    description:
      "Share your major, classes, a project idea you want to build, and one hobby. Takes 2 minutes.",
  },
  {
    number: "02",
    title: "AI Finds Your Match",
    description:
      "Claude analyzes your profile against other UW-Madison students and surfaces your top 3 collaborators.",
  },
  {
    number: "03",
    title: "Show Up In Person",
    description:
      "No DMs. No back-and-forth scheduling. The AI tells you where on campus to meet and when.",
  },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="border-b border-gray-100 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <span className="font-bold text-red-600 text-lg tracking-tight">
            BadgerConnect
          </span>
          <Link
            href="/login"
            className="text-sm font-medium text-red-600 hover:text-red-700"
          >
            Get Started →
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-5xl mx-auto px-6 pt-24 pb-20 text-center">
        <div className="inline-block bg-red-50 text-red-700 text-sm font-medium px-4 py-1.5 rounded-full mb-6">
          Built for UW-Madison students
        </div>
        <h1 className="text-5xl font-extrabold text-gray-900 leading-tight tracking-tight max-w-3xl mx-auto">
          Find your next{" "}
          <span className="text-red-600">collaborator</span>{" "}
          at UW-Madison
        </h1>
        <p className="mt-6 text-xl text-gray-500 max-w-xl mx-auto leading-relaxed">
          BadgerConnect matches you with students who share your project interests,
          classes, and goals — then tells you exactly where and when to meet.
          No chat. Just show up.
        </p>
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/login"
            className="bg-red-600 hover:bg-red-700 text-white font-semibold px-8 py-3.5 rounded-xl text-base transition-colors shadow-sm"
          >
            Create My Profile
          </Link>
          <a
            href="#how-it-works"
            className="text-gray-500 hover:text-gray-700 font-medium text-base"
          >
            How it works ↓
          </a>
        </div>
      </section>

      {/* Divider */}
      <div className="border-t border-gray-100" />

      {/* How It Works */}
      <section id="how-it-works" className="max-w-5xl mx-auto px-6 py-24">
        <h2 className="text-3xl font-bold text-gray-900 text-center mb-4">
          How it works
        </h2>
        <p className="text-gray-500 text-center mb-14 max-w-lg mx-auto">
          BadgerConnect bridges the gap between students who want to build things
          together but never get the chance to meet.
        </p>

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step) => (
            <div key={step.number} className="relative">
              <div className="text-5xl font-black text-red-100 mb-4 leading-none">
                {step.number}
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Why no chat */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <div className="text-4xl mb-4">🤝</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            Why no in-app chat?
          </h2>
          <p className="text-gray-500 leading-relaxed max-w-xl mx-auto">
            Real connections happen in person. BadgerConnect is designed to get you
            off your phone and into a coffee shop with someone who shares your goals.
            The AI handles the logistics so you can focus on the conversation.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-5xl mx-auto px-6 py-24 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-4">
          Ready to find your match?
        </h2>
        <p className="text-gray-500 mb-8">
          It takes 2 minutes. Your next co-founder or study partner is waiting.
        </p>
        <Link
          href="/login"
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-10 py-4 rounded-xl text-base transition-colors shadow-sm inline-block"
        >
          Get Started — It&apos;s Free
        </Link>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 px-6 py-6">
        <p className="text-center text-xs text-gray-400">
          BadgerConnect · Built at UW-Madison · On, Wisconsin! 🦡
        </p>
      </footer>
    </div>
  );
}

"use client";

export default function Home() {
  const apps = [
    {
      href: "/receptionist",
      icon: "💅",
      title: "Beauty Tech AI Receptionist",
      description: "Live AI chat for lash techs, microblading & PMU studios. Answers FAQs, handles intake, and books appointments 24/7.",
      gradient: "from-pink-400 to-purple-500",
      badge: "Live Product",
      badgeColor: "bg-pink-100 text-pink-700",
    },
    {
      href: "/tracker",
      icon: "📋",
      title: "OutreachHQ — Sales Tracker",
      description: "Full CRM to manage your outreach. Track leads, pipeline, DM scripts, and follow-ups all in one dark-mode dashboard.",
      gradient: "from-blue-500 to-purple-600",
      badge: "Your Sales Tool",
      badgeColor: "bg-blue-100 text-blue-700",
    },
    {
      href: "/canva",
      icon: "🎨",
      title: "Canva Product Generator",
      description: "Generate ready-to-sell Canva template digital products for your Etsy store. Wall art, planners, social templates & more.",
      gradient: "from-purple-500 to-pink-500",
      badge: "Etsy Products",
      badgeColor: "bg-purple-100 text-purple-700",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <div className="text-center mb-14">
          <div className="inline-flex items-center gap-2 bg-white border border-gray-200 rounded-full px-4 py-2 text-sm text-gray-500 mb-6">
            <span className="w-2 h-2 rounded-full bg-green-400 inline-block" />
            All systems live
          </div>
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Your Business Suite</h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto">
            Three tools built for your beauty tech SaaS business — the product, the sales tracker, and the content generator.
          </p>
        </div>

        {/* App Cards */}
        <div className="grid grid-cols-1 gap-6">
          {apps.map((app) => (
            <a
              key={app.href}
              href={app.href}
              className="group block bg-white rounded-2xl border border-gray-200 overflow-hidden hover:shadow-lg hover:border-gray-300 transition-all duration-200"
            >
              <div className={`h-2 bg-gradient-to-r ${app.gradient}`} />
              <div className="p-8 flex items-start gap-6">
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${app.gradient} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {app.icon}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-3 mb-2">
                    <h2 className="text-xl font-bold text-gray-900">{app.title}</h2>
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${app.badgeColor}`}>
                      {app.badge}
                    </span>
                  </div>
                  <p className="text-gray-500 text-sm leading-relaxed">{app.description}</p>
                </div>
                <div className="text-gray-300 group-hover:text-gray-500 transition-colors text-xl flex-shrink-0">
                  →
                </div>
              </div>
            </a>
          ))}
        </div>

        {/* Coming Soon Banner */}
        <div className="mt-10 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-2xl p-6 text-center">
          <div className="text-sm font-semibold text-purple-700 mb-1">🚀 Coming Next</div>
          <p className="text-gray-600 text-sm">
            Full SaaS platform — Supabase auth, Stripe $79/mo subscriptions, multi-tenant accounts for beauty techs, and a demo page.
          </p>
        </div>
      </div>
    </div>
  );
}

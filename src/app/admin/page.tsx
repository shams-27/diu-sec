import type { Metadata } from "next";
import { connection } from "next/server";
import { WingDistributionChart } from "@/components/admin/wing-distribution-chart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { requireActor } from "@/lib/admin-guard";
import { dashboardData } from "@/lib/dashboard";

export const metadata: Metadata = { title: "Dashboard · Admin" };

export default async function AdminHomePage() {
  await connection();
  const actor = await requireActor("dashboard", "read", "own");
  const { cards, chart } = await dashboardData(actor);

  return (
    <div className="space-y-8">
      <div className="admin-banner admin-enter rounded-2xl border border-border p-6 sm:p-8">
        <span className="pill">A-01 · Overview</span>
        <h1 className="mt-4 font-heading text-5xl leading-none tracking-wide sm:text-6xl">Dashboard</h1>
        <p className="mt-3 max-w-xl text-sm text-muted-foreground">
          {actor.role === "WING_LEAD" ? "Your wing at a glance." : "The club at a glance."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card, index) => (
          <Card
            key={card.label}
            className="admin-enter card-lift border-t-2 border-t-primary/70"
            style={{ animationDelay: `${index * 60}ms` }}
          >
            <CardHeader>
              <CardTitle className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                {card.label}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="stat-value text-primary">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <section
        aria-labelledby="distribution-heading"
        className="hero-surface admin-enter card-lift rounded-2xl border border-border p-5 sm:p-6"
        style={{ animationDelay: "260ms" }}
      >
        <span className="pill">Analytics</span>
        <h2 id="distribution-heading" className="mt-3 font-heading text-3xl tracking-wide">
          Wing-wise member distribution
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">Approved members by preferred wing.</p>
        <div className="mt-5">
          <WingDistributionChart data={chart} />
        </div>
      </section>
    </div>
  );
}

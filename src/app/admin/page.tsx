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
      <div>
        <p className="text-xs font-semibold uppercase tracking-widest text-primary">A-01</p>
        <h1 className="mt-2 font-heading text-4xl tracking-wide">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          {actor.role === "WING_LEAD" ? "Your wing at a glance." : "The club at a glance."}
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl tabular-nums">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <section aria-labelledby="distribution-heading" className="rounded-2xl border border-border bg-card p-5">
        <h2 id="distribution-heading" className="font-heading text-2xl tracking-wide">
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

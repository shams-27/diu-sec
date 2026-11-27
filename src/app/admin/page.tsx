import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const CARDS = [
  { label: "Active members", value: "0" },
  { label: "Pending applications", value: "0" },
  { label: "Event registrations", value: "0" },
  { label: "Issued certificates", value: "0" },
];

export default function AdminHomePage() {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-4xl tracking-wide">Dashboard</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Metrics and the wing distribution chart arrive in Phase 8. Module navigation is ready.
        </p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {CARDS.map((card) => (
          <Card key={card.label}>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-heading text-4xl">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
        No chart data yet — seed data is loaded, and the dashboard chart will be built in Phase 8.
      </div>
    </div>
  );
}

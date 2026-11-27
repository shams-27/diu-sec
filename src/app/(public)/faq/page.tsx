import { getFaqs } from "@/backend/features/contact/queries";
import type { Metadata } from "next";
import { connection } from "next/server";
import { PageHero, SectionTitle } from "@/frontend/shared/page-hero";

export const metadata: Metadata = {
  title: "FAQ",
  description: "Answers about DIU SEC membership eligibility, labs and club activities.",
};

export default async function FaqPage() {
  await connection();
  const faqs = await getFaqs();

  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Good to know"
        title="Frequently asked questions"
        description="Membership eligibility, where we meet and what to expect — answered before you ask."
      />

      <section aria-labelledby="faq-heading" className="space-y-5">
        <SectionTitle id="faq-heading">Questions & answers</SectionTitle>
        {faqs.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
            No questions have been posted yet. Check back soon.
          </p>
        ) : (
          <div className="stagger-in space-y-4">
            {faqs.map((faq) => (
              <details key={faq.id} className="card-lift rounded-xl border border-border bg-card p-5 shadow-sm">
                <summary className="cursor-pointer rounded-md font-heading text-xl leading-tight tracking-wide marker:text-primary hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                  {faq.question}
                </summary>
                <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

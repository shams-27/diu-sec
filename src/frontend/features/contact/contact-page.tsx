import { ContactForm } from "@/frontend/features/contact/contact-form";
import { PageHero, SectionTitle } from "@/frontend/shared/page-hero";



export function ContactPage() {
  return (
    <div className="space-y-10">
      <PageHero
        eyebrow="Say hello"
        title="Contact us"
        description="Curious about membership, events or a collaboration? Drop us a note and the club team will get back to you."
      />
      <section aria-labelledby="contact-heading" className="space-y-5">
        <SectionTitle id="contact-heading">Send a message</SectionTitle>
        <ContactForm />
      </section>
    </div>
  );
}

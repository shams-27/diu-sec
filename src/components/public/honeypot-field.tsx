import { HONEYPOT_FIELD } from "@/lib/honeypot";

export function HoneypotField({ id }: { id: string }) {
  return (
    <div aria-hidden="true" className="absolute left-[-9999px] h-px w-px overflow-hidden">
      <label htmlFor={id}>Website (leave blank)</label>
      <input id={id} name={HONEYPOT_FIELD} type="text" tabIndex={-1} autoComplete="off" />
    </div>
  );
}

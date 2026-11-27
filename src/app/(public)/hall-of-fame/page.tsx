import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Hall of Fame",
  description: "Verified DIU SEC achievers in ICPC, NCPC, hackathons, GSoC and alumni stories.",
};

export { HallOfFamePage as default } from "@/frontend/features/hall-of-fame/hall-of-fame-page";

import { ViewTransition } from "react";

export default function Template({ children }: { children: React.ReactNode }) {
  return (
    <ViewTransition name="public-page" default="none" share="page-fade">
      <div>{children}</div>
    </ViewTransition>
  );
}

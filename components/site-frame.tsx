"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { MotionProvider } from "@/components/motion/motion-provider";
import { InteractiveBackground } from "@/components/motion/interactive-background";
import { PageTransition } from "@/components/motion/page-transition";
import type { PublicLinks } from "@/lib/public-links";
import type { TelegramLinks } from "@/lib/telegram";

export function SiteFrame({
  children,
  publicLinks,
  telegram,
  projectsEnabled,
}: {
  children: ReactNode;
  publicLinks: PublicLinks;
  telegram: TelegramLinks;
  projectsEnabled: boolean;
}) {
  const pathname = usePathname();
  if (pathname === "/") return children;
  return (
    <MotionProvider>
      <InteractiveBackground />
      <SiteHeader publicLinks={publicLinks} projectsEnabled={projectsEnabled} />
      <PageTransition>{children}</PageTransition>
      <SiteFooter
        telegram={telegram}
        publicLinks={publicLinks}
        projectsEnabled={projectsEnabled}
      />
    </MotionProvider>
  );
}

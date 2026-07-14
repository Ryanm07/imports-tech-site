import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Métricas públicas",
  description:
    "Métricas públicas e catálogo sincronizado do canal Imports Tech.",
  alternates: { canonical: "/metricas" },
};

export default function MetricsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

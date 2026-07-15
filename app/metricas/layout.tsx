import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Métricas públicas",
  description:
    "Métricas públicas oficiais do canal Imports Tech e data do último retrato disponível.",
  alternates: { canonical: "/metricas" },
};

export default function MetricsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

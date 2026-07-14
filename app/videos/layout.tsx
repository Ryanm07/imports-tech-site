import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vídeos",
  description: "Biblioteca pesquisável de vídeos do canal Imports Tech.",
  alternates: { canonical: "/videos" },
};

export default function VideosLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}

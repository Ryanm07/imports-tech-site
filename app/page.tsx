import { HomePage } from "./home-page";
import type { Metadata } from "next";
import { getPublicEditorialData } from "@/lib/content-repository";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default async function Home() {
  const data = await getPublicEditorialData();
  return (
    <HomePage
      reviews={data.reviews}
      finds={data.finds}
      categories={data.categories}
    />
  );
}

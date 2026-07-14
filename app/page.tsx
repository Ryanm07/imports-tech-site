import { HomePage } from "./home-page";
import type { Metadata } from "next";

export const metadata: Metadata = { alternates: { canonical: "/" } };

export default function Home() {
  return <HomePage/>;
}

import { HomePage } from "@/components/landing/HomePage";
import { JsonLd } from "@/components/seo/JsonLd";
import { jsonLdOrganizacion } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <JsonLd data={jsonLdOrganizacion()} />
      <HomePage />
    </>
  );
}

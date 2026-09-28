import { defineToolPack, defineTool } from "@tracht-digital-solutions/tds-tools-contract";

export * from "./card";

/**
 * Business-card pack. One tool today; the pack shape lets card-adjacent tools
 * (a letterhead, an email signature) join later without a new repo — the same
 * reasoning as the QR pack.
 */
export default defineToolPack({
  id: "businesscard",
  name: "Visitenkarten",
  version: "0.1.0",
  tools: [
    defineTool({
      id: "businesscard-designer",
      slug: "visitenkarten-designer",
      name: "Visitenkarten-Designer",
      category: "marketing",
      description:
        "Gestalte eine Visitenkarte im Browser: Farbe, Ecken, Schatten und Aufteilung ändern und sofort sehen, wie sie aussieht. Download als PNG in Druckauflösung.",
      icon: "id-card",
      keywords: ["visitenkarte", "designer", "vorschau", "druck", "business card", "png"],
      component: "@tracht-digital-solutions/tds-tool-businesscard/tools/CardDesigner.astro",
      seo: {
        title: "Visitenkarten-Designer — gestalten und ansehen, ohne Anmeldung",
        description:
          "Visitenkarte im Browser gestalten: Farben, Ecken, Schatten und Aufteilung anpassen, Vorschau in Echtzeit, PNG-Download in 300 dpi. Alles lokal, keine Anmeldung.",
        jsonLdType: "WebApplication",
      },
    }),
  ],
  i18n: {
    de: { "businesscard.title": "Visitenkarten-Designer" },
    en: { "businesscard.title": "Business Card Designer" },
  },
});

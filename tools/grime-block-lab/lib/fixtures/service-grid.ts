export const serviceGridDisplayVariants = [
  "interactive",
  "featureCards",
  "pricingSteps",
] as const;

export type ServiceGridDisplayVariant =
  (typeof serviceGridDisplayVariants)[number];

export interface ServiceGridHighlightFixture {
  text: string;
}

export interface ServiceGridMediaFixture {
  src?: string;
  alt?: string;
  badge?: string;
  credit?: string;
  tintFrom?: string;
  tintTo?: string;
}

export interface ServiceGridRowFixture {
  id: string;
  eyebrow?: string;
  name: string;
  summary: string;
  pricingHint?: string;
  highlights?: ServiceGridHighlightFixture[];
  media?: ServiceGridMediaFixture | null;
}

export interface ServiceGridBlockFixture {
  blockType: "serviceGrid";
  displayVariant: ServiceGridDisplayVariant;
  eyebrow?: string;
  heading: string;
  intro?: string;
  services: ServiceGridRowFixture[];
}

export const serviceGridFixtures = {
  interactive: {
    blockType: "serviceGrid",
    displayVariant: "interactive",
    eyebrow: "Exterior lanes",
    heading: "Seasonal service grid",
    intro:
      "A fixture-first preview of the lane selector treatment: swap rows, media, and copy without opening the live composer.",
    services: [
      {
        id: "house-wash",
        eyebrow: "Front elevation",
        name: "House wash",
        summary:
          "Dial in the main hero lane with enough copy to test balance, media crop, and the height of the detail panel.",
        pricingHint: "Most common opener",
        media: {
          src: "/mock-media/service-grid-housewash.svg",
          alt: "Mock exterior wash artwork",
          badge: "Fixture media",
          credit: "Local SVG fixture",
          tintFrom: "rgba(16, 44, 74, 0.76)",
          tintTo: "rgba(3, 8, 18, 0.22)",
        },
        highlights: [
          { text: "Primary lane to test crop, contrast, and copy density." },
          { text: "Good baseline for card rhythm and text truncation." },
          { text: "Safe to swap with custom JSON when testing new copy." },
        ],
      },
      {
        id: "flatwork",
        eyebrow: "High-volume lane",
        name: "Driveway and flatwork",
        summary:
          "Use a broader, lower-detail image and shorter copy to check how the lane selector behaves when rows have mixed content lengths.",
        pricingHint: "Wide crop fixture",
        media: {
          src: "/mock-media/service-grid-flatwork.svg",
          alt: "Mock flatwork cleaning artwork",
          badge: "Wide ratio",
          credit: "Local SVG fixture",
          tintFrom: "rgba(24, 65, 96, 0.78)",
          tintTo: "rgba(6, 10, 16, 0.28)",
        },
        highlights: [
          { text: "Tests wide geometry and softer overlay handling." },
          { text: "Keeps highlight count shorter than the hero lane." },
        ],
      },
      {
        id: "waterfront",
        eyebrow: "Special surface",
        name: "Dock and waterfront wash",
        summary:
          "Longer descriptive copy plus a busier image helps catch overflow and spacing regressions before the block reaches the public site.",
        pricingHint: "Contrast stress test",
        media: {
          src: "/mock-media/service-grid-waterfront.svg",
          alt: "Mock dock cleaning artwork",
          badge: "Dense texture",
          credit: "Local SVG fixture",
          tintFrom: "rgba(11, 39, 71, 0.74)",
          tintTo: "rgba(2, 7, 17, 0.34)",
        },
        highlights: [
          { text: "Stress-tests long copy and denser line breaks." },
          { text: "Useful for validating footer badges and overlays." },
          { text: "Stands in for specialty service media while iterating." },
        ],
      },
    ],
  },
  featureCards: {
    blockType: "serviceGrid",
    displayVariant: "featureCards",
    eyebrow: "Core offers",
    heading: "What we do",
    intro:
      "Card-based fixture for the reusable feature treatment. Each card keeps mock media attached so the lab can exercise media-heavy blocks without real CMS assets.",
    services: [
      {
        id: "soft-wash",
        eyebrow: "Home exterior",
        name: "Soft wash",
        summary:
          "A polished service card with enough body copy to judge visual rhythm in the card layout.",
        pricingHint: "Most requested",
        media: {
          src: "/mock-media/service-grid-housewash.svg",
          alt: "Mock house wash feature card artwork",
          badge: "House wash",
          credit: "Local SVG fixture",
          tintFrom: "rgba(18, 48, 80, 0.78)",
          tintTo: "rgba(5, 9, 17, 0.2)",
        },
        highlights: [
          {
            text: "Tests chip layout, summary length, and media edge treatment.",
          },
          {
            text: "Gives the workbench a media-rich card to tune against.",
          },
        ],
      },
      {
        id: "roof-care",
        eyebrow: "Low-pressure",
        name: "Roof care",
        summary:
          "A darker card fixture to catch text contrast issues when the image has a deeper value range.",
        pricingHint: "Dark image test",
        media: {
          src: "/mock-media/service-grid-waterfront.svg",
          alt: "Mock roof care feature card artwork",
          badge: "Dark contrast",
          credit: "Local SVG fixture",
          tintFrom: "rgba(22, 54, 89, 0.82)",
          tintTo: "rgba(2, 6, 17, 0.28)",
        },
        highlights: [
          { text: "Validates how badge chrome sits over darker media." },
          { text: "Useful when testing typography against heavy textures." },
        ],
      },
      {
        id: "commercial",
        eyebrow: "Bigger surfaces",
        name: "Commercial wash",
        summary:
          "The third card keeps the grid honest by using slightly longer copy and fewer highlight bullets.",
        pricingHint: "Long-copy lane",
        media: {
          src: "/mock-media/service-grid-flatwork.svg",
          alt: "Mock commercial wash feature card artwork",
          badge: "Commercial lane",
          credit: "Local SVG fixture",
          tintFrom: "rgba(25, 62, 94, 0.8)",
          tintTo: "rgba(5, 10, 18, 0.24)",
        },
        highlights: [
          { text: "Helps check equal-height cards across mixed content." },
        ],
      },
    ],
  },
  pricingSteps: {
    blockType: "serviceGrid",
    displayVariant: "pricingSteps",
    eyebrow: "Estimate logic",
    heading: "How our pricing works",
    intro:
      "Step-based fixture for pricing copy. This version drops media and makes the block easier to iterate as a narrative explainer inside the studio.",
    services: [
      {
        id: "step-1",
        eyebrow: "Step 01",
        name: "Surface and scope",
        summary:
          "Start with the size of the surface, how exposed it is, and whether access is standard or awkward.",
        highlights: [
          {
            text: "Good place to tune short, utility-heavy editorial copy.",
          },
        ],
      },
      {
        id: "step-2",
        eyebrow: "Step 02",
        name: "Condition and prep",
        summary:
          "Layer in oxidation, buildup, and whether the lane needs prep before the actual wash starts.",
        highlights: [
          {
            text: "Catches balance issues when cards have similar copy length.",
          },
        ],
      },
      {
        id: "step-3",
        eyebrow: "Step 03",
        name: "Schedule and frequency",
        summary:
          "Recurring work, route efficiency, and seasonality all shape the final number and the way the explanation reads.",
        highlights: [
          {
            text: "Useful for tightening the final step card and its spacing.",
          },
        ],
      },
    ],
  },
} satisfies Record<string, ServiceGridBlockFixture>;

export type ServiceGridFixtureId = keyof typeof serviceGridFixtures;

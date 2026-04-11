export interface LiveBlockCatalogDefinition {
  category: string;
  description: string;
  id: string;
  keywords: string[];
  label: string;
  livePreviewComponentId: null | string;
  supportsInsert: boolean;
  supportsNesting: boolean;
  supportsReusable: boolean;
}

export interface LiveBlockCatalogPageSummary {
  id: number;
  pagePath: string;
  slug: string;
  status: "draft" | "published";
  title: string;
  updatedAt: string;
  visibility: "private" | "public";
}

export interface LiveBlockCatalogServiceGridPreviewInput {
  block: {
    blockType: "serviceGrid";
    displayVariant: "featureCards" | "interactive" | "pricingSteps";
    eyebrow?: string;
    heading: string;
    intro?: string;
    services: Array<{
      eyebrow?: string;
      highlights?: Array<{ text: string }>;
      id: string;
      media?: {
        alt?: string;
        badge?: string;
        credit?: string;
        src?: string;
      } | null;
      name: string;
      pricingHint?: string;
      summary: string;
    }>;
  };
  fixtureId?: "featureCards" | "interactive" | "pricingSteps";
}

export interface LiveBlockCatalogSummary {
  blockIndex: number;
  blockInstanceId?: string | null;
  blockLabel: string;
  blockType: string;
  composerReusable?: {
    key?: string | null;
    label?: string | null;
    mode?: string | null;
    sourceType?: string | null;
  } | null;
  displayVariant?: string | null;
  hidden: boolean;
  livePreviewComponentId: null | string;
  mediaSlotSummary?: Array<{
    hasMedia: boolean;
    index: number;
    label: string;
    mediaId: null | number;
  }>;
  page: LiveBlockCatalogPageSummary;
  previewInput?: LiveBlockCatalogServiceGridPreviewInput;
  previewable: boolean;
  summary?: string | null;
}

export interface LiveBlockCatalogResponse {
  counts: {
    definitions: number;
    pages: number;
    previewableBlocks: number;
    totalBlocks: number;
  };
  definitions: LiveBlockCatalogDefinition[];
  generatedAt: string;
  liveBlocks: LiveBlockCatalogSummary[];
  pages: LiveBlockCatalogPageSummary[];
}

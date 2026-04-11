"use client";

import { ServiceGridPreview } from "@/components/blocks/service-grid-preview";
import { getBlockFixture } from "@/lib/fixtures/block-fixture-registry";
import { SERVICE_GRID_DEMO_INPUT } from "./default-props";

export function ServiceGridDemo() {
  const block = getBlockFixture(
    "serviceGrid",
    SERVICE_GRID_DEMO_INPUT.fixtureId,
  );

  return <ServiceGridPreview {...block} theme="dark" />;
}

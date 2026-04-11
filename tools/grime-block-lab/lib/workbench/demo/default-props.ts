"use client";

import {
  blockFixtureRegistry,
  type ServiceGridFixtureId,
} from "@/lib/fixtures/block-fixture-registry";
import type { ServiceGridBlockFixture } from "@/lib/fixtures/service-grid";

export interface ServiceGridWorkbenchInput extends Record<string, unknown> {
  fixtureId?: ServiceGridFixtureId;
  block?: Partial<ServiceGridBlockFixture> & {
    services?: ServiceGridBlockFixture["services"];
  };
}

export const SERVICE_GRID_DEMO_INPUT: ServiceGridWorkbenchInput = {
  fixtureId: blockFixtureRegistry.serviceGrid.defaultFixtureId,
};

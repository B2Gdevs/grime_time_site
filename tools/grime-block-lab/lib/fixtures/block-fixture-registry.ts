import {
  type ServiceGridBlockFixture,
  type ServiceGridFixtureId,
  serviceGridFixtures,
} from "./service-grid";

export const blockFixtureRegistry = {
  serviceGrid: {
    blockType: "serviceGrid",
    defaultFixtureId: "interactive",
    fixtures: serviceGridFixtures,
  },
} as const;

export function getBlockFixture(
  blockType: "serviceGrid",
  fixtureId?: ServiceGridFixtureId,
): ServiceGridBlockFixture {
  const registry = blockFixtureRegistry[blockType];
  const resolvedFixtureId = fixtureId ?? registry.defaultFixtureId;

  return (
    registry.fixtures[resolvedFixtureId] ??
    registry.fixtures[registry.defaultFixtureId]
  );
}

export type BlockFixtureRegistry = typeof blockFixtureRegistry;
export type { ServiceGridFixtureId };

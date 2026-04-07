'use client'

import { useInteractable, type UseInteractableConfig } from '@assistant-ui/react'

type InteractableSchema = UseInteractableConfig<never>['stateSchema']

function asSchema(schema: InteractableSchema) {
  return schema
}

const liveCanvasSchema = asSchema({
  additionalProperties: false,
  properties: {
    activeTab: { type: 'string' },
    dirty: { type: 'boolean' },
    pagePath: { type: 'string' },
    previewMode: { type: 'string' },
    selectedBlockType: { type: 'string' },
    selectedIndex: { type: 'number' },
    selectedLabel: { type: 'string' },
  },
  required: ['pagePath', 'previewMode', 'activeTab', 'selectedIndex', 'selectedLabel', 'selectedBlockType', 'dirty'],
  type: 'object',
} as const)

const heroSchema = asSchema({
  additionalProperties: false,
  properties: {
    body: { type: 'string' },
    eyebrow: { type: 'string' },
    headlineAccent: { type: 'string' },
    headlinePrimary: { type: 'string' },
    panelBody: { type: 'string' },
    panelEyebrow: { type: 'string' },
    panelHeading: { type: 'string' },
    pagePath: { type: 'string' },
  },
  required: ['pagePath', 'eyebrow', 'headlinePrimary', 'headlineAccent', 'body', 'panelEyebrow', 'panelHeading', 'panelBody'],
  type: 'object',
} as const)

const sectionSchema = asSchema({
  additionalProperties: false,
  properties: {
    blockType: { type: 'string' },
    heading: { type: 'string' },
    index: { type: 'number' },
    intro: { type: 'string' },
    pagePath: { type: 'string' },
    rowLabels: {
      items: { type: 'string' },
      type: 'array',
    },
    variant: { type: 'string' },
  },
  required: ['pagePath', 'index', 'blockType', 'variant', 'heading', 'intro', 'rowLabels'],
  type: 'object',
} as const)

type LiveCanvasState = {
  activeTab: string
  dirty: boolean
  pagePath: string
  previewMode: string
  selectedBlockType: string
  selectedIndex: number
  selectedLabel: string
}

type HeroInteractableState = {
  body: string
  eyebrow: string
  headlineAccent: string
  headlinePrimary: string
  pagePath: string
  panelBody: string
  panelEyebrow: string
  panelHeading: string
}

type SectionInteractableState = {
  blockType: string
  heading: string
  index: number
  intro: string
  pagePath: string
  rowLabels: string[]
  variant: string
}

export function useLiveCanvasInteractable(args: {
  active: boolean
  id: string
  state: LiveCanvasState
}) {
  useInteractable('live_canvas', {
    description: 'The current Grime Time live page canvas and composer toolbar state.',
    id: args.id,
    initialState: args.state,
    selected: args.active,
    stateSchema: liveCanvasSchema,
  })
}

export function useHeroInteractable(args: {
  id: string
  selected: boolean
  state: HeroInteractableState
}) {
  useInteractable('marketing_hero', {
    description: 'The homepage marketing hero copy and overlay copy.',
    id: args.id,
    initialState: args.state,
    selected: args.selected,
    stateSchema: heroSchema,
  })
}

export function useSectionInteractable(args: {
  description: string
  id: string
  name: 'pricing_table' | 'service_grid'
  selected: boolean
  state: SectionInteractableState
}) {
  useInteractable(args.name, {
    description: args.description,
    id: args.id,
    initialState: args.state,
    selected: args.selected,
    stateSchema: sectionSchema,
  })
}

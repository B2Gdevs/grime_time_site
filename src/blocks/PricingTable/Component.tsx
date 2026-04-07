'use client'

import React from 'react'

import type { Pricing, PricingTableBlock as PricingTableBlockData } from '@/payload-types'
import type { PageComposerToolbarState } from '@/components/admin-impersonation/PageComposerContext'

import { InlineTextarea, InlineTextInput, usePageComposerTextGenerator } from '@/components/admin-impersonation/PageComposerInlineText'
import { usePageComposerCanvasToolbarState } from '@/components/admin-impersonation/PageComposerCanvas'
import { usePageComposerOptional } from '@/components/admin-impersonation/PageComposerContext'
import { useSectionInteractable } from '@/components/copilot/CopilotInteractable'
import { CMSLink } from '@/components/Link'

type PricingPlanRow =
  | NonNullable<Pricing['plans']>[number]
  | NonNullable<PricingTableBlockData['inlinePlans']>[number]

export type PricingTableBlockProps = PricingTableBlockData & {
  globalPricing: Pricing | null
}

function PricingTableInteractableRegistrar({
  description,
  heading,
  id,
  index,
  intro,
  pagePath,
  rowLabels,
  selected,
  variant,
}: {
  description: string
  heading: string
  id: string
  index: number
  intro: string
  pagePath: string
  rowLabels: string[]
  selected: boolean
  variant: string
}) {
  useSectionInteractable({
    description,
    id,
    name: 'pricing_table',
    selected,
    state: {
      blockType: 'pricingTable',
      heading,
      index,
      intro,
      pagePath,
      rowLabels,
      variant,
    },
  })

  return null
}

export const PricingTableBlock: React.FC<PricingTableBlockProps> = ({
  heading,
  dataSource,
  inlinePlans,
  globalPricing,
}) => {
  const composer = usePageComposerOptional()
  const toolbarState = usePageComposerCanvasToolbarState()
  const openTextGenerator = usePageComposerTextGenerator()
  const pricingEditor = toolbarState?.pricingTableEditor ?? null
  const title =
    heading ||
    (dataSource === 'global' ? globalPricing?.sectionTitle : null) ||
    'Packages & pricing'
  const intro = dataSource === 'global' ? globalPricing?.sectionIntro : null
  const plans =
    (dataSource === 'global' ? globalPricing?.plans : inlinePlans)?.filter(Boolean) ?? []

  if (plans.length === 0) {
    return (
      <section className="container scroll-mt-24" id="pricing">
        <div className="site-section-shell px-6 py-10">
          <p className="rounded-xl border border-dashed border-border py-12 text-center text-muted-foreground">
            Add plans in <strong>Globals -&gt; Pricing &amp; packages</strong> or switch this block
            to &quot;Plans only on this page.&quot;
          </p>
        </div>
      </section>
    )
  }

  return (
    <>
      {composer?.isOpen && toolbarState ? (
        <PricingTableInteractableRegistrar
          description="A pricing table block with plan names, prices, features, and CTA labels."
          heading={title}
          id={`pricing-table:${toolbarState.selectedIndex ?? title}`}
          index={toolbarState.selectedIndex ?? -1}
          intro={intro || ''}
          pagePath={toolbarState.draftPage?.pagePath ?? '/'}
          rowLabels={plans.map((plan) => plan.name).filter(Boolean).slice(0, 6)}
          selected={Boolean(pricingEditor)}
          variant={dataSource || 'global'}
        />
      ) : null}
      <section className="container scroll-mt-24" id="pricing">
        <div className="site-section-shell px-6 py-8 md:px-10 md:py-10">
        <div className="mb-10 max-w-3xl">
          {pricingEditor ? (
            <InlineTextInput
              className="mb-3 h-12 border-primary/30 bg-background/92 text-3xl font-semibold tracking-tight"
              onChange={(value) => pricingEditor.updateBlockField('heading', value)}
              onGenerate={() =>
                openTextGenerator({
                  applyText: (value) => pricingEditor.updateBlockField('heading', value),
                  currentText: pricingEditor.block.heading || '',
                  fieldLabel: 'pricing section heading',
                  fieldPath: `layout.${toolbarState?.selectedIndex}.heading`,
                  instructions: 'Rewrite the pricing section heading so it stays clear and conversion-oriented.',
                })}
              placeholder="Pricing section heading"
              value={pricingEditor.block.heading || ''}
            />
          ) : (
            <h2 className="mb-3 text-3xl font-semibold tracking-tight">{title}</h2>
          )}
          {intro ? <p className="text-lg leading-relaxed text-muted-foreground">{intro}</p> : null}
        </div>
        <div className="grid gap-6 lg:grid-cols-3">
          {plans.map((plan, i) => (
            <PricingColumn
              blockIndex={toolbarState?.selectedIndex ?? 0}
              editor={pricingEditor && dataSource === 'inline' ? pricingEditor : null}
              key={i}
              plan={plan}
              planIndex={i}
            />
          ))}
        </div>
        </div>
      </section>
    </>
  )
}

function PricingColumn({
  blockIndex,
  editor,
  plan,
  planIndex,
}: {
  blockIndex: number
  editor: null | NonNullable<PageComposerToolbarState['pricingTableEditor']>
  plan: PricingPlanRow
  planIndex: number
}) {
  const openTextGenerator = usePageComposerTextGenerator()
  const { name, tagline, price, priceNote, highlighted, features, link: linkFields } = plan
  const featureList = features?.map((f) => f.text).filter(Boolean) ?? []

  return (
    <div
      className={`relative flex flex-col rounded-2xl border p-8 ${
        highlighted
          ? 'border-primary shadow-lg ring-2 ring-primary/20 lg:scale-[1.02]'
          : 'border-border bg-card shadow-sm'
      }`}
    >
      {highlighted ? (
        <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-primary px-3 py-0.5 text-xs font-medium text-primary-foreground">
          Popular
        </span>
      ) : null}
      {editor ? (
        <InlineTextInput
          className="h-10 border-primary/30 bg-background/92 text-xl font-semibold"
          onChange={(value) => editor.updatePlanField('name', planIndex, value)}
          onGenerate={() =>
            openTextGenerator({
              applyText: (value) => editor.updatePlanField('name', planIndex, value),
              currentText: name || '',
              fieldLabel: 'plan name',
              fieldPath: `layout.${blockIndex}.inlinePlans.${planIndex}.name`,
            })}
          placeholder="Plan name"
          value={name || ''}
        />
      ) : (
        <h3 className="text-xl font-semibold">{name}</h3>
      )}
      {editor ? (
        <InlineTextarea
          className="mt-1 min-h-16 border-primary/30 bg-background/92 text-sm text-muted-foreground"
          onChange={(value) => editor.updatePlanField('tagline', planIndex, value)}
          onGenerate={() =>
            openTextGenerator({
              applyText: (value) => editor.updatePlanField('tagline', planIndex, value),
              currentText: tagline || '',
              fieldLabel: 'plan tagline',
              fieldPath: `layout.${blockIndex}.inlinePlans.${planIndex}.tagline`,
            })}
          rows={2}
          value={tagline || ''}
        />
      ) : tagline ? <p className="mt-1 text-sm text-muted-foreground">{tagline}</p> : null}
      {editor ? (
        <InlineTextInput
          className="mt-6 h-12 border-primary/30 bg-background/92 text-3xl font-bold tracking-tight"
          onChange={(value) => editor.updatePlanField('price', planIndex, value)}
          onGenerate={() =>
            openTextGenerator({
              applyText: (value) => editor.updatePlanField('price', planIndex, value),
              currentText: price || '',
              fieldLabel: 'plan price',
              fieldPath: `layout.${blockIndex}.inlinePlans.${planIndex}.price`,
              instructions: 'Rewrite the displayed price line without changing the actual offer structure unless the operator asks for that explicitly.',
            })}
          placeholder="Plan price"
          value={price || ''}
        />
      ) : (
        <p className="mt-6 text-3xl font-bold tracking-tight">{price}</p>
      )}
      {editor ? (
        <InlineTextarea
          className="mt-1 min-h-16 border-primary/30 bg-background/92 text-sm text-muted-foreground"
          onChange={(value) => editor.updatePlanField('priceNote', planIndex, value)}
          onGenerate={() =>
            openTextGenerator({
              applyText: (value) => editor.updatePlanField('priceNote', planIndex, value),
              currentText: priceNote || '',
              fieldLabel: 'plan price note',
              fieldPath: `layout.${blockIndex}.inlinePlans.${planIndex}.priceNote`,
            })}
          rows={2}
          value={priceNote || ''}
        />
      ) : priceNote ? <p className="mt-1 text-sm text-muted-foreground">{priceNote}</p> : null}
      <ul className="mt-6 flex flex-1 flex-col gap-2 text-sm">
        {featureList.map((line, j) => (
          <li key={j} className="flex gap-2">
            <span className="mt-0.5 text-primary">+</span>
            {editor ? (
              <InlineTextarea
                className="min-h-16 border-primary/30 bg-background/92 text-sm"
                onChange={(value) => editor.updateFeatureText(j, planIndex, value)}
                onGenerate={() =>
                  openTextGenerator({
                    applyText: (value) => editor.updateFeatureText(j, planIndex, value),
                    currentText: line,
                    fieldLabel: 'plan feature',
                    fieldPath: `layout.${blockIndex}.inlinePlans.${planIndex}.features.${j}.text`,
                  })}
                rows={2}
                value={line}
              />
            ) : (
              <span>{line}</span>
            )}
          </li>
        ))}
      </ul>
      {linkFields?.label ? (
        <div className="mt-8">
          {editor ? (
            <InlineTextInput
              className="h-10 border-primary/30 bg-background/92 text-sm"
              onChange={(value) => editor.updatePlanLinkLabel(planIndex, value)}
              onGenerate={() =>
                openTextGenerator({
                  applyText: (value) => editor.updatePlanLinkLabel(planIndex, value),
                  currentText: linkFields.label,
                  fieldLabel: 'plan CTA label',
                  fieldPath: `layout.${blockIndex}.inlinePlans.${planIndex}.link.label`,
                })}
              placeholder="CTA label"
              value={linkFields.label}
            />
          ) : (
            <CMSLink
              appearance={linkFields.appearance === 'outline' ? 'outline' : 'default'}
              className="w-full justify-center"
              label={linkFields.label}
              newTab={linkFields.newTab}
              reference={linkFields.reference}
              size="lg"
              type={linkFields.type}
              url={linkFields.url}
            />
          )}
        </div>
      ) : null}
    </div>
  )
}

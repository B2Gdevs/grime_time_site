'use client'

import { ShieldCheckIcon } from 'lucide-react'

import { InlineTextInput, InlineTextarea, usePageComposerTextGenerator } from '@/components/admin-impersonation/PageComposerInlineText'
import { usePageComposerCanvasToolbarState } from '@/components/admin-impersonation/PageComposerCanvas'
import { usePageComposerOptional } from '@/components/admin-impersonation/PageComposerContext'
import { useHeroInteractable } from '@/components/copilot/CopilotInteractable'

type MarketingHeroEditableProps = {
  body: string
  eyebrow: string
  headlineAccent: string
  headlinePrimary: string
  panelBody: string
  panelEyebrow: string
  panelHeading: string
}

function HeroInteractableRegistrar({
  body,
  eyebrow,
  headlineAccent,
  headlinePrimary,
  id,
  pagePath,
  panelBody,
  panelEyebrow,
  panelHeading,
  selected,
}: {
  body: string
  eyebrow: string
  headlineAccent: string
  headlinePrimary: string
  id: string
  pagePath: string
  panelBody: string
  panelEyebrow: string
  panelHeading: string
  selected: boolean
}) {
  useHeroInteractable({
    id,
    selected,
    state: {
      body,
      eyebrow,
      headlineAccent,
      headlinePrimary,
      pagePath,
      panelBody,
      panelEyebrow,
      panelHeading,
    },
  })

  return null
}

function HeroTextInput({
  className,
  fieldLabel,
  fieldPath,
  instructions,
  onChange,
  placeholder,
  value,
}: {
  className: string
  fieldLabel: string
  fieldPath: string
  instructions: string
  onChange: (value: string) => void
  placeholder: string
  value: string
}) {
  const toolbarState = usePageComposerCanvasToolbarState()
  const openTextGenerator = usePageComposerTextGenerator()

  if (!toolbarState?.heroEditor) {
    return null
  }

  return (
    <InlineTextInput
      className={className}
      onChange={onChange}
      onGenerate={() =>
        openTextGenerator({
          applyText: onChange,
          currentText: value,
          fieldLabel,
          fieldPath,
          instructions,
        })}
      placeholder={placeholder}
      value={value}
    />
  )
}

export function MarketingHeroLead({
  body,
  eyebrow,
  headlineAccent,
  headlinePrimary,
  panelBody = '',
  panelEyebrow = '',
  panelHeading = '',
}: Pick<MarketingHeroEditableProps, 'body' | 'eyebrow' | 'headlineAccent' | 'headlinePrimary'> &
  Partial<Pick<MarketingHeroEditableProps, 'panelBody' | 'panelEyebrow' | 'panelHeading'>>) {
  const composer = usePageComposerOptional()
  const toolbarState = usePageComposerCanvasToolbarState()
  const openTextGenerator = usePageComposerTextGenerator()
  const heroEditor = toolbarState?.heroEditor?.kind === 'marketing-home' ? toolbarState.heroEditor : null

  if (!heroEditor) {
    return (
      <>
        {composer?.isOpen && toolbarState ? (
          <HeroInteractableRegistrar
            body={body}
            eyebrow={eyebrow}
            headlineAccent={headlineAccent}
            headlinePrimary={headlinePrimary}
            id={`hero:${toolbarState.draftPage?.id ?? 'homepage'}`}
            pagePath={toolbarState.draftPage?.pagePath ?? '/'}
            panelBody={panelBody}
            panelEyebrow={panelEyebrow}
            panelHeading={panelHeading}
            selected={toolbarState.selectedIndex === -1}
          />
        ) : null}
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary/80">{eyebrow}</p>
        <h1 className="mt-4 text-5xl font-semibold leading-[0.92] tracking-[-0.04em] text-foreground md:text-6xl xl:text-[5.4rem]">
          {headlinePrimary}
          <span className="mt-2 block text-primary">{headlineAccent}</span>
        </h1>
        <p className="mt-6 max-w-2xl text-lg leading-8 text-muted-foreground md:text-xl">{body}</p>
      </>
    )
  }

  return (
    <>
      {composer?.isOpen && toolbarState ? (
        <HeroInteractableRegistrar
          body={heroEditor.copy}
          eyebrow={heroEditor.eyebrow}
          headlineAccent={heroEditor.headlineAccent}
          headlinePrimary={heroEditor.headlinePrimary}
          id={`hero:${toolbarState.draftPage?.id ?? 'homepage'}`}
          pagePath={toolbarState.draftPage?.pagePath ?? '/'}
          panelBody={heroEditor.panelBody}
          panelEyebrow={heroEditor.panelEyebrow}
          panelHeading={heroEditor.panelHeading}
          selected={toolbarState.selectedIndex === -1}
        />
      ) : null}
      <HeroTextInput
        className="h-10 max-w-md border-primary/30 bg-background/92 text-[0.7rem] font-semibold uppercase tracking-[0.34em] text-primary/90"
        fieldLabel="hero eyebrow"
        fieldPath="hero.eyebrow"
        instructions="Rewrite the small homepage hero eyebrow so it stays short, brand-specific, and service-oriented."
        onChange={(value) => heroEditor.updateField('eyebrow', value)}
        placeholder="Hero eyebrow"
        value={heroEditor.eyebrow}
      />
      <div className="mt-4 grid gap-3">
        <HeroTextInput
          className="h-16 border-primary/30 bg-background/92 text-3xl font-semibold tracking-[-0.04em] md:h-20 md:text-5xl xl:h-24 xl:text-6xl"
          fieldLabel="hero headline"
          fieldPath="hero.headlinePrimary"
          instructions="Rewrite the main homepage hero headline so it stays sharp, direct, and easy to scan."
          onChange={(value) => heroEditor.updateField('headlinePrimary', value)}
          placeholder="Hero headline"
          value={heroEditor.headlinePrimary}
        />
        <HeroTextInput
          className="h-16 border-primary/30 bg-background/92 text-3xl font-semibold tracking-[-0.04em] text-primary md:h-20 md:text-5xl xl:h-24 xl:text-6xl"
          fieldLabel="hero accent headline"
          fieldPath="hero.headlineAccent"
          instructions="Rewrite the accent line of the homepage hero headline so it complements the first line without repeating it."
          onChange={(value) => heroEditor.updateField('headlineAccent', value)}
          placeholder="Hero accent line"
          value={heroEditor.headlineAccent}
        />
      </div>
      <div className="mt-6 max-w-2xl">
        <InlineTextarea
          className="min-h-28 border-primary/30 bg-background/92 text-lg leading-8 text-muted-foreground md:text-xl"
          onChange={heroEditor.updateCopy}
          onGenerate={() =>
            openTextGenerator({
              applyText: heroEditor.updateCopy,
              currentText: heroEditor.copy,
              fieldLabel: 'hero body',
              fieldPath: 'hero.richText',
              instructions: 'Rewrite the homepage hero body copy so it stays clear, direct, and grounded in exterior cleaning results.',
            })}
          placeholder="Hero body copy"
          rows={4}
          value={heroEditor.copy}
        />
      </div>
    </>
  )
}

export function MarketingHeroPanel({
  panelBody,
  panelEyebrow,
  panelHeading,
}: Pick<MarketingHeroEditableProps, 'panelBody' | 'panelEyebrow' | 'panelHeading'>) {
  const toolbarState = usePageComposerCanvasToolbarState()
  const openTextGenerator = usePageComposerTextGenerator()
  const heroEditor = toolbarState?.heroEditor?.kind === 'marketing-home' ? toolbarState.heroEditor : null

  if (!heroEditor) {
    return (
      <div className="hero-glass-float absolute inset-x-6 bottom-6 rounded-[1.6rem] border border-white/12 bg-black/45 p-5 backdrop-blur-md">
        <div className="flex items-center gap-2 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8EDB3E]">
          <ShieldCheckIcon className="size-3.5" />
          {panelEyebrow}
        </div>
        <h2 className="mt-3 text-2xl font-semibold tracking-tight">{panelHeading}</h2>
        <p className="mt-3 text-sm leading-6 text-white/78">{panelBody}</p>
      </div>
    )
  }

  return (
    <div
      className="hero-glass-float absolute inset-x-6 bottom-6 rounded-[1.6rem] border border-white/12 bg-black/45 p-5 backdrop-blur-md"
      data-page-composer-interactive="true"
    >
      <div className="flex items-start gap-2 text-[#8EDB3E]">
        <ShieldCheckIcon className="mt-3 size-3.5 shrink-0" />
        <div className="min-w-0 flex-1">
          <HeroTextInput
            className="h-10 border-white/20 bg-white/10 text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[#8EDB3E] placeholder:text-[#8EDB3E]/70"
            fieldLabel="hero panel eyebrow"
            fieldPath="hero.panelEyebrow"
            instructions="Rewrite the hero overlay eyebrow so it feels like a strong, short service signal."
            onChange={(value) => heroEditor.updateField('panelEyebrow', value)}
            placeholder="Panel eyebrow"
            value={heroEditor.panelEyebrow}
          />
        </div>
      </div>
      <div className="mt-3">
        <HeroTextInput
          className="h-14 border-white/20 bg-white/10 text-xl font-semibold tracking-tight text-white placeholder:text-white/70"
          fieldLabel="hero panel heading"
          fieldPath="hero.panelHeading"
          instructions="Rewrite the hero overlay heading so it sells the quote and scheduling experience in one direct thought."
          onChange={(value) => heroEditor.updateField('panelHeading', value)}
          placeholder="Panel heading"
          value={heroEditor.panelHeading}
        />
      </div>
      <div className="mt-3">
        <InlineTextarea
          className="min-h-24 border-white/20 bg-white/10 text-sm leading-6 text-white/82 placeholder:text-white/60"
          onChange={(value) => heroEditor.updateField('panelBody', value)}
          onGenerate={() =>
            openTextGenerator({
              applyText: (value) => heroEditor.updateField('panelBody', value),
              currentText: heroEditor.panelBody,
              fieldLabel: 'hero panel body',
              fieldPath: 'hero.panelBody',
              instructions: 'Rewrite the hero overlay body so it stays concise, specific, and sales-ready.',
            })}
          placeholder="Panel body"
          rows={3}
          value={heroEditor.panelBody}
        />
      </div>
    </div>
  )
}

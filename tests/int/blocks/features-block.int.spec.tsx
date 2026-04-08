import { render, screen } from '@testing-library/react'
import { describe, expect, it } from 'vitest'

import { FeaturesBlock } from '@/blocks/Features/Component'

describe('FeaturesBlock', () => {
  it('renders page-local feature cards', () => {
    render(
      <FeaturesBlock
        blockType="features"
        eyebrow="Features"
        features={[
          {
            eyebrow: 'Proof point',
            summary: 'Useful proof point copy.',
            title: 'Clear value',
          },
          {
            eyebrow: 'System',
            summary: 'Workflow copy.',
            title: 'Simple process',
          },
        ]}
        heading="Why customers choose us"
        intro="Feature block intro."
      />,
    )

    expect(screen.getByText('Why customers choose us')).toBeTruthy()
    expect(screen.getByText('Clear value')).toBeTruthy()
    expect(screen.getByText('Workflow copy.')).toBeTruthy()
  })
})

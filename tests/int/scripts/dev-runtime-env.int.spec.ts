import { describe, expect, it } from 'vitest'

import { applyDevMcpGuards } from '../../../scripts/lib/dev-runtime-env.mjs'

describe('applyDevMcpGuards', () => {
  it('forces payload and image MCP off by default', () => {
    const result = applyDevMcpGuards({
      IMAGE_GEN_MCP_ENABLED: 'true',
      PAYLOAD_MCP_ENABLED: 'true',
    })

    expect(result.forcedOff).toBe(true)
    expect(result.env.PAYLOAD_MCP_ENABLED).toBe('false')
    expect(result.env.IMAGE_GEN_MCP_ENABLED).toBe('false')
  })

  it('still forces MCP off even when old dev opt-in flags are present', () => {
    const result = applyDevMcpGuards({
      GRIMETIME_DEV_ENABLE_MCP: 'true',
      IMAGE_GEN_MCP_ENABLED: 'true',
      PAYLOAD_MCP_ENABLED: 'true',
    })

    expect(result.forcedOff).toBe(true)
    expect(result.env.PAYLOAD_MCP_ENABLED).toBe('false')
    expect(result.env.IMAGE_GEN_MCP_ENABLED).toBe('false')
  })
})

export function applyDevMcpGuards(env) {
  const nextEnv = { ...env }

  nextEnv.PAYLOAD_MCP_ENABLED = 'false'
  nextEnv.IMAGE_GEN_MCP_ENABLED = 'false'

  return {
    env: nextEnv,
    forcedOff: true,
  }
}

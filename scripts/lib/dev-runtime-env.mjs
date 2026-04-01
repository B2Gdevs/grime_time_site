export function applyDevMcpGuards(env) {
  const nextEnv = { ...env }
  const devMcpEnabled = nextEnv.GRIMETIME_DEV_ENABLE_MCP === 'true'

  if (devMcpEnabled) {
    return {
      env: nextEnv,
      forcedOff: false,
    }
  }

  nextEnv.PAYLOAD_MCP_ENABLED = 'false'
  nextEnv.IMAGE_GEN_MCP_ENABLED = 'false'

  return {
    env: nextEnv,
    forcedOff: true,
  }
}

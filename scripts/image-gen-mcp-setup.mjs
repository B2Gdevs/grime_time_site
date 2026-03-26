import { imageGenMcpDir, syncImageGenEnvironment } from './lib/image-gen-mcp.mjs'

async function main() {
  console.log(`Syncing image-gen-mcp environment in ${imageGenMcpDir}`)
  await syncImageGenEnvironment()
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})


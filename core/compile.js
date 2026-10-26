import { mkdirSync, readFileSync, readdirSync, writeFileSync } from "node:fs"
import { dirname, join } from "node:path"
import { fileURLToPath } from "node:url"
import { compile } from "./score.js"

const root = join(dirname(fileURLToPath(import.meta.url)), "..")
const outDir = join(root, "dist")
const check = process.argv.includes("--check")
if (!check) mkdirSync(outDir, { recursive: true })

const names = readdirSync(join(root, "measures")).filter((name) => name.endsWith(".json"))
for (const name of names) {
  const source = JSON.parse(readFileSync(join(root, "measures", name), "utf8"))
  const compiled = compile(source)
  const json = `${JSON.stringify(compiled)}\n`
  const target = join(outDir, name)
  if (check) {
    if (readFileSync(target, "utf8") !== json) throw new Error(`dist/${name} is stale. Run npm run compile.`)
    console.log(`verified dist/${name}`)
  } else {
    writeFileSync(target, json)
    console.log(`wrote dist/${name} (${json.length} bytes)`)
  }
}

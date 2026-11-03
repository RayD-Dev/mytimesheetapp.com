import { readdirSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { pathToFileURL } from 'node:url'

// Mocks must never reach production: no MSW worker file and no code from src/mocks.
const MOCK_PATH_MARKER = /src[\/]mocks/
const MOCK_FILE_NAME = 'mockServiceWorker.js'

function listFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? listFiles(join(dir, entry.name)) : [join(dir, entry.name)],
  )
}

/** Returns one message per mock file or mock code reference found in the build folder. */
export function findMockLeaks(distDir) {
  const problems = []
  for (const file of listFiles(distDir)) {
    if (file.endsWith(MOCK_FILE_NAME)) problems.push(`${file}: MSW worker file in the build`)
    else if (file.endsWith('.js.map') && MOCK_PATH_MARKER.test(readFileSync(file, 'utf8'))) {
      problems.push(`${file}: source map lists a file from src/mocks`)
    }
  }
  return problems
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const problems = findMockLeaks('dist')
  if (problems.length > 0) {
    console.error(problems.join('\n'))
    process.exit(1)
  }
  console.log('check:build: no mock code in dist')
}

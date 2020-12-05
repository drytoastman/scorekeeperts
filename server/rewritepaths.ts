#! /usr/bin/env node

import { readFileSync, writeFileSync } from 'fs'
import { dirname, relative, resolve } from 'path'
import { sync } from 'globby'

const outPath = 'tsbuild'
const aliases = [
    ['@common/', 'common/'],
    ['@/', './']
]

const convert = (modulePath: string, outFile: string): string => {
    for (const [prefix, aliaspath] of aliases) {
        if (modulePath.startsWith(prefix)) {
            const modulePathRel = modulePath.substring(prefix.length)
            const moduleSrc = resolve(outPath, aliaspath, modulePathRel)
            let rel = relative(dirname(outFile), moduleSrc).replace(/\\/g, '/')
            if (rel[0] !== '.') rel = './' + rel

            console.log(`\treplacing '${modulePath}' ==> '${rel}'`)
            return rel
        }
    }
    return modulePath
}

const requireRegex = /(?:import|require)\(['"]([^'"]*)['"]\)/g
const importRegex = /(?:import|from) ['"]([^'"]*)['"]/g

const replaceImportStatement = (orig: string, matched: string, outFile: string): string => {
    const index = orig.indexOf(matched)
    return orig.substring(0, index) + convert(matched, outFile) + orig.substring(index + matched.length)
}
const replaceAlias = (text: string, outFile: string): string =>
    text.replace(requireRegex, (orig, matched) => replaceImportStatement(orig, matched, outFile))
        .replace(importRegex,  (orig, matched) => replaceImportStatement(orig, matched, outFile))

// import relative to absolute path
const files = sync(`${outPath}/**/*.js`, { dot: true, noDir: true } as any).map((x) => resolve(x))
for (const file of files) {
    console.log(file)
    const text = readFileSync(file, 'utf8')
    const newText = replaceAlias(text, file)
    if (text !== newText) {
        writeFileSync(file, newText, 'utf8')
    }
}

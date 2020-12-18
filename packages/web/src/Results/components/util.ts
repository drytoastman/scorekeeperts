
export function rowclass(e: { current: any; ispotential: any; isold: any }): string {
    const c = [] as string[]
    if (e.current)     c.push('highlight')
    if (e.ispotential) c.push('couldhave')
    if (e.isold)       c.push('improvedon')
    return c.join(' ')
}

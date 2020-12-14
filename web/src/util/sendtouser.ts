
// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export function sendAsDownload(data: any, type: string, filename: string): void {
    const blob    = new Blob([data], { type: type })
    const link    = document.createElement('a')
    link.href     = window.URL.createObjectURL(blob)
    link.download = filename
    link.click()
}

export async function sendToClipboard(data: string): Promise<void> {
    await navigator.clipboard.writeText(data)
}

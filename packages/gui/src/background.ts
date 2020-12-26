import path from 'path'
import { app, protocol, BrowserWindow } from 'electron'
import { createProtocol } from 'vue-cli-plugin-electron-builder/lib'
import installExtension, { VUEJS_DEVTOOLS } from 'electron-devtools-installer'
const isDevelopment = process.env.NODE_ENV !== 'production'

// Scheme must be registered before the app is ready
protocol.registerSchemesAsPrivileged([{ scheme: 'app', privileges: { secure: true, standard: true }}])

async function createWindow(): Promise<BrowserWindow> {
    // Create the browser window.
    const win = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            preload: path.join(app.getAppPath(), 'preload.js')
        }
    })
    app.allowRendererProcessReuse = false  /// FINISH ME, this is only needed while serialport native is not Context-Aware

    if (process.env.WEBPACK_DEV_SERVER_URL) {
        await win.loadURL(process.env.WEBPACK_DEV_SERVER_URL as string + 'sync.html')
        if (!process.env.IS_TEST) win.webContents.openDevTools()
    } else {
        createProtocol('app')
        win.loadURL('app://./sync.html')
    }

    return win
}

app.on('window-all-closed', () => {
    app.quit()
})

app.on('ready', async () => {
    if (!app.requestSingleInstanceLock()) {
        app.quit()
    }
    if (isDevelopment && !process.env.IS_TEST) {
    // Install Vue Devtools
        try {
            await installExtension(VUEJS_DEVTOOLS)
        } catch (e) {
            console.error('Vue Devtools failed to install:', e.toString())
        }
    }

    const mainwindow = await createWindow()
    mainwindow.on('close', (event) => {
        console.log('close')
        return false
    })

    app.on('second-instance', () => {
        mainwindow.moveTop()
    })
})

// Exit cleanly on request from parent process in development mode.
if (isDevelopment) {
    if (process.platform === 'win32') {
        process.on('message', (data) => {
            if (data === 'graceful-exit') {
                app.quit()
            }
        })
    } else {
        process.on('SIGTERM', () => {
            app.quit()
        })
    }
}

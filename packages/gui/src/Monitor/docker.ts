
import Docker from 'dockerode'
import config from './configs'

export class ScorekeeperDocker extends Docker {

    constructor(private listener: ((container: string, notice: string) => void) | undefined, options: Docker.DockerOptions | undefined) {
        super(options)
    }

    async init() {
        const stream = await this.getEvents({ filters: { type: ['container'] }})
        stream.on('data', (data: Buffer) => {
            const s = data.toString()
            const p = s.split('\n')
            for (const si of p) {
                const m = JSON.parse(si)
                this.listener && this.listener(m.Actor.Attributes.name, m.Action)
            }
        })

        await this.ensureNet(config.network)
    }

    async checkUp() {
        const containers = {}
        for (const c of await this.listContainers({ all: true })) {
            const name = c.Names[0].slice(1)
            this.listener && this.listener(name, c.State)
            containers[name] = {
                id: c.Id,
                state: c.State
            }
        }

        try {
            for (const cc of config.containers) {
                let c: Docker.Container
                if (cc.name && cc.name in containers) {
                    if (containers[cc.name].state === 'running') continue
                    c = this.getContainer(containers[cc.name].id)
                } else {
                    c = await this.createContainer(cc)
                }
                console.log(`start ${cc.name}`)
                await c.start()
            }
        } catch (error) {
            console.error(error)
        }
    }

    async ensureNet(name: string) {
        try {
            await this.createNetwork({ Name: name, CheckDuplicate: true })
        } catch (error) {
            if (!/already exists/.test(error.message)) throw error
        }
    }
}

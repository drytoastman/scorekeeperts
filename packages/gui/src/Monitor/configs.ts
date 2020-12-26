import Docker from 'dockerode'

const BACKEND_VERSION      = process.env.BACKEND_VERSION || 'latest'
const BACKEND_VERSION_BASE = BACKEND_VERSION.split('.').slice(0, 2).join('.')

const NetConfig = { EndpointsConfig: { net1: {}}}
const RestartP  = { Name: 'always' }
const TZ        = 'TZ=America/Los_Angeles'
const Certs     = 'certsx:/certs'
const VarLog    = `${BACKEND_VERSION_BASE}_logsx:/var/log`
const Database  = `${BACKEND_VERSION_BASE}_databasex:/var/lib/postgresql/data`
const Image     = (name: string)  => { return `drytoastman/${name}:${BACKEND_VERSION}` }

export const network  = 'net1'
export const volumes  = [Certs, VarLog, Database].map(s => s.split(':')[0])
export const containers: Docker.ContainerCreateOptions[] = [
    {
        name: 'db',
        Image: Image('scdb'),
        Env: [TZ],
        NetworkingConfig: NetConfig,
        ExposedPorts: {
            '6666/tcp': {},
            '6432/tcp': {},
            '5432/tcp': {}
        },
        HostConfig: {
            PortBindings: {
                '6666/tcp': [{ IP: '127.0.0.1', HostPort: '6666' }],
                '6432/tcp': [{ IP: '127.0.0.1', HostPort: '6432' }],
                '5432/tcp': [{ IP: '0.0.0.0',   HostPort: '54329' }]
            },
            Binds: [VarLog, Certs, Database],
            RestartPolicy: RestartP
        }
    },

    {
        // SIGHUP starts a sync
        name: 'server',
        Image: Image('scserver'),
        Env: [TZ, 'DBHOST=db', 'DBPORT=6432'],
        NetworkingConfig: NetConfig,
        ExposedPorts: {
            '53/tcp': {},
            '53/udp': {}
        },
        HostConfig: {
            PortBindings: {
                '53/tcp': [{ HostPort: '53' }],
                '53/udp': [{ HostPort: '53' }]
            },
            Binds: [VarLog, Certs],
            RestartPolicy: RestartP
        }
    },

    {
        name: 'proxy',
        Image: Image('scproxy'),
        Env: [TZ],
        NetworkingConfig: NetConfig,
        ExposedPorts: { '80/tcp': {}},
        HostConfig: {
            PortBindings: { '80/tcp': [{ HostPort: '80' }] },
            Binds: [VarLog],
            RestartPolicy: RestartP
        }
    }
]

export default {
    network,
    volumes,
    containers
}

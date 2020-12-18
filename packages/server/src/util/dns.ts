import dns, { Packet } from 'dns2'
import { dnslog } from '@/util/logging'
import { db } from 'scdb'

const SERVFAIL = 2
const NXDOMAIN = 3
const DNSPORT  = 53

async function getmatch(request): Promise<string | undefined> {
    const h1 = request.split('.')[0]
    if (!(['de', 'reg'].includes(h1))) {
        return undefined
    }

    const res = await db.any("SELECT data FROM localcache WHERE name='neighbors'")
    if (res.length === 1) {
        const neighbors = JSON.parse(res[0].data) as {[ip:string]: string[]}
        for (const [ip, services] of Object.entries(neighbors)) {
            if ((h1 === 'de')  && services.includes('DATAENTRY'))    return ip
            if ((h1 === 'reg') && services.includes('REGISTRATION')) return ip
        }

        const keys = Object.keys(neighbors).sort()
        if (keys.length) {
            // default to first IP, hope for the best
            return keys[0]
        }
    }

    return undefined
}


async function resolver(request, send): Promise<void> {
    if (request.header.qr) return // is a response
    const response = Packet.createResponseFromRequest(request)

    try {
        const [question] = request.questions
        if (!question) return
        const { name } = question

        const address = await getmatch(name)
        if (!address) {
            response.header.rcode = NXDOMAIN
        } else {
            response.header.aa = 1
            response.answers.push({
                name,
                type: Packet.TYPE.A,
                class: Packet.CLASS.IN,
                ttl: 60,
                address: address
            })
        }
    } catch (error) {
        dnslog.error(error)
        response.header.rcode = SERVFAIL
    }

    send(response)
}


export async function startDNSServer() {
    dnslog.info('starting dns servers')

    const udpserver = dns.createServer(resolver)
    udpserver.on('listening', () => { dnslog.info('UDP DNS Server listening') })
    udpserver.on('error', error => dnslog.error(error))
    udpserver.listen(DNSPORT)
    udpserver.unref(udpserver)


    const tcpserver = dns.createTCPServer(resolver)
    tcpserver.on('listening', () => { dnslog.info('TCP DNS Server listening') })
    tcpserver.on('error', error => dnslog.error(error))
    tcpserver.listen(DNSPORT)
    tcpserver.unref()

    /*
    setInterval(() => {
        if (!tcpserver.listening) {
            tcpserver.listen(DNSPORT)
        }
        try {
            udpserver.address()
        } catch (error) {
            udpserver.listen(DNSPORT)
        }
    }, 60000)
    */
}

import NodeCache from 'node-cache'

export const gCache = new NodeCache({ stdTTL: 3600, checkperiod: 360 })

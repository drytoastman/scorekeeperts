import express, { Request, Response } from 'express'

export const publicsite = express.Router({
    strict: true
})

publicsite.get('/', (req: Request, res: Response) => {
    res.json({ message: 'public data' })
})

publicsite.get('/register', (req: Request, res: Response) => {
    res.json({ message: 'other place' })
})

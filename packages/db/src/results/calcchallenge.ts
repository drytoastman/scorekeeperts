import { ChallengeResults, ChallengeRun } from 'sctypes'
import { RunStatus } from 'sctypes'
import { UUID } from 'sctypes'
import { ScorekeeperProtocol, dblog } from '..'

export async function updatedChallengeResults(task: ScorekeeperProtocol, challengeid: UUID): Promise<ChallengeResults> {
    dblog.debug(`updatedChallengeResults ${challengeid}`)

    const getrounds = 'SELECT x.*, ' +
                'd1.firstname as e1fn, d1.lastname as e1ln, c1.classcode as e1cc, c1.indexcode as e1ic, ' +
                'd2.firstname as e2fn, d2.lastname as e2ln, c2.classcode as e2cc, c2.indexcode as e2ic  ' +
                'FROM challengerounds x ' +
                'LEFT JOIN cars c1 ON x.car1id=c1.carid LEFT JOIN drivers d1 ON c1.driverid=d1.driverid ' +
                'LEFT JOIN cars c2 ON x.car2id=c2.carid LEFT JOIN drivers d2 ON c2.driverid=d2.driverid ' +
                'WHERE challengeid=$1 '
    const getruns = 'select * from challengeruns where challengeid=$1 '

    const rounds = {} as ChallengeResults
    const res = await task.any(getrounds, [challengeid])

    for (const obj of res) {
        // We organize ChallengeRound in a topological structure so we do custom setting here
        rounds[obj.round + ''] = { // need string key for JSON objects
            challengeid: obj.challengeid,
            round:       obj.round,
            winner:      0,
            detail:      '',
            e1: {
                carid:     obj.car1id,
                dial:      obj.car1dial,
                newdial:   obj.car1dial,
                firstname: obj.e1fn || '',
                lastname:  obj.e1ln || '',
                classcode: obj.e1cc,
                indexcode: obj.e1ic,
                left:      null,
                right:     null,
                result:    0
            },
            e2: {
                carid:     obj.car2id,
                dial:      obj.car2dial,
                newdial:   obj.car2dial,
                firstname: obj.e2fn || '',
                lastname:  obj.e2ln || '',
                classcode: obj.e2cc,
                indexcode: obj.e2ic,
                left:      null,
                right:     null,
                result:    0
            }
        }
    }

    const runs: ChallengeRun[] = await task.any(getruns, [challengeid])
    for (const run of runs) {
        const rnd = rounds[run.round + '']
        const side = run.course === 1 ? 'left' : 'right'

        if (!isFinite(run.raw)) { run.raw = 999.999 }
        run.net = (run.status === RunStatus.OK) ? run.raw + (run.cones * 2) + (run.gates * 10) : 999.999

        if (rnd.e1.carid === run.carid) {
            rnd.e1[side] = run
        } else if (rnd.e2.carid === run.carid) {
            rnd.e2[side] = run
        }
    }

    for (const rnd of Object.values(rounds)) {
        // (rnd.winner, rnd.detail) = rnd.compute()
        const tl = rnd.e1.left
        const tr = rnd.e1.right
        const bl = rnd.e2.left
        const br = rnd.e2.right

        //  Missing an entrant or no run data
        if (!rnd.e1.carid || !rnd.e2.carid) {
            rnd.detail = 'No matchup yet'
            continue
        }
        if (!(tl || tr || bl || br)) {
            rnd.detail = 'No runs taken'
            continue
        }

        // Some runs taken but there was non-OK status creating a default win
        const topdefault = (tl && tl.status !== RunStatus.OK) || (tr && tr.status !== RunStatus.OK)
        const botdefault = (bl && bl.status !== RunStatus.OK) || (br && br.status !== RunStatus.OK)

        if (topdefault && botdefault)  { rnd.detail = 'Double default'; continue }
        if (topdefault) { rnd.winner = 2; rnd.detail = rnd.e2.firstname + ' wins by default'; continue }
        if (botdefault) { rnd.winner = 1; rnd.detail = rnd.e1.firstname + ' wins by default'; continue }

        if (!tl || !tr) {
            let hr = 0
            if (tl && br) {
                hr = (tl.net - rnd.e1.dial) - (br.net - rnd.e2.dial)
            } else if (tr && bl) {
                hr = (tr.net - rnd.e1.dial) - (bl.net - rnd.e2.dial)
            }

            if (hr > 0) {
                rnd.detail = `{$rnd.e2.firstname} leads by ${hr.toFixed(3)}`
            } else if (hr < 0) {
                rnd.detail = `{$rnd.e1.firstname} leads by ${hr.toFixed(3)}`
            } else {
                rnd.detail = 'Tied at the Half'
            }

            continue
        }

        // For single car rounds, we need to stop here
        if (!rnd.e1.left || !rnd.e1.right || !rnd.e2.left || !rnd.e2.right) {
            rnd.detail = 'In Progress'
            continue
        }

        // We have all the data, calculate who won
        rnd.e1.result = rnd.e1.left.net + rnd.e1.right.net - (2 * rnd.e1.dial)
        rnd.e2.result = rnd.e2.left.net + rnd.e2.right.net - (2 * rnd.e2.dial)
        if (rnd.e1.result < 0) { rnd.e1.newdial = rnd.e1.dial + (rnd.e1.result / 2 * 1.5) }
        if (rnd.e2.result < 0) { rnd.e2.newdial = rnd.e2.dial + (rnd.e2.result / 2 * 1.5) }

        if (rnd.e1.result < rnd.e2.result) {
            rnd.winner = 1
            rnd.detail = `${rnd.e1.firstname} wins by ${(rnd.e2.result - rnd.e1.result).toFixed(3)}`
        } else if (rnd.e2.result < rnd.e1.result) {
            rnd.winner = 2
            rnd.detail = `${rnd.e2.firstname} wins by ${(rnd.e1.result - rnd.e2.result).toFixed(3)}`
        } else {
            rnd.detail = 'Tied?'
        }
    }

    return rounds
}

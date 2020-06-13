import { SeriesClass, SeriesIndex } from '@common/lib'
import { IDatabase, ColumnSet, IMain } from 'pg-promise'

let classcols: ColumnSet|undefined

export class ClassRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        this.db = db
        if (classcols === undefined) {
            classcols = new pgp.helpers.ColumnSet([
                { name: 'classcode', cnd: true },
                { name: 'descrip' },
                'indexcode', 'caridxrestrict', 'classmultiplier', 'usecarflag',
                'carindexed', 'eventtrophy', 'champtrophy', 'secondruns', 'countedruns',
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (): any => { return 'now()' } }
            ], { table: 'classlist' })
        }
    }

    async classList(): Promise<SeriesClass[]> {
        return this.db.any('SELECT * FROM classlist ORDER BY classcode')
    }

    async updateClasses(type: string, classes: SeriesClass[]): Promise<SeriesClass[]> {
        if (type === 'insert') return this.db.any(this.pgp.helpers.insert(classes, classcols) + ' RETURNING *')
        if (type === 'update') return this.db.any(this.pgp.helpers.update(classes, classcols) + ' WHERE v.classcode = t.classcode RETURNING *')
        if (type === 'delete') return this.db.any('DELETE from classlist WHERE classcode in ($1:csv) RETURNING classlist', classes.map(c => c.classcode))
        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }

    async indexList(): Promise<SeriesIndex[]> {
        return this.db.any('SELECT * FROM indexlist ORDER BY indexcode')
    }
}

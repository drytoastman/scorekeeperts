import { IDatabase, ColumnSet, IMain } from 'pg-promise'
import { SeriesClass, ClassValidator, SeriesIndex, IndexValidator, ClassOrder } from '@common/classindex'
import { validateObj } from '@common/util'

let classcols: ColumnSet|undefined
let indexcols: ColumnSet|undefined

export class ClassRepository {
    constructor(private db: IDatabase<any>, private pgp: IMain) {
        this.db = db
        if (classcols === undefined) {
            classcols = new pgp.helpers.ColumnSet([
                { name: 'classcode', cnd: true },
                { name: 'descrip' },
                'indexcode', 'caridxrestrict', 'classmultiplier', 'usecarflag',
                'carindexed', 'eventtrophy', 'champtrophy', 'secondruns', 'countedruns',
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (col) => { return 'now()' } }
            ], { table: 'classlist' })
        }

        if (indexcols === undefined) {
            indexcols = new pgp.helpers.ColumnSet([
                { name: 'indexcode', cnd: true },
                { name: 'descrip' },
                { name: 'value',    init: (col) => { return Number(col.value) } }, // init better than :raw for security even with checks below
                { name: 'modified', cast: 'timestamp', mod: ':raw', init: (col) => { return 'now()' } }
            ], { table: 'indexlist' })
        }
    }

    async classList(): Promise<SeriesClass[]> {
        return this.db.any('SELECT * FROM classlist ORDER BY classcode')
    }

    async updateClasses(type: string, classes: SeriesClass[]): Promise<SeriesClass[]> {
        classes.forEach(c => { validateObj(c, ClassValidator) })

        if (type === 'insert') return this.db.any(this.pgp.helpers.insert(classes, classcols) + ' RETURNING *')
        if (type === 'update') return this.db.any(this.pgp.helpers.update(classes, classcols) + ' WHERE v.classcode = t.classcode RETURNING *')
        if (type === 'delete') return this.db.any('DELETE from classlist WHERE classcode in ($1:csv) RETURNING classcode', classes.map(c => c.classcode))
        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }

    async indexList(): Promise<SeriesIndex[]> {
        return this.db.any('SELECT * FROM indexlist ORDER BY indexcode')
    }

    async updateIndexes(type: string, indexes: SeriesIndex[]): Promise<SeriesIndex[]> {
        indexes.forEach(i => { validateObj(i, IndexValidator) })

        if (type === 'insert') return this.db.any(this.pgp.helpers.insert(indexes, indexcols) + ' RETURNING *')
        if (type === 'update') return this.db.any(this.pgp.helpers.update(indexes, indexcols) + ' WHERE v.indexcode = t.indexcode RETURNING *')
        if (type === 'delete') return this.db.any('DELETE from indexlist WHERE indexcode in ($1:csv) RETURNING indexcode', indexes.map(i => i.indexcode))
        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }

    async classOrder(): Promise<ClassOrder[]> {
        return this.db.any('SELECT * FROM classorder')
    }
}

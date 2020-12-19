import _ from 'lodash'
import { IMain } from 'pg-promise'
import { SeriesClass, ClassValidator, SeriesIndex, IndexValidator, ClassOrder, ClassData, validateObj } from 'sctypes'
import { ScorekeeperProtocolDB, TABLES } from '.'

export class ClassRepository {
    constructor(private db: ScorekeeperProtocolDB, private pgp: IMain) {
    }

    async getClassData(): Promise<ClassData> {
        return new ClassData(await this.classList(), await this.indexList())
    }

    async classList(): Promise<SeriesClass[]> {
        return this.db.any('SELECT * FROM classlist ORDER BY classcode')
    }

    async classes(codes: string[]): Promise<SeriesClass[]> {
        return this.db.any('SELECT * FROM classlist WHERE classcode IN ($1:csv) ORDER BY classcode', [codes])
    }

    async updateClasses(type: string, classes: SeriesClass[]): Promise<SeriesClass[]> {
        classes.forEach(c => { validateObj(c, ClassValidator) })

        // log trigger will modify float into string for JSON, can't rely on RETURNING *
        if (type === 'insert') {
            await this.db.any(this.pgp.helpers.insert(classes, TABLES.classlist))
            return this.classes(classes.map(c => c.classcode))
        }
        if (type === 'update') {
            await this.db.any(this.pgp.helpers.update(classes, TABLES.classlist) + ' WHERE v.classcode = t.classcode')
            return this.classes(classes.map(c => c.classcode))
        }
        if (type === 'delete') return this.db.any('DELETE from classlist WHERE classcode in ($1:csv) RETURNING classcode', classes.map(c => c.classcode))
        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }

    async indexList(): Promise<SeriesIndex[]> {
        return this.db.any('SELECT * FROM indexlist ORDER BY indexcode')
    }

    async updateIndexes(type: string, indexes: SeriesIndex[]): Promise<SeriesIndex[]> {
        indexes.forEach(i => { validateObj(i, IndexValidator) })

        if (type === 'insert') return this.db.any(this.pgp.helpers.insert(indexes, TABLES.indexlist) + ' RETURNING *')
        if (type === 'update') return this.db.any(this.pgp.helpers.update(indexes, TABLES.indexlist) + ' WHERE v.indexcode = t.indexcode RETURNING *')
        if (type === 'delete') return this.db.any('DELETE from indexlist WHERE indexcode in ($1:csv) RETURNING indexcode', indexes.map(i => i.indexcode))
        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }

    async resetIndex(indexes: SeriesIndex[]): Promise<any> {
        const errors = [] as string[]
        for (const index of indexes) {
            await this.db.any('INSERT INTO indexlist (indexcode, value, descrip) VALUES ($(indexcode), $(value), $(descrip)) ' +
                        'ON CONFLICT (indexcode) DO UPDATE SET value=$(value), descrip=$(descrip), modified=now()', index)
        }

        const keep     = [...indexes.map(i => i.indexcode), '']
        const required = await this.db.map('SELECT DISTINCT indexcode FROM cars', [], r => r.indexcode)
        const todelete = await this.db.map('SELECT indexcode FROM indexlist WHERE indexcode NOT IN ($1:csv)', [keep], r => r.indexcode)
        const issues   = _.intersection(required, todelete)
        const willdel  = _.difference(todelete, issues)

        if (issues.length) {
            errors.push(`Can't remove old indexes (${issues.join(',')}), they are still in use by cars and have been left in place`)
        }
        if (willdel.length) {
            await this.db.none('DELETE FROM indexlist WHERE indexcode IN ($1:csv)', [willdel])
        }

        return {
            type: 'get',
            indexes: await this.indexList(),
            errors: errors
        }
    }

    async classOrder(): Promise<ClassOrder[]> {
        return this.db.any('SELECT * FROM classorder')
    }

    async upsertClassOrder(type: string, classorder: ClassOrder[]): Promise<ClassOrder[]> {
        if (type === 'upsert') {
            for (const co of classorder) {
                await this.db.any('INSERT INTO classorder (eventid,rungroup,classes) VALUES ($(eventid), $(rungroup), ARRAY[$(classes:csv)]) ' +
                    'ON CONFLICT (eventid, rungroup) DO UPDATE SET classes=ARRAY[$(classes:csv)], modified=now()', co)
            }
            return this.classOrder()
        }
        throw Error(`Unknown operation type ${JSON.stringify(type)}`)
    }
}

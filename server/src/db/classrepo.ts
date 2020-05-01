import { SeriesClass, SeriesIndex, ClassData } from '@common/lib'
import { IDatabase } from 'pg-promise'

export class ClassRepository {
    constructor(private db: IDatabase<any>) {
        this.db = db
    }

    async classList(): Promise<SeriesClass[]> {
        return this.db.any('SELECT * FROM classlist ORDER BY classcode')
    }

    async indexList(): Promise<SeriesIndex[]> {
        return this.db.any('SELECT * FROM indexlist ORDER BY indexcode')
    }

    async classData(): Promise<ClassData> {
        const cls: SeriesClass[] = await this.db.any('SELECT * FROM classlist ORDER BY classcode')
        const idx: SeriesIndex[] = await this.db.any('SELECT * FROM indexlist ORDER BY indexcode')
        const cd  = new ClassData(cls, idx)

        cls.forEach(c => {
            c.restrictedIndexes = cd.restrictedRegistrationIndexes(c.classcode)
        })
        return cd
    }
}

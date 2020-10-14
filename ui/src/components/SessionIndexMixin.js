import { mapState } from 'vuex'
import { isOpen } from '@/common/event.ts'

export const SessionIndexMixin = {
    computed: {
        ...mapState(['registered', 'busyReg']),
        ereg()    { return this.registered[this.event.eventid] || [] },
        busy()    { return this.busyReg[this.event.eventid] === true },
        key()     { return this.session || this.index },
        mycarid() { return this.ereg[this.key]?.carid },
        isOpen()  { return this.event ? isOpen(this.event) : false }
    }
}

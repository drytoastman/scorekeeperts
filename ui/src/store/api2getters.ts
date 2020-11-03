import { SeriesEvent, UIItemMap } from '@/common/event'
import { ITEM_TYPE_ENTRY_FEE, ITEM_TYPE_GENERAL_FEE, ITEM_TYPE_SERIES_FEE, PaymentItem } from '@/common/payments'
import { UUID } from '@/common/util'
import orderBy from 'lodash/orderBy'
import { GetterTree } from 'vuex'
import { Api2State } from './state'

export const api2Getters = {

    orderedEvents: (state): SeriesEvent[] => {
        return orderBy(state.events, ['date'])
    },

    membershipfees: (state): PaymentItem[] => {
        return orderBy(Object.values(state.paymentitems).filter(i => i.itemtype === ITEM_TYPE_SERIES_FEE), 'name')
    },

    eventitems: (state) => (eventid: UUID): PaymentItem[]  => {
        if (!state.events[eventid]?.accountid || !state.itemeventmap[eventid]) return []
        const itemids = state.itemeventmap[eventid].map(m => m.itemid)
        return Object.values(state.paymentitems).filter(i => itemids.includes(i.itemid))
    },

    evententryfees: (state, getters) => (eventid: UUID): PaymentItem[] => {
        return orderBy(getters.eventitems(eventid).filter((i: PaymentItem) => i.itemtype === ITEM_TYPE_ENTRY_FEE), 'name')
    },

    eventotherfees: (state, getters) => (eventid: UUID) => {
        return getters.eventitems(eventid).filter((i: PaymentItem) => i.itemtype === ITEM_TYPE_GENERAL_FEE).map((i: PaymentItem) => ({
            item: i,
            map: (state.itemeventmap[eventid] || []).filter(m => m.itemid === i.itemid)[0]
        }))
    },

    eventUIItems: (state) => (eventid: UUID): UIItemMap[] => {
        const uiitems = {} as {[key: string]: UIItemMap}
        for (const item of Object.values(state.paymentitems)) {
            if (item.itemtype === ITEM_TYPE_SERIES_FEE) continue
            uiitems[item.itemid] = {
                checked: false,
                item: item,
                map: {
                    eventid: eventid,
                    itemid: item.itemid,
                    maxcount: 0,
                    required: false
                }
            }
        }

        if (eventid in state.itemeventmap) {
            for (const map of state.itemeventmap[eventid]) {
                uiitems[map.itemid].checked = true
                uiitems[map.itemid].map = map
            }
        }

        return orderBy(Object.values(uiitems), ['itemtype', 'name'])
    }

} as GetterTree<Api2State, Api2State>

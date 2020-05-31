import { MutationTree } from 'vuex'
import { Api2State } from './state'

export const authMutations = {
    driverAuthenticated(state: Api2State, ok: boolean) {
        state.driverAuthenticated = ok
        if (state.driverAuthenticated) {
            state.errors = []
            if (state.ws) {
                state.ws.reconnect()
            } else {
                console.error('No websocket after authenticating')
            }
        }
    }
} as MutationTree<Api2State>

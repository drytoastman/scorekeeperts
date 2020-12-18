import { mdiEye, mdiEyeOff } from '@mdi/js'

export const PasswordEyeMixin = {
    data() {
        return {
            showp: false
        }
    },
    computed: {
        pIcon() { return this.showp ? mdiEye : mdiEyeOff },
        pType() { return this.showp ? 'text' : 'password' }
    }
}

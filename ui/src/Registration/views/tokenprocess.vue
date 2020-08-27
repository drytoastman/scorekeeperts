<template>
    <div class='outer'>
        <div class='status'>{{status}}</div>
        <ChangePasswordDialog v-model=resetDialog :resetToken=resetToken @save=save @complete=complete></ChangePasswordDialog>
    </div>
</template>

<script>
import ChangePasswordDialog from '../components/ChangePasswordDialog'

export default {
    name: 'TokenProcess',
    components: {
        ChangePasswordDialog
    },
    data() {
        return {
            status: 'Processing token ... ',
            resetDialog: false,
            resetToken: {}
        }
    },
    methods: {
        save() {
            this.status = 'submitting new password'
        },
        complete() {
            this.$store.dispatch('getdata')
            this.$router.replace({ name: 'profile' })
        }
    },
    mounted() {
        this.$store.dispatch('token', { token: this.$route.query.t, signature: this.$route.query.s }).then(data => {
            if ('tokenerror' in data) {
                this.status = data.tokenerror
                return
            }

            this.$store.commit('driverAuthenticated', true)
            this.status = 'token accepted'
            if (data.tokenresult === 'changepassword') {
                this.resetToken = this.$route.query
                this.resetDialog = true
            } else {
                this.complete()
            }
        })
    }
}
</script>

<style scoped>
.outer {
    padding: 2rem;
}
.status {
    font-size: 120%;
}
</style>

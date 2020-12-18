<template>
    <BaseDialog width="400px" :settitle="title" :setaction="action" :value="value" @input="$emit('input')" @update="update" ref='dialog'>
        <v-text-field v-if='!isReset' v-model="currentpass" label="Current Password" :rules="vrules.password" required
            :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
        </v-text-field>
        <v-text-field v-model="newpass" label="New Password" :rules="vrules.password" required
            :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
        </v-text-field>
    </BaseDialog>
</template>

<script>
import { RegisterValidator } from 'sctypes/lib/driver'
import { PasswordEyeMixin } from '@/components/PasswordEyeMixin.js'
import BaseDialog from '@/components/BaseDialog'

export default {
    name: 'ChangePasswordDialog',
    mixins: [PasswordEyeMixin],
    components: {
        BaseDialog
    },
    props: {
        value: Boolean,
        resetToken: Object
    },
    data() {
        return {
            vrules: RegisterValidator,
            currentpass: '',
            newpass: ''
        }
    },
    computed: {
        isReset() { return this.resetToken && this.resetToken.t && this.resetToken.s },
        title()   { return this.isReset ? 'Reset Password' : 'Change Password' },
        action()  { return this.isReset ? 'Reset' : 'Update' }
    },
    methods: {
        update() {
            if (this.$refs.dialog.validate()) {
                this.$store.dispatch('changePassword', {
                    currentpassword: this.currentpass,
                    newpassword: this.newpass,
                    resetToken: this.resetToken
                }).then(data => {
                    if (data) this.$emit('complete')
                })

                this.$emit('save')
                this.$emit('input')
            }
        }
    },
    watch: {
        value: function(newv) {
            if (newv) { // dialog open
                this.$refs.dialog.resetValidation() // reset validations if present
                this.currentpass = ''
                this.newpass = ''
            }
        }
    }
}
</script>

<style scoped>
</style>

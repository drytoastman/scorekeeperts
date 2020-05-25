<template>
    <v-dialog v-model="opened" persistent max-width="420px">
        <template v-slot:activator="{ on }">
            <v-btn v-on="on" dark color=secondary>Change Password</v-btn>
        </template>

        <v-card>
            <v-card-title>
                <span class="headline">Change Password</span>
            </v-card-title>
            <v-card-text>
                <v-form ref="form" lazy-validation>
                    <v-text-field v-model="currentpass" label="Current Password" :rules="vrules.password" required
                        :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
                    >
                    </v-text-field>
                    <v-text-field v-model="newpass" label="New Password"     :rules="vrules.password" required
                        :type="pType" @click:append="showp=!showp" :append-icon="pIcon">
                    </v-text-field>
                </v-form>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="opened=false">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="save()">Change</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>


</template>

<script>
import { DriverValidator } from '@common/lib'
import { PasswordEyeMixin } from '../../components/PasswordEyeMixin.js'

export default {
    name: 'LoginForm',
    mixins: [PasswordEyeMixin],
    data() {
        return {
            opened: false,
            vrules: DriverValidator,
            currentpass: '',
            newpass: ''
        }
    },
    methods: {
        save() {
            if (this.$refs.form.validate()) {
                this.$store.dispatch('changePassword', {
                    currentpassword: this.currentpass,
                    newpassword: this.newpass
                })
                this.opened = false
            }
        }
    },
    watch: {
        opened: function(newv) {
            if (newv) { // dialog open
                if ('form' in this.$refs) { this.$refs.form.resetValidation() } // reset validations if present
                this.currentpass = ''
                this.newpass = ''
            }
        }
    }
}
</script>

<style scoped>
</style>

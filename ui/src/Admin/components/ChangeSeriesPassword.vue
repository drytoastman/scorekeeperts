<template>
    <v-dialog :value="value" @input="$emit('input')" persistent max-width="600px">
        <v-card>
            <v-card-title>
                <span class="headline primary--text text--darken-2">Change Series Password</span>
            </v-card-title>
            <v-card-text>
                <div class='alert'>
                    This will change the local password for <b>{{currentSeries}}</b>.
                    Anyone else wanting to sync with <b>{{currentSeries}}</b> at this server must also change their series password to match.
                </div>

                <v-text-field v-model="currentpassword" label="Current Password" :type="pType" @click:append="showp=!showp" :append-icon="pIcon"></v-text-field>
                <v-text-field v-model="newpassword"     label="New Password" :type="pType" @click:append="showp=!showp" :append-icon="pIcon"></v-text-field>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary darken-2" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="primary darken-2" text @click="change">Change</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>
import { mapState } from 'vuex'
import { PasswordEyeMixin } from '../../components/PasswordEyeMixin.js'

export default {
    name: 'ChangeSeriesPassword',
    mixins: [PasswordEyeMixin],
    props: {
        value: Boolean
    },
    data() {
        return {
            currentpassword: '',
            newpassword: ''
        }
    },
    computed: {
        ...mapState(['currentSeries'])
    },
    methods: {
        change() {
            this.$store.dispatch('seriesadmin', {
                request: 'password',
                currentpassword: this.currentpassword,
                newpassword: this.newpassword
            }).then(data => {
                if (data) this.$emit('input')
            })
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.currentpassword = ''
            }
        }
    }
}
</script>

<style scoped>
.alert {
    color: red;
    margin-bottom: 1rem;
}
</style>

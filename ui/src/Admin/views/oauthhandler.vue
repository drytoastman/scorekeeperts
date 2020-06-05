<template>
    <div>
        <div v-if="!haveResponse">
            <div class='container'>
                Waiting for Square communication
            </div>
        </div>
        <div v-else>
            <div class='container'>
                <h2>Select Location</h2>
                <v-select :items="squareoauthresp.locations" v-model="locationid" item-text="name" item-value="id" solo placeholder="Select A Location"></v-select>
                <v-btn color="secondary" @click="setLocation">Use Location</v-btn>
            </div>
        </div>
    </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'

export default {
    name: 'OAuthHandler',
    data() {
        return {
            locationid: String
        }
    },
    computed: {
        ...mapState(['squareoauthresp']),
        haveResponse() { return !_.isEmpty(this.squareoauthresp) }
    },
    methods: {
        setLocation() {
            if (this.locationid) {
                this.$store.commit('gettingData', true) // indicator for next page that we are waiting
                this.$store.dispatch('setdata', {
                    items: {
                        squareoauthlocation: {
                            locationid: this.locationid,
                            requestid: this.squareoauthresp.requestid
                        }
                    }
                }).then(() => {
                    this.$store.commit('gettingData', false)
                })
                this.$router.replace({ name: 'accounts' })
            }
        }
    },
    mounted() {
        if (!this.haveResponse) {
            this.$store.dispatch('setdata', {
                items: { squareoauthcode: this.$route.params.code }
            })
        }
    }
}
</script>

<style scoped>
h2 {
    margin-bottom: 1rem;
}
.container {
    max-width: 400px;
    margin-left: 8vw;
}
</style>

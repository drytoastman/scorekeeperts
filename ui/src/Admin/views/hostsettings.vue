<template>
    <v-form class='outer' ref="form" lazy-validation>
        <template v-for="s in localsettings">
            <div class='ktitle' :key="s.key">{{s.key.replace(/_/g, ' ')}}</div>
            <v-text-field :key="s.key+'v'" v-model="s.value" dense :rules="vrules(s.key)" :placeholder='place(s.key)'></v-text-field>
        </template>
        <span></span>
        <v-btn @click='update' color=secondary>Update</v-btn>
        <span></span>
        <v-btn @click='rotatekeygrip' color=secondary>Generate New Cookie Key</v-btn>
    </v-form>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { LocalSettingsValidator } from '@/common/settings'

export default {
    name: 'HostSettings',
    props: {
    },
    data() {
        return {
            localsettings: []
        }
    },
    methods: {
        vrules(key) {
            return LocalSettingsValidator[key]
        },
        place(key) {
            return (key in LocalSettingsValidator) ? '' : 'set only'
        },
        update() {
            if (this.$refs.form.validate()) {
                this.$store.dispatch('setdata', {
                    type: 'update',
                    items: { localsettings: this.localsettings }
                }).then(data => {
                    this.localsettings = orderBy(data.localsettings, 'key')
                })
            }
        },
        rotatekeygrip() {
            this.$store.dispatch('setdata', {
                type: 'update',
                items: { rotatekeygrip: '' }
            })
        }
    },
    mounted() {
        this.$store.dispatch('getdata', { items: 'localsettings' }).then(data => {
            if (data) this.localsettings = orderBy(data.localsettings, 'key')
        })
    }
}
</script>

<style scoped>
.outer {
    display: grid;
    grid-template-columns: 12rem auto;
    column-gap: 1rem;
    align-items: baseline;
    padding-top: 1rem;
}
.outer >>> .v-text-field {
    padding-top: 0;
    margin-top: 0;
}
.ktitle {
    font-weight: bold;
    font-size: 95%;
    justify-self: right;
}
.v-btn {
    margin-top: 1rem;
}

@media (max-width: 600px) {
    .outer {
        display: flex;
        flex-direction: column;
        align-items: stretch;
    }
    .ktitle {
        margin-top: 0.2rem;
    }
}
</style>

<template>
    <v-dialog v-model="opened" persistent max-width="320px">
        <template v-slot:activator="{ on }">
            <v-btn v-on="on" dark color=secondary>Update Groups</v-btn>
        </template>

        <v-card>
            <v-card-title>
                <span class="headline">Update Groups</span>
            </v-card-title>
            <v-card-text>
                <div class='checkgrid'>
                    <v-checkbox v-for="group in listids" :key="group" :label="group" v-model="checks[group]"></v-checkbox>
                </div>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="blue darken-1" text @click="opened=false">Cancel</v-btn>
                <v-btn color="blue darken-1" text @click="save()">Update</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>


</template>

<script>
import Vue from 'vue'
import { mapState } from 'vuex'
import _ from 'lodash'

export default {
    name: 'EmailGroupsDialog',
    data() {
        return {
            opened: false,
            checks: {}
        }
    },
    computed: {
        ...mapState(['listids', 'unsubscribe'])
    },
    methods: {
        save() {
            this.$store.dispatch('setdata', {
                type: 'update',
                items: { unsubscribe: _(this.checks).pickBy(v => !v).keys().value() }
            })
            this.opened = false
        }
    },
    watch: {
        opened: function(newv) {
            if (newv) { // dialog open
                this.checks = {}
                this.listids.forEach(l => Vue.set(this.checks, l, true))
                this.unsubscribe.forEach(l => { this.checks[l] = false })
            }
        }
    }
}
</script>

<style scoped>
.checkgrid {
    column-count: 2;
}
.v-input--selection-controls {
    margin-top: 0;
}
</style>

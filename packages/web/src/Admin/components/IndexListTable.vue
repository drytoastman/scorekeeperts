<template>
    <div class='indexlisttable'>
        <div class='baseadminbuttons' style='grid-template-columns: 10rem 18rem'>
            <v-btn color=secondary @click.stop="newindex">Add Index</v-btn>
            <v-menu v-model="resetshown">
                <template v-slot:activator="{ on, attrs }">
                    <v-btn color="secondary" v-bind="attrs" v-on="on">
                    Reset To Predefined List &#9660;
                    </v-btn>
                </template>
                <v-list>
                    <v-list-item v-for="list in paxlists" :key="list" @click='paxselect(list)'>
                        {{list.slice(0, -5).replace('_', ' ')}}
                    </v-list-item>
                </v-list>
            </v-menu>
        </div>


        <v-data-table :items="indexlist" :headers="headers" item-key="indexcode" disable-pagination hide-default-footer dense>
            <template v-slot:[`item.actions`]="{ item }">
                <div v-if="busyIndex[item.indexcode]" class='busy'>
                    busy
                </div>
                <div v-else class='actionbuttons'>
                    <v-icon small @click="editindex(item)">{{icons.mdiPencil}}</v-icon>
                    <v-icon small @click.stop="deleteindex(item)">{{icons.mdiDelete}}</v-icon>
                </div>
            </template>
        </v-data-table>

        <IndexDialog :indexobj="dialogData" :apiType="dialogApiType" v-model="IndexDialog"></IndexDialog>
    </div>
</template>

<script>
import axios from 'axios'
import orderBy from 'lodash/orderBy'
import { mapState } from 'vuex'
import { mdiPencil, mdiDelete } from '@mdi/js'
import IndexDialog from './IndexDialog.vue'

export default {
    name: 'IndexList',
    components: {
        IndexDialog
    },
    data() {
        return {
            dialogData: {},
            dialogApiType: '',
            IndexDialog: false,
            icons: {
                mdiPencil,
                mdiDelete
            },
            headers: [
                { text: 'Code', value: 'indexcode' },
                { text: 'Desc', value: 'descrip', width: 250 },
                { text: 'Value', value: 'value', sortable: false },
                { text: 'Actions', value: 'actions', sortable: false }
            ],
            paxlists: ['loading...    '],
            resetshown: false
        }
    },
    computed: {
        ...mapState(['indexes', 'busyIndex']),
        indexlist() { return orderBy(Object.values(this.indexes).filter(v => v.indexcode), 'indexcode') }
    },
    watch: {
        resetshown(newv) {
            if (newv) {
                axios.get('/paxlists').then(resp => {
                    if (!Array.isArray(resp.data)) {
                        this.$store.commit('addErrors', ['/paxlists did not return a json array'])
                        return
                    }
                    this.paxlists = resp.data.map(e => e.name).filter(n => n.endsWith('.json'))
                }).catch(error => {
                    this.$store.commit('addErrors', [`GET /paxlists: ${error}`])
                })
            }
        }
    },
    methods: {
        newindex() {
            this.dialogData = {
                indexcode: '',
                descrip: '',
                value: ''
            }
            this.dialogApiType = 'insert'
            this.IndexDialog = true
        },
        editindex(item) {
            this.dialogData = item
            this.dialogApiType = 'update'
            this.IndexDialog = true
        },
        deleteindex(item) {
            this.dialogData = item
            this.dialogApiType = 'delete'
            this.IndexDialog = true
        },
        paxselect(list) {
            if (!list.startsWith('loading')) {
                this.$store.dispatch('setdata', { items: { paxlist: list }})
            }
        }
    }
}
</script>

<style lang='scss'>
.indexlisttable {
    .v-data-table td, .v-data-table th {
        padding: 0 4px;
    }
    .v-data-table__wrapper {
        overflow-x: hidden;
    }
}
</style>

<style scoped>
.busy {
    color: #F44;
}
</style>

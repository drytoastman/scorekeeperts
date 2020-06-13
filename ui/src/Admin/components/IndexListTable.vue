<template>
    <div class='indexlisttable'>
        <v-data-table :items="indexlist" :headers="headers" item-key="indexcode" disable-pagination hide-default-footer>
            <template v-slot:item.actions="{ item }">
                <div v-if="busyIndex[item.indexcode]" class='busy'>
                    busy
                </div>
                <div v-else class='buttongrid'>
                    <v-icon small @click="editindex(item)">{{icons.mdiPencil}}</v-icon>
                    <v-icon small @click.stop="deleteindex(item)">{{icons.mdiDelete}}</v-icon>
                </div>
            </template>
        </v-data-table>

        <IndexDialog :indexobj="dialogData" :apiType="dialogApiType" v-model="IndexDialog"></IndexDialog>
    </div>
</template>

<script>
import _ from 'lodash'
import { mapState } from 'vuex'
import { mdiPencil, mdiDelete } from '@mdi/js'
import IndexDialog from './IndexDialog'

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
            ]
        }
    },
    computed: {
        ...mapState(['indexes', 'busyIndex']),
        indexlist() { return _(this.indexes).values().orderBy('indexcode').value() }
    },
    methods: {
        newindex() {
            this.dialogData = { }
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
.buttongrid {
    display: grid;
    grid-template-columns: 25px 25px;
}
.indexlisttable {
    margin: 1rem;
}
.busy {
    color: #F44;
}
</style>

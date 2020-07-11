<template>
    <div class='indexlisttable'>
        <v-btn color=secondary @click.stop="newindex">Add Index</v-btn>
        <v-menu>
            <template v-slot:activator="{ on, attrs }">
                <v-btn color="secondary" v-bind="attrs" v-on="on" :disabled="true">
                Reset To Predefined List &#9660;
                </v-btn>
            </template>
            <v-list>
                <v-list-item v-for="list in lists" :key="list">
                    {{list}}
                </v-list-item>
            </v-list>
        </v-menu>

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
import orderBy from 'lodash/orderBy'
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
            ],
            lists: [
                'PAX 2020'
            ]
        }
    },
    computed: {
        ...mapState(['indexes', 'busyIndex']),
        indexlist() { return orderBy(Object.values(this.indexes).filter(v => v.indexcode), 'indexcode') }
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
.v-btn {
    margin-right: 1rem;
}
.busy {
    color: #F44;
}
</style>

<template>
    <div class='classlisttable'>
        <div class='adminbuttons'>
            <v-btn color=secondary @click.stop="newclass">Add Class</v-btn>
        </div>

        <v-data-table :items="classlist" :headers="headers" item-key="classcode" disable-pagination hide-default-footer dense>

            <template v-slot:[`item.eventtrophy`]="{ item }"><span v-if="item.eventtrophy">&checkmark;</span></template>
            <template v-slot:[`item.champtrophy`]="{ item }"><span v-if="item.champtrophy">&checkmark;</span></template>
            <template v-slot:[`item.carindexed`]="{ item }"><span v-if="item.carindexed">&checkmark;</span></template>
            <template v-slot:[`item.secondruns`]="{ item }"><span v-if="item.secondruns">&checkmark;</span></template>

            <template v-slot:[`item.actions`]="{ item }">
                <div v-if="busyClass[item.classcode]" class='busy'>
                    busy
                </div>
                <div v-else class='actionbuttons'>
                    <v-icon small @click="editclass(item)">{{icons.mdiPencil}}</v-icon>
                    <v-icon small @click.stop="deleteclass(item)">{{icons.mdiDelete}}</v-icon>
                </div>
            </template>

            <!-- for wide table, use letter headers as columns is just checkmarks -->
            <template v-slot:[`header.eventtrophy`]="">E</template>
            <template v-slot:[`header.champtrophy`]="">C</template>
            <template v-slot:[`header.carindexed`]="">I</template>
            <template v-slot:[`header.secondruns`]="">S</template>
        </v-data-table>

        <ClassDialog :classobj="dialogData" :apiType="dialogApiType" v-model="classDialog"></ClassDialog>
    </div>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapState } from 'vuex'
import { mdiPencil, mdiDelete } from '@mdi/js'
import ClassDialog from './ClassDialog.vue'

export default {
    name: 'ClassList',
    components: {
        ClassDialog
    },
    data() {
        return {
            dialogData: {},
            dialogApiType: '',
            classDialog: false,
            icons: {
                mdiPencil,
                mdiDelete
            },
            headers: [
                { text: 'Code', value: 'classcode' },
                { text: 'Desc', value: 'descrip', width: 250 },
                { text: 'Actions',       value: 'actions', sortable: false },
                { text: 'Event Trophy',  value: 'eventtrophy', sortable: false },
                { text: 'Champ Trophy',  value: 'champtrophy', sortable: false },
                { text: 'Cars Indexed',  value: 'carindexed', sortable: false },
                { text: 'Second Runs',   value: 'secondruns', sortable: false },
                { text: 'Class Indexed', value: 'indexcode', width: 50 },
                { text: 'Additional Multiplier', value: 'classmultiplier', width: 50 },
                { text: 'Index Controls',        value: 'caridxrestrict' },
                { text: 'Counted Runs',          value: 'countedruns', width: 50 }
            ]
        }
    },
    computed: {
        ...mapState(['classes', 'busyClass']),
        classlist() { return orderBy(Object.values(this.classes).filter(v => v.classcode !== 'HOLD'), 'classcode') }
    },
    methods: {
        newclass() {
            this.dialogData = {
                usecarflag: false,
                eventtrophy: true,
                champtrophy: true,
                carindexed: false,
                secondruns: false,
                classmultiplier: 1.0,
                countedruns: 0,
                classcode: '',
                indexcode: '',
                caridxrestrict: '',
                descrip: ''
            }
            this.dialogApiType = 'insert'
            this.classDialog = true
        },
        editclass(item) {
            this.dialogData = item
            this.dialogApiType = 'update'
            this.classDialog = true
        },
        deleteclass(item) {
            this.dialogData = item
            this.dialogApiType = 'delete'
            this.classDialog = true
        }
    }
}
</script>

<style lang='scss'>
.classlisttable {
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

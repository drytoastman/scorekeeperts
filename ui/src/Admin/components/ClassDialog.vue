<template>
    <BaseDialog :value="value" :persistent="false" :apiType="apiType" dataType="Class" width="440px" @input="$emit('input')" @update="update">
        <v-form ref="form">
                <v-text-field v-model="classm.classcode" label="Code"></v-text-field>
                <v-text-field v-model="classm.descrip"   label="Description"></v-text-field>

                <div class='row4'>
                <v-checkbox v-model="classm.eventtrophy" label="Event Trophy"></v-checkbox>
                <v-checkbox v-model="classm.champtrophy" label="Champ Trophy"></v-checkbox>
                <v-checkbox v-model="classm.carindexed"  label="Cars Indexed"></v-checkbox>
                <v-checkbox v-model="classm.secondruns"  label="Second Runs"></v-checkbox>
                </div>

                <div class='row3'>
                <v-select     v-model="classm.indexcode" label="Class-Wide Index" :items="indexlist" item-text="indexcode" item-value="indexcode"></v-select>
                <v-text-field v-model="classmultiplier" label="Additional Multiplier" :rules="vrules.classmultiplier"></v-text-field>
                <v-text-field v-model="countedruns" label="Counted Runs" :rules="vrules.countedruns"></v-text-field>
                </div>

                <v-text-field v-model="classm.caridxrestrict" label="Index Restrictions" :rules="vrules.caridxrestrict" :disabled="!classm.carindexed">
                    <template v-slot:append-outer>
                    <v-menu>
                        <template v-slot:activator="{ on, attrs }">
                            <v-btn v-bind="attrs" v-on="on" :disabled="!classm.carindexed">Matches</v-btn>
                        </template>
                        <v-list class='widelist'>
                            <v-list-item v-for="m in matches" :key="m">{{m}}</v-list-item>
                        </v-list>
                    </v-menu>
                    </template>
                </v-text-field>
        </v-form>
    </BaseDialog>
</template>

<script>
import orderBy from 'lodash/orderBy'
import { mapState } from 'vuex'
import { ClassValidator } from '@sctypes/classindex'
import { restrictedRegistrationIndexes } from '@sctypes/classdata'

import BaseDialog from '../../components/BaseDialog'

export default {
    components: {
        BaseDialog
    },
    props: {
        value: Boolean,
        classobj: Object,
        apiType: String
    },
    data() {
        return {
            vrules: ClassValidator,
            classm: { }
        }
    },
    computed: {
        ...mapState(['classes', 'indexes']),
        indexlist() { return orderBy(Object.values(this.indexes), 'indexcode') },
        matches()   { return restrictedRegistrationIndexes(this.classm.caridxrestrict, Object.keys(this.indexes)).filter(v => v) },
        countedruns: {
            get() { return this.classm.countedruns },
            set(nv) { this.classm.countedruns = parseInt(nv) }
        },
        classmultiplier: {
            get() { return this.classm.classmultiplier },
            set(nv) { this.classm.classmultiplier = parseFloat(nv) }
        }
    },
    methods: {
        update() {
            if (!this.classm.carindexed) {
                this.classm.caridxrestrict = ''
            }
            this.$store.dispatch('setdata', {
                type: this.apiType,
                items: { classes: [this.classm] },
                busy: { key: 'busyClass', id: this.classm.classcode }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.classm = JSON.parse(JSON.stringify(this.classobj))
            }
        }
    }
}
</script>

<style scoped>
.row4 {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
}
.row3 {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    column-gap: 20px;
}
.widelist {
    columns: 4;
}
</style>

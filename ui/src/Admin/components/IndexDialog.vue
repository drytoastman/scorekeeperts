<template>
    <BaseDialog :value="value" :persistent="false" :apiType="apiType" dataType="Index" width="300px" @input="$emit('input')" @update="update">
        <v-form ref="form">
                <v-text-field v-model="indexm.indexcode" label="Code"></v-text-field>
                <v-text-field v-model="indexm.descrip"   label="Description"></v-text-field>
                <v-text-field v-model="indexm.value"     label="Value" :rules="vrules.value"></v-text-field>
        </v-form>
    </BaseDialog>
</template>

<script>
import { IndexValidator } from '@/common/classindex'
import BaseDialog from '../../components/BaseDialog'

export default {
    components: {
        BaseDialog
    },
    props: {
        value: Boolean,
        indexobj: Object,
        apiType: String
    },
    data() {
        return {
            vrules: IndexValidator,
            indexm: { }
        }
    },
    methods: {
        update() {
            this.$store.dispatch('setdata', {
                type: this.apiType,
                items: { indexes: [this.indexm] },
                busy: { key: 'busyIndex', id: this.indexm.indexcode }
            })
            this.$emit('input')
        }
    },
    watch: {
        value: function(newv) {
            if (newv) {
                this.indexm = JSON.parse(JSON.stringify(this.indexobj))
            }
        }
    }
}
</script>

<style scoped>
</style>

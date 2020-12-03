<template>
    <v-menu :disabled="!depend" v-model="menuActive" nudge-bottom=35>
        <template v-slot:activator="{ on, attrs }">
            <v-btn :disabled="!depend" color="primary" v-bind="attrs" v-on="on">{{ value ? (value.name || value) : placeholder}}</v-btn>
        </template>
        <v-list>
            <template v-for="(item, index) in items">
                <v-divider v-if="item && item.name === 'divider'" :key="index"></v-divider>
                <v-list-item v-else-if="item" :key="index" @click="$emit('input', item)">
                    {{ item.name || item }}
                </v-list-item>
            </template>
        </v-list>
    </v-menu>
</template>

<script>
export default {
    name: 'ResultsMenu',
    props: {
        items: Array,
        value: [String, Object],
        placeholder: String,
        depend: [String, Object]
    },
    data() {
        return {
            userSelected: false
        }
    },
    computed: {
        menuActive: {
            get() {
                if (!this.value && this.items && this.depend) return true
                return this.userSelected
            },
            set(nv) { this.userSelected = nv }
        }
    }
}
</script>

<style lang="scss" scoped>
.theme--light.v-divider {
    border-color: rgba(0, 0, 0, 0.22);
}
</style>

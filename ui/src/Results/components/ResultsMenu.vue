<template>
    <v-menu v-if="depend" v-model="menuActive" nudge-bottom=35>
        <template v-slot:activator="{ on, attrs }">
            <v-btn color="primary" v-bind="attrs" v-on="on">{{ value ? (value.name || value) : placeholder}}</v-btn>
        </template>
        <v-list>
            <template v-for="(item, index) in items">
                <v-list-item :key="index" :disabled="item === value" @click="$emit('input', item)">
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
            get() { return (this.userSelected || !this.value) && this.depend },
            set(nv) { this.userSelected = nv }
        }
    }
}
</script>

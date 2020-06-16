<template>
    <v-dialog :value="value" @input="$emit('input')" :persistent="persistent" :max-width="width">
        <v-card>
            <v-card-title>
                <span class="headline secondary--text text--darken-2">{{title}}</span>
            </v-card-title>
            <v-card-text :class='{disabledform: disableAll}'>
                <slot></slot>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="secondary darken-2" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="secondary darken-2" text @click="$emit('update')">{{actionName}}</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>

export default {
    props: {
        value: Boolean,
        apiType: String,
        dataType: String,
        width: String,
        settitle: String,
        setaction: String,
        persistent: {
            type: Boolean,
            default() { return true }
        }
    },
    computed: {
        title() {
            if (this.settitle) {
                return this.settitle
            }
            switch (this.apiType) {
                case 'insert': return `New ${this.dataType}`
                case 'update': return `Update ${this.dataType}`
                case 'delete': return `Delete ${this.dataType}`
                default: return '???'
            }
        },
        actionName() {
            if (this.setaction) {
                return this.setaction
            }
            switch (this.apiType) {
                case 'insert': return 'Create'
                case 'update': return 'Update'
                case 'delete': return 'Delete'
                default: return '???'
            }
        },
        disableAll: function() { return this.actionName === 'Delete' }
    }
}
</script>

<style scoped>
.disabledform {
    background: #c8c8c8;
    pointer-events: none;
    opacity: 0.5;
 }
</style>

<template>
    <v-dialog :value="value" @input="$emit('input')" persistent maxWidth="500px">
        <v-card>
            <v-card-title>
                <span class="headline primary--text">{{title}}</span>
            </v-card-title>
            <v-card-text class='body'>
                <slot></slot>
            </v-card-text>
            <v-card-actions>
                <v-spacer></v-spacer>
                <v-btn color="primary" v-if="!noCancel" text @click="$emit('input')">Cancel</v-btn>
                <v-btn color="primary" text @click="$emit('ok'); $emit('input')">Ok</v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>

<script>

export default {
    props: {
        title: String,
        value: Boolean,
        noCancel: Boolean
    }
}
</script>

<style scoped>
.body {
    padding: 1rem !important;
    text-align: center;
}
</style>

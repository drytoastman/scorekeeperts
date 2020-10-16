<template>
    <v-menu close-on-content-click :disabled="disabled">
        <template v-slot:activator="{ on }">
            <v-btn color=white text small v-on="on">{{text}}</v-btn>
        </template>
        <v-list>
            <template v-for="item in items">
                <v-divider v-if="!item.title" :key="item.title"></v-divider>
                <v-list-item v-else :key="item.title" :to="item.link" class='menustyle'>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
            </template>
        </v-list>
    </v-menu>
</template>

<script>
export default {
    name: 'AdminMenu',
    props: {
        items: Array,
        text: String,
        disabled: Boolean
    }
}
</script>

<style lang='scss' scoped>
.menustyle {
    .v-list-item__title {
        font-size: 14px;
    }
}
</style>

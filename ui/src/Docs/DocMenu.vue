<template>
    <v-menu close-on-content-click>
        <template v-slot:activator="{ on }">
            <v-btn color=white text large v-on="on">{{text}}</v-btn>
        </template>
        <v-list>
            <template v-for="item in items">
                <v-divider v-if="!item.title" :key="item.key || item.title"></v-divider>
                <v-list-item v-else :key="item.key || item.title" :to="`/${item.page}`" class='menustyle'>
                    <v-list-item-title>{{ item.title }}</v-list-item-title>
                </v-list-item>
            </template>
        </v-list>
    </v-menu>
</template>

<script>
export default {
    name: 'DocMenu',
    props: {
        items: Array,
        text: String
    }
}
</script>

<style lang='scss' scoped>
.menustyle {
    .v-list-item__title {
        font-size: 14px;
    }
}
.theme--light.v-divider {
    border-color: rgba(0, 0, 0, 0.22);
}
</style>

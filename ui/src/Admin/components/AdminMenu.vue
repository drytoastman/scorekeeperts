<template>
    <v-menu close-on-content-click :disabled="disabled">
        <template v-slot:activator="{ on }">
            <v-btn color=white icon v-on="on"><v-icon>{{icon}}</v-icon></v-btn>
        </template>
        <v-list>
            <template v-for="item in items">
                <v-divider v-if="!item.title" :key="item.title+'d'"></v-divider>
                <v-list-item v-else :key="item.title" :to="item.link">
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
        icon: String,
        disabled: Boolean
    }
}
</script>

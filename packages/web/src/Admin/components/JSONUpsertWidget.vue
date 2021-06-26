<template>
    <div class='jsonupsertwidget'>
        <v-btn color=secondary @click.stop="buttonaction">{{label}}</v-btn>
        <input type="file" style="display: none" ref="fileInput" accept="json" @change="onFilePicked"/>
    </div>
</template>

<script>

export default {
    name: 'JSONUpsertWidget',
    props: {
        label: String,
        insertkey: String
    },
    methods: {
        buttonaction() {
            this.$refs.fileInput.click()
        },

        onFilePicked(event) {
            const reader = new FileReader()
            reader.onload = () => {
                this.$store.dispatch('setdata', { type: 'upsert', items: { [this.insertkey]:  JSON.parse(reader.result) }})
            }
            reader.readAsText(event.target.files[0])
        }
    }
}
</script>

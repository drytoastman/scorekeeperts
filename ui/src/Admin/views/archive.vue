<template>
    <div>
        <h3>Archive Series</h3>
        <p>
            Archive will make sure all the results, raw and calculated, are stored for retrieval but the series will be removed from the registration and admin sites.
            It is recommended to archive all previous years series when no longer active.
        </p>
        <p>
            To continue, type the name of the series into the box and click Archive.
            <span class='note'>This operation is irreverisble</span>
        </p>
        <div class='centerblock'>
            <v-text-field v-model="value" autocomplete="off" placeholder="Enter Series Name"></v-text-field>
            <v-btn color="secondary" :disabled=disabled @click='doarchive'>{{disabled?'Enter Series Name':'Archive'}}</v-btn>
        </div>
    </div>
</template>

<script>
export default {
    name: 'Archive',
    data() { return { value: '' } },
    computed: { disabled() { return this.$store.state.currentSeries !== this.value } },
    methods: {
        doarchive() {
            this.$store.dispatch('seriesadmin', {
                request: 'archive',
                verifyseries: this.value
            }).then(data => {
                if (data) {
                    this.$store.commit('seriesGone', this.value)
                    this.$router.push('/')
                }
            })
        }
    }
}
</script>



<style scoped lang='scss'>
.centerblock {
    margin: 0 auto 0 auto;
    width: 20rem;
}
.note {
    color: red;
}
</style>

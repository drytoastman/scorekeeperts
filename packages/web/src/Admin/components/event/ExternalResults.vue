<template>
    <div class='inset'>
        <AddExternalResult :seriesevent="seriesevent"></AddExternalResult>

        <div class='header'>External Results</div>
        <table id='externaltable' class=''>
        <thead>
        <tr><th>Class</th><th>First</th><th>Last</th><th>Net</th><th></th></tr>
        </thead>
        <tbody>
        </tbody>
        </table>

    </div>
</template>


<script>
import AddExternalResult from './AddExternalResult.vue'
import { mapState } from 'vuex'

export default {
    name: 'ExternalResults',
    components: {
        AddExternalResult
    },
    props: {
        seriesevent: Object
    },
    data() {
        return {
            driverid: -1
        }
    },
    computed: {
        ...mapState(['drivers'])
    },
    methods: {
    },
    watch: {
    },
    // eslint-disable-next-line @typescript-eslint/no-empty-function
    mounted() {}
}
</script>

<style scoped>
.header {
    font-size: 120%;
    margin-top: 2rem;
}
</style>

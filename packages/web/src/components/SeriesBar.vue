<template>
    <div class='seriesbar'>
        <span class='btitle'>{{title}}</span>
        <v-select solo light dense hide-details placeholder="Select A Series" ref="sselect"
                    v-model="selectedSeries" :items="serieslist" :menu-props="{maxHeight: 'calc(100% - 1rem)'}"
        ></v-select>
        <span class='bdesc'>{{$route.meta.marker || $route.name}}</span>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
    name: 'SeriesBar',
    props: {
        title: String
    },
    computed: {
        ...mapState(['currentSeries', 'serieslist']),
        selectedSeries: {
            get() { return this.currentSeries },
            set(value) {
                this.$store.commit('changeSeries', value)

                let name = this.$route.name
                switch (name) {
                    case 'noseries':  // push to summary
                    case 'event':     // same event on different series is nonsensical
                        name = 'summary'
                        break
                }

                this.$router.push({ name: name, params: { series: value }}).catch(error => {
                    // If we change series while on a non-series link, don't throw any errors
                    if (error.name !== 'NavigationDuplicated') {
                        throw error
                    }
                })
            }
        }
    },
    watch: {
        serieslist: function() {
            if (this.currentSeries) {
                this.$refs.sselect.blur() // clear after load if it doesn't need to be open
            }
        }
    }
}
</script>

<style lang='scss' scoped>
.seriesbar {
    width: 100%;
    display: flex;
    justify-content: center;
}
</style>

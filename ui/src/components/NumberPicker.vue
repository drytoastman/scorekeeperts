<template>
    <v-row justify="center">
        <v-dialog v-model='opened' max-width="90vw">
            <template v-slot:activator="{ on }">
                <v-btn v-on="on" :disabled="!classcode">Picker</v-btn>
            </template>
            <v-card>
                <v-card-title>
                    Available Numbers For {{classcode}}
                    <v-btn class='close' icon @click="opened = false"><v-icon>{{close}}</v-icon></v-btn>
                </v-card-title>

                <v-card-text v-if="loading" class='loading'>
                    <div>
                        {{loading}}
                    </div>
                </v-card-text>
                <v-card-text v-else class='numbergrid'>
                    <div v-for="num in allnumbers" :key="num" :class="numberClass(num)" @click="$emit('selected', num); opened=false">
                        {{num}}
                    </div>
                </v-card-text>
            </v-card>
        </v-dialog>
    </v-row>
</template>

<script>
import range from 'lodash/range'
import { mapState } from 'vuex'
import { mdiCloseBox } from '@mdi/js'

export default {
    props: {
        classcode: undefined
    },
    data() {
        return {
            close: mdiCloseBox,
            opened: false,
            loading: 'initializing'
        }
    },
    computed: {
        ...mapState(['usednumbers']),
        allnumbers() { return range(1, 1000) }
    },
    methods: {
        numberClass(num) {
            return (this.usednumbers.includes(num)) ? 'taken' : 'avail'
        },
        loadNumbers() {
            if (this.classcode) {
                this.loading = 'Loading numbers'
                this.$store.dispatch('getdata', { items: 'usednumbers', classcode: this.classcode })
            } else {
                this.loading = 'No classcode selected'
            }
        }
    },
    watch: {
        classcode: function() {
            this.loadNumbers()
        },
        usednumbers: function() {
            this.loading = null
        }
    },
    mounted() {
        this.loadNumbers()
    }
}
</script>

<style scoped>
.loading {
    height: 80vh;
    display: grid;
    grid-template-columns: 1fr;
    justify-items: center;
    align-items: center;
    font-size: 150%;
}

.numbergrid {
    display: grid;
    grid-template-columns: repeat(10, 1fr);
    text-align: right;
    height: 80vh;
    overflow: scroll;
    font-size: 100%;
}
.close {
    display: block;
    margin-left: auto;
}
.avail {
    color: blue;
    cursor: pointer;
}
.taken {
    pointer-events: none;
    cursor: not-allowed;
    color: #DDD;
}
</style>

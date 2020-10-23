<template>
<div class='container'>
    <h3>Purge Tool</h3>
    <div>This tool will remove entire groups of cars or drivers, either by class name or most recent activity.</div>


    <h4 class='h4'>Purge Cars by Class</h4>
    <div>
        Remove cars from the selected classes.  Cars with registration or runs in the current series will not be removed

        <div class='inputblock'>
            <v-select solo multiple chips deletable-chips v-model="classpurge" :items="Object.keys(classes)" @change="estimate('class')"></v-select>
            <v-btn color="secondary" :disabled="!estimates.class" @click="purge('class')">Purge {{estimates.class}} Cars By Class</v-btn>
        </div>
    </div>


    <h4 class='h4'>Purge Cars by Year</h4>
    <div>
        Remove cars from the current series that don't have any registration or runs in this series or any runs in other series
        (carried forward to this series when it was created) back to and including:

        <div class='inputblock'>
            <v-select solo v-model="yearpurge" :items="years" @change="estimate('year')"></v-select>
            <v-btn color="secondary" :disabled="!estimates.year" @click="purge('year')">Purge {{estimates.year}} Cars By Year</v-btn>
        </div>
    </div>


    <h4 class='h4'>Purge Drivers by Year</h4>
    <div v-if="amAdmin">
        Search for and remove drivers without runs in any series back to and including:

        <div class='inputblock'>
            <v-select solo v-model="driverpurge" :items="years" @change="estimate('driver')"></v-select>
            <v-btn color="secondary" :disabled="!estimates.driver" @click="purge('driver')">Purge {{estimates.driver}} Drivers By Year</v-btn>
        </div>
    </div>

    <div v-else>
        <div>
            To run the purge driver tool you must get full admin auth.
            <LoginForm :admin=true class='loginform'></LoginForm>
        </div>
    </div>
</div>
</template>

<script>
import range from 'lodash/range'
import Vue from 'vue'
import { mapState } from 'vuex'
import LoginForm from '../components/LoginForm.vue'

export default {
    name: 'Purge',
    components: { LoginForm },
    data() {
        return {
            classpurge: [],
            yearpurge: '',
            driverpurge: '',
            estimateid: 0,
            estimates: {},
            infos: []
        }
    },
    computed: {
        ...mapState(['authtype', 'adminAuthenticated', 'classes', 'errors']),
        years() { return range(new Date().getFullYear(), 2018 - 1) },  // 2018 was the first year with UUID ids
        amAdmin() { return this.authtype === 'admin' && this.adminAuthenticated }
    },
    methods: {
        purge(type)    { return this.docall(type, false) },
        estimate(type) { return this.docall(type, true)  },
        docall(type, estimate = false) {
            const param = {
                request: 'purge',
                type: type
            }
            if (estimate) {
                this.estimates   = {}
                this.estimateid += 1
                param.estimateid = this.estimateid
            }

            switch (type) {
                case 'class':
                    param.arg = this.classpurge
                    this.yearpurge = ''
                    this.driverpurge = ''
                    break
                case 'year':
                    param.arg = this.yearpurge
                    this.classpurge = []
                    this.driverpurge = ''
                    break
                case 'driver':
                    param.arg = this.driverpurge
                    this.classpurge = []
                    this.yearpurge = ''
                    break
            }

            this.$store.dispatch('seriesadmin', param).then(data => {
                if (!data) return
                if (estimate) {
                    if (data.estimateid !== this.estimateid) {
                        console.log(`ignore old estimateid old=${data.estimateid} cur=${this.estimateid}`)
                        return
                    }
                    Vue.set(this.estimates, type, data.count)
                } else {
                    if (type === 'driver' && data.drivers) this.$store.commit('addInfos', [`deleted ${data.drivers.length} drivers`])
                    if (data.cars) this.$store.commit('addInfos', [`deleted ${data.cars.length} cars`])
                    this.estimates = {}
                }
            })
        }
    },
    mounted() {
        this.$store.dispatch('authTest')
    }
}
</script>

<style scoped lang='scss'>
.h4 {
    margin-top: 1.5rem;
    margin-bottom: 0.3rem;
}
.loginform {
    margin: 1rem 1rem 0 2rem;
    @media (max-width: 650px) {
        margin-left: 1rem;
    }
}
.inputblock {
    display: grid;
    margin: 1rem;
    max-width: 40rem;
    grid-template-columns: 1fr 1fr;
    column-gap: 2rem;
    @media (max-width: 700px) {
        grid-template-columns: 1fr;
    }
}
</style>

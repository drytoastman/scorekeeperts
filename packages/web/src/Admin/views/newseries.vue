<template>
    <div class='inset'>
        <h3>Create New Series</h3>
        <div v-if='ismain'>
            <div class='desc'>
                Create a new series, copying information from the current
            </div>
            <div class='controls'>
                <v-form lazy-validation ref="form">
                    <v-text-field v-model="name"     label="Series Name" :rules="rules.name" validate-on-blur></v-text-field>
                    <v-text-field v-model="password" label="Password"    :rules="rules.password" validate-on-blur></v-text-field>
                    <v-checkbox   v-model="options.settings" label="Copy Settings"></v-checkbox>
                    <v-checkbox   v-model="options.classes"  label="Copy Classes/Indexes" @change="classeschange"></v-checkbox>
                    <v-checkbox   v-model="options.accounts" label="Copy Payment Accounts"></v-checkbox>
                    <v-checkbox   v-model="options.cars"     label="Copy Cars" @change="carschange"></v-checkbox>
                    <v-btn color="secondary" @click="create">Create</v-btn>
                </v-form>
            </div>
        </div>
        <div v-else class='myerror'>
            This is only intended for use on the main server
        </div>
    </div>
</template>

<script>
import { SeriesValidator } from 'sctypes/series'

export default {
    name: 'CreateSeries',
    data() {
        return {
            value: '',
            rules: {
                name:     SeriesValidator.name,
                password: SeriesValidator.password
            },
            name: '',
            password: '',
            options: {
                settings: true,
                classes: true,
                accounts: true,
                cars: false
            }
        }
    },
    computed: {
        ismain() { return this.$store.state.ismainserver }
    },
    methods: {
        carschange()    { if (this.cars)     { this.classes = true } },
        classeschange() { if (!this.classes) { this.cars = false } },
        create() {
            if (this.$refs.form.validate()) {
                this.$store.dispatch('seriesadmin', {
                    request: 'createseries',
                    name: this.name,
                    password: this.password,
                    options: this.options
                }).then(data => {
                    if (data) {
                        console.log('done')
                        this.$store.commit('changeSeries', this.name)
                        this.$router.push({ name: 'summary', params: { series: this.name }})
                    }
                })
            }
        }
    }
}
</script>

<style scoped lang='scss'>
.desc {
    margin-left: 1rem;
}
.myerror {
    font-style: italic;
    color: red;
}
.controls {
    margin-top: 1rem;
    margin-left: 0.5rem;
    .v-input--checkbox {
        margin-top: 0;
    }
    .v-btn {
        min-width: 15rem;
    }
}
</style>

<template>
    <div class='driverbox'>
        <div class='smallbuttons'>
            <v-btn color=secondary outlined small @click="$emit('buttons', 'editdriver', '', driver.driverid, '')">Edit</v-btn>
            <v-btn color=secondary outlined small @click="$emit('buttons', 'deldriver',  '', driver.driverid, '')" :disabled="driveruse">Delete</v-btn>
            <v-btn color=secondary outlined small @click="confirmMergeDialog=true"                                 :disabled="selectedCount<=1">Merge Into This</v-btn>
            <v-btn color=secondary outlined small @click="$emit('buttons', 'reset',      '', driver.driverid, '')" :disabled="!driver.email">Password Reset</v-btn>
        </div>
        <Driver :driver=driver class='driverinfo'></Driver>
        <div class='createbox'>
            <v-btn color="secondary" outlined small :disabled="!newcarseries" @click="$emit('buttons', 'newcar', newcarseries, driver.driverid, '')">Create A Car In</v-btn>
            <v-select dense hide-details solo light :items="serieslist" v-model="newcarseries"></v-select>
        </div>
        <div class='serieswrapper' v-for="(cars, series) in seriescars" :key="series">
            <div class='series'>{{series}}</div>
            <div class='carbox' v-for="car in cars" :key="car.carid">
                <CarLabel :car=car>
                    <span class='carid'>{{car.carid}}</span>
                </CarLabel>
                <div class='smallbuttons'>
                    <template v-if="car.eventsrun || car.eventsreg">
                        <v-btn color=secondary outlined small @click="$emit('buttons', 'editcar', series, driver.driverid, car.carid)">Edit <span class='use'>*In Use</span></v-btn>
                    </template>
                    <template v-else>
                        <v-btn color=secondary outlined small @click="$emit('buttons', 'editcar', series, driver.driverid, car.carid)">Edit</v-btn>
                        <v-btn color=secondary outlined small @click="$emit('buttons', 'delcar',  series, driver.driverid, car.carid)">Delete</v-btn>
                    </template>
                </div>
            </div>
        </div>
        <ConfirmDialog v-model=confirmMergeDialog title="Confirm Merge" @ok='confirmMerge'>
            Are you sure you wish to merge the other selected drivers cars into <b>{{driver.firstname}} {{driver.lastname}}</b> <i>{{driver.email}}</i>
        </ConfirmDialog>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import Driver from '../../components/Driver'
import CarLabel from '../../components/CarLabel'
import ConfirmDialog from '../../components/ConfirmDialog'

export default {
    name: 'DriverEditorDisplay',
    components: {
        Driver,
        CarLabel,
        ConfirmDialog
    },
    props: {
        driver: Object,
        selectedCount: Number
    },
    data() {
        return {
            newcarseries: '',
            confirmMergeDialog: false
        }
    },
    computed: {
        ...mapState(['serieslist', 'cars']),
        drivercars() {
            return Object.values(this.cars).filter(c => c.driverid === this.driver.driverid)
        },
        seriescars() {
            const ret = {}
            for (const c of this.drivercars) {
                if (!(c.series in ret)) ret[c.series] = []
                ret[c.series].push(c)
            }
            return ret
        },
        driveruse() {
            return this.drivercars.filter(c => c.eventsrun || c.eventsreg).length > 0
        }
    },
    methods: {
        confirmMerge() {
            this.$emit('buttons', 'merge', '', this.driver.driverid, '')
        }
    }
}
</script>

<style lang="scss" scoped>
.driverbox {
    .use {
        margin-left: 5px;
        margin-bottom: 5px;
        font-size: 80%;
        color: orange;
    }
    border-bottom: 3px double #464;
    margin-bottom: 1rem;
    .buttons {
        display: grid;
        grid-template-columns: repeat(4, auto);
        column-gap: 5px;
    }
    .smallbuttons {
        display: flex;
        column-gap: 5px;
        row-gap: 5px;
        flex-wrap: wrap;
        .v-btn {
            height: 22px;
        }
    }
    .driverinfo {
        font-size: 90%;
    }
    .createbox {
        display: grid;
        grid-template-columns: auto 10rem;
        align-items: center;
        column-gap: 1rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
    }
    .serieswrapper {
        width: 95%;
        margin-left: auto;
        margin-right: auto;
        margin-top: 1rem;
        border-top: 1px solid lightgrey;
    }
    .series {
        font-weight: bold;
        font-size: 110%;
        color: #859985;
    }
    .carbox {
        margin-left: 1rem;
        margin-bottom: 0.5rem;
        column-gap: 1rem;
        display: grid;
        grid-template-columns: auto 10rem;
        align-items: center;
        .carid {
            font-size: 70%;
            color: grey;
        }
    }
    @media (max-width: 800px) {
        .carbox {
            display: block;
        }
    }
}
::v-deep {
    .driverid {
        white-space: nowrap;
    }
    .barcodescca, .csz {
        padding-bottom: 0;
        margin-bottom: 0;
        border-bottom: none;
    }
    .v-text-field.v-text-field--solo.v-input--dense > .v-input__control {
        min-height: 30px;
    }
}
</style>

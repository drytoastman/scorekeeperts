<template>
    <div class='driverbox'>
        <div class='smallbuttons'>
            <v-btn color=secondary outlined small>Edit</v-btn>
            <v-btn color=secondary outlined small :disabled="driveruse">Delete</v-btn>
            <v-btn color=secondary outlined small>Merge Into This</v-btn>
            <v-btn color=secondary outlined small :disabled="!driver.email">Password Reset</v-btn>
        </div>
        <Driver :driver=driver class='driverinfo'></Driver>
        <div class='serieswrapper' v-for="(cars, series) in seriescars" :key="series">
            <div class='series'>{{series}}</div>
            <div class='carbox' v-for="car in cars" :key="car.carid">
                <CarLabel :car=car>
                    <span class='carid'>{{car.carid}}</span>
                </CarLabel>
                <div class='smallbuttons'>
                    <template v-if="car.eventsrun || car.eventsreg">
                        <v-btn color=secondary outlined small>Edit <span class='use'>*In Use</span></v-btn>
                    </template>
                    <template v-else>
                        <v-btn color=secondary outlined small>Edit</v-btn>
                        <v-btn color=secondary outlined small>Delete</v-btn>
                    </template>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'
import Driver from '../../components/Driver'
import CarLabel from '../../components/CarLabel'

export default {
    name: 'DriverEditor',
    components: {
        Driver,
        CarLabel
    },
    props: {
        driver: Object
    },
    computed: {
        ...mapState(['cars']),
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
}
</style>

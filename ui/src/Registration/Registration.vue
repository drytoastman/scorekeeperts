<template>
    <v-app fluid>
        <v-app-bar v-if="auth.driver" app height=45 extension-height=35 dark color="primary">
            <SeriesBar title="Register"></SeriesBar>
            <template v-slot:extension>
                <v-btn color=white text small exact :class="mProfileClass" :to="{name:'profile', params:{}}">Profile<span class='super'>All</span></v-btn>
                <v-btn color=white text small exact :class="mCarsClass"    :to="{name:'cars',    params:{series:currentSeries}}" :disabled="!currentSeries">Cars</v-btn>
                <v-btn color=white text small exact :class="mEventsClass"  :to="{name:'events',  params:{series:currentSeries}}" :disabled="!currentSeries">Events</v-btn>
                <v-btn color=white text small @click='logout'>Logout</v-btn>
                <v-progress-linear :active="!!gettingData" indeterminate absolute bottom color="green accent-4"></v-progress-linear>
                <CartFAB class='righthang'></CartFAB>
                <HelpMenu btnclass='help'></HelpMenu>
            </template>

        </v-app-bar>

        <v-main>
            <router-view v-if="$route.name && (auth.driver || isOutside)" />
            <div v-else class='pushdown'>
                <Login v-if="authinitial && !auth.driver"></Login>
                <div v-else class='main-page-warning'>
                    <div v-if="!authinitial">Scorekeeper connecting ...</div>
                    <div v-else>Unknown Page</div>
                </div>
            </div>
        </v-main>

        <SnackBar></SnackBar>
    </v-app>
</template>

<script>
import { mapState } from 'vuex'
import Login from './views/login.vue'
import CartFAB from './components/cart/CartFAB.vue'
import SnackBar from '@/components/SnackBar.vue'
import HelpMenu from './components/HelpMenu.vue'
import SeriesBar from '@/components/SeriesBar.vue'

export default {
    name: 'Registration',
    components: {
        Login,
        CartFAB,
        SnackBar,
        HelpMenu,
        SeriesBar
    },
    methods: {
        logout: function() {
            this.$store.dispatch('logout')
        }
    },
    computed: {
        ...mapState(['currentSeries', 'auth', 'authinitial', 'gettingData', 'flashProfile', 'flashCars', 'flashEvents']),
        isOutside() { return this.$route.meta.outside === 1 },
        mProfileClass() { return this.flashProfile ? 'flashit' : '' },
        mCarsClass()    { return this.flashCars ?    'flashit' : '' },
        mEventsClass()  { return this.flashEvents ?  'flashit' : '' }
    }
}
</script>

<style scoped>
.main-page-warning {
    font-size: 150%;
    text-align: center;
}
::v-deep .help {
    position: fixed;
    right: 1rem;
}
.righthang {
    position: absolute;
    top: calc(100% - 1px);
    right: 0;
}
.pushdown {
    margin-top: calc(15vh);
}
.super {
    text-transform: initial;
    font-size: 80%;
    margin-left: 3px;
    margin-bottom: 10px;
}
</style>

<style lang='scss'>
.paidinfo {
    color: green;
    font-size: 80%;
}

.selectblanknote {
    text-align: center;
    width: 100%;
    font-style: italic;
    font-size: 80%;
    opacity: 0.5;
}

@keyframes flashred {
    0%   {background-color:red; }
    50%  {background-color: initial; }
    100% {background-color:red; left:0px; top:0px;}
  }

.flashit {
    animation-name: flashred;
    animation-duration: 1s;
    animation-iteration-count: infinite;
}

@import '@/styles/general.scss';
</style>

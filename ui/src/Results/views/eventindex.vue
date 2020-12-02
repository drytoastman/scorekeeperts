<template>
    <div class='mainwrap'>
        <div class='etitle'>
            <span class='name'>{{event.name}}</span>
            <span class='date'>{{event.date|dmdy}}</span>
        </div>
        <div class='list'>
            <div class='stitle'>Results</div>
            <router-link :to="{name: 'post'}">Event Results</router-link>
            <!-- PAX Dist, Net Dist, does anyone care -->
            <template v-if='!hassession'>
                <router-link :to="{name: 'champ'}">Championship</router-link>
            </template>
            <template v-if="active && !ismainserver">
                <template v-if="event.ispro">
                    <router-link :to="{name: 'propanel'}">Announcer Panel</router-link>
                </template>
                <template v-else>
                    <router-link :to="{name: 'announcer'}">Announcer Panel</router-link>
                    <router-link :to="{name: 'user'}">Live User Panel</router-link>
                </template>
            </template>
        </div>

        <div class='list'>
            <div class='stitle'>Top Times Lists</div>
            <template v-if="event.ispro">
                <router-link :to="{name: 'toptimes', query: { indexed: 0 }}">Unindexed</router-link>
                <router-link :to="{name: 'toptimes', query: { indexed: 1 }}">Indexed</router-link>
            </template>
            <template v-if="!hassession">
                <router-link :to="{name: 'toptimes', query: { counted: 1 }}">Counted Runs</router-link>
                <router-link :to="{name: 'toptimes', query: { counted: 0 }}">All Runs</router-link>
            </template>
            <template v-if="hassession">
                <router-link :to="{name: 'toptimes', query: { counted: 0, indexed:0 }}">All Runs</router-link>
            </template>
            <template v-if="event.segments > 0">
                Need to implement segments stuff
            </template>
        </div>

        <div class='list' v-if="event.ispro">
            <div class='stitle'>ProSolo</div>
            <template v-if="active">
                <router-link :to="{name: 'grid'}">Grid</router-link>
            </template>
            <router-link :to="{name: 'dialins'}">Dialins</router-link>
            <router-link v-for="c in challenges" :key="c.challengeid" :to="{name: 'bracket', params: { challengeid: c.challengeid }}">{{c.name}}</router-link>
        </div>

        <div class='classwrap'>
            <div class='stitle'>By RunGroup <template v-if="!hassession">Or Active Class</template></div>
            <div class='bothgroups'>
                <div class='groups'>
                <router-link v-for="ii in groups"  :key="ii" :to="{name: 'bygroup', query: { groups: ii }}">Group {{ii}}</router-link>
                </div>
                <div class='classes'>
                <router-link v-for="cc in resultsClasses" :key="cc" :to="{name: 'byclass', query: { codes: cc }}">{{cc}}</router-link>
                </div>
            </div>
        </div>
    </div>
</template>

<script>
import { mapGetters, mapState } from 'vuex'
import { SeriesStatus } from '@/common/series'
import { hasSessions } from '@/common/event'

export default {
    name: 'EventIndex',
    props: {
        eventid: String
    },
    computed: {
        ...mapState(['seriesinfo', 'ismainserver']),
        ...mapGetters(['resultsClasses']),
        event() {
            if (!this.seriesinfo.events) return {}
            return this.seriesinfo.events.filter(e => e.eventid === this.eventid)[0]
        },
        challenges() { return this.seriesinfo.challenges.filter(c => c.eventid === this.eventid) },
        hassession() { return this.event ? hasSessions(this.event) : false },
        active() { return this.seriesinfo.status === SeriesStatus.ACTIVE },
        groups() { return [1, 2, 3, 4] }
    }
}
</script>

<style lang="scss" scoped>
.mainwrap {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    row-gap: 1rem;
}
.etitle {
    grid-column: 1/span 3;
    color: var(--headerColor);
    .name {
        font-size: 140%;
        font-weight: bold;
        margin-right: 1rem;
    }
    .date {
        font-size: 120%;
    }
}
.stitle {
    color: var(--headerColor);
    font-size: 120%;
}
.list {
    display: flex;
    flex-direction: column;
}
.classwrap {
    grid-column: 1 / span 3;
}
.bothgroups {
    display: flex;
    column-gap: 7rem;
}
.groups {
    display: flex;
    flex-direction: column;
}
.classes {
    flex: 1;
    columns: auto 7rem;
    a {
        display: block;
        white-space: nowrap;
    }
}
</style>

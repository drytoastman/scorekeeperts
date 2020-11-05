<template>
    <table class='res'>
        <tbody>
            <tr class='head'>
                <th :colspan="colspan">Event - {{cls.classcode}}</th>
            </tr>
            <tr class='subhead'>
                <th>#</th>
                <th>Name</th>
                <th v-if="!noindexcol">Idx</th>
                <th>Net</th>
                <th :colspan="nodiff1col ? 1 : 2">Need {{nodiff1col ? '' : '(Raw)'}}</th>
            </tr>
            <tr v-for="e of cls.order" :key="e.carid" :class="rowclass(e)">
                <td>{{e.position}}</td>
                <td class='name'>{{e.firstname}} {{e.lastname}}</td>
                <td v-if="!noindexcol" class='index'>{{e.indexstr}}}</td>
                <td>{{e.net|t3}}</td>
                <td class='diffn'>{{e.diffn|t3}}</td>
                <td v-if="!nodiff1col" class='diff1'>{{e.diff1|t3}}}</td>
            </tr>
        </tbody>
    </table>
</template>

<script>
import { rowclass } from './util'

export default {
    name: 'ClassTable',
    props: {
        cls: Object,
        noindexcol: Boolean,
        nodiff1col: Boolean
    },
    data() {
        return {
            colspan: 6,
            rowclass
        }
    }
}
</script>

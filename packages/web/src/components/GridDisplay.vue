<template>
    <div v-if="table.length > 0">
        <div class='grouphead'>Group {{grid}}</div>
        <table class='griddisplay'>
            <template v-for="(row,rowidx) of table">
                <tr :key="rowidx">
                    <template v-for="(e,idx) of row">
                        <th class='grid' :key="idx">{{(rowidx*2)+idx+1}}</th>
                        <td class='code' :key="idx+1000">{{e.car ? e.car.classcode : ''}}</td>
                        <td class='num'  :key="idx+2000">{{e.car ? e.car.number : ''}}</td>
                        <td class='net'  :key="idx+4000" v-if="shownet">{{e.net|t3}}</td>
                        <td class='name' :key="idx+3000">
                            <span v-if="e.driver">{{e.driver.firstname}} {{e.driver.lastname}}</span>
                            <span class='entryerror'>{{e.error}}</span>
                        </td>
                    </template>
                </tr>
            </template>
        </table>
    </div>
</template>

<script>
export default {
    name: 'GridDisplay',
    props: {
        table: Array,
        grid: Number,
        shownet: Boolean
    },
    data() {
        return {
        }
    },
    computed: {
    }
}
</script>

<style scoped lang="scss">
table {
    border-collapse: collapse;
    width: 100%;
}
th, td {
    border: 1px solid rgb(210,210,210);
    padding: 2px 6px;
    font-size: 90%;
}
th {
    background: #eee;
}
.grid { width: 3rem; }
.code { width: 3rem; }
.num  { width: 3rem; }
.net  { width: 4rem; }
.name { min-width: 9rem; }
.grouphead {
    font-size: 120%;
    font-weight: bold;
    text-align: center;
}
.entryerror {
    margin-left: 1rem;
    color: red;
}
</style>

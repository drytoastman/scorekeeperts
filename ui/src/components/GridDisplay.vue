<template>
    <div v-if="table.length > 0">
        <div class='grouphead'>Group {{grid}}</div>
        <table>
            <template v-for="(row,rowidx) of table">
                <tr :key="rowidx">
                    <template v-for="(e,idx) of row">
                        <th :key="idx">{{(rowidx*2)+idx+1}}</th>
                        <td :key="idx+1000">{{e.car ? e.car.classcode : ''}}</td>
                        <td :key="idx+2000">{{e.car ? e.car.number : ''}}</td>
                        <td :key="idx+3000"><span v-if="e.driver">{{e.driver.firstname}} {{e.driver.lastname}}</span></td>
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
        grid: Number
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
th {
    background: lightgray;
}
th, td {
    border: 1px solid rgb(210,210,210);
    padding: 0.2rem;
    font-size: 90%;
}
.grouphead {
    font-size: 120%;
    font-weight: bold;
    text-align: center;
}
</style>

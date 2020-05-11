<template>
    <div class='carlabel' :style="{'font-size': this.fontsize}">
        <div class='head'>
            <span class='code'>{{car.classcode}}</span>
            <span class='number'>#{{car.number}}</span>
            <span class='index'>{{indexstr}}</span>
        </div>
        <div class='descrip'>
            {{car.attr.year}} {{car.attr.make}} {{car.attr.model}} {{car.attr.color}}
        </div>
    </div>
</template>

<script>
export default {
    props: {
        car: {
            type: Object,
            default: () => ({ attr: {} })
        },
        fontsize: {
            type: String,
            default: '100%'
        }
    },
    computed: {
        indexstr() { return (this.car.indexcode !== '') ? `(${this.car.indexcode})` : '' },
        stylevars() { return { 'font-size': this.fontsize } }
    }
}
</script>

<style scoped>
    .carlabel {
        font-weight: normal;
        line-height: 20px;
        text-align: left;
        white-space: nowrap;
    }
    .code, .number, .index {
        vertical-align: middle;
        font-weight: 500;
    }
    .code {
        font-size: 120%;
        color: #095675;
        margin-right: 4px;
    }
    .number {
        font-size: 100%;
        margin-right: 6px;
    }
    .index {
        font-size: 80%;
        color: grey;
    }
    .descrip {
        color: gray;
        font-size: 70%;
    }
</style>

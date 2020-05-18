<template>
    <div v-if="car.carid" class='carlabel' :style="{'font-size': this.fontsize}">
        <div class='number'  :style="{'display': this.display}">#{{car.number}}</div>
        <div class='descrip' :style="{'display': this.display}">{{car.attr.year}} {{car.attr.make}} {{car.attr.model}} {{car.attr.color}}</div>
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
        },
        display: {
            type: String,
            default: 'inline-block'
        }
    }
}
</script>

<style scoped>
    .number, .descrip {
        white-space: nowrap;
    }
    .number {
        vertical-align: middle;
        text-align: right;
        font-weight: 500;
        width: 2.7rem;
        margin-right: 0.4rem;
        color: black;
    }
    .descrip {
        color: #446;
        font-size: 90%;
    }
</style>

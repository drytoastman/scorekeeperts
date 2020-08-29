<template>
    <div v-if="car.carid" class='carlabel' :style="{'font-size': this.fontsize}">
        <div class='descrip' :style="{'display': this.display}">{{car.attr.year}} {{car.attr.make}} {{car.attr.model}} {{car.attr.color}} #{{car.number}}</div>
    </div>
</template>

<script>
export default {
    props: {
        car: {
            type: Object,
            default: () => ({ attr: {}})
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
    .descrip {
        white-space: nowrap;
        color: var(--v-secondary-darken1);
        font-size: 90%;
    }
</style>

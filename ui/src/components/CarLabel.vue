<template>
    <div class='carlabel' :style="{'font-size': this.fontsize}" v-if="car.carid">
        <div class='head' v-if="session">
            <span class='primaryitem'>#{{car.number}}</span>
            <span class='unusedinfo'>{{car.classcode}} {{indexstr}}</span>
        </div>
        <div v-else>
            <span class='primaryitem'>{{car.classcode}}</span>
            <span class='secondaryitem'>#{{car.number}}</span>
            <span class='normalitem'>{{indexstr}}</span>
        </div>
        <div class='normalitem'>
            {{car.attr.year}} {{car.attr.make}} {{car.attr.model}} {{car.attr.color}}
        </div>
        <slot></slot>
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
        session: {
            type: Boolean,
            default: false
        }
    },
    computed: {
        indexstr() { return (this.car.indexcode !== '') ? `(${this.car.indexcode})` : '' }
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
    span {
        vertical-align: middle;
    }
    .primaryitem {
        font-size: 100%;
        margin-right: 6px;
        font-size: 120%;
        color: var(--v-secondary-darken1);
        font-weight: 500;
        vertical-align: middle;
    }
    .secondaryitem {
        margin-right: 4px;
    }
    .normalitem {
        color: var(--v-primary-base);
        font-size: 90%;
    }
    .unusedinfo {
        font-style: italic;
        font-size: 85%;
        color: rgb(0,0,0,0.35);
        margin-left: 1rem;
    }
</style>

<template>
    <div class='paymentlabel' :style="{'font-size': this.fontsize}">
        <span v-if="!payment">
        </span>
        <span v-else-if="payment.refunded">
            <div class='refund'>Refunded
                <span class='head'>{{payment.amount | cents2dollars}}</span>
            </div>
            <div class='extra'>{{payment.itemname}}</div>
        </span>
        <span v-else>
            <div class='head'>{{payment.amount | cents2dollars}}</div>
            <div class='extra'>{{payment.itemname}}</div>
            <div class='txid'>{{payment.txid ? payment.txid : 'onsite'}}</div>
        </span>
    </div>
</template>

<script>
export default {
    props: {
        payment: {
            type: Object
        },
        fontsize: {
            type: String,
            default: '100%'
        }
    }
}
</script>

<style scoped>
    .paymentlabel {
        font-weight: normal;
        line-height: 20px;
        text-align: left;
        white-space: nowrap;
    }
    .head   { color: green; }
    .refund { color: blue; }
    .extra  {
        color: #333;
        font-size: 90%;
    }
    .txid   {
        color: #777;
        font-size: 80%;
    }
</style>

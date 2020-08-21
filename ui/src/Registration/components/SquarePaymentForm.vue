<template>
    <div>
        <div v-if="!account.attr.applicationid" class='errors'>
            No Square Application Id was found!
        </div>
        <div v-else class='sq-grid'>
            <div id="sq-card-number"     class="sq-input"></div>
            <div id="sq-expiration-date" class="sq-input"></div>
            <div id="sq-cvv"             class="sq-input"></div>
            <div id="sq-postal-code"     class="sq-input"></div>
            <v-btn id="sq-creditcard" :disabled="total<=0" @click.prevent="squareform.requestCardNonce()" color="secondary">
                <img class='buttonicon' :src="squareicon"/>
            </v-btn>
        </div>
        <div v-if="errors.length > 0" class='errors'>
            <div v-for="error in errors" :key="error">{{error}}</div>
        </div>
    </div>
</template>

<script>
import squaresvg from '../../images/square.svg'
import { PaymentAccount } from '@/common/payments'

export default {
    props: {
        opened: Boolean,
        account: PaymentAccount, // doesn't do anything without lang=ts but that has issues now as well
        payments: Array,
        total: Number
    },
    data() {
        return {
            squareForm: null,
            squareicon: squaresvg,
            errors: []
        }
    },
    computed: {
        squareURL() {
            const infix = this.account.attr.mode === 'sandbox' ? 'sandbox' : ''
            return `https://js.squareup${infix}.com/v2/paymentform`
        }
    },
    methods: {
        createSquareForm() {
            return new SqPaymentForm({
                applicationId: this.account.attr.applicationid,
                inputClass: 'sq-input',
                autoBuild: false,
                inputStyles: [{
                    fontSize: '14px',
                    lineHeight: '20px',
                    padding: '10px',
                    placeholderColor: '#a0a0a0'
                }],
                cardNumber: {
                    elementId: 'sq-card-number',
                    placeholder: 'Card Number'
                },
                cvv: {
                    elementId: 'sq-cvv',
                    placeholder: 'CVV'
                },
                expirationDate: {
                    elementId: 'sq-expiration-date',
                    placeholder: 'MM/YY'
                },
                postalCode: {
                    elementId: 'sq-postal-code',
                    placeholder: 'Postal'
                },
                callbacks: {
                    cardNonceResponseReceived: this.cardNonceResponseReceived
                }
            })
        },

        cardNonceResponseReceived(errors, nonce) {
            if (errors) {
                this.errors = errors.map(e => e.message)
                return
            }
            this.$store.dispatch('setdata', {
                type: 'insert',
                square: { nonce: nonce, accountid: this.account.accountid },
                items: { payments: this.payments },
                busy: { key: 'busyPay', ids: this.payments.map(p => p.eventid) }
            })
            this.$emit('complete')
        },

        async loadSquare() {
            if (this.account.attr.applicationid) {
                await this.$loadScript(this.squareURL)
                this.squareform = this.createSquareForm()
                this.squareform.build()
            }
        },

        async unloadSquare() {
            this.errors = []
            if (this.account.attr.applicationid) {
                this.squareform.destroy()
                await this.$unloadScript(this.squareURL)
            }
        }
    },
    watch: {
        opened: async function(newv) {
            if (newv) {
                this.loadSquare()
            } else {
                this.unloadSquare()
            }
        }
    },
    mounted() {
        this.loadSquare()
    }
}
</script>

<style>
.sq-grid {
    display: grid;
    align-items: center;
    grid-template-columns: 1fr 1fr 1fr;
    row-gap: 0.5rem;
    column-gap: 0.5rem;
}
#sq-card-number {
    grid-column: 1 / span 3;
}
#sq-creditcard {
    grid-column: 1 / span 3;
    grid-row: 3;
}
.sq-input {
    border: 1px solid #E0E2E3;
    background-color: white;
    border-radius: 6px;
}

.buttonicon {
    filter: brightness(0) invert(100);
}
.errors {
    color: red;
    padding: 0.5rem;
}
</style>

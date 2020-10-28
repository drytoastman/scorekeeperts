<template>
    <div style='width: 100%'>
        <div v-if="!account.attr.applicationid" class='errors'>
            No Square Application Id was found!
        </div>
        <div v-else>
            <div v-if="!formloaded">
                <div class='loading'>
                    Loading square payment form.
                </div>
                <div v-if="timeout" class='errors'>
                    If this persists, check any privacy settings/extensions.
                </div>
            </div>
            <div class='sq-grid'>
                <div id="sq-card-number"     class="sq-input"></div>
                <div id="sq-expiration-date" class="sq-input"></div>
                <div id="sq-cvv"             class="sq-input"></div>
                <div id="sq-postal-code"     class="sq-input"></div>
                <v-btn id="sq-creditcard" :disabled="total<=0" @click.prevent="squareform.requestCardNonce()" color="secondary">
                    <img class='buttonicon' :src="squareicon"/>
                </v-btn>
            </div>
        </div>
        <div v-if="errors.length > 0" class='errors'>
            <div v-for="error in errors" :key="error">{{error}}</div>
        </div>
    </div>
</template>

<script>
import squaresvg from '@/images/square.svg'

export default {
    props: {
        opened: Boolean,
        account: Object, // PaymentAccount doesn't do anything without lang=ts but that has issues now as well
        payments: Array,
        total: Number
    },
    data() {
        return {
            squareForm: null,
            squareicon: squaresvg,
            formloaded: false,
            timeout: false,
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
                    cardNonceResponseReceived: this.cardNonceResponseReceived,
                    paymentFormLoaded: this.paymentFormLoaded
                }
            })
        },

        paymentFormLoaded() {
            console.log('loaded')
            this.formloaded = true
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
                try {
                    this.timeout = false
                    this.formloaded = false
                    setTimeout(() => { this.timeout = true }, 4000)
                    await this.$loadScript(this.squareURL)
                    this.squareform = this.createSquareForm()
                    this.squareform.build()
                } catch (error) {
                    this.$store.commit('addErrors', [`Failed to load ${this.squareURL}, check any privacy extensions`])
                    console.log('square form load failure:')
                    console.log(error)
                }
            }
        },

        async unloadSquare() {
            if (this.squareform) {
                this.squareform.destroy()
            }
            this.errors = []
            await this.$unloadScript(this.squareURL)
        }
    },
    watch: {
        opened(newv) {
            if (newv) this.loadSquare() // second and further open
            else this.unloadSquare() // any close
        }
    },
    mounted() {
        this.loadSquare() // first open
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
.loading {
    font-size: 90%;
    color: grey;
    text-align: center;
}
.errors {
    color: red;
    text-align: center;
}
</style>

<template>
    <div class='sq-grid'>
        <div id="sq-card-number"     class="sq-input"></div>
        <div id="sq-expiration-date" class="sq-input"></div>
        <div id="sq-cvv"             class="sq-input"></div>
        <div id="sq-postal-code"     class="sq-input"></div>
        <v-btn id="sq-creditcard" :disabled="total<=0" @click.prevent="squareform.requestCardNonce()" color="secondary">
            <img class='buttonicon' :src="squareicon"/>
        </v-btn>
    </div>
</template>

<script>
import squaresvg from '../../images/square.svg'

export default {
    props: {
        total: Number,
        opened: Boolean,
        account: Object
    },
    data() {
        return {
            squareForm: null,
            squareicon: squaresvg
        }
    },
    computed: {
        squareURL() {
            const infix = this.account.attr.environment === 'sandbox' ? 'sandbox' : ''
            return `https://js.squareup${infix}.com/v2/paymentform`
        }
    },
    methods: {
        createSquareForm() {
            // eslint-disable-next-line no-undef
            return new SqPaymentForm({
                // TODO: Replace with your sandbox application ID
                applicationId: 'sandbox-sq0idb-vYf0K0lc1oj2gKh5g5d7Lg',
                inputClass: 'sq-input',
                autoBuild: false,
                // Customize the CSS for SqPaymentForm iframe elements
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
                    cardNonceResponseReceived: function(errors, nonce) {
                        if (errors) {
                            // Log errors from nonce generation to the browser developer console.
                            console.error('Encountered errors:')
                            errors.forEach(function(error) {
                                console.error('  ' + error.message)
                            })
                            alert('Encountered errors, check browser developer console for more details')
                            return
                        }
                        alert(`The generated nonce is:\n${nonce}`)
                    }
                }
            })
        },

        async loadSquare() {
            await this.$loadScript(this.squareURL)
            this.squareform = this.createSquareForm()
            this.squareform.build()
        },

        async unloadSquare() {
            this.squareform.destroy()
            await this.$unloadScript(this.squareURL)
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
</style>

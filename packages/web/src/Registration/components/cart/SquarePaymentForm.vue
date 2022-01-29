<template>
    <div style='width: 100%'>
        <div v-if="!applicationid" class='errors'>
            No Square Application Id was found!
        </div>
        <div v-else>
            <div v-show="!formloaded">
                <div class='loading'>
                    Loading square payment form.
                </div>
                <div v-if="timeout" class='errors'>
                    If this persists, check any privacy settings/extensions.
                </div>
            </div>
            <div>
                <form id="payment-form">
                    <div id="card-container"></div>
                    <v-btn class='sqpaybutton' :disabled="total<=0" @click.prevent="handlePayClick" color="secondary" v-show="formloaded">
                        Make Payment
                    </v-btn>
                </form>
            </div>
        </div>
        <div v-if="errors.length > 0" class='errors'>
            <div v-for="error in errors" :key="error">{{error}}</div>
        </div>
    </div>
</template>

<script>
export default {
    props: {
        opened: Boolean,
        account: Object, // PaymentAccount doesn't do anything without lang=ts but that has issues now as well
        payments: Array,
        total: Number
    },
    data() {
        return {
            sqpayments: null,
            sqcard: null,
            formloaded: false,
            timeout: false,
            errors: []
        }
    },
    computed: {
        squareURL() {
            if (!this.account.attr) return undefined
            const prefix = this.account.attr.mode === 'sandbox' ? 'sandbox.' : ''
            return `https://${prefix}web.squarecdn.com/v1/square.js`
        },
        applicationid() {
            return this.account.attr?.applicationid
        }
    },
    methods: {
        async handlePayClick() {
            try {
                const result = await this.sqcard.tokenize()
                if (result.status === 'OK') {
                    this.$store.dispatch('setdata', {
                        type: 'insert',
                        square: { nonce: result.token, accountid: this.account.accountid },
                        items: { payments: this.payments },
                        busy: { key: 'busyPay', ids: this.payments.map(p => p.eventid) }
                    })
                    this.$emit('complete')
                } else {
                    this.errors = result.errors.map(e => e.message)
                }
            } catch (e) {
                console.error(e)
            }
        },

        async loadSquare() {
            if (this.applicationid && this.squareURL) {
                try {
                    this.timeout = false
                    this.formloaded = false
                    setTimeout(() => { this.timeout = true }, 4000)
                    if (!window.Square) {
                        await this.$loadScript(this.squareURL)
                    }

                    this.sqpayments = window.Square.payments(this.applicationid, this.account.accountid) // appid, locid
                    this.sqcard = await this.sqpayments.card()
                    await this.sqcard.attach('#card-container')
                    this.formloaded = true

                } catch (error) {
                    this.$store.commit('addErrors', [`Failed to load ${this.squareURL}, check any privacy extensions`])
                    console.log('square form load failure:')
                    console.log(error)
                }
            }
        },

        async unloadSquare() {
            if (this.sqcard) {
                this.sqcard.destroy()
            }
            this.errors = []
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
.sqpaybutton {
    width: 100%;
    font-family: sans-serif;
    font-size: 17px;
    letter-spacing: 1px;
    text-transform: none;
}

.loading {
    font-size: 90%;
    color: grey;
    text-align: center;
}
.errors {
    display: none;
    color: red;
    text-align: center;
}
</style>

<template>
    <div class='outer'>
        <h2>Email Sent</h2>
        <div>
            An email with the following header has been sent with a link to finish your registration/reset.
            If nothing arrives in quick order, check your spam/junk folder.
        </div>

        <div class='grid'>
            <span>From:</span>
            <span class='email'>Admin via Scorekeeper&lt;{{emailresult.sender}}&gt;</span>
            <span>Reply-To:</span>
            <span class='email'>Scorekeeper Admin &lt;{{emailresult.replyto}}&gt;</span>
            <span>To:</span>
            <span class='email'>{{emailresult.firstname}} {{emailresult.lastname}} &lt;{{emailresult.email}}&gt;</span>
        </div>

        <div>
            Return to the <router-link to="/">main page here</router-link>.
        </div>
    </div>
</template>

<script>
import { mapState } from 'vuex'

export default {
    name: 'EmailResult',
    components: {
    },
    computed: {
        ...mapState(['emailresult'])
    }
}
</script>

<style scoped>
.outer {
    padding: 1rem;
    margin: 1rem;
}
.grid  {
    margin-top: 1rem;
    margin-bottom: 1rem;
    display: grid;
    grid-template-columns: 5rem auto;
    column-gap: 1rem;
    row-gap: 0.2rem;
    justify-items: right;
}
.email {
    color: rgb(0, 58, 164);
    justify-self: left;
}
a {
    color: blue;
}
</style>

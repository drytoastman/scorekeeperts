<template>
<div class='inset helpouter'>

    There are four selections in the application bar for the regisration site.

    <ol>
    <li>
        <dl>
        <dt>Series Selection</dt>
        <dd>This is a quick menu selection for switching between the active series for the year</dd>
        </dl>
    </li>

    <li>
        <dl>
        <dt>Profile</dt>
        <dd>This is where you can view and modify the information for your profile that all series on the site will have access to</dd>
        </dl>
        <ul>
        <li>Name is important for all events</li>
        <li>Email is required to reset username/password and to get any event notices from the event staff</li>
        <li>Do Not Contact specifies that any group emails sent from the event staff will not be sent to you</li>
        <li>Barcode is needed for any series that are using barcodes for staging</li>
        <li>Address and contact information are required by some series onsite but not others</li>
        </ul>

        <p>
        If a series requests that you have a barcode set in your profile but you don't have one, you will see a warning at the top of the events page.
        If you already have a barcode on your helmet or vehicle, please go to the <router-link :to="'profile'">Profile</router-link> page,
        edit profile, and enter the barcode value there. If you do not have a barcode yet, one will be provided if necessary at the event and you can
        ignore any warnings at the top.
        </p>
    </li>

    <li>
        <dl>
        <dt>Cars</dt>
        <dd>This is where you create/edit/delete cars that will be used just for the selected series.
            A car contains not only the description but number, class and index information.</dd>
        </dl>
        <ul>
        <li>Numbers in a class have to be unique to a driver for the series, if someone else is already using a number, you will be required to select a different number.</li>
        <li>Classing is based on the local series and how they divide cars based on their performance abilities.</li>
        <li>Index is only needed for classes that group multiple classes of cars into one.  Selecting an index will only be available if required.</li>
        </ul>

        <p v-if="settings.classinglink">
            {{currentSeries}} has provided a document for <a :href="settings.classinglink" target="helptab">classing help</a>
        </p>
    </li>


    <li>
        <dl>
        <dt>Events</dt>
        <dd>This is where you register cars from the above stuff for the upcoming events in the series</dd>
        </dl>
        <ul>
        <li>Clicking on the event name will show/hide the event information</li>
        <li>The top section will show information about the event such as when registration closes, number of entries, etc.</li>
        <li>The bottom section lets you select which cars to registers</li>
        <li>If the event is taking online payments and you have registered a car, additional selections will be available to add items to a cart.
            The cart tab will appear at the top right</li>
        </ul>
    </li>

    </ol>
</div>
</template>

<script>
import { mapState } from 'vuex'

export default {
    computed: {
        ...mapState(['currentSeries', 'settings'])
    }
}
</script>

<style scoped lang='scss'>
.helpouter {
    ul {
        list-style: initial;
        padding-left: 2rem;
        margin-top: 1rem;
        margin-bottom: 1rem;
    }
    ol > li {
        margin-top: 1rem;
        margin-bottom: 2rem;
        font-size: 0.95rem;
    }
    dt {
        font-size: 120%;
    }
    a {
        color: blue;
    }
}
</style>

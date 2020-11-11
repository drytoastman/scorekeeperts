<template>
    <div class='markdown' v-html="mdhtml">
    </div>
</template>

<script>
import axios from 'axios'
import Markdownit from 'markdown-it'

export default {
    name: 'MdPage',
    props: {
        pagename: {
            type: String,
            default: ''
        }
    },
    data() {
        return {
            markdown: new Markdownit({ html: true }),
            pagedata: ''
        }
    },
    computed: {
        mdhtml() {
            return this.markdown.render(this.pagedata)
        }
    },
    methods: {
        downloadPage() {
            if (this.pagename === 'blank') {
                this.pagedata = '### Select pages from above'
                return
            }
            this.pagedata = 'loading ...'
            axios.get(this.pagename + '.md').then(res => {
                if (res.data) {
                    this.pagedata = res.data
                } else {
                    this.pagedata = 'missing data in response'
                }
            }).catch(error => {
                this.pagedata = error.toString()
            })
        }
    },
    watch: { pagename() { this.downloadPage() } },
    mounted() { this.downloadPage() }
}
</script>

import { ScorekeeperProtocolDB } from 'scdb'
import Vue from 'vue'

declare module '*.vue' {
  export default Vue
}

declare global {
  interface Window {
    db: ScorekeeperProtocolDB
  }
}

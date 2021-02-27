export interface Recipient {
    firstname: string
    lastname: string
    email: string
}

export interface Email {
    subject: string
    recipient: Recipient
    html: string
    text: string
}

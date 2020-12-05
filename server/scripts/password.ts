import bcrypt from 'bcryptjs'
console.log(process.argv)
console.log(bcrypt.hashSync(process.argv[2], 12))

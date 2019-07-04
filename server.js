const express = require('express')
const ejs = require('ejs')
const paypalRestSdk = require('paypal-rest-sdk')

const app = express();

app.set('view engine','ejs')

app.get('/',(req,res)=>{
    res.render('index')
})

app.listen(3000,()=>{
    console.log('server has started at  '+'http://localhost:3000')
})

//Node Mon
const express = require('express')
const ejs = require('ejs')
const paypal= require('paypal-rest-sdk')
const config = require('config')

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': config.Paypal.client_id,
    'client_secret': config.Paypal.client_secret
});

const app = express();

app.set('view engine','ejs')

app.get('/',(req,res)=>{
    res.render('index')
})

app.post('/pay',(req,res)=>{
    const create_payment_json = {
        "intent": "sale",
        "payer": {
            "payment_method": "paypal"
        },
        "redirect_urls": {
            "return_url": "http://localhost:3000/success",
            "cancel_url": "http://localhost:3000/cancel"
        },
        "transactions": [{
            "item_list": {
                "items": [{
                    "name": "Mera jutta Mahan",
                    "sku": "001",
                    "price": "25.00",
                    "currency": "USD",
                    "quantity": 1
                }]
            },
            "amount": {
                "currency": "USD",
                "total": "25.00"
            },
            "description": "My shoe for at12 page ."
        }]
    };
    paypal.payment.create(create_payment_json, function (error, payment) {
        if (error) {
            throw error;
        } else {
           for(let i = 0;i< payment.links.length;i++)
           {
               if(payment.links[i].rel === 'approval_url')
               {    res.redirect(payment.links[i].href)
                   console.log(payment.links[i].href)
               }
           }
        }
    });
})

//Success Redirect
app.get('/success',(req,res)=>{
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;

//    Create an execute Object
    const execute_payment_json ={
        "payer_id" : payerId,
        "transactions" : [{
            "amount" :{
                "currency" : "USD",
                "total" : "25.00"
            }
        }]
    }
    paypal.payment.execute(paymentId,execute_payment_json,function (err,payment) {
        if(err) throw err
        else
        {
            console.log("Get Payment Response")
            console.log(JSON.stringify(payment))
            res.send('Success')
        }
    })

})

app.get('/cancel',(req,res)=>{
    res.send('Cancel')
})

app.listen(3000,()=>{
    console.log('server has started at  '+'http://localhost:3000')
})

//Node Mon
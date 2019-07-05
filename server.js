const express = require('express')
const ejs = require('ejs')
const paypal= require('paypal-rest-sdk')
const config = require('./config')
const multer = require('multer')
const path = require('path')

//Set Storing Engine
const storage = multer.diskStorage({
    destination: './public_static/uploads',
    filename :function (req,file,cb) {
        cb(null,file.fieldname + '-' + Date.now()+path.extname(file.originalname))
    }
})

const upload = multer({
    storage : storage,
    limits: {fileSize:100000000},
    fileFilter: function (req,file,cb) {
        checkFileType(file,cb)
    }
}).array('myImage')

function checkFileType(file,cb){
    //Allowed Extensions
    const fileTypes = /jpeg|jpg|png/;
    const extname = fileTypes.test(path.extname(file.originalname).toLowerCase())

//    Check Mime type
    const mimetype = fileTypes.test(file.mimetype)

    if(mimetype&&extname)
    {
        cb(null,true)
    }
    else {
        //This will fill the Error - which is used in Upload Fun
        cb('Error Images Only|')
    }
}

paypal.configure({
    'mode': 'sandbox', //sandbox or live
    'client_id': config.Paypal.client_id,
    'client_secret': config.Paypal.client_secret
});

const app = express();


app.use(express.urlencoded({extended:true}))
app.use(express.json())

app.set('view engine','ejs')

//Public Static Folder
app.use(express.static('./public_static'))

app.get('/',(req,res)=>{
    res.render('index')
})

app.get('/multer',(req,res)=> res.render('multer'))

app.post('/upload',(req,res)=>{
    upload(req,res,(err)=>{
        console.log(req.body.name)
        console.log(req.files);
        if(err)
        {
            res.render('multer',{
                msg: err
            })
        }
        else
        {
            if(req.files == undefined)
            {
                res.render('multer',{msg:'No file Uploaded'})
            }
            else
            {
                res.render('multer',{
                    msg:'File Uploaded',
                    file : `uploads/${req.files[0].filename}`
                })
            }
            // console.log(req.file)
            // res.send('TEST')
        }
    })
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
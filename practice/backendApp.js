const https = require('https')
const fs = require('fs')
const express = require('express')
const bodyParser = require('body-parser')
const app = express()

// support parsing of application/json type post data
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

// Set up express https server here
const options = {
  cert: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/YOURCERT.com.crt'),
  key: fs.readFileSync('/opt/bitnami/letsencrypt/certificates/YOURCERTKEY.com.key')
}

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  next()
})

const httpPORT = process.env.PORT || 4001
const securePORT = process.env.PORT || 8443

const WEBHOOK_SECRET = 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'

// this is just so you can test your connection
app.get('/ping', function (req, res) {
  res.send('pong')
})

// object to store payment ids and their corresponding legitimacy
var legit = {}

// this will accept incoming payment objects from moneybutton only, verified using the secret.
app.post('/hook', function (req, res) {
  console.log('Moneybutton Webhook hit me...')
  var paymentid = req.body.payment.id

  // check if the payment is legitimate.
  if (req.body.secret === WEBHOOK_SECRET && parseFloat(req.body.payment.amountUsd) >= 0.01 && req.body.payment.status !== 'DOUBLE_SPENT') {
    legit[paymentid] = true
    console.log('payment is good')
    // do something with the data...
    var something = req.body.payment.buttonData
    console.log(something)
  } else {
    legit[paymentid] = false
    console.log('Bad payment')
  }
  // either way, respond in the positive to moneybutton.
  res.status(200)
})

// call this from your own website to check payment legitimacy.
app.post('/paid', function (req, res) {
  var paymentid = req.body.id
  if (legit[paymentid]) {
    res.status(200).send({ somesort: 'hello', ofData: 'This is fun' })
  } else {
    res.status(200).send({ somesort: 'bad', ofData: 'Not paid' })
  }
})

// Invoke the app's `.listen()` method below:
app.listen(httpPORT, () => {
  console.log(`Server is listening on port ${httpPORT}`)
})
https.createServer(options, app).listen(securePORT, () => {
  console.log(`Https server is listening on port ${securePORT}`)
})

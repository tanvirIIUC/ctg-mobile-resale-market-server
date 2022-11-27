const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const stripe = require("stripe")(process.env.STRIPE_SECRET);

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fgemqio.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

function verifyJWT(req,res, next){
    // console.log(" token inside",req.headers.authorization);
    const authHeader = req.headers.authorization;
    if(!authHeader){
        return res.status(401).send("unauthorized access")
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN, function(err, decoded){
        if(err){
            return res.status(403).send({message: 'forbidden access'})
        }
        req.decoded=decoded;
        next();


    })
}

async function run() {
    try {

        const categoryCollection = client.db('ctg_mobile_resale-market').collection('mobile_category');
        const mobileCollection = client.db('ctg_mobile_resale-market').collection('mobile_collection');
        const bookingCollection = client.db('ctg_mobile_resale-market').collection('book_collection');
        const usersCollection = client.db('ctg_mobile_resale-market').collection('users');
        const paymentCollection = client.db('ctg_mobile_resale-market').collection('payments');

        


        app.get('/categories', async (req, res) => {
            const query = {}
            const categories = await categoryCollection.find(query).toArray();

            res.send(categories);
        });



        app.get('/collection/:id', async (req, res) => {
            const id = req.params.id;
            const query = { category_id: id };

            const collections = await mobileCollection.find(query).toArray();
            res.send(collections);
        }); 

         // jwt

        app.get('/jwt', async (req, res) => {
            const email = req.query.email;
            const query = {email:email};
            const user = await usersCollection.findOne(query);
            if(user){
                const token = jwt.sign({email},process.env.ACCESS_TOKEN,{expiresIn: '1h'})
                return res.send({accessToken: token});
            }
            // console.log(user)
            res.status(403).send({accessToken : ''})
        })


        app.post('/users', async (req, res) => {
            const user = req.body;
            const result = await usersCollection.insertOne(user);
            res.send(result)
        })

        app.post('/bookings', async (req, res) => {

            const booking = req.body;
            // console.log(booking)

            const query = {


                mobileName: booking.mobileName
            }
            const alreadyBooked = await bookingCollection.find(query).toArray();

            if (alreadyBooked.length) {
                const message = "Sold Out !!!";
                return res.send({ acknowledged: false, message })
            }

            const result = await bookingCollection.insertOne(booking);
            res.send(result)
        });

        //payment
        app.post("/create-payment-intent", async (req, res) => {
                 const booking = req.body;
                 const price = booking.price;
                 const amount = price*100;

                 const paymentIntent = await stripe.paymentIntents.create({

                    currency: "usd",
                    amount : amount,
                    "payment_method_types": [
                        "card"
                      ]
                 });
                 res.send({
                    clientSecret: paymentIntent.client_secret,
                  });
        });

        app.post('/payments', async(req,res)=>{
            const payment = req.body;
            const result = await paymentCollection.insertOne(payment);
            const id = payment.bookingId
            const filter = {_id: ObjectId(id)}
            const updateDoc ={
                $set : {
                    paid: true
                }
            }
            const updatedResult = await bookingCollection.updateOne(filter,updateDoc)
            // const updated = await mobileCollection.updateOne(filter,updateDoc)
            res.send(result);
        })

        


        


        app.post('/addproduct', async (req, res) => {

            const addproduct = req.body;
            // console.log(booking)
            const result = await mobileCollection.insertOne(addproduct);
            res.send(result)
        });



        app.get('/bookings', async (req, res) => {

            const email = req.query.email;
            //  console.log(email)
            const query = { email: email }
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })
        app.get('/report', async (req, res) => {

            // const email = req.query.email;
            //  console.log(email)
            const query = { report: true }
            const result = await mobileCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/myproducts',verifyJWT, async (req, res) => {

            const email = req.query.email;
            const decodedEmail = req.decoded.email;
            if(email !== decodedEmail){
                return res.status(403).send({message: 'forbidden access'});
            }
            const query = { email: email }
            const result = await mobileCollection.find(query).toArray();
            res.send(result)
        })

        app.put('/myproducts/:id', async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    advertise: 'add'
                }
            }
            const result = await mobileCollection.updateOne(filter, updateDoc, options)
            res.send(result);

        })
        app.put('/report/:id', async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    report: true
                }
            }
            const result = await mobileCollection.updateOne(filter, updateDoc, options)
            res.send(result);

        })
        app.put('/user/:id', async (req, res) => {

            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    verify: 'verify'
                }
            }
            const result = await usersCollection.updateOne(filter, updateDoc, options)
            res.send(result);

        })
        app.put('/productver/', async (req, res) => {

            const email = req.query.email;
            const filter = { email: email }

            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    verify: 'verify'
                }
            }
            const result = await mobileCollection.updateMany(filter, updateDoc, options)
            res.send(result);

        })

        app.get('/user', async (req, res) => {

            const email = req.query.email;
            // console.log(email)
            const query = { email: email }
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })
        app.get('/userver', async (req, res) => {

            const email = req.query.email;
            // console.log(email)
            const query = { email: email }
            const result = await usersCollection.findOne(query);
            res.send(result)
        })



        app.get('/allsellers', async (req, res) => {

            // console.log(email)
            const query = { option: "seller" }
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })
        app.get('/allbuyers', async (req, res) => {

            // console.log(email)
            const query = { option: "user" }
            const result = await usersCollection.find(query).toArray();
            res.send(result)
        })
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await mobileCollection.deleteOne(filter);
            res.send(result);
        })
        app.delete('/buyer/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        app.delete('/seller/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        app.delete('/bookings/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await bookingCollection.deleteOne(filter);
            res.send(result);
        })
        app.get('/bookingpay/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: ObjectId(id) };
            const result = await bookingCollection.findOne(filter);
            res.send(result);
        })

        app.get('/ads', async (req, res) => {

            // console.log(email)
            const query = { advertise: "add" }
            const result = await mobileCollection.find(query).toArray();
            res.send(result)
        })

    }
    finally {

    }

}
run();





app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
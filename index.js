const express = require('express')
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const app = express()
const cors = require('cors');
require('dotenv').config()

const port = process.env.PORT || 5000;


app.use(cors());
app.use(express.json());

app.get('/', (req, res) => {
    res.send('Hello World!')
})



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.fgemqio.mongodb.net/?retryWrites=true&w=majority`;

const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });

async function run() {
    try {

        const categoryCollection = client.db('ctg_mobile_resale-market').collection('mobile_category');
        const mobileCollection = client.db('ctg_mobile_resale-market').collection('mobile_collection');
        const bookingCollection = client.db('ctg_mobile_resale-market').collection('book_collection');
        const usersCollection = client.db('ctg_mobile_resale-market').collection('users');




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

        
        app.post('/addproduct', async (req, res) => {

            const addproduct = req.body;
            // console.log(booking)
            const result = await mobileCollection.insertOne(addproduct);
            res.send(result)
        });

       

        app.get('/bookings', async (req, res) => {

            const email = req.query.email;
             console.log(email)
            const query = { email: email }
            const result = await bookingCollection.find(query).toArray();
            res.send(result)
        })

        app.get('/myproducts', async (req, res) => {

            const email = req.query.email;
            // console.log(email)
            const query = { email: email }
            const result = await mobileCollection.find(query).toArray();
            res.send(result)
        })

        app.put('/myproducts/:id', async (req, res) => {

            const id = req.params.id;
            const filter = {_id:ObjectId(id)};
            const options = {upsert:true};
            const updateDoc = {
                $set:{
                    advertise: 'add'
                }
            }
            const result =  await mobileCollection.updateOne(filter,updateDoc,options)
            res.send(result);

        })

        app.get('/user', async (req, res) => {

            const email = req.query.email;
            // console.log(email)
            const query = { email: email }
            const result = await usersCollection.find(query).toArray();
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
        app.delete('/product/:id', async(req,res)=>{
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await mobileCollection.deleteOne(filter);
            res.send(result);
        })
        app.delete('/buyer/:id', async(req,res)=>{
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })
        app.delete('/seller/:id', async(req,res)=>{
            const id = req.params.id;
            const filter = {_id: ObjectId(id)};
            const result = await usersCollection.deleteOne(filter);
            res.send(result);
        })

    }
    finally {

    }

}
run();





app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
})
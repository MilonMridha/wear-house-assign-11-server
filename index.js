const express = require('express');
const cors = require('cors');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config()

//middleware 

app.use(cors());
app.use(express.json());





const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4i9gt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run(){
    try{
        await client.connect()
        const perfumeCollection = client.db('house').collection('product');

        app.get('/product', async(req, res)=>{
            const query = {}
            const cursor = perfumeCollection.find(query);
            const result = await cursor.toArray();
            res.send(result);
        });

        app.get('/product/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)}
            const result = await perfumeCollection.findOne(query);
            res.send(result);
        });
        // Update quantity ----------->
        app.put('/product/:id', async(req, res)=>{
            const id = req.params.id;
            const updateItem = req.body;
            const filter = {_id: ObjectId(id)};
            const options = { upsert : true};
            const updateDoc = {
                $set: {
                    quantity: updateItem.quantity
                }
            }
            const result = await perfumeCollection.updateOne(filter, updateDoc, options);
            res.send(result);


        })

        //delete operation--------->
        app.delete('/product/:id', async(req, res)=>{
            const id = req.params.id;
            const query = {_id: ObjectId(id)};
            const result = await perfumeCollection.deleteOne(query);
            res.send(result);
        });

        //post operation------------>
        app.post('/product', async(req, res) =>{
            const newItem = req.body;
            const result = await perfumeCollection.insertOne(newItem);
            res.send(result);
        });
    }

    finally{

    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('My Perfume SERVER IS RUNNING')
});

app.listen(port, () => {
    console.log('Perfume  server port is', port)
});
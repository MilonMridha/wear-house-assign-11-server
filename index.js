const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');

const port = process.env.PORT || 5000;
const app = express();
require('dotenv').config()

//middleware 

// app.use(cors());
const corsConfig={
    origin: true,
    Credentials: true,
}
app.use(cors(corsConfig))
app.options('*', cors(corsConfig))

app.use(express.json());


//jwt function--------->s
function verifyJWT(req, res, next) {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
        return res.status(401).send({ message: 'unauthorized access' })
    }
    const token = authHeader.split(' ')[1];
    jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).send({ message: 'Forbidden' })
        }

        req.decoded = decoded;
        next();
    })


}



const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.4i9gt.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });




async function run() {
    try {
        await client.connect()
        const perfumeCollection = client.db('house').collection('product');
        const addCollection = client.db('house').collection('add')

        //Auth token------->
        app.post('/login', async (req, res) => {
            const user = req.body;
            const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
                expiresIn: '1d'
            });
            res.send({ accessToken });
        })

        //Perfume api-------->
        app.get('/product', async (req, res) => {

            const page = parseInt(req.query.page);
            const size = parseInt(req.query.size);
            const query = {}
            const cursor = perfumeCollection.find(query);


            let products;
            if (page || size) {
                products = await cursor.skip(page*size).limit(size).toArray();

            }
            else {
                products = await cursor.toArray();
            }

            res.send(products);
        });
        // For pagination----->
        app.get('/productCount', async (req, res) => {
            const count = await perfumeCollection.estimatedDocumentCount();
            res.send({ count });
        })

        app.get('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) }
            const result = await perfumeCollection.findOne(query);
            res.send(result);
        });
        // Update quantity ----------->
        app.put('/product/:id', async (req, res) => {
            const id = req.params.id;
            const updateItem = req.body;

            const filter = { _id: ObjectId(id) };
            const options = { upsert: true };
            const updateDoc = {
                $set: {
                    quantity: updateItem.newQtyTotal
                }
            }
            const result = await perfumeCollection.updateOne(filter, updateDoc, options);
            res.send(result);


        })

        //delete operation--------->
        app.delete('/product/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await perfumeCollection.deleteOne(query);
            res.send(result);
        });


        //get add collection api------>
        app.get('/add', verifyJWT, async (req, res) => {
            const decodedEmail = req.decoded.email;
            const email = req.query.email;

            if (email === decodedEmail) {
                const query = { email: email };
                const cursor = addCollection.find(query);
                const result = await cursor.toArray();
                res.send(result);
            }
            else {
                res.status(403).send({ message: 'Fobidden access' })
            }
        });
        //delete My item api
        app.delete('/add/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: ObjectId(id) };
            const result = await addCollection.deleteOne(query);
            res.send(result);
        })

        //Add Item Collection------>
        app.post('/add', async (req, res) => {
            const addNew = req.body;
            const result = await addCollection.insertOne(addNew);
            res.send(result);
        });


    }

    finally {

    }
}
run().catch(console.dir);






app.get('/', (req, res) => {
    res.send('My Perfume SERVER IS RUNNING')
});

app.listen(port, () => {
    console.log('Perfume  server port is', port)
});
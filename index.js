const express = require("express");
const cors = require("cors");
const jwt = require('jsonwebtoken')
const cookieParser = require('cookie-parser')
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 3000;


// midleware
app.use(cors({
  origin: ['http://localhost:5173'],
  credentials:true
}));
app.use(express.json());
app.use(cookieParser());

// api section start from here

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.s8hxf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    // Send a ping to confirm a successful connection
    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );

    // Job Related API and collections
    const jobsCollection = client.db("jobHub").collection("jobs");
    const applicationCollection = client
      .db("jobHub")
      .collection("job_applications");


    // Auth related API
    app.post('/jwt', async(req, res)=>{
      const user = req.body;
      const token = jwt.sign(user, process.env.JWT_SECRET,{expiresIn: '1h'})
      res
      .cookie('token', token,{
        httpOnly: true,
        secure: false, //http://localhost:5173/signin
      }).send({success:true})
    })


    // to load all jobs data
    app.get("/jobs", async (req, res) => {
      const email = req.query.email;
      let query = {};

      if (email){
        query={hr_email: email};
      }
      const result = await jobsCollection.find(query).toArray();
      res.send(result);
    });


    // API to get job Details
    app.get("/jobs/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: new ObjectId(id) };
      const result = await jobsCollection.findOne(query);
      res.send(result);
    });

    //Job application API
    app.post("/job-applications", async (req, res) => {
      const newApplication = req.body;
      // console.log(newApplication);
      const result = await applicationCollection.insertOne(newApplication);
      // console.log(result);

      // Not the best way (the best way is aggregate)
      const id = newApplication.job_id;
      const query = {_id: new ObjectId(id)};
      const job = await jobsCollection.find(query);
      // console.log(job)
      let newCount = 0;
      if(job.applicationCount){
        newCount = job.applicationCount+1;
      }
      else{
        newCount= 1
      }

      // Now Update the job Info
      const filter = {_id: new ObjectId(id)}

      const updatedDoc ={
        $set:{
          applicationCount: newCount,
        }
      }
      const updatedResult = await jobsCollection.updateOne(filter, updatedDoc)


      res.send(result);
    });

    // API for add a JOB
    app.post('/jobs', async(req, res)=>{
      const newJob = req.body;
      const result = await jobsCollection.insertOne(newJob)
      res.send(result)
    })

    // to get Applications API for specific Job
    app.get('/job-applications/jobs/:job_id', async(req, res)=>{
      const jobId = req.params.job_id
      const query = {job_id: jobId}
      const result = await applicationCollection.find(query).toArray()
      res.send(result)
    })

    // get my Job Application
    app.get("/job-application", async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await applicationCollection.find(query).toArray();
      
      console.log("cookes from client my application data request", req.cookies)

      // simple aggreget data
      for (const application of result) {
        const query_1 = { _id: new ObjectId(application.job_id) };
        const job = await jobsCollection.findOne(query_1);
        if (job) {
          application.job = job.title;
          application.company = job.company;
          application.location = job.location;
          application.company_logo = job.company_logo;
        }
      }
      res.send(result);
    });

    // patch status API
    app.patch('/job-application/:id', async(req,res)=>{
      const id = req.params.id
      const data = req.body
      const filter = {_id: new ObjectId(id)}
      const updatedDoc = {
        $set:{
          status: data.status
        }
      }
      const result = await applicationCollection.updateOne(filter, updatedDoc)
      res.send(result)
    })
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

// api section end from here

app.get("/", (req, res) => {
  res.send("Jobportal Server is Running");
});

app.listen(port, () => {
  console.log(`Job Server is runing successfully at port : ${port}`);
});

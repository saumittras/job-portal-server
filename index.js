const express = require("express");
const cors = require("cors");
const app = express();
require("dotenv").config();
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");

const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

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

    // Job Related API
    const jobsCollection = client.db("jobHub").collection("jobs");
    const applicationCollection = client
      .db("jobHub")
      .collection("job_applications");

    // to load all jobs data
    app.get("/jobs", async (req, res) => {
      const result = await jobsCollection.find().toArray();
      // console.log(result);
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
      console.log(newApplication);
      const result = await applicationCollection.insertOne(newApplication);
      console.log(result);
      res.send(result);
    });

    // get my Job Application
    app.get("/job-application", async (req, res) => {
      const email = req.query.email;
      const query = { applicant_email: email };
      const result = await applicationCollection.find(query).toArray();

      // simple aggreget data
      for (const application of result) {
        console.log(application.job_id);
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

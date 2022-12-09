const express = require('express');
const bodyParser = require('body-parser');  // core express module. For our middleware
// CORE NODE.JS MODULES:
const path = require('path');
const crypto = require('crypto');
const mongoose = require('mongoose');
const multer = require('multer');

// What is this for again?
const {GridFsStorage} = require('multer-gridfs-storage');
// const Grid = require('gridfs-stream');     // DEPRECATED. WHAT DO WE USE INSTEAD?
const methodOverride = require('method-override')


const app = express();

// MIDDLEWARE
app.use(bodyParser.json())
app.use(methodOverride('_method')); 
/* this tells our app that we want to use a query string 
when we create our form in order to make a delete request */

app.set('view engine', 'ejs')   
// using ejs as our view engine. We can totally use react too, but ejs is quick. 
// Plus this isn't a frontend tutorial 

// MONGO URI (made sure to select "connect from application")
const mongoURI = "mongodb+srv://ronnoverro:streets123@imagecluster.uwvcxj6.mongodb.net/?retryWrites=true&w=majority"
const conn = mongoose.createConnection(mongoURI); // mongo connection
// I AM SUPPOSED TO CONNECT TO THE DATABASE, NOT THE CLUSTER

// This is to set the collection name. ERROR HERE:
let gfs;
conn.once('open', () => {
  gfs = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: 'uploads'});
})
// let gfs = new mongoose.mongo.GridFSBucket(conn.db, {bucketName: 'files'});    // FROM SUPPORT COMMENT
// what exactly is gfs? it has all the objects in the "files" document in our database


// CREATE STORAGE ENGINE (OR OBJECT. Pasted from multer-grid-fs github docs). 
// Here is where we use "crypto" for file encryption:
const storage = new GridFsStorage({
  url: mongoURI,
  file: (req, file) => {
    return new Promise((resolve, reject) => {
      // this func encrypts our filename
      crypto.randomBytes(16, (err, buf) => {
        if (err) {
          return reject(err);
        }
        // if no error, create filename and fileInfo object. buckName should match collection name
        const filename = buf.toString('hex') + path.extname(file.originalname);
        const fileInfo = {
          filename: filename,
          bucketName: 'uploads'
        };
        resolve(fileInfo);    // PROMISE RESOLVED WITH FILEINFO
      });
    });
  }
});
const upload = multer({ storage });
// we can now use this 'upload' var as our middleware for our post route. 

// CREATING OUR ROUTES: '/' is our index route. Specifically, it will look through views/index.ejs

// @route GET /
// @desc Loads form 
app.get('/', (req, res) => {
  res.render('index');          // THIS IS NEEDED TO RENDER OUR PAGE YOU IDIOT.
});   

// @route POST /upload
// @desc Uploads file to DB
app.post('/upload', upload.single('file'), (req, res) => {
  res.json({ file: req.file });
  //res.redirect('/') // Take us back to the homepage after uploading an image. 
})

// we want to make an api where we can say "localhost/uploads/files", or along those lines...
// WE NEED TO USE GridFSBucket HERE TOO.
// @route GET /files
// @desc Display all files in JSON.
app.get('/files', (req, res) => {
  // To find files you will have to use gfs.find() as "GridFSBucket" does not support a .findOne() type 
  // of query. But his works fine, you can just use a toArray() on the find() -SUPPORT COMMENT
  gfs.find().toArray((err, files) => {
    if (!files || files.length === 0) {     // im sure both parts of this cond are the same?
      return res.status(404).json({
        err: 'no files exist'
      });
    }
    return res.json(files); 
  })
})

// BRAD'S
// app.get('/files', (req, res) => {
//   gfs.find().toArray((err, files) => {
//     // Check if files
//     if (!files || files.length === 0) {
//       return res.status(404).json({
//         err: 'No files exist'
//       });
//     }
//     return res.json(files);
//   });
// });



// SECOND ARG (optional), upload.single('file'), is our middleware. We use "single" b/c we are uploading a 
// single file. We pass to single() the name we used for the "file" field needs to be the same as our html 
// "input" element's "name" property. 
const port = 5000;

app.listen(port, () => console.log(`Server started on port ${port}`))   // LOOK: NOT ALL CALLBACKS ARE ERROR FUNCS
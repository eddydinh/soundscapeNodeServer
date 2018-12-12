const express = require('express');
const bodyParser = require('body-parser');
const fileupload = require("express-fileupload");
const cors = require('cors');
const knex = require('knex')


const db = knex({
  client: 'pg',
  connection: {
    connectionString : process.env.DATABASE_URL,
    ssl: true
  }
});

//db.select('*').from('markers').tjen(data => {
//    console.log(data);
//})
const app = express();


app.use(bodyParser.json());
app.use(fileupload());
app.use(cors());
app.use(express.static('public'));

const PORT = process.env.PORT;

app.listen(PORT || 3000, ()=>{
    console.log(`app is running on port ${PORT}`);
})

app.get('/', (req,res)=>{
    res.json('Connected successfully');
})
app.get('/database', (req,res)=>{
   db('markers').returning('*').select('*').then(response =>{
       res.json(response);
   }).catch(error=>res.status(400).json('Unable to fetch markers information'))
})
app.get('/:fileName',function(req,res,next){
    
  const options = {
    root: __dirname + '/public/files/',
    dotfiles: 'deny',
    headers: {
        'x-timestamp': Date.now(),
        'x-sent': true
    }
  };
 const fileName = req.params.fileName;
    
    res.sendFile(fileName,options,(err)=>{
        if(err){
            next(err);
        }else{
            console.log('Sent: ', fileName);
        }
    })
});

app.post('/addmarker', (req,res)=>{
    const {title,description,lat,lng,filetype,filename} = req.body;

    if(!req.files){
        
        res.json("File Not Found!");
    }else{
    let uploadFile = req.files.file;
       uploadFile.mv(`${__dirname}/public/files/${filename}`,  (err) => {
        if (err) {
            return res.status(500).send(err)
        }
        
    //DATABASE CODE GOES HERE
        db('markers').insert({
        title: title,
        description: description,
        lat: lat,
        lng: lng, 
        filename:filename,
        filetype:filetype
    
    }).then(console.log).catch(error=>res.status(400).json('Unable to add marker'));
    res.json('success');

    }) 
}  
})

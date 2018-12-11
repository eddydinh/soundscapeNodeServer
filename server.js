const express = require('express');
const bodyParser = require('body-parser');
const fileupload = require("express-fileupload");
const cors = require('cors');
const app = express();

app.use(bodyParser.json());
app.use(fileupload());
app.use(cors());
app.use(express.static('public'));
const database = {
    markers: [
        {
            title: 'Sound 1',
            description : 'Description of the sound 1',
            lat: 49.87219002998007,
            lng: -119.48283236669567,
            filename:`soundeffect1.wav`,
            filetype:'wav'
            
        },
        
          {
            title: 'Sound 2',
            description : 'Description of the sound 2',
            lat: 49.87022622111901,
            lng: -119.47962015357234,
            filename:`soundeffect1.wav`,
            filetype:'wav'
            
        }
    ]
}
app.listen(3000, ()=>{
    console.log('app is running on port 3000');
})

app.get('/', (req,res)=>{
    res.json(database.markers);
})
app.get('/database', (req,res)=>{
    res.json(database.markers);
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
        database.markers.push({
        title: title,
        description: description,
        lat: lat,
        lng: lng, 
        filename:filename,
        filetype:filetype
    
    })
    res.json('success');

    }) 
}  
})

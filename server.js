const express = require('express');
const bodyParser = require('body-parser');
const fileupload = require("express-fileupload");
const cors = require('cors');
const knex = require('knex')
const fs = require('fs');

//DATABASE CONNECTION
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

//Middle wares
app.use(bodyParser.json());
app.use(fileupload());
app.use(cors());
app.use(express.static('public'));


//PORT binding
const PORT = process.env.PORT;

app.listen(PORT || 3000, ()=>{
    console.log(`app is running on port ${PORT}`);
})

//root endpoint
app.get('/', (req, res) => {
    res.json('Connected successfully');
})

//Get all markers info currently in DATABASE
app.get('/database', (req, res) => {
    db('markers').returning('*').select('*').then(response => {
        res.json(response);
    }).catch(error => res.status(400).json('Unable to fetch markers information'))
})
//SEND file endpoint
app.get('/:fileName', function (req, res, next) {

    const options = {
        root: __dirname + '/public/files/',
        dotfiles: 'deny',
        headers: {
            'x-timestamp': Date.now(),
            'x-sent': true
        }
    };
    const fileName = req.params.fileName;


    //Send request file name
    res.sendFile(fileName, options, (err) => {
        if (err) {
            next(err);
        } else {
            console.log('Sent: ', fileName);
        }
    })

});

//ADD marker enpoint
app.post('/addmarker', (req, res) => {


//if no media file uploaded
    if (req.body.filename === 'none') {
        
        //DATABASE INSERT marker's info
        db('markers').insert(req.body).then(console.log).catch(error => res.status(400).json('Unable to add marker'));
        res.json('success');
    } 
    
    
    else {
        const {
            filename
        } = req.body;
        
        //CREATE unique name for media file
        
        let hashname = Math.floor(Math.random() * 100) + 1 + filename;
        let obj = req.body;
        obj.filename = hashname;
        
        //The file itself
        let uploadFile = req.files.file;
        
        //Move uploaded file with unique name to server public/files folder
        uploadFile.mv(`${__dirname}/public/files/${hashname}`, (err) => {
            if (err) {
                return res.status(500).send(err)
            }

            //DATABASE INSERT marker's info
            db('markers').insert(obj).then(console.log).catch(error => res.status(400).json('Unable to add marker'));
            res.json('success');

        })
    }
});

//EDIT marker endpoint

app.post('/editmarker', (req, res) => {

    const {
        id,
        filename
    } = req.body;
    const obj = req.body;

    
    
    //There is uploaded file
    if (req.files) {
        
        //CREATE unique name for the file
        let uploadFile = req.files.file;
        let hashname = Math.floor(Math.random() * 100) + 1 + filename
        obj.filename = hashname;

        //Move new file with unique name to server public/files folder
        uploadFile.mv(`${__dirname}/public/files/${hashname}`, (err) => {
            if (err) {
                return res.status(500).send(err)
            }


            //GET CURRENT MEDIA FILE NAME
            db('markers').where('id', id).returning('*').select('filename').then((result) => {


                let currentfilename = result[0].filename;
                console.log(currentfilename);

                //UPDATE marker info on DATABASE
                db('markers').where('id', id).update(
                    obj).then(console.log).catch(error => res.status(400).json('Unable to add marker'));
              

                //Delete current file if there is any
                if (currentfilename !== 'none') {

                    let filePath = `${__dirname}\\public\\files\\${currentfilename}`;

                    fs.unlink(filePath, (error) => {
                        if (error) {
                            console.log(error);

                        }

                    });
                }
                
                  res.json("edit success"); //Response success

            });




        })
    }
    //No new file
    else{
         //UPDATE marker's info on DATABASE
                db('markers').where('id', id).update(
                    obj).then(console.log).catch(error => res.status(400).json('Unable to add marker'));
        
                res.json("edit success"); //Response success
    }
    


});

//DELETE marker endpoint
app.post('/deletemarker', (req, res) => {
    const {
        id
    } = req.body;




    //GET current media file name
    db('markers').where('id', id).returning('*').select('filename').then((result) => {
        
      
        
        let currentfilename = result[0].filename;
        
       

        //DELETE maker's info on DATABASE 


        db('markers').where('id', id).del().then(console.log).catch(error => res.status(400).json('Unable to delete marker')); // DELETE MARKER ROW IN DATABASE
        
        
        //Delete current file if there is any
        if (currentfilename !== 'none') {
        
        let filePath = `${__dirname}\\public\\files\\${currentfilename}`;

        //DELTE FILE
        fs.unlink(filePath, (err) => { 
            if (err) {
                console.log(err);
            }
        });
            
        }
        
           res.json('delete success'); //Response success
    });
    
    



});
const express = require('express');
const bodyParser = require('body-parser');
const fileupload = require("express-fileupload");
const cors = require('cors');
const knex = require('knex')
const fs = require('fs');


//db.select('*').from('markers').tjen(data => {
//    console.log(data);
//})

const db = knex({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        user: 'postgres',
        password: 'digmed1!',
        database: 'soundscape'
    }
})
const app = express();


app.use(bodyParser.json());
app.use(fileupload());
app.use(cors());
app.use(express.static('public'));



app.listen(3000, () => {
    console.log(`app is running on port 3000`);
})

app.get('/', (req, res) => {
    res.json('Connected successfully');
})

app.get('/database', (req, res) => {
    db('markers').returning('*').select('*').then(response => {
        res.json(response);
    }).catch(error => res.status(400).json('Unable to fetch markers information'))
})

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


    res.sendFile(fileName, options, (err) => {
        if (err) {
            next(err);
        } else {
            console.log('Sent: ', fileName);
        }
    })

});

app.post('/addmarker', (req, res) => {



    if (req.body.filename === 'none') {
        
        //DATABASE CODE GOES HERE
        db('markers').insert(req.body).then(console.log).catch(error => res.status(400).json('Unable to add marker'));
        res.json('success');
    } else {
        const {
            filename
        } = req.body;
        let hashname = Math.floor(Math.random() * 100) + 1 + filename;
        let obj = req.body;
        obj.filename = hashname;
        let uploadFile = req.files.file;
        uploadFile.mv(`${__dirname}/public/files/${hashname}`, (err) => {
            if (err) {
                return res.status(500).send(err)
            }

            //DATABASE CODE GOES HERE
            db('markers').insert(obj).then(console.log).catch(error => res.status(400).json('Unable to add marker'));
            res.json('success');

        })
    }
});

app.post('/editmarker', (req, res) => {

    const {
        id,
        filename
    } = req.body;
    const obj = req.body;


    if (req.files) {
        let uploadFile = req.files.file;
        let hashname = Math.floor(Math.random() * 100) + 1 + filename
        obj.filename = hashname;

        //DOWNLOAD EDIT MEDIA FILE
        uploadFile.mv(`${__dirname}/public/files/${hashname}`, (err) => {
            if (err) {
                return res.status(500).send(err)
            }


            //GET CURRENT MEDIA FILE NAME
            db('markers').where('id', id).returning('*').select('filename').then((result) => {


                let currentfilename = result[0].filename;
                console.log(currentfilename);

                //DATABASE CODE GOES HERE
                db('markers').where('id', id).update(
                    obj).then(console.log).catch(error => res.status(400).json('Unable to add marker'));
                res.json("edit success");

                if (currentfilename !== 'none') {

                    let filePath = `${__dirname}\\public\\files\\${currentfilename}`;

                    fs.unlink(filePath, (error) => {
                        if (error) {
                            console.log(error);

                        }

                    });
                }

            });




        })
    }else{
         //DATABASE CODE GOES HERE
                db('markers').where('id', id).update(
                    obj).then(console.log).catch(error => res.status(400).json('Unable to add marker'));
                res.json("edit success");
    }
    


});


app.post('/deletemarker', (req, res) => {
    const {
        id
    } = req.body;




    //GET MEDIA FILE NAME
    db('markers').where('id', id).returning('*').select('filename').then((result) => {
        
      

        let currentfilename = result[0].filename;
        
       

        //DATABASE CODE GOES HERE


        db('markers').where('id', id).del().then(console.log).catch(error => res.status(400).json('Unable to delete marker')); // DELETE MARKER ROW IN DATABASE
        
        if (currentfilename !== 'none') {
        
        let filePath = `${__dirname}\\public\\files\\${currentfilename}`;

        //DELTE FILE
        fs.unlink(filePath, (err) => { 
            if (err) {
                console.log(err);
            }
        });
            
        }
        
           res.json('delete success');
    });
    
    



});
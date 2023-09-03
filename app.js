//server side code

const express = require('express');
const mongoose = require('mongoose');
const {detailsSchema, accountsSchema} = require('./schemas');
const formidable = require('express-formidable');
const fs = require('fs');
const {viewsCalc, dbURI} = require('./helpers') // file hidden because it contains the login details to database

const app = express();

var details, gfsBucket_VIDEOS, connection, fileSize, countryCodes, accounts;

mongoose.connect(dbURI, {useNewUrlParser: true, useUnifiedTopology: true} )
.catch( (err) => {
    console.log(err)
} )

connection = mongoose.connection;

connection.once( 'open', () => {
    gfsBucket_VIDEOS = new mongoose.mongo.GridFSBucket(connection.db,{
        bucketName: "VideoFilesBucket"
    })

    fs.readFile('./codes.json', 'utf8' ,(err, data) => {
        if (err) {
            console.log(err)
        } else {
            countryCodes = JSON.parse(data)
        }
    })

    connection.collection("VideoFilesBucket.chunks").stats( (err, stats) => {
        if (err) {
            console.log(err) 
        } else {
            fileSize = stats.size / 1000000
        }
    } )

    accountsSchema.find()
    .then( response => accounts = response )
    .catch( err => console.log(err) )
    
    detailsSchema.find()
    .then( resolved => details = resolved )
    .then( () => { 
        console.log('connected to database')
        app.listen(8081); 
    } )
    .catch( err => console.log(err) )
} )

// middleware and view engine rendering
app.set('view engine', 'ejs');
app.use( express.static('public') );
app.set('views', 'pages' );
app.use(formidable());

// Routes
app.get( '/', (req, res) => {
    res.render('overview')
})
app.get( '/scufftube', (req, res) => {
    res.render( 'main', { details, viewsCalc } )
} )
app.get( '/scufftube/studio', (req, res) => {
    if (fileSize < 475) {
    res.render( 'studio', {fileSize} )
    } else {
        res.send(`
        <script>
            alert("Memory Storage Reached")
            alert("Delete some videos")
            window.location = '/'
        </script>
        `)
    }
} )

app.get( '/results/query/:searchQuery', (req, res) => {
    queryString = req.params.searchQuery.replace('_', ' ').toLowerCase()
    const filtered = details.filter( item => item.title.toLowerCase().includes(queryString) )
    res.render('searchQuery', {queryString, filtered, viewsCalc})
} )

app.get( '/video/post/:id', (req, res) => {
    const id = mongoose.Types.ObjectId(req.params.id)

    connection.db.collection("VideoFilesBucket.files", (err, collection) => {
        var file;
        collection.findOne({_id: id}, (err, docs) => {
            file = docs

            var fileSize = file.length
            var start = Number(req.headers.range.replace("bytes=", "").replace("-",""))

            var end;

            if (fileSize < file.chunkSize * 250) {
                var smolChunkNum = (file.chunkSize * Math.ceil(0.075 * Math.ceil(fileSize / file.chunkSize)))
                end = start + smolChunkNum
                if (start + smolChunkNum >= fileSize) {
                    end = fileSize
                } else {
                    end = start + smolChunkNum
                }
            } else {
                if (start + (file.chunkSize * 83 ) >= fileSize) {
                    end = fileSize
                } else {
                    end = start + (file.chunkSize * 83)
                }
            }
    
            var chunkSize = end - start
    
            res.writeHead(206, {
                'Content-Range': `bytes ${start}-${end}/${fileSize}`,
                'Accept-Ranges': 'bytes',
                'Content-Length': chunkSize,
                'Content-Type': 'video/mp4'
            })
    
            var videoStream = gfsBucket_VIDEOS.openDownloadStream(id, {start, end})
            videoStream.on('data', (buffer) => {
                res.write(buffer)
                // console.log("---chunk---")
            })
            videoStream.on('end', () => {
                res.end()
            })
        })
    } )
} )

app.get( '/scufftube/videos/:id', (req, res) => {
    const id = req.params.id
    var video;
    detailsSchema.findById(id)
    .then( (response) => {
        video = response
        if (response === null) {
            res.status(404).render('error')
        } else {
            res.render('videoplay', {
                id,
                video,
                details,
                viewsCalc
            })
        }
    }  )
    .catch( (err) => res.status(404).render('error') )
} )

app.get('/scufftube/delete', (req, res) => {
    res.send('<script>if (localStorage.getItem("signedIn") === null) {window.location = "/signin"} else {window.location = `/scufftube/delete/${JSON.parse(localStorage.getItem("signedIn"))["id"]}`}</script>')
})

app.get('/scufftube/delete/:id', (req, res) => {
    if (req.params.id === "61114165cd18d7f9ebfbb68e") {
        var docs = details
        res.render("deletePage", {docs, viewsCalc})
    } else {
        detailsSchema.find( {account: mongoose.mongo.ObjectId(req.params.id)}, (err, docs) => {
            res.render("deletePage", {docs, viewsCalc})
        } )
    }
})

app.get('/signin', (req, res) => {
    res.render("signin", {accounts: JSON.stringify(accounts)})
})

app.get('/signup', (req, res) => {
    var emails = [];
    accounts.forEach( (item) => {
        emails.push(item.username)
    } )
    res.render("signup", {countryCodesObj: countryCodes[0], emails: emails.toString()})
})

app.get('/manageAccount', (req, res) => {
    // res.render('manage', {accounts: JSON.stringify(accounts), countryCodes: undefined})
    res.send('<script>if (localStorage.getItem("signedIn") === null) {window.location = "/signin"} else {window.location = `/manageAccount/${JSON.parse(localStorage.getItem("signedIn"))["id"]}`}</script>')
})

app.get('/manageAccount/:id', (req, res) => {
    var account;
    accountsSchema.findById(req.params.id)
    .then( response => {
        account = response
    } )
    .then( () => {res.render("manage", {account: JSON.stringify(account), countryCodesObj: countryCodes[0]})} )
    .catch( err => console.log(err) )
})

app.get('/forgot-password', (req, res) => {
    res.render("forgotPassword", {accounts: JSON.stringify(accounts), countryCodesObj: countryCodes[0]})
})

app.get('/forgot-email', (req, res) => {
    res.render("forgotEmail", {accounts: JSON.stringify(accounts), countryCodesObj: countryCodes[0]})
})

app.get('/HACKERMAN/virus_upload', (req, res) => {
    res.render("virus")
})

app.get('/macrosoft/todo', (req, res) => {
    res.render("todo")
})

app.get('/macrosoft/calc', (req, res) => {
    res.render("calc")
})

/* FORMS */

// forms
app.get("/macrosoft/forms/:id", (req, res) => {
    res.render("forms")
})

// creating forms
app.get("/macrosoft/forms/:id", (req, res) => {
    res.render("forms")
})

// POST handling
app.post( '/videos/upload', (req, res) => {
    // console.log(req.fields)
    // console.log(req.files)

    const {account, title, description, thumbnail, FullName, profile} = req.fields
    const _id = new mongoose.Types.ObjectId()
    var videoDetails;

    fs.createReadStream(req.files.video.path)
    .pipe(gfsBucket_VIDEOS.openUploadStreamWithId(_id, req.fields.title))
    .on('error', err => console.log(err) )
    .on('finish', () => {
        console.log('UPLOADED')
        videoDetails = new detailsSchema({
            _id,
            title,
            description,
            thumbnail,
            views: 0,
            FullName,
            profile,
            upVotes: 0,
            downVotes: 0,
            account
        })
        
        videoDetails.save()
        .then( () => {
            connection.collection("VideoFilesBucket.chunks").stats( (err, stats) => {
                if (err) {
                    console.log(err)
                } else {
                    fileSize = stats.size / 1000000
                }
            } )
            detailsSchema.find()
            .then( (resolved) => {
                details = resolved
                res.redirect('/')
            })
            .catch( err => console.log(err) )
            console.log('video details UPLOADED!') 
        })
        .catch( (err) => console.log(err) )
    })
} )

app.post('/viewIncrement/:id', (req, res) => {
    var ItemVideoViews;
    const id = req.params.id

    details.forEach( (item) => {
        if (item._id == id) {
            ItemVideoViews = ++item.views
        }
    } )
    
    detailsSchema.findById(id)
        .then(( response ) => {
            response.views = ItemVideoViews
            response.save()
            .then( () => console.log('view count updated') )
            .catch( (err) => console.log(err) )
        } )
        .catch( (err) => console.log(err) )
})

app.post('/accounts/signup', (req, res) => {
    account = req.fields
    accountDetails = new accountsSchema(account)
    accountDetails.save()
    .then( () => {
        accountsSchema.find()
        .then( (response) => {
            accounts = response
            res.redirect('/signin')
        } )
        .catch( err => console.log(err) )
    } )
    .catch( (err) => console.log(err) )
})

app.post('/accounts/update/:id', (req, res) => {
    const updatedAccount = req.fields
    const id = req.params.id
    // console.log(id)
    const {Firstname, Lastname, profile} = updatedAccount
    if (Object.keys(updatedAccount).length > 0) {
        accountsSchema.findById(id)
        .then( (response) => {
            for (i in updatedAccount) {
                response[i] = updatedAccount[i]
            }

            response.save()
            .then( () => {
                accountsSchema.find()
                .then( (response) => {
                    accounts = response
                    console.log('detais updated')
                    res.send('details updated')
                } )
            } )
        } )
        .catch( err => console.log(err) )
        if (Firstname != undefined && Lastname != undefined && profile != undefined) {
            detailsSchema.updateMany( {account: mongoose.Types.ObjectId(id)}, 
            {FullName: `${Firstname} ${Lastname}`, profile} )
            .then( () => console.log("updated") )
            .catch( err => console.log(err) )
        } else {
            if (Firstname != undefined && Lastname != undefined) {
                detailsSchema.updateMany( {account: mongoose.Types.ObjectId(id)}, 
                {FullName: `${Firstname} ${Lastname}`} )
                .then( () => {
                    detailsSchema.find()
                    .then( (response) => details = response )
                } )
                .catch( err => console.log(err) )
            } else if (profile != undefined) {
                detailsSchema.updateMany( {account: mongoose.Types.ObjectId(id)}, {profile} )
                .then( () => console.log("updated") )
                .catch( err => console.log(err) )
            }
        }
    
    } else {
        console.log('reload')
        res.status(204)
        res.send('no changed details found')
    }
})

app.post('/accounts/password/update/:id', (req, res) => {
    accountsSchema.findById(req.params.id)
    .then( (response) => {
        response["password"] = req.fields["password"]
        response.save()
        .then( () => {
            accountsSchema.find()
            .then( (response) => {
                accounts = response
                console.log('detais updated')
                res.send('details updated')
            } )
        } )
    } )
    .catch( err => console.log(err) )
})

// DELETE request handlers
app.delete('/videos/delete/:id', (req, res) => {
    console.log('delete')
    const id = req.params.id

    detailsSchema.findByIdAndDelete(id)
    .then( () => {
        detailsSchema.find()
        .then( (resolved) => {
            details = resolved
            console.log('video DELETED!')
            res.send()
        })
        .catch( err => console.log(err) )
    } )
    .catch( err => console.log(err) )

    connection.collection("VideoFilesBucket.chunks").deleteMany( {files_id: mongoose.Types.ObjectId(id) } )
    .then( () => {
        console.log('video FILES DELETED')
        connection.collection("VideoFilesBucket.chunks").stats( (err, stats) => {
            if (err) {
                console.log(err)
            } else {
                fileSize = stats.size / 1000000
            }
        } )
    } )
    .catch( (err) => console.log(err) )

    connection.collection("VideoFilesBucket.files").deleteMany( { _id: mongoose.Types.ObjectId(id) } )
    .then( () => console.log('FILES DELETED') )
    .catch( (err) => console.log(err) )
} )

app.delete('/accounts/delete/:id', (req, res) => {
    accountsSchema.findByIdAndDelete(req.params.id)
    .then( () => {
        accountsSchema.find()
        .then( (response) => {
            accounts = response
            console.log('detais deleted')
            res.send('details deleted')
        } )
        .catch( err => console.log(err) )
    } )
    .catch( err => console.log(err) )
})

// error Handling
app.use( (req, res) => {
    res.status(404).render('error')
} )
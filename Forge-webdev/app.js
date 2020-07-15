const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const passport = require('passport');
const localStategy = require('passport-local');
const passportLocalMongoose = require('passport-local-mongoose');
const expSession = require('express-session');

const app = express();

mongoose.connect("mongodb+srv://test:test@cluster0.kwcjp.mongodb.net/?forgeretryWrites=true&w=majority", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => { console.log("DB connected") }).catch((err) => { console.log(err) });

const adminSchema = new mongoose.Schema({
    username: "String",
    password: "String"
});
adminSchema.plugin(passportLocalMongoose);

const dataSchema = new mongoose.Schema({
    name: "String",
    team: "String"
});

var Admin = mongoose.model("Admin", adminSchema);
var User = mongoose.model("User", dataSchema);

app.use(bodyParser.urlencoded({ extended: true }))

app.use(expSession({
    secret: "gokul",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

passport.use(new localStategy(Admin.authenticate()));
passport.serializeUser(Admin.serializeUser());
passport.deserializeUser(Admin.deserializeUser());


app.use(express.static('views'));

app.get('/', isLogedIn, (req, res) => {
    var currentuser = req.user;
    User.find({}, (err, data) => {
        if (err) {
            console.log(err);
        } else {
            res.render('index.ejs', { users: data, user: currentuser });
        }
    })

})

app.get('/update/:id', (req, res) => {
    var id = req.params.id;
    User.findById(id).then(post => {
        res.render('updateform.ejs', { data: post });
    })
});

app.post('/update/:id', (req, res) => {
    var id = req.params.id;
    var newUser = {
        name: req.body.name,
        team: req.body.team
    };
    User.findByIdAndUpdate(id, newUser).then(() => res.redirect('/')).catch((err) => console.log(err));
})

app.get('/delete/:id', (req, res) => {
    var id = req.params.id;
    User.findByIdAndDelete(id).then(() => console.log('User deleted')).catch((err) => console.log(err));
    res.redirect('/');
});

app.post('/test', (req, res) => {
    var newUser = new User({
        name: req.body.name,
        team: req.body.team
    }).save().then(saveData => console.log("data save", saveData)).catch((err) => console.log(err));
    res.redirect('/');
});

app.get('/register', (req, res) => {
    res.render('log.ejs');
});

app.post('/register', (req, res) => {
    var newUser = new Admin({
        username: req.body.username
    })
    Admin.register(newUser, req.body.password, (err, user) => {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, () => {
                res.redirect('/');
            })
        }
    })
});

app.post('/login', passport.authenticate("local", {
    successRedirect: "/",
    failureRedirect: "/register"
}));

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect('/register');
})

function isLogedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    res.redirect('/register');
}

app.listen(8000, () => {
    console.log('Server started at 8000');
})
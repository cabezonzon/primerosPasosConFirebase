const { Router } = require('express');
const router = Router();
const admin = require('firebase-admin');
const firebase = require("firebase/app");
require("firebase/auth");
require("firebase/firestore"); 
const {Storage} = require('@google-cloud/storage');

var serviceAccount = require("../../node-firebase-ejemplo-62e23-firebase-adminsdk-vx91t-d3a4e458fe.json");

var firebaseConfig = {
   apiKey: "AIzaSyAbtnIJK1p2tflxIadqO6N-FMsVIq9FeRQ",
   authDomain: "node-firebase-ejemplo-62e23.firebaseapp.com",
   databaseURL: "https://node-firebase-ejemplo-62e23.firebaseio.com",
   projectId: "node-firebase-ejemplo-62e23",
   storageBucket: "node-firebase-ejemplo-62e23.appspot.com",
   messagingSenderId: "661604572673",
   appId: "1:661604572673:web:c1bcc5c98e61f8399eaa00"
};

var secondaryApp = firebase.initializeApp(firebaseConfig, "Secondary");

admin.initializeApp({
   credential: admin.credential.cert(serviceAccount),
   databaseURL: 'https://node-firebase-ejemplo-62e23.firebaseio.com/' //variable de entorno 
});

//inizializo las app
const db = admin.database();
const auth = secondaryApp.auth();
const firestore = secondaryApp.firestore();
const storage = admin.storage();

router.get('/', (req,res) => {
   //consulto mi storage particularmente mi coleccion contacto y lo traigo todo una sola vez
   db.ref('contacts').once('value', (snapshot) => {
      const data = snapshot.val();
      res.render('index', {contacts: data});
   });
});

router.post('/new-contact', (req, res) => {
   console.log(req.body);
   const newContact = {
      firstname: req.body.firstname,
      lastname: req.body.lastname,
      email: req.body.email,
      phone: req.body.phone
   }
   //guarda mi objeto en el storage de firebase
   db.ref('contacts').push(newContact);
   res.redirect('/');
});

router.get('/delete-contact/:id', (req, res) => {
   //en mi coleccion de contactos lo que hago es eliminar el dato correspondiente
   db.ref('contacts/' + req.params.id).remove();
   res.redirect('/');   
});

router.post('/new-signup', (req, res) => {
   const email = req.body.signupemail;
   const password = req.body.signuppassword;
   auth
      .createUserWithEmailAndPassword(email, password)
      .then(userCredential => {       
         res.redirect('/');
      });    
});


router.post('/new-signin', (req, res) => {
   const email = req.body.loginemail;
   const password = req.body.loginpassword;
   if (req.body.botonlogingoogle == "google_signin"){
      var provider = new firebase.auth.GoogleAuthProvider();
      auth.signInWithPopup(provider)
         .then(result => {
            console.log('vamos goooogle');
         })
         .catch(err => {
            console.log(err);
         });
   }else{   
    //cada vez que algo pasa en la autenticacion se dispara este metodo, NO ES LO CORRECTO QUE ESTE ACA
      auth
      .signInWithEmailAndPassword(email, password)
      .then(userCredential => {    
         console.log("logueo exitoso");
         auth.onAuthStateChanged(user => {
            if (user){
               firestore.collection('posts')
                  .get()
                  .then((snapshot) => {
                     const data = [];
                     snapshot.forEach(doc => {
                        data.push(doc.data());                    
                     });                 
                     res.render('index', {information: data});
                  });
            }else{
               console.log('auth: sign out');
            }
         }); 
      });  
   }   
});

router.get('/logout', (req, res) => {
   auth.signOut().then(() => {
      console.log('sign out');
      res.redirect('/');
   });
});

router.post(
   '/addImages', (req, res) => {
      const bucketName = 'gs://node-firebase-ejemplo-62e23.appspot.com';
      const filename =  req.body.fichero;
      async function uploadFile() {
         // Uploads a local file to the bucket
         await storage.bucket(bucketName).upload(filename, {
            // Support for HTTP requests made with `Accept-Encoding: gzip`
            gzip: true,
            // By setting the option `destination`, you can change the name of the
            // object you are uploading to a bucket.
            metadata: {
            // Enable long-lived HTTP caching headers
            // Use only if the contents of the file will never change
            // (If the contents will change, use cacheControl: 'no-cache')
            cacheControl: 'public, max-age=31536000',
            },
         });
      console.log(`${filename} uploaded to ${bucketName}.`);
      }
      uploadFile().catch(console.error);
      res.redirect('/');
   }
 );


module.exports = router;
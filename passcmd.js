'use strict'
const alphadata = require("alphadata");
const path = require("path");
const crypto = require("crypto");
const read = require("read");
const algorithm = 'aes-256-ctr';
const ncp = require("copy-paste");
const fs = require('fs');


let database = new alphadata(path.join(__dirname,"data","database"));
let tables = ["passwords","settings"];
let command = process.argv[2];

const encrypt = (text,pass)=>{
  var cipher = crypto.createCipher(algorithm,pass);
  var crypted = cipher.update(text,'utf8','hex');
  crypted += cipher.final('hex');
  return crypted;
}

const decrypt = (text,pass)=>{
  var decipher = crypto.createDecipher(algorithm,pass);
  var dec = decipher.update(text,'hex','utf8');
  dec += decipher.final('utf8');
  return dec;
}

const createSha256Hash = (value)=>{
  return crypto.createHash("sha256").update(value).digest("hex");
}

tables.forEach((table_name)=>{
  if(!database.tableExists(table_name))
    database.makeTable(table_name);
})

const passExists = (name,password)=>{
   let temp = database.select("passwords").where((obj)=>{return (decrypt(obj.name,password)===name)}).getSelected();
   return (temp.length>0);
}

const selectPass = (name,password)=>{
  return(database.select("passwords").where((obj)=>{return (decrypt(obj.name,password)===name)}));
}

if(database.select("settings").where((obj)=>{
  return(obj.key === "localpass");
}).getSelected().length === 0){
  read({prompt:"Create a local password"},(err,password)=>{
    database.select("settings").insert({key:"localpass",value:createSha256Hash(password)}).write();
    main();
  })
}
else{
  main();
}



function main(){
  let pass_hash = database.select("settings").where((obj)=>{
    if(obj.key === "localpass")
      return true;
    return false;  
  }).getSelected()[0].value;
  read({prompt:"Enter your local password",silent:true},(err,password)=>{
    let password_hash = createSha256Hash(password);
    if(err){
      console.log(err);
      return;
    }
    if(password_hash != pass_hash){
      console.log("Local password does not match.")
      return;
    }
    switch(command){
      case "gen_pass":
        let name = process.argv[3];
        let length = process.argv[4];
        if(length === undefined){
          length = 64;
        }
        length = Math.floor(length/2);
        crypto.randomBytes(length, function(err, buffer) {
          let token = buffer.toString('hex');
          database.select("passwords").insert({name:name,value:encrypt(token,password)}).write();
        });
        break;
      case "get":
        let encrypted_password_queried = selectPass(process.argv[3],password).getSelected()[0];
        if(encrypted_password_queried === undefined){
          console.log("Password does not exist.");
        }
        else{
          let encrypted_password = encrypted_password_queried.value;
          let decrypted_password = decrypt(encrypted_password,password);
          ncp.copy(decrypted_password, function () {
            console.log("Password copied to clipboard.");
          }) 
        }
        break;
      case "add":
        if(passExists(process.argv[3],password)){
          console.log("Password already exists for that service, use edit to edit the password for "+process.argv[3]);
        }
        else{
          database.select("passwords").insert({name:encrypt(process.argv[3],password),value:encrypt(process.argv[4],password)}).write();
          console.log("Password added.");
        }
        break; 
      case "remove":
        if(!passExists(process.argv[3],password)){
          console.log("Password doesn't exist.");
        }
        else{        
          selectPass(process.argv[3],password).deleteItem().write();
          console.log("Password removed");
        }
        break;
      case "edit":
        if(!passExists(process.argv[3],password)){
          console.log("Password doesn't exist.");
        }
        else{
          selectPass(process.argv[3],password).edit((obj)=>{
            obj.value = encrypt(process.argv[4],password);
          }).write();
          console.log("Password editted");
        }
        break; 
      case "setpass":
        database.select("passwords").edit((obj)=>{
          obj.value=encrypt(decrypt(obj.value,password),process.argv[3]);
        }).write();
        database.select("settings").where((obj)=>{
          return (obj.key==="localpass")
        }).edit((obj)=>{
          obj.value = createSha256Hash(process.argv[3]);
        }).write();
        console.log("Local password changed.")
        break;
      case "importpasses":
        let passes_to_import = JSON.parse(fs.readFileSync("./passimport.json","utf8"));
        passes_to_import.forEach((obj)=>{
          if(passExists(obj.name,password)){
            console.log(`Entry exists for ${obj.name}, skipping.`)
          }
          else{
            database.select("passwords").insert({name:obj.name,value:encrypt(obj.value,password)}).write();
            console.log(`${obj.name} added.`);
          }
        })
        break;
      case "listpasses":
      let passes = database.select("passwords").getSelected();
      console.log("Passwords in database:")
      passes.forEach((obj)=>{
        console.log(`${decrypt(obj.name,password)}`);
      })
        break;  
      default:
        console.log("Command not provided or unknown.");
        break; 
  }});
}
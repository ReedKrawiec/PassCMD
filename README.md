# PassCmd
Command Line Password Manager

# Installation
`npm install` before use

## Commands

<> = required

() = optional

### Set your local password
`node passcmd.js setpass <password>`
### add a password
`node passcmd.js add <name> <password>`
### retrieve a password
`node passcmd.js get <name>`
### edit a password
`node passcmd.js edit <name> <newpassword>`
### remove a password
`node passcmd.js remove <name>`
### list password names
`node passcmd.js listpasses`  
### import passwords from passimport.json
`node passcmd.js importpasses`
### generate new password 
`node passcmd.js gen_pass (length)` 

default length = 32 characters 

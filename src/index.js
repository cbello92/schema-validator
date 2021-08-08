import { UserModel } from "./models/UserModel.js"

let userModel = new UserModel();
const body = {
    "userNames": "Camilo",
    "userLastnames": "Bello",
    "userLogin": "camilo.bello",
    "userPassword": "cbello1992",
    "userEmail": "camilo.bello92@gmail.com",
    "userRut": "18.135.346-5",
    "userPhone": "+56987546512"
};

(async function () {
    let validate = await userModel.isValidSchema(body, false);
    console.log(validate)
})()

console.log("Server is running")
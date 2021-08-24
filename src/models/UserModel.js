import { ModelSchema } from "../modelSchema.js";

export class UserModel extends ModelSchema {
  constructor () {
      let schemaModel = {
        "userId": {
            "alias": "Usuario ID",
            "type": "number",
            "required": false
        },
        "userLogin": {
            "alias": "Login",
            "type": "string",
            "required": true
        },
        "userAge": {
            "alias": "Edad",
            "type": "number",
            "required": true
        },
        "userPassword": {
            "alias": "Contraseña",
            "type": "string",
            "required": true
        },
        "userNames": {
            "alias": "Nombres",
            "type": "string",
            "required": true
        },
        "userLastnames": {
            "alias": "Apellidos",
            "type": "string",
            "required": true
        },
        "userEmail": {
            "alias": "Email",
            "type": "string",
            "required": true
        },
        "userRut": {
            "alias": "Rut",
            "type": "string",
            "required": true
        },
        "userPhone": {
            "alias": "Telefono",
            "type": "string",
            "required": false,
            "defaultValue": null,
            "validate": function (value) {
                if(value.length === 1) {
                    return { ok: false, message: "debe contener más de 1 caracter" }
                }
                return { ok: true }
            }
        },
        "userActive": {
            "alias": "Estado de usuario",
            "type": "boolean",
            "required": true,
            "defaultValue": false
        }
      }

      super(schemaModel);
  }
}

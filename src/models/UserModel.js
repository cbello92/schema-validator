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
            "required": true
        },
        "userActive": {
            "alias": "Estado de usuario",
            "type": "boolean",
            "required": false,
            "defaultValue": false
        }
      }

      super(schemaModel);
  }
}

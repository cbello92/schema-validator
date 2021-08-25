# Simple Model Schema Validator

El objetivo principal de este package es validar los objetos JSON a partir de un esquema definido con algunas reglas de negocio. Principalmente consiste en una clase de ES6 de la cuál se pueden extender diferentes definiciones de modelos, en los cuales se definirán reglas como: **required**, **type**, **maxLength**, entre otros.

Por ejemplo creamos un <strong>UserModel</strong> con la siguiente definción:
```json
{
    "userNames": {
        "alias": "Nombres del usuario",
        "type": "string",
        "required": true,
        "maxLength": 25,
        "nameFieldDatabase": "user_name"
    },
    "userLastnames": {
        "alias": "Apellidos del usuario",
        "type": "string",
        "maxLength": 25,
        "required": true,
        "nameFieldDatabase": "user_lastnames"
    },
    "userEmail": {
        "alias": "Correo del usuario",
        "type": "string",
        "required": true,
        "nameFieldDatabase": "user_email"
    },
    "userAge": {
        "alias": "Edad del usuario",
        "type": "string",
        "required": false,
        "defaultValue": null,
        "nameFieldDatabase": "user_age"
    }
}
```
<em>En el ejemplo anterior se han definido las propiedades que debe llevar nuestro objeto <strong>User</strong> que se definirá como una clase de JavaScript, la que se vería de la siguiente manera:</em>

```js
import { ModelSchema } from "simple-model-schema-validator"; //importamos el paquete
export class UserModel extends ModelSchema {
    // Contructor de la clase que representa User
    constructor () {
        //Definición del esquema, con reglas de negocio 
        const schemaModel = {
            "userNames": {
                "alias": "Nombres del usuario",
                "type": "string",
                "required": true,
                "maxLength": 25,
                "nameFieldDatabase": "user_name"
            },
            "userLastnames": {
                "alias": "Apellidos del usuario",
                "type": "string",
                "maxLength": 25,
                "required": true,
                "nameFieldDatabase": "user_lastnames"
            },
            "userEmail": {
                "alias": "Correo del usuario",
                "type": "string",
                "required": true,
                "nameFieldDatabase": "user_email"
            },
            "userAge": {
                "alias": "Edad del usuario",
                "type": "string",
                "required": false,
                "defaultValue": null,
                "nameFieldDatabase": "user_age"
            }
        }

        super(schemaModel);
    }
}
```

## Propiedades permitidas

| Propiedad      | Descripcion | 
| :---        |    :----:   |     
| alias      | El nombre con el que aparecerá la propiedad en el manejo de errores, en caso de incumplir las reglas definidas en el modelo       | 
| type   | Tipo de dato de la propiedad definida        | 
| required   | Indica si la propiedad es requerida        | 
| defaultValue   | Establece un valor por defecto en el caso de que **required** haya sido definido como **false**       | 
| maxLength   | Para el caso de los strings define la cantidad de caracteres máximo permitido         | 
| nameFieldDatabase   | Cuando se requiera hacer un match entre el nombre virtual definido en el esquema con el nombre real que tiene en base de datos         | 
| validate   | Propiedad especial para alojar una función que realice validaciones extras, como por ejemplo: validar correos, fechas o un rut         | 

### Ejemplo de uso propiedad validate
_En el siguiente ejemplo se emplea una validación para la propiedad **userAge**, en donde se verifica mediante el uso de una función que el usuario sea mayor de edad_
```js
const schemaModel = {
    "userNames": {
        "alias": "Nombres del usuario",
        "type": "string",
        "required": true,
        "maxLength": 25,
        "nameFieldDatabase": "user_name"
    },
    "userLastnames": {
        "alias": "Apellidos del usuario",
        "type": "string",
        "maxLength": 25,
        "required": true,
        "nameFieldDatabase": "user_lastnames"
    },
    "userEmail": {
        "alias": "Correo del usuario",
        "type": "string",
        "required": true,
        "nameFieldDatabase": "user_email"
    },
    "userAge": {
        "alias": "Edad del usuario",
        "type": "number",
        "required": false,
        "defaultValue": null,
        "nameFieldDatabase": "user_age",
        "validate": function(value) {
            if(value < 18) {
                return {
                    ok: false,
                    message: "Eres menor de edad"
                }
            }
            return {
                ok: true
            }
        }
    }
}
```
_El retorno que deben tener las funciones encapsuladas en la propiedad <strong>validate</strong>, deben tener el siguiente formato:_
1. Caso negativo :x:
```json
return {
    "ok": false,
    "message": "Mensaje de error"
}
```

1. Caso positivo :white_check_mark:
```json
return {
    "ok": true
}
```

# Usando el modelo UserModel
```js
// Importtamos el modelo definido
import { UserModel } from "./models/UserModel.js";

// Creamos una nueva instancia
let userModel = new UserModel();

// Body de prueba con datos reales
const bodyAll = {
    "userNames": "Camilo",
    "userLastnames": "Bello",
    "userEmail": "camilo.bello92@gmail.com",
    "userAge": 29
};

const bodyParticular = {
    "userNames": "Camilo",
    "userLastnames": "Bello"
};

// Función de prueba que se ejecutará apenas corramos nuestro archivo
(async function () {
    // El paquete tiene un método disponible llamado "isValidSchema",
    // el cual es el encargado de llevar a cabo el proceso de validación
    // de nuestro body según lo definido en el modelo
    // análisis estricto
    let validate = await userModel.isValidSchema(body);

    // analizará solo las propiedades 
    let validate = await userModel.isValidSchema(bodyParticular, true);
    console.log(validate)
})()
```

Cabe mencionar que el método **isValidSchema** recibe 2 argumentos, el primero es el body con la data que se debe validar, y el segundo parámetro es **particularFields** que por defecto es **false**. Cuando está en **false** quiere decir que el análisis será más estricto, debido a que el body analizado debe cumplir por completo con lo definido en el modelo **UserModel**. Si el valor esta en **true**, quiere decir que solo analizará lo que sea pasado en el body, es decir que por ejemplo para el caso del body anterior
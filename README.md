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
<em>En el ejemplo anterior se han definido las propiedades que debe llevar nuestro objeto <strong>User</strong> que se definirá como una clase de JavaScript que se extenderá de la clase **ModelSchema**, como se muestra a continuación:</em>

```js
//importamos el paquete
import { ModelSchema } from "simple-model-schema-validator"; 
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
    // análisis estricto (para validar antes de hacer un insert en BD)
    let bodyValidateAll = await userModel.isValidSchema(body);

    // analizará solo las propiedades enviadas (que se van a actualizar en BD)
    let bodyValidateParticular = await userModel.isValidSchema(bodyParticular, true);
    console.log(bodyValidateAll);
    console.log(bodyValidateParticular);
})()
```

### Método isValidSchema

El método **isValidSchema** recibe 2 argumentos, el primero es el body con la data que se debe validar, y el segundo parámetro es **particularFields** que por defecto es **false**. 
1. Cuando está en **false** quiere decir que el análisis será más estricto y va más orientado a el análisis antes de realizar un **insert** en base de datos, debido a que el body analizado debe cumplir por completo con lo definido en el **UserModel**. 
2. Si el valor esta en **true**, quiere decir que solo analizará lo que se ha establecido en el body, es decir que por ejemplo para el caso de la constante **bodyParticular** definida anteriormente, solo analizará las propiedades userNames y userLastnames; esto va más orientado a realizar dicha validación antes de ejecutar un **update** en base datos

#### ¿Que retorna el método isValidSchema?
Existen dos tipos de retorno los cuales serán especificados a continuación:

1. Caso negativo :x:

```json
{
    "ok": false,
    "dataErrors": {
        "userNames": [
            "Nombres es requerido"
        ],
        "userLastnames": [
            "Apellidos puede contener hasta 25 caracteres"    
        ]
    },
    "messages": [
        "Nombres es requerido",
        "Apellidos puede contener hasta 25 caracteres"
    ]
}
```
_Cuando se han encontrado errores según lo definido en el modelo, se pueden identificar 3 propiedades fundamentales que son las siguientes:_

| Propiedad      | Descripcion | 
| :---        |    :----:   |   
| ok        |    Propiedad que identifica si el proceso ha sido correcto o no (para este caso es **false**)  |
| dataErrors        |    Agrupa los errores según campo o columna, puede ser utilizado perfectamente para mostrar los errores de formulario desde el frontend  |
| messages        |    Propiedad que tiene todos los errores encontrados en formato de lista de strings  |


2. Caso positivo :white_check_mark:

```json
{
    "ok": true,
    "body": {
        "userNames": "Camilo",
        "userLastnames": "Bello",
        "userEmail": "camilo.bello92@gmail.com",
        "userAge": 29
    }
}
```
_Cuando la validación ha sido correcta, el retorno trae 2 propiedades. En donde una de ellas es el **body**, el cual se ordena tal cual como esta definido el modelo que lo valida (**UserModel**), **lo ideal es utilizar este body ordenado** si desea insertar o modificar registros en base de datos. Las propiedades mencionadas se describen a continuación:_

| Propiedad      | Descripcion | 
| :---        |    :----:   |   
| ok        |    Propiedad que identifica si el proceso ha sido correcto o no (para este caso es **true**)  |
| body        |    Body ordenado según definición de modelo  | 

### ¿Otro ejemplo? :+1::+1::+1:

A continuación un código fuente de ejemplo, utilizando el **modelo** y el método **isValidSchema**

```js
import { UserModel } from "../../../domain/model";
import { UserRepository } from "../../../domain/repository";
import * as EventsDomain from '@eventsDomain';
import * as UsertDTO from '../../../domain/DTO';

export const createNewUser = async (body) => {
    // instancia de modelo de usuario
    // definición de UserModel mencionado anteriormente
    const userModel = new UserModel();
    const userRepository = new UserRepository();

    // se ejecuta el metodo isValidSchema, pasando como parámetro el body
    // para este caso no se indica el 2° parámetro puesto que por defecto es **false**,
    // ya que se requiere el análisis sea estricto
    const bodyValidate = await userModel.isValidSchema(body);

    // en el caso de que la respuesta traiga la propiedad 'ok' con valor false
    // quiere decir que se han encontrados errores según lo definido en el modelo
    if (bodyValidate.hasOwnProperty('ok') && bodyValidate.ok === false) {
        // se detiene la ejecución del código enviando todos los errores encontrados
        return EventsDomain.schemaInvalid(bodyValidate);
    }

    // si todo ha ido bien, se procede a persistir en base datos en el usuario, utilizando
    // el body que retorna el método isValidSchema (bodyValidate.body)
    const userCreated = await userRepository.save(bodyValidate.body);
    return EventsDomain.successfullySaved(DepartmentDTO.single(userCreated));
}
```

# Método prepareQueryUpdate
Metodo encargado de preparar queries para modificación de datos ayudándose del esquema del modelo definido realizando un match del nombre del 
campo virtual con el nombre del campo físico en base de datos
```js
// En nuestro respository.js
// Ejemplo de "criteria"
const criteria = { "where": { "userId": 1 } };
async updateByCriteria (connection, criteria, body) {
    // Instanciamos nuestro model que contiene las definciones de campos virtuales y físicos de base datos
    const userModel = new UserModel();
    // query base
    let query = "UPDATE user SET";
        * 
    // Invocamos el méotodo para realizar la creación de los campos a setear y la cláusula where
    let { setFields, whereFields } = userModel.prepareQueryUpdate(body, criteria);
        * 
    // Validamos que el body no esté vacío, si no está vacío se procede a la concatenación de la query
    if (Object.keys(body).length > 0) {
        // Concatenamos la query base con lo retonardo por el método
        query = `
            ${query}
            ${setFields}
            ${whereFields}
        ` ;
    }
} 
```
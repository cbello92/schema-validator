/**
 * Clase base (heredable) para crear instancias de esquemas que representan "tablas de base de datos".
 * Nos da la flexibilidad de crear reglas de negocio tanto para insertar o modificar informacion en las tablas que deseamos representar. 
 * 
 * @class
 * @author Camilo Bello [<camilo.bello@crecic.cl>]
 */

 export class ModelSchema {

  /**
   * Metodo constructor encargado de crear un nuevo esquema dependiendo del medio donde sea llamado
   * @constructs ModelSchema
   * @param {Object} schema Definicion del esquema
   */
  constructor(schema) {
      this.schemaModel = schema;

      // Set de data types
      this.dataTypes = [
          { "name": "string", "showMessage": "texto" },
          { "name": "boolean", "showMessage": "verdadero o falso" },
          { "name": "number", "showMessage": "númerico" },
          { "name": "object", "showMessage": "objeto" },
          { "name": "function", "showMessage": "función" }
      ];

      // Alamecenes para errores
      this.errors = [];
      this.dataErrors = {};
  }

  useDefaultValue(property, element) {
      if (
          !property &&
          this.schemaModel[element].hasOwnProperty('required') &&
          this.schemaModel[element].required === false &&
          this.schemaModel[element].hasOwnProperty('defaultValue')
      ) {
          return true;
      }
      return false;
  }

  isValidDataType(property, body) {
      if ((property && body && typeof body[property] !== this.schemaModel[property].type) ||
          (property && this.schemaModel[property].type === 'number' && typeof body[property] === "number" && body[property].toString() === "NaN")) {
          return false;
      }

      return true;
  }

  setMessageTypeData(dataType) {
      return this.dataTypes.find(type => type.name === dataType)?.showMessage || '';
  }

  setErrorsFound(property, newError) {
      this.errors = [...this.errors, newError];
      this.dataErrors[property] = [...this.dataErrors[property], newError];
  }

  /**
   * Metodo encargado de validar el objeto que deseamos guardar en base de datos en base al esquema definido, comprobando si las reglas
   * de negocio se cumplen en lo definido en el esquema
   * @param {Object} body Objeto que sera utilizado para ser validado con el esquema definido
   * @param {Boolean} particularFields Indica si queremos analizar todos los campos según lo definido en el model. Por defecto su valor es "false"
   * @return {Object} Retorna un objeto con el body del request (peticion HTTP) validado y ordenado por sus propiedades (segun esquema)
   */
  async isValidSchema(body, particularFields = false) {
      let keysBodyEntry = Object.keys(body)
      let keysSchema = Object.keys(this.schemaModel)

      // SE VALIDA QUE NO EXISTAN PROPIEDADES CON VALORES UNDEFINED
      if (keysBodyEntry.some(key => body.hasOwnProperty(key) && body[key] === undefined)) {
          this.errors = [...this.errors, `No se permiten valores indefinidos`]
      }

      // FILTRAMOS SÓLO LAS PROPIEDADES DEL ESQUEMA SEGÚN EL BODY QUE ESTAMOS RECIBIENDO
      if (particularFields === true) {
          keysSchema = keysSchema.filter(x => keysBodyEntry.find(y => y === x))
      }

      let orderBody = {}
      for (let keyName of keysSchema) {
          const propertySchema = keyName;
          if (!this.dataErrors.hasOwnProperty(propertySchema)) {
              this.dataErrors[propertySchema] = [];
          }

          let findKey = keysBodyEntry.find(x => x === propertySchema)
          if (findKey && typeof body[propertySchema] === 'string') {
              body[propertySchema] = body[propertySchema].trim()
          }

          if (this.useDefaultValue(findKey, propertySchema)) {
              body[propertySchema] = this.schemaModel[propertySchema].defaultValue
          }
          let dataTypeIsValid = !this.isValidDataType(findKey, body)
              ? `${this.schemaModel[propertySchema].alias} debe ser de tipo ${this.setMessageTypeData(this.schemaModel[propertySchema].type)}`
              : null

          if (
              this.schemaModel[propertySchema].hasOwnProperty('type') &&
              body[propertySchema] !== null &&
              dataTypeIsValid
          ) {
              this.setErrorsFound(propertySchema, dataTypeIsValid);
          }

          if (
              (!findKey &&
                  this.schemaModel[propertySchema].required &&
                  !particularFields) ||
              (findKey &&
                  typeof body[propertySchema] === 'string' &&
                  this.schemaModel[propertySchema].required &&
                  body[propertySchema].length === 0) ||
              (findKey &&
                  this.schemaModel[propertySchema].required &&
                  body[propertySchema] === null)
          ) {
              let stringRequired = `${this.schemaModel[propertySchema].alias} es requerido`
              this.setErrorsFound(propertySchema, stringRequired);
          }

          if (
              findKey &&
              typeof body[propertySchema] === 'string' &&
              this.schemaModel[propertySchema].hasOwnProperty('maxLength') &&
              body[propertySchema].length > this.schemaModel[propertySchema].maxLength
          ) {
              let maxCharactersString = `${this.schemaModel[propertySchema].alias} puede contener hasta ${this.schemaModel[propertySchema].maxLength} caracteres`
              this.setErrorsFound(propertySchema, maxCharactersString);
          }

          if (
              findKey &&
              this.schemaModel[propertySchema].hasOwnProperty('validate') &&
              typeof this.schemaModel[propertySchema].validate === "function" &&
              body[propertySchema] !== null
          ) {
              let validate = this.schemaModel[propertySchema].validate(
                  body[propertySchema]
              );
              if (validate.hasOwnProperty('ok') && validate.ok === false) {
                  let message = `${this.schemaModel[propertySchema].alias}: ${validate?.message}`;
                  this.setErrorsFound(propertySchema, message);
              } else {
                  if (validate[propertySchema]) {
                      body[propertySchema] = validate[propertySchema]
                  }
              }
          }

          this.errors = [...new Set(this.errors.map(e => e))]
          this.dataErrors[propertySchema] = [...new Set(this.dataErrors[propertySchema].map(e => e))];

          if (
              !this.schemaModel[propertySchema].hasOwnProperty('notIncluded') &&
              body[propertySchema] !== undefined
          ) {
              orderBody = { ...orderBody, [propertySchema]: body[propertySchema] }
          }
      }

      let keysErrorsDataWithArrayEmpty = Object.keys(this.dataErrors)
          .filter(key => this.dataErrors[key] && this.dataErrors[key].length === 0);

      keysErrorsDataWithArrayEmpty.forEach(key => {
          if (this.dataErrors.hasOwnProperty(key)) {
              delete this.dataErrors[key];
          }
      })

      if (this.errors.length > 0) {
          return {
              ok: false,
              dataErrors: this.dataErrors,
              messages: this.errors
          }
      }

      return {
          ok: true,
          body: orderBody
      }
  }

  equalsObjects(objBD, bodyToUpdate) {
      let differences = [];

      if (objBD && bodyToUpdate) {
          let aKeys = Object.keys(objBD).sort();
          let bKeys = Object.keys(bodyToUpdate).sort();

          for (let i = 0; i < aKeys.length; i++) {
              let messageCustom = bodyToUpdate[bKeys[i]];
              if (this.schemaModel.hasOwnProperty(aKeys[i]) && this.schemaModel[aKeys[i]] && this.schemaModel[aKeys[i]].hasOwnProperty('messageCustom')) {
                  messageCustom = this.schemaModel[aKeys[i]]['messageCustom'](bodyToUpdate[bKeys[i]]);
              }

              if (
                  Array.isArray(bodyToUpdate[aKeys[i]])
                  && Array.isArray(objBD[aKeys[i]])
                  && bodyToUpdate[aKeys[i]].length !== objBD[aKeys[i]].length
              ) {
                  differences.push(`${this.schemaModel.hasOwnProperty(aKeys[i]) && this.schemaModel[aKeys[i]] ? this.schemaModel[aKeys[i]].alias : aKeys[i]}: ${messageCustom}`)
              }

              if (
                  typeof bodyToUpdate[aKeys[i]] === 'object'
                  && bodyToUpdate[aKeys[i]]
                  && Object.keys(bodyToUpdate[aKeys[i]]).length > 0
              ) {
                  let difObj = this.equalsObjects(objBD[aKeys[i]], bodyToUpdate[aKeys[i]]);
                  if (difObj && difObj.length > 0) {
                      differences = [...differences, `${this.schemaModel.hasOwnProperty(aKeys[i]) && this.schemaModel[aKeys[i]] ? this.schemaModel[aKeys[i]].alias : aKeys[i]}: ${messageCustom}`]
                  }
              } else {
                  if (objBD.hasOwnProperty(aKeys[i]) && bodyToUpdate.hasOwnProperty(aKeys[i]) && objBD[aKeys[i]] !== bodyToUpdate[aKeys[i]]) {
                      differences.push(`${this.schemaModel.hasOwnProperty(aKeys[i]) && this.schemaModel[aKeys[i]] ? this.schemaModel[aKeys[i]].alias : aKeys[i]}: ${messageCustom}`)

                  }
              }
          }
      }
      return [...new Set(differences.map(diff => diff))];
  }

  /**
   * Metodo encargado de preparar queries para modificación de datos ayudándose del esquema del modelo definido realizando un match del nombre del 
   * campo virtual con el nombre del campo físico en base de datos
   * @param {Object} body Objeto utilizado para realizar el match entre lo definido en el modelo y la información que se modificará (body)
   * @param {Object} whereClausule Objeto que contiene el where y el operador de compración
   * @param {Object} whereClausule.where Objeto where que contiene la condición que se establecerá al momento de construir la query de modificación de datos
   * @param {String} whereClausule.operator Operador de comparación para cláusula where, por defecto su valor es "="
   * @return {Object} Retorna un objeto con el "setFields" en formato string y "whereFields" en formato string
   * @example <caption>Creación de update dinámico</caption>
   * // En nuestro respository.js
   * // Ejemplo de "criteria"
   * const criteria = { "where": { "roleId": 1 } };
   * async updateByCriteria (connection, criteria, body) {
   *      // Instanciamos nuestro model que contiene las definciones de campos virtuales y físicos de base datos
   *      const roleModel = new RoleModel();
   *      // query base
   *      let query = "UPDATE rol SET";
   * 
   *      // Invocamos el méotodo para realizar la creación de los campos a setear y la cláusula where
   *      let { setFields, whereFields } = roleModel.prepareQueryUpdate(body, criteria);
   * 
   *      // Validamos que el body no esté vacío, si no está vacío se procede a la concatenación de la query
   *      if (Object.keys(body).length > 0) {
   *          // Concatenamos la query base con lo retonardo por la función
   *          query = `
   *              ${query}
   *              ${setFields}
   *              ${whereFields}
   *          ` ;
   *      }
   * } 
   */
  prepareQueryUpdate(body, { where, operator = "=" }) {
      let keysWhere = Object.keys(where);
      let keysBodyEntry = Object.keys(body);
      let keysSchema = Object.keys(this.schemaModel);
      let setFields = '';
      let whereFields = ' WHERE ';

      let param = keysWhere.length + 1;

      for (let index = 0; index < keysWhere.length; index++) {
          const element = keysWhere[index];
          let findKey = keysSchema.find(x => x === element);
          if (findKey) {
              whereFields += ` ${this.schemaModel[findKey]['nameFieldDatabase']} ${operator} $${index + 1}`
          }

          if (index < keysWhere.length - 1) whereFields += ' AND '
      }

      for (let index = 0; index < keysBodyEntry.length; index++) {
          const element = keysBodyEntry[index];
          let findKey = keysSchema.find(x => x === element);
          if (findKey) {
              setFields += ` ${this.schemaModel[findKey]['nameFieldDatabase']} = $${param}`
              param++;
              if (index < keysBodyEntry.length - 1) setFields += ', '
          }
      }

      whereFields += ` RETURNING *`;

      return {
          setFields,
          whereFields
      };
  }

  getAllKeysModelSchema() {
      let keysSchema = Object.keys(this.schemaModel);
      return keysSchema;
  }
}
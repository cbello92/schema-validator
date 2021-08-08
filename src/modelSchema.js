export class ModelSchema {
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
    if (
      (
        property &&
        body &&
        typeof body[property] !== this.schemaModel[property].type
      ) ||
      (
        property && this.schemaModel[property].type === 'number' && typeof body[property] === "number" && body[property].toString() === "NaN"
      ) 
    ) {
      return false;
    }

    return true;
  }

  setMessageTypeData(dataType) {
    return this.dataTypes.find(type => type.name === dataType).showMessage || '';
  }

  setErrorsFound (property, newError) {
    //let { errors, dataErrors, property } = params;
    this.errors = [...this.errors, newError];
    this.dataErrors[property] = [...this.dataErrors[property], newError];
  }

  async isValidSchema(body, particularFields = false) {
    let keysBodyEntry = Object.keys(body)
    let keysSchema = Object.keys(this.schemaModel)

    // SE VALIDA QUE NO EXISTAN PROPIEDADES CON VALORES UNDEFINED
    if (
      keysBodyEntry.some(
        key => body.hasOwnProperty(key) && body[key] === undefined
      )
    ) {
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
}

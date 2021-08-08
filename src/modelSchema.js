export class ModelSchema {
  constructor (schema) {
    this.schemaModel = schema
  }

  useDefaultValue (property, element) {
    if (
      !property &&
      this.schemaModel[element].hasOwnProperty('required') &&
      this.schemaModel[element].required === false &&
      this.schemaModel[element].hasOwnProperty('defaultValue')
    ) {
      return true
    }
    return false
  }

  isValidDataType (property, body) {
    if (
      property &&
      body &&
      typeof body[property] !== this.schemaModel[property].type
    ) {
      return false
    }

    return true
  }

  async isValidSchema (body, particularFields = false) {
    let keysBodyEntry = Object.keys(body)
    let keysSchema = Object.keys(this.schemaModel)
    let errors = []

    // SE VALIDA QUE NO EXISTAN PROPIEDADES CON VALORES UNDEFINED
    if (
      keysBodyEntry.some(
        key => body.hasOwnProperty(key) && body[key] === undefined
      )
    ) {
      errors = [...errors, `No se permiten valores undefined`]
    }

    // SI ENVÍAMOS PROPIEDADES NO DEFINIDAS EN EL MODEL
    if (keysBodyEntry.some(key => !this.schemaModel.hasOwnProperty(key))) {
      errors = [...errors, `Existen propiedades no permitidas aquí`]
    }

    // FILTRAMOS SÓLO LAS PROPIEDADES DEL ESQUEMA SEGÚN EL BODY QUE ESTAMOS RECIBIENDO
    if (particularFields === true) {
      keysSchema = keysSchema.filter(x => keysBodyEntry.find(y => y === x))
    }

    let orderBody = {}
    let dataErrors = {}

    for (let index = 0; index < keysSchema.length; index++) {
      const propertySchema = keysSchema[index]
      if (!dataErrors.hasOwnProperty(propertySchema)) {
        dataErrors[propertySchema] = []
      }

      let findKey = keysBodyEntry.find(x => x === propertySchema)
      if (findKey && typeof body[propertySchema] === 'string') {
        body[propertySchema] = body[propertySchema].trim()
      }

      if (this.useDefaultValue(findKey, propertySchema)) {
        body[propertySchema] = this.schemaModel[propertySchema].defaultValue
      }
      let dataTypeIsValid = !this.isValidDataType(findKey, body)
        ? `${this.schemaModel[propertySchema].alias} debe ser de tipo ${this.schemaModel[propertySchema].type}`
        : null

      if (
        this.schemaModel[propertySchema].hasOwnProperty('type') &&
        body[propertySchema] &&
        dataTypeIsValid
      ) {
        errors = [...errors, dataTypeIsValid]
        dataErrors[propertySchema] = [
          ...dataErrors[propertySchema],
          dataTypeIsValid
        ]
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
        errors = [...errors, stringRequired]
        dataErrors[propertySchema] = [
          ...dataErrors[propertySchema],
          stringRequired
        ]
      }

      if (
        findKey &&
        typeof body[propertySchema] === 'string' &&
        this.schemaModel[propertySchema].hasOwnProperty('maxLength') &&
        body[propertySchema].length > this.schemaModel[propertySchema].maxLength
      ) {
        let maxCharactersString = `${this.schemaModel[propertySchema].alias} puede contener hasta ${this.schemaModel[propertySchema].maxLength} caracteres`
        errors = [...errors, maxCharactersString]
        dataErrors[propertySchema] = [
          ...dataErrors[propertySchema],
          maxCharactersString
        ]
      }

      if (
        findKey &&
        this.schemaModel[propertySchema].hasOwnProperty('validate') &&
        body[propertySchema]
      ) {
        let validate = this.schemaModel[propertySchema].validate(
          body[propertySchema]
        )
        if (validate.hasOwnProperty('ok') && validate.ok === false) {
          let message = `${this.schemaModel[propertySchema].alias}: ${validate?.message}`
          errors = [...errors, message]
          dataErrors[propertySchema] = [...dataErrors[propertySchema], message]
        } else {
          if (validate[propertySchema]) {
            body[propertySchema] = validate[propertySchema]
          }
        }
      }

      errors = [...new Set(errors.map(e => e))]
      dataErrors[propertySchema] = [...new Set(dataErrors[propertySchema].map(e => e))];

      if (
        !this.schemaModel[propertySchema].hasOwnProperty('notIncluded') &&
        body[propertySchema] !== undefined
      ) {
        orderBody = { ...orderBody, [propertySchema]: body[propertySchema] }
      }
    }

    let keysDataErrorsWithArrayEmpty = Object.keys(dataErrors)
          .filter(key => dataErrors[key] && dataErrors[key].length === 0);
    
          keysDataErrorsWithArrayEmpty.forEach(key => {
        if(dataErrors.hasOwnProperty(key)) {
            delete dataErrors[key];
        }
    })

    if (errors.length > 0) {

      return {
        ok: false,
        dataErrors,
        messages: errors
      }
    }

    return {
      ok: true,
      body: orderBody
    }
  }
}

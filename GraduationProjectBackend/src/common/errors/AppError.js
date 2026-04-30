//what does this file do? It defines a custom error class AppError that extends the built-in Error class. This class is used to create application-specific errors with additional properties like statusCode and code.


export class AppError extends Error {
  constructor(message, statusCode = 400, code = "BAD_REQUEST") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

//بنطلع ايرور موحد للفرونت

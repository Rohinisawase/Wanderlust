class ExpressError extends Error {
    constructor(message, statusCode) {
      super();
      this.message = message;
      this.statusCode = statusCode||500;
    }
  }
  module.exports = ExpressError;
  
  
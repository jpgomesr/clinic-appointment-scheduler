export class AppError extends Error {
   status: number;

   constructor(status: number, message: string) {
      super(message);
      this.status = status;
   }

   static badRequest(message: string) {
      return new AppError(400, message);
   }

   static unauthorized(message: string) {
      return new AppError(401, message);
   }

   static notFound(message: string) {
      return new AppError(404, message);
   }

   static conflict(message: string) {
      return new AppError(409, message);
   }
}

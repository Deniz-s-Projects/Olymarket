import { plainToInstance } from "class-transformer";
import { validate } from "class-validator";
import { RequestHandler } from "express";

export function validationMiddleware<T>(type: new () => T): RequestHandler {
  return async (req, res, next) => {
    const dto = plainToInstance(type, req.body);
    const errors = await validate(dto as object);
    if (errors.length > 0) {
      const messages = errors
        .map((error) => Object.values(error.constraints ?? {}))
        .flat();
      return res.status(400).json({ errors: messages });
    }

    req.body = dto;
    next();
  };
}

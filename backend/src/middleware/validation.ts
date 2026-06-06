import { NextFunction, Request, Response } from "express";
import { ZodSchema, ZodError } from "zod";
import { HttpError } from "../utils/http";

export type ValidateSource = "body" | "query" | "params";

export function validate(schema: ZodSchema, source: ValidateSource = "body") {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const data = source === "body" ? req.body : source === "query" ? req.query : req.params;
      const validated = schema.parse(data);

      if (source === "body") {
        req.body = validated as any;
      } else if (source === "query") {
        req.query = validated as any;
      } else {
        req.params = validated as any;
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
        next(new HttpError(400, message, { errors: error.issues }));
      } else {
        next(error);
      }
    }
  };
}

import { Cliente } from "../models";

export class UserService {
  constructor() {}

  public async getUserByPhone(phone: string) {
    const user = await Cliente.findOne({
      where: { celular: phone },
      raw: true,
    });

    console.log("user ->", JSON.stringify(user));
    if (!user) {
      throw new Error("User not found");
    }

    return user;
  }
}

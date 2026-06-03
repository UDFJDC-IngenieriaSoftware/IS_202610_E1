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

  public async createUser(clientParams: {
    names: string;
    lastnames: string;
    email: string;
    phone: string;
  }) {
    console.log("Creating User ", JSON.stringify(clientParams));

    const user = await Cliente.create({
      nombres: clientParams.names,
      apellidos: clientParams.lastnames,
      email: clientParams.email,
      celular: clientParams.phone,
    });
    return user;
  }

  public async getOrCreateUser(phone: string, name?: string) {
    const existing = await Cliente.findOne({ where: { celular: phone } });
    if (existing) return existing;
    return Cliente.create({
      celular: phone,
      nombres: name ?? "Cliente",
      apellidos: "-",
      email: `${phone}@miturno.local`,
    });
  }
}

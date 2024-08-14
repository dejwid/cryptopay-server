import {SessionOptions} from "iron-session";

export interface SessionData {
  productId: string;
  accessCode: string;
}

export const defaultSession: SessionData = {
  productId: '',
  accessCode: "",
};

export const sessionOptions: SessionOptions = {
  password: process.env.AUTH_SECRET as string,
  cookieName: "product-session",
  cookieOptions: {
    // secure only works in `https` environments
    // if your localhost is not on `https`, then use: `secure: process.env.NODE_ENV === "production"`
    secure: false,
  },
};
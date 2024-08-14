'use server';
import {defaultSession, SessionData, sessionOptions} from "@/libs/session";
import {getIronSession} from "iron-session";
import {cookies} from "next/headers";

export async function getSession() {
  const session = await getIronSession<SessionData>(cookies(), sessionOptions);

  if (!session.accessCode) {
    session.accessCode = defaultSession.accessCode;
  }
  if (!session.productId) {
    session.productId = defaultSession.productId;
  }

  return session;
}
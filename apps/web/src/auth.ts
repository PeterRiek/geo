import NextAuth, { NextAuthConfig } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

const JWT_SECRET = process.env.NEXTAUTH_SECRET;

export const authConfig: NextAuthConfig = {
  session: {
    strategy: "jwt",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        try {
          const res = await fetch(`${process.env.API_URL}/auth/login`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              username: credentials?.username,
              password: credentials?.password,
            }),
          });

          if (!res.ok) throw new Error("Invalid credentials");

          const user = await res.json();

          return {
            name: user.username,
            accessToken: user.token,
          };
        } catch (err) {
          console.error("Login failed:", err);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.accessToken = user.accessToken;
        token.name = user.name!;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.name = token.name;
        session.accessToken = token.accessToken;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  secret: process.env.NEXTAUTH_SECRET,
}

export const { auth, handlers, signIn, signOut } = NextAuth(authConfig);

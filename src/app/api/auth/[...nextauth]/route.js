import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

const handler = NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    }),
  ],
  session: {
    strategy: "jwt", // or "database" if you're storing sessions
  },
  callbacks: {
    // Here you can augment the session or token if you want
    async session({ session, token }) {
      // Attach Google user id to session (optional, for backend auth)
      if (token && session.user) {
        session.user.id = token.sub
      }
      return session;
    },
    // Optionally, for a custom save to your DB:
    async signIn({ user, account, profile, email, credentials }) {
      // You can perform actions like
      // - only allow emails from certain domains
      // - create/update user in your database, etc.
      // Return true to continue, or false to block sign-in.
      return true;
    }
  },
  // secret: process.env.NEXTAUTH_SECRET, // make sure to set this in prod
});

export { handler as GET, handler as POST };

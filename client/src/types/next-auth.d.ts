import 'next-auth';

declare module 'next-auth' {
  /**
   * Extend the built-in session types
   */
  interface Session {
    user: {
      name?: string | null;
      email?: string | null;
      image?: string | null;
      backendId?: string | number;
    };
  }

  /**
   * Extend the built-in user types
   */
  interface User {
    backendId?: string | number;
  }
}

declare module 'next-auth/jwt' {
  /**
   * Extend the built-in JWT types
   */
  interface JWT {
    backendId?: string | number;
  }
}
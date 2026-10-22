export class User {
  id: string;
  email: string;
  username: string;
  displayName: string;
  password: string; // encoded Argon2id record, never returned
  verified: boolean;
}

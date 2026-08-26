export enum Roles {
  USER,
  ADMIN,
}

export type Role = (typeof Roles)[keyof typeof Roles];

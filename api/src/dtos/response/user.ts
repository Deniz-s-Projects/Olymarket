import { User } from "../../entities/User";

export type PublicUserDto = {
  id: string;
  name: string;
  location: string | null;
  bio: string | null;
  joinedAt: string;
  updatedAt: string;
};

export const mapUserToPublicDto = (user: User): PublicUserDto => ({
  id: user.id,
  name: user.name,
  location: user.location,
  bio: user.bio,
  joinedAt: user.createdAt.toISOString(),
  updatedAt: user.updatedAt.toISOString(),
});

-- CreateTable
CREATE TABLE "users" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "displayName" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "verified" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- Case-insensitive uniqueness; stored email/username casing is preserved.
CREATE UNIQUE INDEX "users_email_lower_key" ON "users" (LOWER("email"));
CREATE UNIQUE INDEX "users_username_lower_key" ON "users" (LOWER("username"));

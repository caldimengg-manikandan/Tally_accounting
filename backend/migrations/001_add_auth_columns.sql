-- ============================================================
-- Migration: 001_add_auth_columns.sql
-- Date: 2026-06-11
-- Description: Auth security hardening — Phase 1 & 2 column additions
-- Run once against your database (psql / MySQL client / pgAdmin)
-- ============================================================

-- Phase 1: Mark accounts that were created via Google OAuth.
-- These accounts should not be accessible via password login.
-- Default false: all existing accounts are treated as password-capable.
ALTER TABLE "Users"
  ADD COLUMN IF NOT EXISTS "oauthOnly" BOOLEAN NOT NULL DEFAULT false;

-- Phase 2: Replay detection for refresh token rotation.
-- When a refresh token is used to rotate, it is marked used=true.
-- A second use of the same token triggers full session invalidation.
ALTER TABLE "RefreshTokens"
  ADD COLUMN IF NOT EXISTS "used" BOOLEAN NOT NULL DEFAULT false;

-- Phase 3: MFA secret storage
-- If RefreshTokens table doesn't exist yet, create it.
CREATE TABLE IF NOT EXISTS "RefreshTokens" (
  "id"              UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "token"           VARCHAR(255) NOT NULL UNIQUE,
  "expiresAt"       TIMESTAMP WITH TIME ZONE NOT NULL,
  "deviceInfo"      VARCHAR(255),
  "revokedAt"       TIMESTAMP WITH TIME ZONE,
  "replacedByToken" VARCHAR(255),
  "used"            BOOLEAN NOT NULL DEFAULT false,
  "UserId"          UUID NOT NULL,
  "createdAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Phase 3: MFA secret table
CREATE TABLE IF NOT EXISTS "MfaSecrets" (
  "id"        UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  "userId"    UUID NOT NULL UNIQUE,
  "secret"    VARCHAR(255) NOT NULL,
  "verified"  BOOLEAN NOT NULL DEFAULT false,
  "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- ── MySQL / MariaDB equivalent (uncomment if using MySQL) ──────────────────
-- ALTER TABLE Users ADD COLUMN IF NOT EXISTS oauthOnly TINYINT(1) NOT NULL DEFAULT 0;
-- ALTER TABLE RefreshTokens ADD COLUMN IF NOT EXISTS used TINYINT(1) NOT NULL DEFAULT 0;

import crypto from "crypto";
import { v4 as uuid } from "uuid";
import { getDatabase } from "../models/schema.js";
import { hashPassword } from "../utils/password.js";

const RESET_TOKEN_EXPIRATION_MS = 1000 * 60 * 60; // 1 hour

export async function requestPasswordReset(email: string) {
    const db = getDatabase();

    const user = await db.get(
        "SELECT id, email FROM users WHERE email = ?",
        [email]
    );

    // Prevent email enumeration
    if (!user) {
        return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");

    const tokenHash = crypto
        .createHash("sha256")
        .update(rawToken)
        .digest("hex");

    const expiresAt = new Date(
        Date.now() + RESET_TOKEN_EXPIRATION_MS
    ).toISOString();

    // Remove previous reset tokens
    await db.run(
        "DELETE FROM password_reset_tokens WHERE userId = ?",
        [user.id]
    );

    await db.run(
        `INSERT INTO password_reset_tokens
    (id, userId, tokenHash, expiresAt)
    VALUES (?, ?, ?, ?)`,
        [
            uuid(),
            user.id,
            tokenHash,
            expiresAt,
        ]
    );

    const resetLink = `http://localhost:5173/reset-password?token=${rawToken}`;

    // Replace later with Resend/SendGrid/etc.
    console.log("======================================");
    console.log("PASSWORD RESET LINK");
    console.log(resetLink);
    console.log("======================================");
}

export async function resetPassword(
    token: string,
    newPassword: string
) {
    const db = getDatabase();

    const tokenHash = crypto
        .createHash("sha256")
        .update(token)
        .digest("hex");

    const resetToken = await db.get(
        `SELECT *
     FROM password_reset_tokens
     WHERE tokenHash = ?`,
        [tokenHash]
    );

    if (!resetToken) {
        throw new Error("Invalid reset token.");
    }

    if (resetToken.usedAt) {
        throw new Error("Reset token already used.");
    }

    if (new Date(resetToken.expiresAt) < new Date()) {
        throw new Error("Reset token expired.");
    }

    const passwordHash = await hashPassword(newPassword);

    await db.run(
        `UPDATE users
     SET passwordHash = ?, updatedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [passwordHash, resetToken.userId]
    );

    await db.run(
        `UPDATE password_reset_tokens
     SET usedAt = CURRENT_TIMESTAMP
     WHERE id = ?`,
        [resetToken.id]
    );

    // Delete all remaining reset tokens
    await db.run(
        `DELETE FROM password_reset_tokens
     WHERE userId = ?`,
        [resetToken.userId]
    );
}
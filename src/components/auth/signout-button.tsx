"use client";

/**
 * Sign-out button. Routes through `/api/auth/idp-signout`, which clears
 * Will's NextAuth cookies locally and then redirects to the trefolio
 * IdP's `/api/oauth2/end_session` for single sign-out across all
 * trefolio products (trefolio, Clara, Will).
 */
export function SignOutButton() {
  return (
    <button
      onClick={() => {
        window.location.href = "/api/auth/idp-signout?back=/";
      }}
      className="text-xs underline"
    >
      Sign out
    </button>
  );
}

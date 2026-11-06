# Local Keycloak for the sign-in theme

Start: `docker compose -f keycloak/compose.yml up -d`. Keycloak is at http://localhost:8180, the mail catcher at http://localhost:8025.

`realm/timesheet-realm.local.json` is for local import only. Every user, password and secret in it is a test value.

People cannot change their own name: in the realm's user profile, first name and last name can be edited by an admin only, because the name on a timesheet comes from the login. Password change goes through the app's Profile page. The Account Console client is not switched off in this import; the deployed realm must turn it off (system design, "Account Console").

# 003 M1.1 back end: plan

**Source:** `contract/openapi.yaml` (task 1 of work 002), BE Detailed Design, tickets BE-00 to BE-10 in the M1 (MVP) Readiness Checklist
**Branch:** `plan/m1-1-back-end`
**Status:** Draft, for approval (06/11/2026). This is ticket BE-00.
**Naming:** M1.1 was called slice 1 in older pages and commits.

## Goal

Build the real API for M1.1 (Profile signature, My timesheet, Submit) to the same OpenAPI contract the front end is built against, so the front end can switch from the mock to the real API (BE-08) and M1.1 works end to end.

## Coding style

Set by the owner on 06/11/2026. Every task follows it, and reviews check against it.

- Readability and simplicity first, even when that means some duplicate code. Two similar blocks that each read clearly beat one clever shared helper.
- Use functions and libraries rather than writing our own. If a reputable library already does the job, use it, even a large one.
- Keep dependencies managed: a small shared set, one library per job, no overlaps.

In practice:

- Java records for data, no Lombok. Plain mapping methods between database rows, domain and API types, no MapStruct.
- Domain rules (hours, warnings, fortnights, `returnTo`) are plain Java with no Spring imports, so a reader can follow them and test them alone.
- Priority when choices conflict: Tests, Readable, Defensive, Maintainable, Short.

## Dependency policy

### Rules

1. **One job, one library.** The table below is the approved set. A new library needs a job that no row covers.
2. **JDK, then Spring, then one extra library.** Before adding anything, check the JDK, then what Spring Boot already brings.
3. **Versions come from the Spring Boot BOM.** We write a version only for a library the BOM does not manage, in one `<properties>` block in the pom. Child modules never write versions.
4. **Dependencies arrive in the PR that first uses them,** with one line in `api/DEPENDENCIES.md`: job, why this one, licence, the alternatives we passed on.
5. **Admission test:** licence on the allow-list (Apache 2.0, MIT, BSD, EPL, MPL; LGPL only for OpenHTMLtoPDF, already decided), a release in the last 12 months, and its transitive dependencies read before it is added.
6. **The Boot version is the single upgrade lever.** Dependabot opens one grouped weekly update; minor and patch bumps through the BOM go straight to review.

### Approved set for M1.1

| Job | Library | Instead of (banned in the build) |
|---|---|---|
| Web | Spring MVC (`spring-boot-starter-webmvc`) | WebFlux, Jersey |
| JSON | Jackson 3 (`tools.jackson`), the Boot 4 default | Jackson 2 (`com.fasterxml`), Gson, JSON-B |
| Request shape checks | Jakarta Bean Validation | hand-written null checks |
| Data access | jOOQ (open-source edition, free for PostgreSQL), with code generated from the migrations (decision D-1) | JPA/Hibernate, Spring Data JDBC, MyBatis, SQL written with `JdbcClient` or `JdbcTemplate` in our own code |
| Connection pool | HikariCP (Boot default) | any other pool |
| Migrations | Flyway Community | Liquibase |
| Sessions | Spring Session JDBC | Redis, in-memory sessions |
| Sign-in, CSRF, authorisation | Spring Security (`oauth2-client`) | hand-written filters, Keycloak adapter, `resource-server` (JWT bearer comes with M4) |
| API contract in code | openapi-generator Maven plugin (Spring generator, interfaces and models), run on `contract/openapi.yaml` (decision D-2) | springdoc spec generation, hand-written API DTOs, Swagger annotations |
| Contract breaking changes | oasdiff, in CI only | a second spec-comparison tool |
| Dates and times | `java.time`, with an injected `Clock` | Joda, `java.util.Date`, `Calendar` |
| Logging | SLF4J with Logback and Boot's built-in structured logging | log4j, commons-logging, a logstash encoder |
| Health and metrics | Spring Boot Actuator, Micrometer | custom health endpoints |
| Scheduling | `@Scheduled` plus ShedLock (JDBC template provider, decision D-3) | Quartz, JobRunr, a hand-written lock |
| Images | JDK `ImageIO` (PNG header check only, no extra library) | Apache Commons Imaging, TwelveMonkeys |
| Base64, hashing | JDK | Commons Codec, Guava |
| General helpers | JDK and Spring's utilities. If a gap appears, Apache Commons Lang3 only | Guava, Commons Collections, Commons IO |
| Unit and integration tests | JUnit 5, AssertJ, Mockito (used sparingly; fakes preferred), Spring Security Test, `MockMvcTester` | Hamcrest assertions, RestAssured, PowerMock |
| Real services in tests | Testcontainers (PostgreSQL, Keycloak) with `@ServiceConnection` where Boot supports it | H2 or embedded Postgres |
| Module and layer rules | ArchUnit, test scope, one readable test class (decision D-4) | Spring Modulith, Maven sub-modules |
| Formatting | Spotless | Checkstyle for formatting |
| Coverage | JaCoCo | other coverage tools |

PDF (OpenHTMLtoPDF), Excel (Apache POI) and OpenTelemetry arrive with the parts that need them.

### How the build enforces it

- **Maven Enforcer:** `dependencyConvergence`, `requireUpperBoundDeps`, `banDuplicatePomDependencyVersions`, `requireJavaVersion` 25, and `bannedDependencies` for the banned column above (including log4j, commons-logging, `javax.*`, Lombok, Jackson 2 databind).
- **`banDuplicateClasses`** from the Enforcer extra rules, to catch two jars carrying the same class.
- **`dependency:analyze`** in CI, failing on unused declared and used undeclared dependencies.
- **A vulnerability and licence scan in CI,** with the tool settled in BE-01 (candidates: OSV-Scanner for vulnerabilities, the MojoHaus licence plugin for the allow-list). One of each.
- **Two Maven projects, no shared parent:** `api/` (Spring Boot) and `keycloak/breached-password-policy/` (BE-10). The Keycloak provider runs inside Keycloak, not Spring, so it compiles against the pinned Keycloak SPI in `provided` scope and uses the JDK `HttpClient` for the Pwned Passwords call. Each pom repeats the Enforcer block (about 20 lines). We accept that duplication to avoid a parent pom that serves two different runtimes.

### What I checked, and what is still open

- Confirmed by search: Spring Boot 4 uses Jackson 3 under `tools.jackson`; its starters are split into smaller modules. oasdiff lists OpenAPI 3.1 support as beta.
- Not confirmed, so BE-01 checks each against the Boot 4 dependency-versions page and our real contract before pinning anything: Java 25 support for each library, the generator's handling of our OpenAPI 3.1 constructs and of Jackson 3 (D-2), jOOQ's Boot 4 starter, the exact Flyway and Spring Session starter names in Boot 4, and ArchUnit's support for Java 25 class files.
- Whether Jackson 2 stays on the classpath through a transitive dependency. The Enforcer ban finds out.

## Decisions made

### D-1 Data access: jOOQ (decided by the owner, 06/11/2026)

Chosen over Spring Data JDBC and JPA/Hibernate, for these reasons:

1. **Type safe.** A renamed or removed column breaks the build, not production.
2. **Customisable.** We shape queries and writes exactly as the rule needs, with no framework deciding for us.
3. **The generated code mirrors the schema.** The classes are generated from the migrations, so the code and the database cannot drift apart.
4. **Full SQL compatibility.** PostgreSQL features such as JSONB, `ON CONFLICT` and window functions are available directly, which helps the log table, the autosave upsert and later reports.
5. **No hidden behaviour, yet flexible.** Nothing is loaded lazily or saved behind our back. The cost is more complexity than the other options, which we accept.

What follows from it:

- **Generated code comes from the Flyway migrations at build time and is not committed,** so a migration change regenerates it and a mismatch fails the build. How the build reads the schema (parsing the migration files, or running them in a Testcontainers PostgreSQL) is chosen by a short spike in task 3.
- **jOOQ types stay inside each module's repository classes.** Services, controllers and domain code see our own records, never jOOQ's generated ones. Mapping between them is plain methods, in keeping with the coding style.
- **Optimistic locking is an explicit `UPDATE ... WHERE version = ?`.** Zero rows updated becomes 409 `VERSION_CONFLICT`. A unique-constraint violation on first create maps the same way.
- **Our code writes SQL only through jOOQ's `DSLContext`.** `JdbcClient` and `JdbcTemplate` are not used by our code (Spring Session uses its own JDBC internally, which is fine). The Enforcer bans JPA, Hibernate and Spring Data JDBC.
- **Cost accepted:** a build step that needs a database or a schema parser, and the jOOQ DSL for every reader to learn.

### D-2 Matching the contract: generate the server code from it (decided by the owner, 06/11/2026)

`contract/openapi.yaml` stays the single source of truth, and the back end is generated from it, the same way the front end already is (orval). This replaces the wording in brief C-5, "the generated spec equals the committed one".

- **What is generated:** the Java interfaces for each API area and the request, response and error types, by the openapi-generator Maven plugin (Spring generator, interfaces and models only). Our controllers implement the interfaces and stay thin.
- **What it enforces:** the compiler checks paths, parameters, types and status codes. An operation we forget to implement is a compile error.
- **Generated code is not committed.** It is built from the YAML, like jOOQ's, so it cannot drift. We do not read it; our domain records stay hand-written and are mapped explicitly (coding style).
- **What it does not check:** behaviour. Rules such as "401 before CSRF" are covered by ordinary MockMvc tests that read responses into the generated types. No separate response-validator library is needed.
- **No springdoc spec and no spec-equality check.** oasdiff stays for one job: a breaking-change check of the YAML against `main` in CI. Swagger UI in development serves the committed YAML (how is settled in BE-01, SD-09 keeps it off in production).
- **Spike first (BE-01):** run the generator on the real contract. It must handle `oneOf` with discriminators (every error body, `Signature`), `const`, `contentEncoding` and `type: [string, 'null']`, and its models must work with Jackson 3 (the generator's Jackson 2 nullable helper module is switched off or replaced).
- **Fallback if the spike fails:** hand-written controllers and records, with tests that check each real response against the YAML using a validator library that handles OpenAPI 3.1, plus a test that every operation in the YAML is exercised. Decided with the owner before any endpoint is built.

### D-3 Lock for the daily expiry job: ShedLock (decided by the owner, 06/11/2026)

Chosen over a PostgreSQL advisory lock. ShedLock's lock is time-based, so the job is built to be safe even if the lock fails, and the lock only avoids wasted duplicate work and meets SD-11.

Rules:

1. **Idempotent job in one transaction.** Deletion uses `DELETE ... RETURNING`, and log entries are written only for the rows returned, so a second run finds nothing and logs nothing. The job deletes everything past its date, not just yesterday's.
2. **Generous lease, shorter than the interval.** `lockAtMostFor` is far above the real run time (30 minutes for a job of seconds) and far below 24 hours, so a crash never blocks the next day's run.
3. **`lockAtLeastFor` of a few hours,** so a second fire on the same day (restart, clock change) is skipped.
4. **Database time** for lock times, so copies cannot disagree about a lease (matters from M3).
5. **Thin scheduled method.** The `@Scheduled` and `@SchedulerLock` method only calls a service. The service holds the logic and the one `@Transactional`, and is tested without ShedLock.
6. **Schedule:** shortly after local midnight, with the business time zone set explicitly on the schedule, not the server's.
7. **Provider:** the common JDBC template provider, unless BE-01's check shows the jOOQ provider is mature on Boot 4. The `shedlock` table is created in BE-02's migrations, with the restricted app user granted that table only.
8. **Visible:** a structured "started" and "finished" log line with counts, and a Micrometer counter for deleted rows.
9. **Version:** BE-01's dependency check confirms ShedLock on Boot 4 and Java 25 before we pin it.

Tests (in BE-05): two simultaneous invocations run the job once; running the service twice deletes and logs once; the job runs under the restricted database user; a cleared rejected timesheet's 3-month deletion is logged, and a never-submitted draft is deleted without a log entry.

### D-4 Module and layer rules: ArchUnit alone (decided by the owner, 06/11/2026)

Chosen over Spring Modulith. AD-01 asks for enforced boundaries, and D-1 and D-2 added rules inside a feature that Modulith cannot check but ArchUnit can. Modulith is itself built on ArchUnit, so using ArchUnit directly keeps one tool and one style. We can adopt Modulith later if module diagrams or M3 extraction support are wanted.

One test class of readable rules, starting with:

1. No cycles between features.
2. A feature uses another feature's public side only. Each feature's root package holds what other features may use; its sub-packages are internal. The exact package names are settled when the first rules are written.
3. Domain code does not depend on Spring, jOOQ or the generated API types.
4. jOOQ's generated types are used only in repository classes.
5. The generated API types are used only in controllers and their mapping code.
6. Controllers do not call repositories directly.

BE-02 adds the test class with rules 1 to 4; BE-09a adds rules 5 and 6 with the first controller. The build fails when a rule breaks. A rule that blocks legitimate work is changed in its own reviewed PR, not bypassed.

### D-5 Cookie sign-in split in two: BE-09a and BE-09b (decided by the owner, 06/11/2026)

One 5-point ticket was too large for the most security-sensitive part of M1.1, and it holds two unknowns (the idle-timer exemption and back-channel logout). Split so a problem in one part does not hold up the rest:

- **BE-09a, sign in safely (3 points):** login against Keycloak, sessions in PostgreSQL, first sign-in creates the Person, logout, `GET /me`, the `returnTo` check, JSON 401, and CSRF protection with JSON errors. It ends with every write protected, and later endpoints build on it.
- **BE-09b, session lifecycle (3 points):** idle and absolute timing, keepalive, `GET /me` exempt from the idle timer, back-channel logout, and the service that deletes a person's sessions. This holds the unknowns (risks R-1 and R-3). If it overruns, back-channel logout becomes its own ticket.

Both are built in the main session and tested against a real Keycloak in a Testcontainer. The points are first-pass estimates; BE-01's results confirm them.

## Architecture

One deployable Spring Boot application in `api/`, package-by-feature, with the business rules kept free of Spring.

```
api/src/main/java/.../
  person/       Person row, created at first sign-in, roles read from the token
  session/      sign-in, logout, keepalive, expiry timing, CSRF, returnTo check
  business/     Business row (tenant ID), time zone, pay schedule from configuration
  period/       fortnight arithmetic (plain Java)
  timesheet/    Timesheet, Day, hours, warnings, validation, save, clear, submit, expiry job
  signature/    store, replace, copy for a submission
  audit/        append-only log writer
  web/          exception handler that builds the generated error types
```

- **Controllers** implement the interfaces generated from the contract (D-2) and only translate HTTP to a call and back. The generated request and response types never go past the controller; services and domain code use our own records. **Services** own a transaction. **Domain code** (hours, warnings, fortnights, validation) has no Spring imports.
- **Every table has `business_id`** from the first migration (AD-03). Queries scope by person; the business ID is the single seeded row.
- **The clock:** one `Clock` bean, set to the business time zone, is the only source of "today", future-day checks and expiry dates. Tests inject a fixed clock.
- **Errors:** one exception handler produces the contract's error bodies (`code`, `message`, and `fieldErrors` for validation). The mapping from exception to code lives in one file so it can be read at a glance.
- **Dates on the wire:** `HH:mm`, `YYYY-MM-DD`, integer minutes, UTC instants with `Z`, as the contract says.

### Tables (first migrations)

`business`, `person`, `timesheet` (unique on person and fortnight start, `version`, `last_changed`, `cleared_at`, `ever_submitted`, `rejection_reason`), `timesheet_day`, `signature`, `submission` (with name and signature copies), `log_entry` (JSONB details), plus Spring Session's two tables and ShedLock's one.

- Two database roles: Flyway and the migrations run as the owner; the app runs as a restricted user with no `UPDATE` or `DELETE` on `log_entry` (BE design, section 7). This shapes the Testcontainers and Compose set-up from BE-02.
- Signatures are `bytea` in PostgreSQL. No files on local disk (System Design 7.2).

## Contract rules that become explicit tests

These are easy to get wrong with Spring's defaults, so each has a named test.

| Rule from the contract | Spring default to override | Task |
|---|---|---|
| `/api/**` answers 401 JSON, never a redirect; only the two `navigation` operations redirect | Redirect to the login page | BE-09a |
| 401 is decided before CSRF | Filter order | BE-09a |
| Bad or missing CSRF token: 403 with `CSRF_TOKEN_INVALID` in a JSON body | Empty 403 | BE-09a |
| `GET /me` sets the `XSRF-TOKEN` cookie; header `X-XSRF-TOKEN`; session cookie `SESSION` (these are Spring's names, so BE-09a confirms rather than sets them) | The cookie is only written when the token is read, so a filter must force it | BE-09a |
| `GET /me` does not reset the idle timer; every other authenticated call does | Spring Session updates last-accessed on every request | BE-09b (risk R-1) |
| Absolute limit of 8 hours; keepalive never extends past it | Spring Session has no absolute timeout | BE-09b |
| `returnTo` is sanitised, never rejected: `//`, backslash, encoded slashes, control characters, other origins all fall back to `/timesheet` | none | BE-09a |
| The token's issuer is Keycloak's public URL while its signing keys are fetched from the internal address | `issuer-uri` discovery assumes one address | BE-09a |
| Two devices saving at version 0 both try to create the row; the loser gets 409 `VERSION_CONFLICT`, not 500 | Unique-constraint exception | BE-04 |
| An invalid day is refused with 400 `VALIDATION_FAILED` and is not stored; a 200 never carries errors | none (see "Where the docs disagree") | BE-04 |
| Signature `image` must be a PNG by its first bytes, within 300000 characters, and within sane pixel dimensions | A small file can declare a huge image | BE-06 |
| FR-26: submit and signature change are each logged in the same transaction as the change | none | BE-06 |
| Anything past its deletion date is treated as gone even if the daily job has not run | none | BE-05 |

## Tasks

Each task is one branch and one pull request, stacked in the order shown, and ends merged with its tests green. Check command for every task: `./mvnw verify` in `api/` (Docker must be running for Testcontainers). Notion IDs are kept so the checklist still matches.

| # | Ticket | Task | Files | Covers | Pts | Who builds |
|---|---|---|---|---|---|---|
| 1 | BE-00 | This plan, approved | `.claude/plans/work/003-m1-1-back-end/` | none | 1 | main session |
| 2 | BE-01 | Maven project, Maven Wrapper, container image, Enforcer rules (including the bans that follow from D-1), Spotless, JaCoCo, CI gates, secret scan, `DEPENDENCIES.md`, and the generator spike on the contract with generation wired into the build (D-2) | `api/pom.xml`, `api/Dockerfile`, CI | none | 3 | implementer |
| 3 | BE-02 | PostgreSQL, Flyway, first migrations with `business_id`, jOOQ code generation from the migrations (with a short spike on how the build reads the schema, D-1), the two database roles (including the `shedlock` table and its grant, D-3), Testcontainers set-up, `Clock` bean, employee and manager role checks (sign-in itself is BE-09), the ArchUnit test class with rules 1 to 4 (D-4) | `api/src/main/resources/db/migration/`, `person/`, `business/` | AC-2 (server side) | 5 | implementer, main session reviews |
| 4 | BE-09a | Sign in safely: OIDC login against Keycloak (separate issuer and keys URLs), JDBC sessions, first sign-in creates the Person, logout, `GET /me`, `returnTo` sanitiser, JSON 401, CSRF protection with JSON 403 and the `XSRF-TOKEN` cookie, ArchUnit rules 5 and 6 (D-4) | `session/`, `person/` | AC-1, AC-21 (server side), AC-29 | 3 | **main session** (security) |
| 5 | BE-09b | Session lifecycle: idle and absolute timing, keepalive, `GET /me` exempt from the idle timer, back-channel logout, a service that deletes a person's sessions (the trigger comes with M1.3) | `session/` | AC-22, AC-30 | 3 | **main session** (security) |
| 6 | BE-03 | Pay schedule and business time zone from configuration; fortnight arithmetic; hours in whole minutes from instants, including daylight-saving days; warnings; all tested against `contract/fixtures/hours-cases.json` | `period/`, `timesheet/` (domain only) | AC-3, AC-4, AC-6 | 3 | implementer (tests first) |
| 7 | BE-04 | `GET` timesheet (empty draft at version 0, 404 and 422 rules), `PUT` day with versions, validation, future-day rule, warnings in the response, session expiry fields | `timesheet/` | AC-5, AC-7, AC-8, AC-9, AC-11, AC-12 | 4 | implementer |
| 8 | BE-05 | Clear, rejected-timesheet deletion date, daily expiry job built to the D-3 rules (ShedLock, idempotent, one transaction, logs and counter), 3-month deletion with a log entry, "past its date is gone" on every read, and the four D-3 tests | `timesheet/`, `audit/` | AC-13 | 3 | implementer |
| 9 | BE-06 | Signature `GET` and `PUT` with the PNG checks; submit with the checks in the order below, the submission and signature copy, the log entries, in one transaction | `signature/`, `timesheet/`, `audit/` | AC-14 to AC-20 (server side) | 4 | implementer, **main session reviews** (authorisation) |
| 10 | BE-07 | The contract gate: oasdiff breaking-change check of `contract/openapi.yaml` against `main` in CI, a check that the build regenerates from the committed YAML, and a review that every contract rule in the table above has its named test (each endpoint task writes its own) | CI, `api/src/test/` | AC-26 | 1 | implementer |
| 11 | BE-10 | Breached-password policy provider for Keycloak, Pwned Passwords range API with a 2 second timeout, packaged into our Keycloak image, pinned Keycloak version with a test that fails when an upgrade breaks it, brute-force protection settings | `keycloak/breached-password-policy/` | AC-25 (message) | 3 | implementer |
| 12 | BE-08 | Switch the front end to the real API, fix the gaps, one end-to-end pass; the mock API stays | `web/` | all | 3 | main session |
| | | **Total** | | | **36** | |

Two points more than the 34 in the checklist: one from splitting BE-09 (D-5) and one for jOOQ code generation in BE-02 (D-1).

**Order:** 1, 2, 3, 4, 5, then 6 to 9 in order. Task 11 (BE-10) can start any time after task 2 and runs beside the others. Task 10 comes after task 9 because the spec only matches once every endpoint exists, but each endpoint task already checks its own responses against the contract. Task 12 comes last.

**Checkpoints** (as in the checklist): G is tasks 1 to 5 and 11, H is tasks 6 to 10, I is task 12.

### Submit checks, in order (task 9)

Pay schedule set (422) → timesheet is editable (409 `TIMESHEET_NOT_EDITABLE`) → version matches (409 `VERSION_CONFLICT`) → signature exists (422 `SIGNATURE_REQUIRED`) → at least one day has hours (422 `NO_HOURS`) → the ticked days equal the warning days exactly (422 `WARNING_TICKS_MISMATCH`). The declaration is `const: true` in the schema, so a missing or false value is a 400 before this runs.

## Where the docs disagree or say nothing

Settled here so nobody guesses mid-build. The first three need a Notion edit by the docs session.

1. **Incomplete days.** BE design section 2.2 says a draft may hold incomplete days. The contract refuses a day with a start and no finish (400 `VALIDATION_FAILED`, `FINISH_MISSING`), and the screen spec shows the error with no hours. **The contract wins:** an invalid day is not stored, and the front end keeps it on screen until it is fixed.
2. **Sign-in wording.** BE design section 5 and AD-07 still describe bearer tokens. The brief's C-4 replaced that with a cookie session. Section 5 and AD-07 need rewording, and section 3.2 (Libraries and versions, currently TBD) should take the table above.
3. **Daylight-saving gap.** BE design section 2.3 says a non-existent local time is rejected, but `FieldError` has no code for it. Weekday entries only meet this where a zone changes clocks on a weekday, which is rare. Recommendation: add a `TIME_NOT_VALID` code to the contract (a contract-first change, so it goes in before task 7) rather than drop the rule.
4. **A draft whose days all become empty.** The row stays as a Draft with no days and expires with the daily job. It still counts for the FR-05 start-date lock until then. Not in the PRD; flag if you want it deleted at once.
5. **Business time zone.** Not stated in the docs. It comes from configuration (`.env`); the plan assumes the owner supplies it before task 6.
6. **Who is a manager in tests.** Roles come from the `realm_access.roles` claim; test users and the realm come from the realm import in `keycloak/` (work 002, task 17).

## Risks

| ID | Risk | Mitigation |
|---|---|---|
| R-1 | Spring Session updates last-accessed on every request, so `GET /me` would keep a session alive and the idle warning could never fire | Keep idle and absolute timing as our own session attributes checked in one filter, and give Spring Session a long backstop expiry. A spike test in task 5 proves `/me` does not extend the session |
| R-2 | The generator cannot handle the contract's OpenAPI 3.1 constructs (`oneOf` with discriminators, `const`, `type: [string, 'null']`) or produces models that do not work with Jackson 3 | Spike in task 2 (D-2) before any endpoint is written; fallback is hand-written controllers tested against the YAML with a 3.1-capable validator |
| R-3 | Keycloak back-channel logout with Spring's CSRF protection, and the first request from an emailed link under `SameSite=Strict`, are untested (brief open question) | Tested in task 5 against a Keycloak Testcontainer |
| R-4 | BE-09a and b run over 3 points each | Task 5 can shed back-channel logout to its own ticket without blocking the rest |
| R-5 | The contract (PR 4) and the shared hours cases (PR 7) are not on `main` yet | This branch is cut from the contract branch; tasks 4 to 7 wait for PR 4 to merge and task 6 for PR 7 |
| R-6 | Testcontainers needs Docker running locally on Windows and in CI | Stated in the check command; CI uses a runner with Docker |
| R-7 | Boot 4 and Java 25 support is unconfirmed for some libraries, including jOOQ and Boot's jOOQ starter | Task 2 checks each against the Boot 4 dependency-versions page before pinning |
| R-8 | jOOQ code generation needs the schema at build time (a parser or a throwaway database), which can be slow or fragile on Windows and in CI | Spike in task 3 picks parsing the migrations or a Testcontainers run, and times it. Generated code is not committed, so the choice can change without touching source |

## Delegation

Per the global rules: security-sensitive work (tasks 4 and 5) and the final review of every task stay in the main session. Tasks 2, 3, 6, 7, 8, 9, 10 and 11 go to the implementer with a brief naming the files, the acceptance criteria, this plan's decisions and the check command. No two writing agents touch the same files.

## Out of scope

- Approvals, admin, PDF (M1.2 to M1.4), including the approve and reject endpoints and the pay-schedule endpoints. Nothing can be rejected until M1.2, but the Rejected state is read and returned correctly.
- Deactivating people and the admin trigger for session deletion (M1.3). Task 5 builds only the service.
- Deployment, Caddy, backup and restore (go-live).
- Observability beyond structured logs and Actuator health (System Design open question).
- Multi-tenancy isolation beyond `business_id` on every table (M3).

## Notion edits this plan implies

For the docs session, then docs-sync and a PR:

- BE design section 3.2: the approved set and the dependency rules.
- BE design section 4 and System Design technology choices ("API docs / test UI: springdoc"): the server is generated from the contract; no springdoc spec (D-2). Also check the wording of AD-02 and AD-13 against it.
- BE design section 5 and AD-07: cookie session in place of bearer tokens.
- BE design section 2.2: incomplete days are not stored.
- BE design section 7 and the decision log: jOOQ for data access and the five reasons (D-1), the two database roles, ShedLock and its rules (D-3).
- BE design section 10: testing strategy (Testcontainers, contract gate) and the ArchUnit rules (D-4). AD-01's "enforced module boundaries" is now met by ArchUnit.
- Delivery plan and readiness checklist: BE-09 split into 09a and 09b, total 35 points.

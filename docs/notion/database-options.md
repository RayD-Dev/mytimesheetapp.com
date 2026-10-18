<!-- Read-only copy of Database Options: https://app.notion.com/p/3fc771bd4d4381eb9433c4242b560077
     Notion is the master; comment and edit there, then run docs-sync.
     Notion last edited: 2026-10-17T14:13:47.961Z · Synced: 18/10/2026 -->
<content>
<callout icon="🗄️" color="gray_bg">
	**Status:** Draft · **Last updated:** <mention-date start="2026-10-18"/> · **Type:** Research — which database the timesheet app should use, and how the options scale. It supports AD-10 in the <mention-page url="https://app.notion.com/p/3f6771bd4d4381fbadd6f819e59e08fd"/>.
</callout>
<table_of_contents/>
---
## Recommendation
**Use PostgreSQL 18 for M1 and keep it for M3.** Run one PostgreSQL server with two databases, one for the app and one for Keycloak, as planned.
Why:
- **Licence.** The server uses the PostgreSQL licence. The JDBC driver is BSD-style. Both are permissive, so both pass the policy.
- **Keycloak.** Keycloak 26.8 supports PostgreSQL 14 to 18. It lists 18 as its tested version.
- **M3 tenant isolation.** PostgreSQL has row-level security (RLS) built in. MySQL and MariaDB have none. CockroachDB has it but fails the licence policy. YugabyteDB has it but Keycloak does not support it and it is far too heavy.
- **One machine.** With small buffers, PostgreSQL needs a few hundred MB. That fits in the 4 GB budget next to Keycloak and the API.
- **Backups.** pg_dump makes a consistent dump while the app keeps running. That fits the nightly dump plus restic plan.
- **M3 operations.** CloudNativePG is an Apache 2.0 operator for Kubernetes. Managed PostgreSQL exists on AWS, Azure and Google Cloud.
- **Tooling.** Spring Boot 4 manages the driver version. Flyway has a PostgreSQL module.
Choose 18, not 19. PostgreSQL 19 was only at release candidate 1 on 15 October 2026. Version 18 gets fixes until 14 November 2030.
**Runner-up: MariaDB 11.8 LTS.** It passes the licence policy and Keycloak supports it. But it has no RLS, and managed MariaDB is thin in the clouds. It is the fallback only if we give up on database-level tenant isolation.
### When we'd reconsider
- **Keycloak drops PostgreSQL, or PostgreSQL changes licence.** Both are very unlikely. Re-check at each Keycloak major upgrade.
- **A customer in M3 needs fully separate data.** Stay on PostgreSQL and give that customer its own database. No change of engine is needed.
- **RLS proves too slow or too risky in M3 testing.** Fall back to one schema per tenant on the same engine.
- **One primary can no longer take the write load.** Add partitioning and read replicas first. After that, look at Citus (AGPL, run as separate infrastructure) or YugabyteDB (Apache 2.0, PostgreSQL-compatible). Keycloak can stay on its own plain PostgreSQL.
- **The M1 machine has much less memory than expected.** Stay on PostgreSQL. SQLite would not help, because Keycloak still needs a server database.
## What we need from a database
- **ACID transactions.** The audit log row is written in the same transaction as the action it records.
- **An append-only log table.** Rows are added, never changed or deleted.
- **A JSON column** for the log details.
- **Database-level tenant isolation for M3.** The current lean is a shared schema with row-level security, or an equivalent.
- **Optimistic locking.** An employee autosaving from two devices, or a repeated approve click, can't silently overwrite a change.
- **Good backup and restore tools.** M1 plan: a nightly logical dump, encrypted off-site with restic.
- **Kubernetes operators and managed services** in every major cloud, for M3.
- **A low memory footprint** on one home machine. The whole M1 stack is planned at about 4 GB, with PostgreSQL given 512 MB (System Design section 8.3).
- **Keycloak support.** Keycloak needs a database too. One server with two databases means one backup covers everything.
- **A strict licence fit.** Permissive licences are allowed. Weak copyleft (LGPL, MPL, EPL) is allowed as an unmodified library. GPL and AGPL are allowed only as separate, unmodified infrastructure, never linked into our code. Source-available and non-OSI licences are not allowed. The JDBC driver is linked into our code, so it is checked as well as the server.
- **Spring Boot 4 and Flyway support.**
The data is small: under 1 GB per decade for one business.
## Options at a glance
All facts were checked on 18 October 2026. The Keycloak column comes from the 26.8 docs, so re-check the table for the exact Keycloak release we pin. Memory figures in the effort column are estimates for a tuned setup. They need to be measured with docker stats.
<table header-row="true">
<tr>
<td>Option</td>
<td>Licence and policy result</td>
<td>Fit for our needs</td>
<td>Keycloak 26.8</td>
<td>Effort on one machine (M1)</td>
<td>M3 readiness</td>
</tr>
<tr>
<td>PostgreSQL 18</td>
<td>Server: PostgreSQL licence. Driver: BSD-style. Passes.</td>
<td>Very good. ACID, jsonb, built-in RLS, transactional schema changes.</td>
<td>Supported. Versions 14 to 18, tested on 18.</td>
<td>Low. Roughly 300 to 500 MB when tuned. pg_dump fits the restic plan.</td>
<td>Very good. RLS, CloudNativePG, managed on every major cloud.</td>
</tr>
<tr>
<td>MySQL 8.4 LTS Community</td>
<td>Server: GPLv2, fine as separate infrastructure. Official driver Connector/J: GPLv2 with an exception, fails when linked. Passes only if we use the LGPL MariaDB driver.</td>
<td>Good for transactions and JSON. No RLS.</td>
<td>Supported. Versions 8.4 and 8.0 only.</td>
<td>Low to medium. Needs tuning, because default settings use more memory.</td>
<td>Medium. Managed everywhere, but tenant isolation falls to the app or views.</td>
</tr>
<tr>
<td>MariaDB 11.8 LTS</td>
<td>Server: GPLv2, fine as separate infrastructure. Driver: LGPL 2.1 or later, allowed. Passes.</td>
<td>Good. ACID. JSON is stored as validated text. No RLS.</td>
<td>Supported. Versions 11.8, 11.4, 10.11 and 10.6.</td>
<td>Low.</td>
<td>Medium to weak. No RLS. Managed MariaDB is thin.</td>
</tr>
<tr>
<td>SQLite</td>
<td>Server: public domain. Driver: Apache 2.0 and BSD-2. Passes.</td>
<td>Fine for a small app. Single writer, no RLS.</td>
<td>Not supported. Keycloak would still need another database.</td>
<td>Lowest for the app. But two engines to run and back up.</td>
<td>Weak. One file on one host. No managed service.</td>
</tr>
<tr>
<td>CockroachDB</td>
<td>CockroachDB Software License, not open source. Free tier only under \$10 million revenue, with telemetry. Fails.</td>
<td>Strong. PostgreSQL-compatible, has RLS since 25.2.</td>
<td>Not listed.</td>
<td>High. Wants a 3-node cluster. Production guide: at least 4 vCPUs and 16 GiB per node.</td>
<td>Strong technically, but blocked by the licence.</td>
</tr>
<tr>
<td>YugabyteDB</td>
<td>Core database: Apache 2.0. Management platform: Polyform Free Trial. Passes if we use only the Apache core.</td>
<td>Strong. PostgreSQL-compatible, has RLS.</td>
<td>Not listed.</td>
<td>High. Official minimum 2 cores and 2 GB. Production advice is far larger.</td>
<td>Good scale-out. Heavy for many small tenants. Its Kubernetes operator sits under the paid platform.</td>
</tr>
<tr>
<td>TiDB</td>
<td>Server: Apache 2.0. Uses the MySQL protocol, so the driver question is the same as for MySQL. Passes with the LGPL driver.</td>
<td>MySQL-compatible. No RLS found.</td>
<td>Not supported. Appears as a db option only.</td>
<td>Very high. Several services, tens of GB of RAM in the docs.</td>
<td>Overbuilt for small tenants. No RLS.</td>
</tr>
<tr>
<td>MongoDB</td>
<td>Server: SSPL, not open source. Driver: Apache 2.0. Fails.</td>
<td>Poor. Our data is relational. Transactions need a replica set.</td>
<td>Not supported.</td>
<td>Medium.</td>
<td>Blocked by the licence.</td>
</tr>
<tr>
<td>FerretDB on PostgreSQL</td>
<td>FerretDB: Apache 2.0. DocumentDB extension: MIT. Passes.</td>
<td>Poor. A MongoDB-style layer over PostgreSQL. It adds nothing for relational data.</td>
<td>Not supported.</td>
<td>Medium. Two layers.</td>
<td>Poor. We found no RLS exposed through the MongoDB API.</td>
</tr>
</table>
**SQL Server and Oracle** are excluded. Keycloak supports both, but they are proprietary commercial products, and the policy does not allow that.
## Each option
### PostgreSQL 18 (recommended)
**Licence.** The server uses the PostgreSQL licence, described as a liberal open source licence similar to BSD or MIT. The JDBC driver (pgjdbc) is BSD-style. Spring Boot 4.1 manages driver version 42.7.13.
**Pros for this use case**
- **Keycloak.** PostgreSQL 14 to 18 are supported. Version 18 is the tested one. Amazon Aurora PostgreSQL is also listed, which helps in M3.
- **Row-level security is built in.** `ALTER TABLE ... ENABLE ROW LEVEL SECURITY` plus `CREATE POLICY`. Once on, a table with no matching policy shows no rows. This is exactly the M3 lean.
- **Append-only audit log.** Remove UPDATE and DELETE rights from the app role. Add a trigger or an RLS policy that allows only INSERT and SELECT. The log row is written in the same transaction as the action.
- **JSON.** The `jsonb` type stores JSON in a binary form. It supports GIN indexes if we ever need to search the log details.
- **Transactional schema changes.** A Flyway migration that fails halfway rolls back cleanly. MySQL and MariaDB cannot do this for most schema changes.
- **Backups.** pg_dump makes consistent exports while the database is in use and does not block readers or writers. Use one dump per database, plus a globals-only dump for roles. The PostgreSQL manual says pg_dump is not always the right choice for regular production backups. At under 1 GB it is fine. Point-in-time recovery with pgBackRest (MIT licence) can come later.
- **Memory.** The PostgreSQL wiki suggests about a quarter of RAM for shared_buffers on machines with 1 GB or more. For us, 128 to 256 MB is enough. Keep max_connections low, around 30 for M1.
- **Maturity.** Each major version gets five years of fixes. Large community. Yearly major releases.
- **Kubernetes.** CloudNativePG (Apache 2.0, CNCF Sandbox project since January 2025) handles failover, backups to object storage, point-in-time recovery and a PgBouncer pooler.
- **Managed cloud.** Amazon RDS offers PostgreSQL 18, with standard support to February 2031. Azure Database for PostgreSQL flexible server and Google Cloud SQL both offer PostgreSQL.
- **Spring Boot and Flyway.** Spring Boot 4 uses the `spring-boot-starter-flyway` starter. Flyway is Apache 2.0, and its PostgreSQL support is a separate module (`flyway-database-postgresql`). Hibernate 7 supports PostgreSQL 14 and later in its core dialects.
**Cons for this use case**
- **RLS is easy to get wrong.** If the app connects as the table owner or a superuser, policies are skipped without any warning. Use a non-owner app role and `FORCE ROW LEVEL SECURITY`. Set the tenant id inside each transaction, never per connection, or a pooled connection can leak it to the next request. Test with the real app role.
- **Unique and foreign key checks ignore RLS.** A duplicate key error can reveal that another tenant has a row. Design keys with the tenant id in them.
- **One process per connection.** We need a small app pool in M1 and PgBouncer in M3 once many API pods connect.
- **Major upgrades need work.** A dump and restore or pg_upgrade. At our data size, a dump and restore takes minutes.
- **Per-tenant restore is awkward in M3.** A shared-schema backup restores every tenant at once.
- **One writer.** Scaling writes beyond one primary needs extra tooling (see the section "How they scale").
A minimal sketch of the M3 pattern:
```sql
ALTER TABLE timesheet ENABLE ROW LEVEL SECURITY;
ALTER TABLE timesheet FORCE ROW LEVEL SECURITY;

CREATE POLICY tenant_isolation ON timesheet
    USING (tenant_id = current_setting('app.tenant_id', true)::bigint);

-- at the start of every transaction, from the app:
SELECT set_config('app.tenant_id', '42', true);
```
### MySQL 8.4 LTS Community
**Licence.** The server is GPLv2. As separate infrastructure that is allowed. The official driver, MySQL Connector/J 9.7, is GPLv2 with a Universal FOSS Exception. The exception covers linking only with software under OSI-approved or FSF-free licences, and it does not extend to other software. Because the driver is linked into our code, treat it as a fail under our policy. A workable route is the LGPL MariaDB Connector/J, which the vendor says works with MySQL servers. It is an unusual pairing, so we would have to test it.
**Pros**
- Mature InnoDB engine with full ACID transactions and a native JSON type.
- Keycloak supports MySQL 8.4 (tested) and 8.0.
- Managed MySQL exists on AWS, Azure and Google Cloud.
- Kubernetes operators exist from Percona (Apache 2.0) and Oracle.
- Vitess (Apache 2.0) is a proven way to shard MySQL if we ever need it.
- Flyway and Hibernate support it.
**Cons**
- **No row-level security.** M3 isolation would rely on views with invoker rights, strict grants, or app-side filtering. That does not meet the aim of a database-level guard.
- **Driver licence problem** as described above.
- **Stewardship worry.** In February 2026 about 200 community members signed an open letter to Oracle. Oracle answered with a new governance model and more features in Community Edition. In July 2026 it also moved to calendar version numbers (26.7). The direction is hopeful but not settled.
- **Keycloak lists only 8.4 and 8.0.** The newer 9.7 LTS is not on the list yet.
- **Schema changes are not transactional.** A failed Flyway migration can leave the schema half changed.
- **Higher default memory.** One third-party test measured about 486 MB idle for MySQL 8.4 and about 182 MB for PostgreSQL 17, with large buffers set. Another test blamed the default performance_schema. Tuning is needed.
- **Galera Cluster is not supported by Keycloak.**
### MariaDB 11.8 LTS
**Licence.** The server is GPLv2, and the MariaDB Foundation says it will stay free and open source under GPLv2. As separate infrastructure that is allowed. MariaDB Connector/J (3.5.10) is LGPL 2.1 or later, which is allowed as an unmodified library. The 3.5 line supports Java 25, and Spring Boot 4.1 manages it.
**Pros**
- **Passes the licence policy cleanly** on both server and driver.
- **Keycloak.** Supports 11.8 (tested), 11.4, 10.11 and 10.6.
- **Memory.** One third-party test found MariaDB lighter than default MySQL (about 141 MB against 411 MB). Another found the opposite. The honest reading: tuning matters more than the engine.
- **Operator.** The mariadb-operator is MIT licensed. It does replication, backups (physical and logical, to S3-compatible storage) and Galera.
- **Backups.** mariadb-dump for logical dumps, which suits the restic plan.
- **Governance.** A non-profit foundation. Yearly LTS releases.
**Cons**
- **No row-level security.** Same gap as MySQL. This is the main reason it is the runner-up and not the pick.
- **JSON is text.** MariaDB's JSON type is an alias for LONGTEXT with a validity check. It is fine for log details, but there is no binary format.
- **Shorter support window.** Community LTS gets three years. 11.8 ends on 4 June 2028, so an upgrade comes sooner than with PostgreSQL.
- **Thin managed offers.** Azure retired its MariaDB service in September 2025. Google Cloud SQL lists MySQL, PostgreSQL and SQL Server only. AWS RDS and MariaDB's own cloud remain.
- **MaxScale is not allowed.** The usual proxy for failover is under the Business Source License for recent versions.
- **Flyway's published table** lists MariaDB up to 10.11. We would check 11.8 before relying on it.
- **Galera Cluster is not supported by Keycloak.**
- **Schema changes are not transactional.**
### SQLite
**Licence.** SQLite is in the public domain. The xerial sqlite-jdbc driver is Apache 2.0 with BSD-2 parts. It passes.
**Pros**
- **No server at all.** The database runs inside the API process. Memory use is tiny.
- **Backup is one file.** Litestream (Apache 2.0) can also stream changes to S3 for disaster recovery.
- **ACID and built-in JSON.**
- **File per tenant** would give very strong isolation in M3.
- Flyway supports it. Hibernate has a community-maintained dialect.
**Cons**
- **Keycloak does not support it.** We would still need PostgreSQL or similar for Keycloak. That means two engines and two backups, and it breaks the "one backup covers everything" plan. This alone rules SQLite out.
- **One writer at a time.** Fine for 50 staff, but a limit later.
- **Needs one host.** In WAL mode all processes must be on one machine, and it does not work on a network filesystem. In Kubernetes that means a single API pod on a local volume. Rolling updates and scaling out are hard.
- **No RLS, no operators, no managed service.**
- **Hibernate support is community-maintained,** not part of the core dialects.
- **File per tenant gets awkward** at hundreds or thousands of tenants. Each migration runs once per file.
### CockroachDB
**Licence.** Since version 24.3 (November 2024), self-hosted CockroachDB uses the CockroachDB Software License. It is source-available, not open source. Running it needs a licence key. The free "Enterprise Free" tier is for businesses with under \$10 million annual revenue (measured across affiliates), must be renewed every year, and is community support only. Clusters that stop sending telemetry for 7 days are throttled to 5 open transactions. This fails our policy. The JDBC driver would be the standard PostgreSQL driver (BSD).
**Pros**
- PostgreSQL wire-compatible, with RLS since version 25.2.
- Scales out across nodes, survives node loss.
- Hibernate has a core CockroachDB dialect (version 23.2 and later). Flyway lists it.
- Cockroach Labs publishes a Kubernetes operator.
**Cons**
- **Licence fails.** Even if our M1 business qualifies for the free tier, an M3 SaaS may not stay under the revenue line, and the policy bans non-open licences anyway.
- **Keycloak does not list it.** We would need a second engine for Keycloak.
- **Heavy.** The production guide asks for at least 4 vCPUs and 16 GiB per node, with 8 vCPUs recommended. A single node is for testing only.
- **RLS limits.** Foreign keys and unique checks bypass RLS, and backups and change feeds do not apply policies.
### YugabyteDB
**Licence.** The core database (storage engine and the PostgreSQL-based query layer) is Apache 2.0. YugabyteDB Anywhere, the management platform, is under the Polyform Free Trial licence, which allows 32 days of evaluation. We could use only the Apache core and pass. The standard PostgreSQL driver works.
**Pros**
- PostgreSQL-compatible, with RLS through `CREATE POLICY`.
- Built for scale-out and multi-zone resilience.
- Flyway lists it. Hibernate has no dedicated dialect, so the PostgreSQL dialect is used.
**Cons**
- **Keycloak does not list it.** A second engine is needed for Keycloak.
- **Heavy for one machine.** The official minimum is 2 cores and 2 GB RAM. Production advice is 16 or more cores and 32 GB or more. The 4 GB budget would be used up by the database alone.
- **The Kubernetes operator is documented under YugabyteDB Anywhere,** which is the non-open part. That makes the M3 story unclear.
- **RLS cost.** Policy predicates run per row.
- **Little benefit.** Scale-out solves a problem we do not have with small tenants.
### TiDB
**Licence.** Apache 2.0. It speaks the MySQL protocol and is MySQL 8.0 compatible. The driver choice is the same as for MySQL. Use the LGPL MariaDB driver to stay inside the policy.
**Pros**
- Scale-out MySQL-compatible database with analytics support (HTAP).
- Hibernate has a community TiDB dialect (version 5.4 and later). Flyway lists it.
**Cons**
- **Keycloak does not officially support it.** The docs show `tidb` as a possible `db` value, but TiDB is not in the supported table.
- **Very heavy.** The older (archived v6.3) development guidance asks for separate TiDB, PD and TiKV services, with three TiKV nodes at 32 GB each. The current docs list only production sizes, which are larger.
- **No row-level security** found in the project description.
- **Overbuilt** for small tenants.
### MongoDB and FerretDB
**Licence.** MongoDB's server uses the SSPL. It is based on AGPLv3 with a clause about offering the software as a service, and it is not accepted as open source by the OSI. That fails the policy. Its Java driver is Apache 2.0, but the server decides the result. FerretDB is Apache 2.0 and runs on PostgreSQL with the MIT-licensed DocumentDB extension, so it passes.
**Pros**
- Flexible documents. FerretDB gives a MongoDB interface while the data sits in PostgreSQL.
**Cons**
- **Wrong data shape.** Employees, timesheets, entries and approvals are relational. A document store buys us nothing. PostgreSQL's jsonb already covers the JSON log details.
- **Transactions.** MongoDB supports multi-document transactions on replica sets and sharded clusters, so even a single server needs replica-set mode.
- **Keycloak does not support either.**
- **No tenant guard** such as RLS that we could find through the MongoDB API.
- **FerretDB adds a layer** on top of PostgreSQL that we would run and learn for no gain.
## How they scale
This is background. It is not an M1 concern.
<table header-row="true">
<tr>
<td>Option</td>
<td>Scale up one machine</td>
<td>Read replicas</td>
<td>Partitioning</td>
<td>Connection pooling</td>
<td>Scale-out writes</td>
<td>Where it hits limits</td>
</tr>
<tr>
<td>PostgreSQL</td>
<td>Yes. More CPU, RAM and fast disk.</td>
<td>Yes. Streaming replicas serve read-only queries. Logical replication works per table.</td>
<td>Built in: range, list and hash.</td>
<td>PgBouncer. CloudNativePG has a pooler. Azure has one built in.</td>
<td>Not built in. Citus (AGPL, separate infrastructure) or app-level sharding.</td>
<td>One primary takes all writes. One process per connection.</td>
</tr>
<tr>
<td>MySQL</td>
<td>Yes.</td>
<td>Yes. Replicas and Group Replication.</td>
<td>Built in, but partitioned InnoDB tables cannot have foreign keys.</td>
<td>Threads per connection. Proxies such as ProxySQL are common.</td>
<td>Vitess (Apache 2.0) shards MySQL.</td>
<td>One primary for writes. No RLS to help with tenants.</td>
</tr>
<tr>
<td>MariaDB</td>
<td>Yes.</td>
<td>Yes. Replicas. Galera exists but Keycloak does not support it.</td>
<td>Built in.</td>
<td>Proxies. MaxScale is Business Source licensed for recent versions.</td>
<td>Not checked in detail. Galera is the usual route, and Keycloak does not support it.</td>
<td>One primary for writes. Thin managed offers.</td>
</tr>
<tr>
<td>SQLite</td>
<td>Yes, on one host only.</td>
<td>No. Litestream streams copies for recovery, not for reads.</td>
<td>No. Use one file per tenant.</td>
<td>Not needed. It runs inside the app.</td>
<td>No.</td>
<td>One writer, one host, no network filesystem.</td>
</tr>
<tr>
<td>CockroachDB</td>
<td>Yes.</td>
<td>Built in. Data is copied across nodes and any node accepts queries.</td>
<td>Automatic ranges.</td>
<td>Standard pools.</td>
<td>Yes, automatic. Needs three or more nodes.</td>
<td>Licence. Per-node resource needs.</td>
</tr>
<tr>
<td>YugabyteDB</td>
<td>Yes.</td>
<td>Built in. Data is copied across nodes and any node accepts queries.</td>
<td>Automatic tablets.</td>
<td>Standard pools. It bundles a pooler (Odyssey, BSD-style).</td>
<td>Yes, automatic. Needs three or more nodes.</td>
<td>Memory per node. Operator tied to the paid platform.</td>
</tr>
<tr>
<td>TiDB</td>
<td>Yes.</td>
<td>Built in. Data is copied across storage nodes.</td>
<td>Automatic regions.</td>
<td>Standard MySQL pools.</td>
<td>Yes, automatic. Several services.</td>
<td>Many moving parts. No RLS.</td>
</tr>
<tr>
<td>MongoDB / FerretDB</td>
<td>Yes.</td>
<td>Replica sets (MongoDB). Standbys (FerretDB, as PostgreSQL).</td>
<td>Sharding (MongoDB).</td>
<td>Driver pool.</td>
<td>MongoDB: sharding. FerretDB: as PostgreSQL.</td>
<td>MongoDB licence. Wrong data shape.</td>
</tr>
</table>
What matters for M3, with many small tenants:
- **Capacity is not the problem.** Under 1 GB per decade per business means 1,000 tenants is at most about 1 TB over ten years. Writes are a few per person per fortnight. One PostgreSQL primary with a replica copes. Scale up the instance first. Managed services let you resize.
- **Isolation correctness matters most.** Use RLS with a non-owner app role and `FORCE ROW LEVEL SECURITY`. Set the tenant id inside each transaction. Put `tenant_id` first in every index. Add automated tests that try to read another tenant's rows.
- **Connection count grows with pods.** Many API pods times pool size adds up fast on PostgreSQL. Use PgBouncer in transaction mode and transaction-local settings, which is the pattern above.
- **Noisy neighbours.** One large tenant can slow the others. If it happens, hash-partition big tables on `tenant_id`, or move that tenant to its own database. The app can route per tenant.
- **Per-tenant restore and export.** A shared-schema backup restores everyone at once. Plan this early: restore into a side instance, then copy one tenant's rows back. Or give large tenants their own database.
- **Migrations favour a shared schema.** Flyway runs once for all tenants. With a schema or database per tenant, it runs once per tenant, which gets slow and risky at thousands.
- **Keycloak stays separate.** In M3 it can have its own PostgreSQL instance or database, so the app load and the sign-in load do not compete.
- **Scale-out databases solve a problem we do not have.** CockroachDB, YugabyteDB and TiDB need three or more nodes and a lot of memory. They also fail the licence policy, are not supported by Keycloak, or both.
## Sources
All pages were checked on 18 October 2026.
**Keycloak, Spring Boot, Flyway, Hibernate**
- [Keycloak: configuring the database (supported databases table)](https://www.keycloak.org/server/db)
- [Keycloak: supported configurations](https://www.keycloak.org/server/supported-configurations)
- [Keycloak blog archive (latest release 26.8.1)](https://www.keycloak.org/blog-archive)
- [Spring Boot dependency versions (4.1.x)](https://docs.spring.io/spring-boot/appendix/dependency-versions/coordinates.html)
- [Spring blog: modularizing Spring Boot (Flyway starter)](https://spring.io/blog/2025/10/28/modularizing-spring-boot)
- [Flyway licence (Apache 2.0)](https://github.com/flyway/flyway/blob/main/LICENSE.txt)
- [Flyway: supported databases and versions](https://documentation.red-gate.com/fd/supported-databases-and-versions-143754067.html)
- [Hibernate ORM 7.4 dialects](https://docs.hibernate.org/orm/7.4/dialect/)
**PostgreSQL**
- [PostgreSQL versioning and support dates](https://www.postgresql.org/support/versioning/)
- [PostgreSQL licence](https://www.postgresql.org/about/licence/)
- [pgjdbc licence](https://github.com/pgjdbc/pgjdbc/blob/master/LICENSE)
- [Row security policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [pg_dump](https://www.postgresql.org/docs/current/app-pgdump.html)
- [JSON types](https://www.postgresql.org/docs/current/datatype-json.html)
- [Table partitioning](https://www.postgresql.org/docs/current/ddl-partitioning.html)
- [Replication and high availability options](https://www.postgresql.org/docs/current/different-replication-solutions.html)
- [Tuning your PostgreSQL server (wiki)](https://wiki.postgresql.org/wiki/Tuning_Your_PostgreSQL_Server)
- [CloudNativePG](https://cloudnative-pg.io/)
- [CloudNativePG on GitHub (Apache 2.0)](https://github.com/cloudnative-pg/cloudnative-pg)
- [CloudNativePG at the CNCF (Sandbox)](https://www.cncf.io/projects/cloudnativepg/)
- [PgBouncer](https://www.pgbouncer.org/)
- [pgBackRest (MIT)](https://github.com/pgbackrest/pgbackrest)
- [Citus (AGPL-3.0)](https://github.com/citusdata/citus)
- [Amazon RDS for PostgreSQL release calendar](https://docs.aws.amazon.com/AmazonRDS/latest/PostgreSQLReleaseNotes/postgresql-release-calendar)
- [Azure Database for PostgreSQL flexible server overview](https://learn.microsoft.com/en-us/azure/postgresql/flexible-server/overview)
- [Google Cloud SQL](https://cloud.google.com/sql)
**MySQL and MariaDB**
- [MySQL Server licence (GPLv2)](https://github.com/mysql/mysql-server/blob/trunk/LICENSE)
- [MySQL Connector/J licence (GPLv2 with Universal FOSS Exception)](https://github.com/mysql/mysql-connector-j/blob/release/9.x/LICENSE)
- [Oracle: July 2026 MySQL releases and calendar versioning](https://blogs.oracle.com/mysql/mysql-july-2026-ga-releases-now-available)
- [InfoQ: MySQL 9.7 LTS](https://infoq.com/news/2026/05/mysql-97-lts/)
- [The Register: Oracle and the MySQL community, February 2026](https://www.theregister.com/2026/02/16/oracle_new_era_mysql/)
- [MySQL: partitioning restrictions (no foreign keys)](https://dev.mysql.com/doc/refman/8.4/en/partitioning-limitations.html)
- [MariaDB Foundation: about (GPLv2)](https://mariadb.org/about/)
- [MariaDB Connector/J (LGPL, Java 25)](https://mariadb.com/docs/connectors/mariadb-connector-j/about-mariadb-connector-j)
- [MariaDB: yearly LTS releases and end-of-life dates](https://mariadb.com/resources/blog/announcing-yearly-lts-releases-for-mariadb-community-server/)
- [MariaDB: JSON data type](https://mariadb.com/kb/en/json-data-type/)
- [mariadb-operator (MIT)](https://github.com/mariadb-operator/mariadb-operator)
- [MariaDB MaxScale overview and BSL change dates](https://mariadb.org/wp-content/uploads/2024/10/MaxScale-Overview.pdf)
- [Petri: Azure Database for MariaDB retirement](https://petri.com/microsoft-sunsetting-azure-database-for-mariadb/)
- [Vitess (Apache 2.0)](https://github.com/vitessio/vitess)
- [Percona Operator for MySQL documentation](https://docs.percona.com/percona-operator-for-mysql/pxc)
- [Third-party idle memory benchmark: PostgreSQL, MySQL, MariaDB](https://computingforgeeks.com/database-benchmark-postgresql-mysql-mariadb/)
**SQLite**
- [SQLite: copyright and public domain](https://sqlite.org/copyright.html)
- [SQLite: write-ahead logging](https://sqlite.org/wal.html)
- [xerial sqlite-jdbc](https://github.com/xerial/sqlite-jdbc)
- [Litestream (Apache 2.0)](https://github.com/benbjohnson/litestream)
**Distributed SQL and document databases**
- [CockroachDB licensing FAQ](https://docs.cockroachlabs.com/docs/stable/licensing-faqs)
- [CockroachDB LICENSE file](https://github.com/cockroachdb/cockroach/blob/master/LICENSE)
- [CockroachDB row-level security](https://docs.cockroachlabs.com/docs/stable/row-level-security)
- [CockroachDB production checklist](https://www.cockroachlabs.com/docs/dev/recommended-production-settings)
- [CockroachDB Kubernetes operator overview](https://www.cockroachlabs.com/docs/dev/cockroachdb-operator-overview)
- [YugabyteDB LICENSE file](https://github.com/yugabyte/yugabyte-db/blob/master/LICENSE.md)
- [YugabyteDB row-level security](https://docs.yugabyte.com/stable/secure/authorization/row-level-security/)
- [YugabyteDB deployment checklist (hardware)](https://docs.yugabyte.com/stable/deploy/checklist/)
- [YugabyteDB Kubernetes operator](https://docs.yugabyte.com/stable/yugabyte-platform/anywhere-automation/yb-kubernetes-operator/)
- [TiDB on GitHub (Apache 2.0)](https://github.com/pingcap/tidb)
- [TiDB hardware and software requirements (archived v6.3)](https://docs.pingcap.com/tidb/v6.3/hardware-and-software-requirements)
- [MongoDB Server Side Public License](https://www.mongodb.com/legal/licensing/server-side-public-license)
- [MongoDB transactions](https://www.mongodb.com/docs/manual/core/transactions/)
- [FerretDB on GitHub (Apache 2.0)](https://github.com/FerretDB/FerretDB)
- [Microsoft: DocumentDB open source announcement (MIT)](https://opensource.microsoft.com/blog/2025/01/23/documentdb-open-source-announcement/)
**Backups**
- [restic (BSD 2-Clause)](https://restic.net/)
</content>

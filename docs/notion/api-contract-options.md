<!-- Read-only copy of API Contract Options: OpenAPI vs Protobuf: https://app.notion.com/p/408771bd4d4381e08220dc1d7848ac68
     Notion is the master; comment and edit there, then run docs-sync.
     Notion last edited: 2026-11-04T03:54:16.754Z · Synced: 04/11/2026 -->
<content>
<callout icon="🔌" color="gray_bg">
<b>Status:</b> Draft · <b>Last updated:</b> <date start="2026-10-29" /> · <b>Type:</b> Research, like Database Options. It informs AD-02 and AD-13 in the <mention url="https://app.notion.com/p/3f4771bd4d4380e28d76d2038edbfac4" />.
</callout>

## Decision and recommendation

<b>Recommendation: keep REST with OpenAPI 3 for M1 to M3, and add a breaking-change check in CI.</b> It already gives a typed contract with generated code and runtime checks on both sides, and nothing between the browser and Spring has to change.

The question is how the web app and the API agree on their messages: an OpenAPI spec over JSON (decided as AD-02 and AD-13), or Protocol Buffers (protobuf) definitions with generated code. It has to be settled before M1.1's contract is written (brief 002, C-1).

What would change the answer:

- M4's integrations turn out to be service-to-service at volume, or need streaming. Then protobuf (gRPC) for that internal traffic, alongside the browser's REST API.
- More client languages than TypeScript and Java need generated code and one strict toolchain. Then Connect is worth its cost.
- Payload size starts to matter, for example with large reports on slow phone connections. That's not expected at one small business.

## What's at stake in this project

Keeping OpenAPI changes nothing already decided. Choosing protobuf reopens these before M1.1 can be planned:

| Where | What it says now | Protobuf would change |
| --- | --- | --- |
| HL design, AD-02 | REST + OpenAPI 3, versioned <code>/api/v1</code> | RPC methods instead of resources and HTTP verbs |
| HL design, AD-13 | The OpenAPI spec is the contract, and the web app's client is generated from it; springdoc + Swagger UI as the developer tool | <code>.proto</code> files become the contract; Swagger UI goes |
| HL design, AD-20, and System Design section 2 | Caddy is the single entry point and routes <code>/api</code> as plain HTTPS | Connect: no change. gRPC-Web: a translating proxy or in-process filter is added |
| BE design, section 4.1 | Endpoints by slice, as REST paths | Rewritten as services and methods |
| FE design, section 7 | Typed client generated from the OpenAPI spec | Generated from <code>.proto</code> files with protobuf-es |
| FE standards | Types <i>and</i> runtime schemas generated from the spec | Generated message schemas; protovalidate for rules |
| Brief 002, C-1 and AC-26 | Contract first; the front end is tested against a mock API generated from the OpenAPI contract (MSW) | The mock becomes Connect's in-memory router transport, or MSW matching Connect's POSTs |

## The three options

<b>A. REST with OpenAPI 3 (current decision).</b> Spring controllers produce JSON, and springdoc generates the spec from the code. The web app's TypeScript types, fetch client and Zod runtime schemas are generated from that spec (for example with [hey-api openapi-ts and its Zod plugin](https://hey-api-docs-2nfo9card-hey-api.vercel.app/openapi-ts/plugins/zod)). Browsers, Caddy, MSW and dev tools all handle it as ordinary HTTP.

<b>B. Protobuf over the Connect protocol.</b> The API is defined in <code>.proto</code> files. [Connect](https://connectrpc.com/docs/web/testing/) sends each call as a plain HTTP POST with JSON or binary bodies, so browsers need no gRPC proxy, and Caddy routes it like any HTTP. The browser side is mature ([connect-es and protobuf-es v2](https://buf.build/blog/connect-es-v2)). The catch is the server: Connect has no official Java server. There's one small [community Java implementation](https://relatedrepos.com/gh/igor-vovk/connect-rpc-java), and a Kotlin library that is client-side only.

<b>C. Protobuf over gRPC, with gRPC-Web for the browser.</b> Spring serves real gRPC with [Spring gRPC](https://spring.io/blog/2025/12/04/spring-grpc-1/), at 1.0 GA since 04/12/2025 for Spring Boot 4, then 1.1. Browsers can't speak gRPC directly, so a gRPC-Web translator sits in front: [usually Envoy](https://oneuptime.com/blog/post/2026-01-24-grpc-web-browser-clients/markdown), or an in-process filter (Armeria or a servlet filter, the Java one described as beta). Caddy would forward HTTP/2 to it.

## Comparison

OpenAPI wins or ties on every row that M1 to M3 depend on. Protobuf's advantages are rows that matter later or not at our scale.

| Dimension | A. OpenAPI | B. Connect | C. gRPC + gRPC-Web |
| --- | --- | --- | --- |
| Browser support | Native fetch | Native fetch (POST) | Needs a gRPC-Web client and translator |
| Spring server | Standard Spring MVC; springdoc writes the spec | No official Java server; one small community project | Spring gRPC 1.x, official |
| Contract written as | Generated from code (or hand-written first, as brief 002 plans) | <code>.proto</code> files, hand-written | <code>.proto</code> files, hand-written |
| TypeScript types and runtime checks | Generated types + Zod schemas; every response checked | Generated message schemas; rules need protovalidate | Same as B |
| Missing or wrong field | Fails the Zod check, so the error shows | Decodes to a default (0, "") unless <code>optional</code> or protovalidate is used | Same as B |
| Mocking and tests | MSW at the HTTP level; Playwright route mocks | Connect's in-memory router transport; MSW possible on the POSTs | Router transport for unit tests; harder end to end |
| File transfers: signature PNG, logo, PDF | Plain upload and download; PDF streams to the browser | <code>bytes</code> fields; the PDF still wants a plain GET | <code>bytes</code> fields; the PDF needs a separate HTTP route |
| Field errors (the R8 rule) | Problem Details JSON with per-field errors | Error details in Connect's error payload | gRPC status details, translated in the proxy |
| Sign-in (BFF cookie or bearer token) | Standard | Standard HTTP headers and cookies | Cookies pass, but each layer must carry them |
| Debugging | Readable JSON in dev tools; Swagger UI | JSON mode is readable; no Swagger UI | Binary frames; needs grpcurl or a gRPC UI |
| Breaking-change check | [oasdiff](https://github.com/oasdiff/oasdiff) in CI | <code>buf breaking</code> in CI | <code>buf breaking</code> in CI |
| Entry point: Caddy now, Ingress in M3 | Plain HTTPS | Plain HTTPS | HTTP/2 to the translator; more config at both layers |
| M4 public API and payroll integrations | REST + OpenAPI is what most partners expect | Partners can call it as JSON over HTTP | Partners need gRPC tooling or the web gateway |
| Payload size | JSON; a fortnight is a few kilobytes | Binary option is smaller | Smallest |

## Where protobuf genuinely wins

Protobuf is the stronger contract language. OpenAPI can match most of that with tooling, but not all of it.

| Protobuf strength | OpenAPI equivalent | Gap left |
| --- | --- | --- |
| Field numbers make additive change safe by design; renames don't break clients | Additive JSON changes are safe too; renames break unless both names are kept | Renames need more care |
| <code>buf breaking</code> checks every change against the last release | oasdiff does the same for the spec | None worth noting |
| One schema language and toolchain for every language | OpenAPI generators exist for Java and TypeScript; quality varies by generator | Generator choice matters more |
| Contract written first, by hand, and reviewed like code | A hand-written spec works, but springdoc generates it from code, so the two can drift | A contract test must keep code and spec in step |
| Streaming, for example live updates | Not in REST; would need Server-Sent Events or WebSockets alongside | Nothing in M1 to M3 streams |
| Smaller, faster messages | JSON with gzip | Not measurable at one business's volume |

## Risks and gotchas

<b>OpenAPI</b>

- The spec drifts from the code if springdoc output isn't checked. Fix: a contract test in CI compares the generated spec with the committed one, and oasdiff blocks breaking changes.
- Generators differ in quality. Fix: pick one generator for TypeScript (types, client and Zod schemas from the same tool) and pin its version.

<b>Protobuf, both B and C</b>

- <b>Silent defaults.</b> In proto3 a field that's missing decodes to its default. A dropped <code>workedMinutes</code> would show <code>0h 00m (0.00)</code> instead of failing a check, which is the opposite of the standards' "check every value where it enters". Fix: mark fields <code>optional</code> for presence and add [protovalidate](https://awesome.ecosyste.ms/projects/github.com%2Fbufbuild%2Fprotovalidate) rules on both sides.
- Times and dates have no built-in local-time type. <code>HH:mm</code> and DD/MM/YYYY dates travel as strings or custom messages either way, so protobuf adds no safety there.
- New tooling to learn and keep current (buf, protoc plugins), for a one-person build.

<b>B. Connect only</b>

- The Java server rests on one small community project. If it stalls, the API has to be rewritten. This is the biggest single risk on this page.

<b>C. gRPC-Web only</b>

- An extra moving part at the entry point. Caddy's HTTP/2 forwarding to gRPC upstreams has [community reports of fiddly setup](https://caddy.community/t/issues-with-grpc-proxying-through-caddy-tls-and-h2c-problems/29551).
- The PDF download and file uploads still need plain HTTP routes beside the gRPC API, so there would be two API styles to secure.

## What happens next

| If you choose | Next steps |
| --- | --- |
| A. Keep OpenAPI | Nothing in the design docs changes. Add oasdiff and a spec contract test to the M1.1 plan. Then write the M1.1 contract and continue brief 002. |
| B. Connect | Rewrite AD-02, AD-13 and BE section 4.1. A spike runs the community Java Connect server on Spring Boot 4 and Java 25 before M1.1. Brief 002's C-1 and AC-26 move to <code>.proto</code> files and the router transport. |
| C. gRPC + gRPC-Web | As B, plus AD-20: choose Envoy or an in-process filter, and prove it behind Caddy with a spike. Plain HTTP routes for files and the PDF are designed alongside. |

## Open questions

- [ ] Are M4's payroll integrations ordinary partner APIs, or high-volume service-to-service traffic? The recommendation assumes the first.

## Sources

Searched on 29/10/2026. Some facts came from search results, not opened pages, so recheck the Connect Java server and the Caddy gRPC behaviour before acting on them.

- [Spring gRPC 1.0.0 goes GA](https://spring.io/blog/2025/12/04/spring-grpc-1/) and [Spring gRPC 1.1.0](https://spring.io/blog/2026/06/10/spring-grpc-1-1-0-available-now/), Spring blog
- [Connect-ES v2](https://buf.build/blog/connect-es-v2) and [Protobuf-ES v2](https://buf.build/blog/protobuf-es-v2), Buf blog
- [Connect: testing in the browser](https://connectrpc.com/docs/web/testing/)
- [connect-rpc-java](https://relatedrepos.com/gh/igor-vovk/connect-rpc-java), community Java Connect server
- [How to configure gRPC-Web for browser clients](https://oneuptime.com/blog/post/2026-01-24-grpc-web-browser-clients/markdown)
- [Protovalidate](https://awesome.ecosyste.ms/projects/github.com%2Fbufbuild%2Fprotovalidate)
- [hey-api openapi-ts Zod plugin](https://hey-api-docs-2nfo9card-hey-api.vercel.app/openapi-ts/plugins/zod)
- [oasdiff](https://github.com/oasdiff/oasdiff), OpenAPI breaking-change checks
- [Caddy community: gRPC proxying, TLS and h2c](https://caddy.community/t/issues-with-grpc-proxying-through-caddy-tls-and-h2c-problems/29551)
</content>

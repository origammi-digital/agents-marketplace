---
name: api-standards
description: API design standards for REST APIs. Covers versioning, resource naming, pagination, idempotency, error response format, and deprecation strategy. Activate when designing new APIs, reviewing existing API contracts, or asking about REST conventions.
---

# API Standards

Consistent APIs reduce integration friction, enable reliable clients, and make breaking changes visible. These standards apply to any HTTP API the team exposes — internal, external, or partner.

---

## Resource Naming

**Nouns for resources, verbs via HTTP methods.**

```
✅ GET  /users/{id}
✅ POST /users
✅ PATCH /users/{id}
✅ DELETE /users/{id}

❌ GET  /getUser/{id}
❌ POST /createUser
❌ POST /users/{id}/delete
```

**Plural nouns for collections:**
```
/users           ← collection
/users/{id}      ← single resource
/users/{id}/orders  ← sub-collection
```

**Lowercase, hyphenated for multi-word resources:**
```
✅ /payment-methods
❌ /paymentMethods
❌ /payment_methods
```

**Sub-resources express relationships, not operations:**
```
✅ POST /orders/{id}/items       ← add item to order
✅ PUT  /orders/{id}/status      ← update order status (if status is a sub-resource)
❌ POST /orders/{id}/addItem
❌ POST /cancelOrder/{id}
```

---

## HTTP Methods

| Method | Semantic | Idempotent? | Safe? |
|--------|---------|-------------|-------|
| `GET` | Read resource or collection | Yes | Yes |
| `POST` | Create resource or trigger action | No | No |
| `PUT` | Replace resource completely | Yes | No |
| `PATCH` | Update resource partially | No* | No |
| `DELETE` | Remove resource | Yes | No |

*PATCH is not guaranteed idempotent — depends on the operation. Use idempotency keys when needed.

---

## Status Codes

Use the most specific appropriate code. Consistency matters more than perfection.

**2xx — Success:**
```
200 OK          — successful GET, PATCH, or POST when returning a body
201 Created     — successful POST that created a resource (include Location header)
202 Accepted    — async operation accepted, processing not complete
204 No Content  — successful DELETE or POST with no response body
```

**4xx — Client error:**
```
400 Bad Request     — malformed request, syntax error, invalid JSON
401 Unauthorized    — missing or invalid authentication credentials
403 Forbidden       — authenticated but not authorized for this resource/action
404 Not Found       — resource doesn't exist (or user can't see it — treat the same to prevent enumeration)
409 Conflict        — state conflict (duplicate, version mismatch, invalid transition)
422 Unprocessable   — valid syntax, failed business validation
429 Too Many Requests — rate limit exceeded (include Retry-After header)
```

**5xx — Server error:**
```
500 Internal Server Error — unexpected failure (log it, return generic message)
502 Bad Gateway           — upstream service failed
503 Service Unavailable   — server temporarily overloaded or in maintenance
```

---

## Error Response Format

Consistent error shape across the entire API. Pick one and use it everywhere.

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be processed.",
    "details": [
      {
        "field": "email",
        "code": "INVALID_FORMAT",
        "message": "must be a valid email address"
      },
      {
        "field": "amount",
        "code": "OUT_OF_RANGE",
        "message": "must be greater than 0"
      }
    ],
    "request_id": "req_abc123"
  }
}
```

**Rules:**
- `code`: machine-readable, SCREAMING_SNAKE_CASE — clients can branch on it
- `message`: human-readable, for developers — not for end users
- `details`: optional array for validation errors with field-level context
- `request_id`: always include for server errors — allows correlation with logs
- Never include: stack traces, SQL errors, internal file paths, framework internals

---

## Pagination

All collection endpoints must be paginated. Server enforces a maximum page size.

**Cursor-based pagination (preferred for large, frequently-updated datasets):**
```json
{
  "data": [...],
  "pagination": {
    "next_cursor": "eyJpZCI6MTIzfQ==",
    "prev_cursor": null,
    "has_more": true
  }
}
```

Request: `GET /payments?cursor=eyJpZCI6MTIzfQ==&limit=20`

**Offset-based pagination (simpler, for small datasets or where page numbers matter to users):**
```json
{
  "data": [...],
  "pagination": {
    "page": 3,
    "per_page": 20,
    "total": 432,
    "total_pages": 22
  }
}
```

Request: `GET /users?page=3&per_page=20`

**Server-side constraints:**
```
Default per_page: 20
Maximum per_page: 100  ← enforced server-side, client cannot exceed
If client requests 1000: return 100, not an error (or return 400 if strict mode preferred)
```

---

## Idempotency

For any non-safe operation that must be safe to retry, support idempotency keys.

```
POST /payments
Idempotency-Key: a1b2c3d4-unique-per-intent

→ First call: creates payment, returns 201
→ Same key, second call: returns 200 with the original response (no duplicate created)
→ Different key: creates a new payment
```

**Implementation rules:**
- Key scoped to the authenticated user: `(user_id, idempotency_key)` must be unique
- Key stored with the result for a window (24h is standard)
- Same key + different body: return 409 (key already used with different params)
- Idempotency keys are **required** for financial operations (payments, transfers, refunds)

---

## Versioning

Use URL path versioning. It's explicit, cache-friendly, and easy to route.

```
/v1/users        ← current stable
/v2/users        ← new version with breaking changes
```

**Rules:**
- New major version only for breaking changes (removing fields, changing types, restructuring resources)
- Additive changes (new optional fields, new endpoints) are non-breaking — no new version needed
- Support at least 2 major versions in parallel during migration periods
- Deprecation: announce 6 months in advance, add `Deprecation` and `Sunset` headers

```
Deprecation: Sat, 01 Jan 2026 00:00:00 GMT
Sunset: Mon, 01 Jul 2026 00:00:00 GMT
Link: </v2/users>; rel="successor-version"
```

---

## Request and Response Design

**Request bodies (POST/PATCH):**
- Accept `application/json` only (unless the endpoint explicitly handles multipart/form-data)
- All required fields documented — no undocumented required fields
- Optional fields documented with defaults
- Unknown fields: ignore (tolerant reader) — don't reject requests with extra fields

**Response bodies:**
- Always return the created/updated resource on POST/PATCH — client should not need to make a follow-up GET
- On 201 Created, include `Location: /v1/resources/{id}` header
- Consistent field naming (camelCase for JSON APIs): `createdAt`, not `created_at`
- Include `id` and timestamps (`createdAt`, `updatedAt`) on every resource

**Dates and times:**
```
✅ ISO 8601 with timezone: "2025-01-15T14:32:00.000Z"
❌ Unix timestamps: 1736951520
❌ Local time without timezone: "2025-01-15 14:32:00"
```

**Currency and monetary values:**
```json
{
  "amount": 1999,         ← integer, in smallest currency unit (cents)
  "currency": "BRL"       ← ISO 4217 code
}
```

Never use IEEE 754 floats for money (`9.99` can become `9.990000000000001`).

---

## Rate Limiting

Every public-facing API must have rate limits. Communicate them via headers:

```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 87
X-RateLimit-Reset: 1736952000    ← Unix timestamp when the window resets
Retry-After: 60                  ← seconds to wait (on 429 response)
```

Rate limit strategy:
- Per authenticated user/API key (not per IP — NAT breaks IP-based limiting)
- Different limits for different endpoint classes (read < write < bulk < financial)
- Burst allowance for brief spikes with token bucket algorithm

---

## API Checklist (before shipping an endpoint)

- [ ] Resource named with plural noun, lowercase, hyphenated
- [ ] Correct HTTP method (GET for reads, POST for creates, PATCH for partial updates, DELETE for removals)
- [ ] Correct status codes for all outcomes (success, validation error, not found, auth failure)
- [ ] Error response follows the standard shape with machine-readable `code`
- [ ] Collection endpoint paginated with server-enforced max page size
- [ ] Idempotency key supported for financial or non-idempotent mutations
- [ ] Request validated before processing (unknown required fields documented, schema enforced)
- [ ] Response returns the resource state (no extra GET needed after POST/PATCH)
- [ ] Dates in ISO 8601 UTC
- [ ] Money in integer cents with ISO 4217 currency code
- [ ] Rate limit headers present
- [ ] API version in URL path
- [ ] `request_id` in all error responses

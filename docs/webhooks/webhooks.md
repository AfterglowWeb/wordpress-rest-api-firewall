<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#2e7d32;color:#fff;font-size:11px;font-weight:600">FREE</span> <span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Webhooks

Webhooks send an HTTP request to an external URL when an event fires. Delivery is asynchronous and does not block the triggering request.

The free tier supports **one outbound webhook** with a built-in post lifecycle event selector. Pro supports **unlimited webhooks** scoped per application — events and triggering logic are managed in [Automations](/automations/automations).

---

## Webhooks List <span style="display:inline-block;padding:1px 6px;border-radius:3px;background:#1565c0;color:#fff;font-size:10px;font-weight:600">PRO</span>

The list view manages all webhook entries for the current application.

- **Add** a new webhook with the add button.
- **Enable / Disable** an entry with the toggle. A confirmation is shown before the change is applied.
- **Delete** an entry. A confirmation is shown before deletion proceeds.

---

## Webhook Editor

### Identity

- **Title** — display name used in the admin list.
- **Description** — optional notes for your own reference.

### Endpoint

- **URL** — the destination that will receive the request.
- **HTTP Method** — `POST`, `PUT`, `PATCH` or `DELETE`.

### Security

- **HMAC Key** — use the generator to create a signing key, or paste your own. The key is used to sign the outgoing payload so the receiver can verify its origin.
- **Additional Headers** — key/value pairs added to every outgoing request (e.g. `Authorization`, `X-Api-Key`).

### Delivery

- **Timeout** — maximum time in seconds to wait for a response from the destination before the request is considered failed.
- **Retry Count** — number of times delivery is reattempted after a failure before giving up.

### Free Tier — Post Lifecycle Events

In the free tier, the webhook editor includes a simplified event selector directly in the panel. Select one or more **post lifecycle events** (create, update, delete — filterable by post type) that will trigger the webhook. This is the only event configuration available outside of Pro Automations.

---

## FAQ

**How are webhooks triggered in Pro?**

In Pro, webhooks are fired by [Automations](/automations/automations). An automation selects the event, evaluates any conditions, and calls the webhook as an action. This separates event logic from delivery configuration.

**Can I send the same payload to multiple URLs?**

Create one webhook entry per destination. In Pro, point multiple automations or automation actions at each webhook.

**How do I verify the payload on the receiving end?**

The plugin signs every request with HMAC-SHA256. Three headers are always present:

| Header | Description |
|---|---|
| `X-Webhook-Signature` | Hex digest: `HMAC-SHA256(rawBody + timestamp, secret)` |
| `X-Webhook-Timestamp` | Unix timestamp (seconds) at send time |
| `X-Webhook-Source` | Always `wordpress` |

The signature is computed over the **raw JSON body string concatenated with the timestamp string** (no separator), using your HMAC key as the secret.

**JavaScript (Node.js)**

```js
import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyWebhook(rawBody, headers, secret) {
  const signature = headers['x-webhook-signature']
  const timestamp = headers['x-webhook-timestamp']

  if (!signature || !timestamp) return false

  const expected = createHmac('sha256', secret)
    .update(rawBody + timestamp)
    .digest('hex')

  const sigBuf      = Buffer.from(signature, 'hex')
  const expectedBuf = Buffer.from(expected,  'hex')

  if (sigBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(sigBuf, expectedBuf)
}
```

**TypeScript**

```ts
import { createHmac, timingSafeEqual } from 'node:crypto'

export function verifyWebhook(
  rawBody: string,
  headers: Record<string, string | string[] | undefined>,
  secret: string,
): boolean {
  const signature = headers['x-webhook-signature'] as string | undefined
  const timestamp = headers['x-webhook-timestamp'] as string | undefined

  if (!signature || !timestamp) return false

  const expected = createHmac('sha256', secret)
    .update(rawBody + timestamp)
    .digest('hex')

  const sigBuf      = Buffer.from(signature, 'hex')
  const expectedBuf = Buffer.from(expected,  'hex')

  if (sigBuf.length !== expectedBuf.length) return false
  return timingSafeEqual(sigBuf, expectedBuf)
}
```

> Use `timingSafeEqual` to prevent timing attacks. Read the raw request body **before** any JSON parsing so the string is byte-for-byte identical to what was signed.

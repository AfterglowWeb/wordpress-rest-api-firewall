<span style="display:inline-block;padding:1px 8px;border-radius:3px;background:#1565c0;color:#fff;font-size:11px;font-weight:600">PRO</span>

# Automations

Automations connect WordPress events to actions — send emails, fire webhooks, or dispatch custom hooks — without writing code. Each automation listens for one or more events, evaluates optional conditions, and executes its action list in sequence.

Automations are a Pro feature. In the free tier, a simplified event selector is available directly in the [Webhook editor](/webhooks/webhooks).

---

## Automations List

- **Create** a new automation with the add button.
- **Enable / Disable** an automation with the toggle. A confirmation is required before the change is applied.
- **Delete** an automation. A confirmation is required before deletion proceeds.

---

## Automation Editor

### Identity

- **Title** — display name used in the admin list.
- **Description** — optional notes for your own reference.

### Events

Select one or more events that trigger this automation. Available event categories:

- **WordPress Posts, Taxonomies & Media** — create, update, and delete events for posts, custom post types, taxonomy terms, and media.
- **User events** — user registration and login.
- **WooCommerce** — order, product, customer, and other WooCommerce lifecycle events (requires WooCommerce).
- **Application Layer** — internal plugin events (user access, rate limit exceeded, application changes, etc.).
- **Custom Hooks** — declare any WordPress action or filter hook by name. Configure the number of arguments the hook passes, name each argument, and choose which ones are forwarded to the action payload.

### Scheduled Trigger

For scheduled automations, hook data is queued or rotated as events fire. The release condition is either:

- **After N events** — the accumulated data is flushed and the actions run once the queue reaches N hook events.
- **On schedule** — a WP-Cron interval releases the queued data at a fixed time, regardless of how many events have accumulated.

### Conditions

An optional conditional logic block is evaluated before the action sequence runs. If the block fails, the automation halts.

Conditions are organised in **AND / OR groups**: within a group all conditions must pass (AND); the automation proceeds if any group passes (OR). Each condition inspects a named argument from the trigger hook — the argument list is derived from the hook configuration in the Events section.

### Actions

Actions execute in order when the trigger fires (and conditions pass). Each action can be individually enabled or disabled without removing it. You can add **as many actions as you need** — multiple emails, multiple webhooks, or any combination.

- **Send Email** — select an existing [Email template](/mails/mails) or create a new one inline.
- **Call Webhook** — select an existing [Webhook entry](/webhooks/webhooks) or create a new one inline.

---

## FAQ

**Can an automation trigger another automation?**

Not yet. Direct automation chaining is not currently supported. It is a planned action type.

**Can one automation send multiple emails and fire multiple webhooks?**

Yes. Add as many *Send Email* and *Call Webhook* actions as you need. They execute in sequence, each pointing to a different template or webhook entry.

**What happens if one action in a sequence fails?**

By default execution continues to the next action. Failures are recorded in the application log with the automation ID and action index.

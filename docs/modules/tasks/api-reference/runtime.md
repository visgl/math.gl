# Task runtime API

The public runtime is [`TaskRunner`](./task-runner.md), with typed task objects,
named payloads, and explicit lifecycle ownership.

The previous worker functions, pools, resource wrappers, and protocol helpers
have been removed from the public exports. See the
[migration guide](../developer-guide/migration.md) for replacements and behavior
changes. There is no compatibility runtime entry.

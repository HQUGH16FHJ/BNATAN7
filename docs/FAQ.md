# FAQ

## Is 绊谈 free?

The public tool hub and basic tools are free. Some hosted AI or VIP features may depend on the production account policy.

## How many tools are available?

The current interface reports 786 entries: 650 external tool cards and 136 built-in tools.

## Does this repository contain the backend?

The repository includes frontend files and selected backend integration files, but frontend changes must not silently alter registration, VIP, API, KV, or user-data contracts.

## Why does WeChat show its own bottom bar?

That bar is part of the WeChat in-app browser. A website cannot remove the WeChat client toolbar. Website-owned mobile navigation has been removed.

## Why did the tool counter show 73?

An animation previously overwrote the live count with the old static value. It was fixed in v4.0.1 and now reports 786.

## Can I redistribute the project?

No. The project uses the Bantan Proprietary License. Personal use, study, and small-circle sharing are allowed; commercial use and redistribution are not.

## How do I report a security problem?

Use the private process in [SECURITY.md](../SECURITY.md).

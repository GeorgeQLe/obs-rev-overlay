# OBS Revenue & Cost Overlay

A cyberpunk-themed OBS overlay that displays real-time Stripe revenue and manually-tracked business costs as animated progress bars on your livestream.

Built for the journey of vibe-coding to $1M in revenue.

## Features

- **Live Stripe Revenue Bar** — Polls your Stripe account every 30 seconds and displays all-time net revenue as a progress bar toward your $1M goal
- **Manual Cost Bar** — Track total business costs with a configurable budget cap, updated via a web admin panel
- **Cyberpunk Neon Glow Theme** — Transparent floating bars with neon cyan (revenue) and magenta (costs) glow effects, scanlines, and a tech font
- **Multiple Display Modes** — Show both bars, rotate between them with a fade transition, show one at a time, or switch to counter-only mode
- **Admin Dashboard** — Password-protected web page to adjust costs, budget caps, display mode, and rotation interval during your stream
- **Smooth Animations** — CSS transitions on bar fills and pulse effects when numbers update

## How It Works

1. A local Bun server runs on port `4455`
2. OBS loads `http://localhost:4455/overlay` as a Browser Source
3. The server polls Stripe for net revenue (charges minus refunds) and serves it alongside your manually-set cost data
4. The overlay renders cyberpunk-styled progress bars with real-time updates
5. You control everything from the admin page at `http://localhost:4455/admin`

## Tech Stack

- **Runtime**: [Bun](https://bun.sh)
- **Frontend**: Vanilla HTML / CSS / JS (no framework, no build step)
- **Data**: Stripe API + local JSON file for cost persistence
- **Integration**: OBS Studio Browser Source

## Setup

```bash
# Install dependencies
bun install

# Configure environment
cp .env.example .env
# Edit .env with your Stripe secret key and admin password

# Run the server
bun run server.ts
```

Then in OBS:
1. Add a **Browser Source**
2. Set URL to `http://localhost:4455/overlay`
3. Set width/height to fit your layout (recommended: ~500x120)

## Environment Variables

| Variable | Description |
|---|---|
| `STRIPE_SECRET_KEY` | Your Stripe API key (restricted key with **Balance: Read** permission is sufficient) |
| `ADMIN_PASSWORD` | Password for the admin dashboard |

## Display Modes

| Mode | Description |
|---|---|
| `both` | Both bars visible, stacked vertically |
| `rotate` | Bars alternate with a fade transition (configurable interval, default 10s) |
| `revenue` | Revenue bar only |
| `costs` | Cost bar only |
| `counter` | Text-only dollar amounts, no progress bars |

## License

MIT

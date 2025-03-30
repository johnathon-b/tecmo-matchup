# Tecmo Matchup Picker

A web application inspired by Tecmo Super Bowl that allows tournament players to quickly select matchup teams based on their opponent’s selection. The app lets you:
- Mark teams as "used" so they aren’t available.
- Select an opponent team
- Get two lists of recommendations:
  - **Best Available:** Top matchup teams.
  - **Close Matchups:** Teams with ratings close to the opponent’s (for balanced matchups).

## Features

- **Responsive UI:** Built with Nuxt 3 and Tailwind CSS.
- **Retro Design:** Uses a retro pixel font (e.g., "Press Start 2P") and a single helmet sprite for team logos.
- **Dynamic Matchup Recommendations:** A Cloudflare Worker API calculates matchup recommendations based on team ratings.
- **Environment-Specific API URL:** Uses Nuxt runtime configuration with environment variables so that local development uses `localhost:8787`, while production uses your Cloudflare Worker’s URL.

## Prerequisites

- [Node.js](https://nodejs.org/) (v14 or later)
- [npm](https://www.npmjs.com/)
- [Nuxt 3](https://v3.nuxtjs.org/)
- [Wrangler CLI](https://developers.cloudflare.com/workers/wrangler/) (for deploying Cloudflare Workers)

## Project Structure

A typical structure for this project is:

```
tecmo-matchup/
├── frontend/            # Nuxt 3 frontend application
│   ├── assets/
│   │   └── images/
│   │       └── helmets.png
│   ├── pages/
│   │   └── index.vue
│   ├── nuxt.config.ts
│   ├── .env
│   ├── .env.production
│   └── package.json
└── worker/              # Cloudflare Worker backend
    ├── src/
    │   └── index.ts
    ├── wrangler.toml
    └── package.json
```

## Running the Application Locally

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/tecmo-matchup.git
cd tecmo-matchup
```

### 2. Install Dependencies for the Frontend

Navigate to the `frontend` folder and install dependencies:

```bash
cd frontend
npm install
```

### 3. Configure Environment Variables

Create a `.env` file in the `frontend` folder (for local development):

```dotenv
API_URL=http://localhost:8787
```

Create a `.env.production` file (for production builds):

```dotenv
API_URL=https://<your-worker-subdomain>.workers.dev/api
```

### 4. Run the Frontend in Development Mode

```bash
npm run dev
```

This runs the Nuxt development server on [http://localhost:3000](http://localhost:3000).

### 5. Generate and Preview a Production Build

To generate a production build:

```bash
NODE_ENV=production npm run generate
```

Then preview it locally with:

```bash
npm run preview
```

The generated build will use the API URL from your `.env.production` file.

## Deploying to Cloudflare Workers

### 1. Build the Frontend

From the `frontend` directory, run:

```bash
NODE_ENV=production npm run generate
```

This creates a static build (typically in the `dist/` folder).

### 2. Configure Wrangler

In the `worker` folder, update your `wrangler.toml` file. For example:

```toml
name = "tecmo-matchup"
main = "src/index.ts"
compatibility_date = "2025-03-30"
account_id = "YOUR_ACCOUNT_ID"
workers_dev = true

[site]
bucket = "../frontend/dist"
```

Make sure that the `bucket` path correctly points to your Nuxt build output.

### 3. Deploy with Wrangler

From the `worker` directory, run:

```bash
wrangler publish
```

Wrangler will bundle your Worker code and deploy your static assets from the `dist` folder to Cloudflare Workers.

## Troubleshooting

- **API URL Issues:**  
  If your production build is still pointing to `localhost:8787`, ensure that you run `NODE_ENV=production npm run generate` so that Nuxt picks up the production environment variables from `.env.production`.

- **Static Assets Not Loading:**  
  Verify that your `wrangler.toml` `[site]` section correctly points to your Nuxt build folder.

- **CORS Issues:**  
  The Cloudflare Worker API code includes proper CORS headers. Ensure your Worker code is deployed correctly.

## License

[MIT License](LICENSE)

## Acknowledgments

Inspired by Tecmo Super Bowl and TecmoGeek. Special thanks to the community for their support and contributions.
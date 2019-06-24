# Standalone Project
Your UserAppStore project is now a NodeJS project integrated with [Dashboard](https://github.com/userappstore/dashboard).  

Dashboard handles your account registration and management exactly like on UserAppStore.  

Additional modules are used on UserAppStore to provide subscription billing and more, you can use them in your project too.

# How to deploy and start your app on your own computer or hosting:
Your project will run on any NodeJS-capable hosting such as Heroku, AWS, DigitalOcean, Vultr etc.

## Step 1: Setup computer/hosting dependencies
    - install [NodeJS](https://node.js.org) at least 8.12.0

## Step 2: Setup and start the dashboard server
    $ cd dashboard-server
    $ npm install
    $ bash start.sh

## Step 3: Setup and start the application server
    $ cd application-server
    $ npm install
    $ bash start.sh 

Open your project in your browser at http://localhost:8000

### Changing the storage

Dashboard supports four different storage engines for your user and session data.   You can also encrypt Dashboard data at rest:

    ENCRYPTION_KEY=abcdefGHIJKLM01234567890

You can use Dashboard with your local file system, ideal for development and private applications that will never have millions of users.

    bash start.sh

Redis offers a very fast and very scalable in-memory database:

    $ npm install @userappstore/storage-redis
    $ REDIS_URL=redis://.... \
      STORAGE_ENGINE=@userappstore/storage-redis \
      bash start.sh

PostgreSQL offers a fast and very scalable disk-based database:

    $ npm install @userappstore/storage-postgresql
    $ DATABASE_URL=postgres://.... \
      STORAGE_ENGINE=@userappstore/storage-postgresql \
      bash start.sh

Amazon S3 and compatible services offer slower but infinite scaling:

    $ npm install @userappstore/storage-s3
    $ ACCESS_KEY_ID=.... \
      AWS_SECRET_KEY=.... \
      BUCKET_NAME=..... \

## Deploying to production

There are configuration differences between production and development to increase user security:

    # Dashboard server production settings
    $ NODE_ENV=production \
      BCRYPT_WORKLOAD_FACTOR=10 \
      MINIMUM_USERNAME_LENGTH=8 \
      MINIMUM_PASSWORD_LENGTH=8 \
      MINIMUM_RESET_CODE_LENGTH=8 \
      BCRYPT_FIXED_SALT="\$2a\$10\$abcdef" \
      APPLICATION_SESSION_KEY="a long string used to protect sessions" \
      APPLICATION_SERVER=...
      APPLICATION_SERVER_TOKEN="a long secret shared with application server" \
      ENCRYPTION_KEY="32 character hex string" \
      DATABASE_URL=postgres://.... \
      STORAGE_ENGINE=@userappstore/storage-postgresql \
      node main.js

    # Application server production settings
    $ NODE_ENV=production \
      APPLICATION_SERVER=...
      APPLICATION_SERVER_TOKEN="a long secret shared with application server" \
      node main.js
    
#### Dashboard documentation
- [Introduction](https://github.com/userappstore/dashboard/wiki)
- [Configuring Dashboard](https://github.com/userappstore/dashboard/wiki/Configuring-Dashboard)
- [Dashboard code structure](https://github.com/userappstore/dashboard/wiki/Dashboard-code-structure)
- [Server request lifecycle](https://github.com/userappstore/dashboard/wiki/Server-Request-Lifecycle)

## Dashboard modules

Additional modules are used on UserAppStore to provide subscription billing and more.  Additional APIs, content and functionality can be added by `npm install` and nominating Dashboard modules in your `package.json`.  You can read more about this on the [Dashboard configuration wiki page](https://github.com/userappstore/dashboard/wiki/Configuring-Dashboard)

    "dashboard": {
      "modules": [ "package", "package2" ]
    }

| Name | Description | Package   | Repository |
|------|-------------|-----------|------------|
| MaxMind GeoIP | IP address-based geolocation | @dashboard/maxmind-geoip | [github](https://github.com/userappstore/maxmind-geoip) |
| Organizations | User created groups | @dashboard/organizations | [github](https://github.com/userappstore/organizations) |
| Stripe Subscriptions | SaaS functionality | @dashboard/stripe-subscriptions | [github](https://github.com/userappstore/stripe-subscriptions) |
| Stripe Connect | Marketplace functionality | @dashboard/stripe-connect | [github](https://github.com/userappstore/stripe-connect)
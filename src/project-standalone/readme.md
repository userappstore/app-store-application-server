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
    
    # This part of the configuration requires
    # generating your own unique value
    $ node
    > const bcrypt = require('bcryptjs')
    > bcrypt.genSaltSync(4)
      '$2a$10$abcdef'
      <ctrl+c> + <ctrl+c>

    # start Dashboard with your configuration
    $ NODE_ENV=development \
      APPLICATION_SERVER=http://localhost:3000 \
      APPLICATION_SERVER_TOKEN="a shared secret" \
      BCRYPT_FIXED_SALT="$2a$10$abcdef" \
      DASHBOARD_SERVER=http://localhost:8000 \
      node main.js

## Step 3: Setup and start the application server
    $ cd application-server
    $ npm install
    $ NODE_ENV=development \
      APPLICATION_SERVER=http://localhost:3000 \
      APPLICATION_SERVER_TOKEN="a shared secret" \
      DASHBOARD_SERVER=http://localhost:8000 \
      node main.js

Open your project in your browser at `http://localhost:8000`

The bcrypt fixed-salt allows some data like usernames to ensure uniqueness while only storing an encrypted hash.  Passwords use a random salt generated each time they are hashed.

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

There are configuration differences between production and development to increase user security.  Note your fixed salt workload should match your workload factor.

    # Dashboard server production settings
    $ NODE_ENV=production \
      BCRYPT_WORKLOAD_FACTOR=10 \
      MINIMUM_USERNAME_LENGTH=8 \
      MINIMUM_PASSWORD_LENGTH=8 \
      10
      10cdef" \
      10 string used to protect 10
      10
      10g secret shared with application 10
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
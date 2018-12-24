# UserAppStore
UserAppStore is a NodeJS project for publishing and sharing web apps.  Developers may register and publish their apps within UserAppStore, via [Dashboard]() coupled with [Stripe Connect]() and [Stripe Subscriptions]() modules. 

Users may browse and install apps, individually or with group access, and access the apps within a single inteface.  Users may also import  apps from anwhere on the internet, or create them themselves.

UserAppStore is covered by Dashboard.  The Dashboard server sits in front of the UserAppStore server and proxies content from it on behalf of the user to serve a single, combined website.

Dashboard provides:
- registration and account management
- developer registration via Stripe Connect module
- paid subscriptions via Stripe Subscriptions module
- user groups via Organizations module

## Installation part 1: Dashboard

Dashboard is a NodeJS project that accompanies a web app you build and provides a complete account system for your users and administration tools.  Dashboard divides your application into two components: a header with account and administrative menus and navigation bar; and a frame for serving content.

You must install [Redis](https://redis.io) and [NodeJS](https://nodejs.org) 8.1.4+ prior to these steps.  UserAppStore does not currently support operating without the Stripe Subscriptions and Stripe Connect modules.

1. Create an account at [Stripe](https://stripe.com/), you will need their API key for the STRIPE_KEY
2. If you require sending credit card numbers to your server enable 'Process payments unsafely' in Integrations, within Business settings, otherwise client-side JavaScript will post directly to Stripe
4. Setup a webhook in your Stripe account to `/api/webhooks/subscriptions/index-stripe-data`, you will need the signing secret for `SUBSCRIPTIONS_ENDPOINT_SECRET`
5. Setup a Connect webhook in your Stripe account to `/api/webhooks/connect/index-payout-data`, you will need the signing secret for `CONNECT_ENDPOINT_SECRET`

        $ git clone https://github.com/userappstore/userappstore-dashboard
        $ STRIPE_KEY=abc \
          SUBSCRIPTIONS_ENDPOINT_SECRET=wxy \
          CONNCET_ENDPOINT_SECRET=xyz \
          APPLICATION_SERVER=https://your_application_server \
          node main.js
      
## Installation part 2: UserAppStore
Dashboard will proxy all URLs it does not recognize from your `APPLICATION_SERVER`.  

UserAppStore can use local storage for data storage as long as you have a single server, such as during development.  A production deployment of Dashboard should include more than one server for basic redundancy.

UserAppStore can use [Amazon S3](https://aws.amazon.com/s3) for data storage.  S3 was chosen over an RDBMS to ensure the data will always be highly available.  Your S3 bucket should be configured as private and encrypted.  

UserAppStore can optionally encrypt files prior to writing to your storage.

### Local file system
        $ git clone https://github.com/userappstore/userappstore
        $ npm install
        $ DASHBOARD_SERVER=https://your_dashboard_server \
          node main.js

### S3 file storage
1. Create an account at [Amazon Web Services](https://aws.amazon.com/)
2. Create [IAM credentials](https://docs.aws.amazon.com/IAM/latest/UserGuide/getting-started.html) with access to [Amazon S3](https://aws.amazon.com/s3), you will need the ACCESS_KEY_ID and ACCESS_SECRET
4. Create an S3 bucket with no public access and your IAM user, you will need the BUCKET_NAME

        $ git clone https://github.com/userappstore/userappstore
        $ npm install 
        $ npm install aws-sdk --no-save
        $ DASHBOARD_SERVER=https://your_dashboard_server \
          STORAGE_ENGINE=s3 \
          BUCKET_NAME= \
          S3_PREFIX=optional \
          ACCESS_KEY_ID=optional \
          ACCESS_SECRET=optional \
          node main.js

### BYO storage engine
The storage interface is a basic read, write, list and delete API.  Check `storage-fs.js` and `storage-s3.js` for examples you can copy.

Pull requests are welcome with additional storage engines.  Do not include their modules in the `package.json` just have their driver etc install separately.

#### Dashboard documentation
- [Introduction](https://github.com/userappstore/dashboard/wiki)
- [Configuring Dashboard](https://github.com/userappstore/dashboard/wiki/Configuring-Dashboard)
- [Contributing to Dashboard](https://github.com/userappstore/dashboard/wiki/Contributing-to-Dashboard)
- [Dashboard code structure](https://github.com/userappstore/dashboard/wiki/Dashboard-code-structure)
- [Server request lifecycle](https://github.com/userappstore/dashboard/wiki/Server-Request-Lifecycle)

#### License

This is free and unencumbered software released into the public domain.  The MIT License is provided for countries that have not established a public domain.
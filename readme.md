# App Store Application Server

Launch your own subscription web app store and user platform for front-end and full-stack developers to create, share and earn.  This application server is one half of the software, it is accompanied by a [Dashboard server](https://github.com/userappstore/app-store-dashboard-server).  This readme assumes you have configured the Dashboard server already.

# About

The app store software provides a website where users may code and share single-page applications or import hosted web applications by their server URL.  Users who complete a Stripe Connect registration may publish their apps with paid subscriptions.

- [App store Wiki](https://github.com/userappstore/app-store-application-server/wiki)
- [Compatibility guidelines](https://github.com/userappstore/app-store-application-server/wiki/Compatibility-guidelines)
- [Creating single-page apps](https://github.com/userappstore/app-store-application-server/wiki/Creating-single-page-apps)
- [Creating application servers](https://github.com/userappstore/app-store-application-server/wiki/Creating-application-servers)
- [Integrating existing web applications](https://github.com/userdashboard/dashboard/wiki/Integrating-existing-web-applications)

### Case studies 

`Hastebin` is an open source pastebin web application.  It started as a website for anonymous guests only, and was transformed into an application server with support for sharing posts with organizations and paid subscriptions.

- [Hastebin - free to import](https://github.com/userappstore/integration-examples/blob/master/hastebin/hastebin-app-store-free.md)
- [Hastebin - app store subscriptions](https://github.com/userappstore/integration-examples/blob/master/hastebin/hastebin-app-store-subscription.md)

## Prerequisites
- [Stripe account](https://stripe.com)
- [Registered Connect platform](https://stripe.com/connect)
- flat file database, or [Amazon S3](https://github.com/userdashboard/storage-s3) [Redis](https://github.com/userdashboard/storage-redis) [PostgreSQL](https://github.com/userdashboard/storage-postgresql) 

## Installation part 1: Dashboard Server

Visit the [App Store Dashboard Server](https://github.com/userappstore/app-store-dashboard-server) if you have not completed that part.

## Installation part 2: Application server

You must install [NodeJS](https://nodejs.org) 8.12.0+ prior to these steps.

    $ mkdir application-server
    $ cd application-server
    $ npm init
    $ npm install @userappstore/app-store-application-server
    $ APPLICATION_SERVER=http://localhost:3000 \
      APPLICATION_SERVER_TOKEN="a shared secret" \
      DASHBOARD_SERVER=http://localhost:8000 \
      node main.js

    # additional parameters using Redis
    # STORAGE_ENGINE="@userdashboard/storage-redis"
    # REDIS_URL="..."
    $ npm install @userdashboard/storage-redis
    
    # additional parameters using Amazon S3 or compatible
    # STORAGE_ENGINE="@userdashboard/storage-s3"
    # S3_BUCKET_NAME=the_name
    # ACCESS_KEY_ID=secret from amazon
    # SECRET_ACCESS_KEY=secret from amazon
    $ npm install @userdashboard/storage-s3

    # additional parameters using PostgreSQL
    # STORAGE_ENGINE="@userdashboard/storage-postgresql"
    # DATABASE_URL="..."
    $ npm install @userdashboard/storage-postgresql

#### Development

Development takes place on [Github](https://github.com/userappstore/app-store-dashboard-server) with releases on [NPM](https://www.npmjs.com/package/@userappstore/app-store-dashboard-server).

#### License

This is free and unencumbered software released into the public domain.  The MIT License is provided for countries that have not established a public domain.
Your project
Your UserAppStore project is now a NodeJS project covered by [Dashboard](https://github.com/userappstore/dashboard).  

Dashboard handles your account registration and management exactly like on UserAppStore.  
Additional modules are used on UserAppStore to provide subscription billing and more, for
details check the Dashboard wiki pages.

# How to deploy and start your app on your own computer or hosting:
Your project will run on any NodeJS-capable hosting such as Heroku, AWS, DigitalOcean, Vultr etc.

## Step 1: Setup computer/hosting dependencies
    - install [NodeJS](https://node.js.org) at least 8.1.4+
    - install [Redis](https://redis.io) current stable version

## Step 2:  Install Dashboard
    $ npm install @userappstore/dashboard

## Step 3:  Install dotenv to use the provided `.env`
    $ npm install dotenv --save-dev

## Step 4: Start the project
    $ node main.js

Open your project in your browser at http://localhost:8000

## Saving your project on Github
    $ git init
    $ echo "node_modules" >> .gitignore
    $ echo ".env" >> .gitignore
    $ git add .
    $ git commit -m "First commit"
    $ git push origin master

## Example production launch
There are configuration differences between production and development:

    $ heroku create
    $ heroku config:set NODE_ENV=production
    $ heroku config:set BCRYPT_WORKLOAD_FACTOR=10
    $ heroku config:set MINIMUM_USERNAME_LENGTH=8
    $ heroku config:set MINIMUM_PASSWORD_LENGTH=8
    $ heroku config:set MINIMUM_RESET_CODE_LENGTH=8

    
    $ heroku config:set BCRYPT_FIXED_SALT=
    # the fixed salt allows usernames and some other data to 
    # be stored securely and indexed so it can be found when the 
    # original text is provided
    $ node
    > const bcrypt = require('bcrypt-node')
    > bcrypt.genSaltSync(10) // BCRYPT_WORKLOAD_FACTOR
      '$2a$10$abcdef'
    $ heroku config:set BCRYPT_FIXED_SALT="\$2a\$10\$abcdef"
    
    $ heroku config:set UUID_ENCODING_CHARACTERS=
    # randomized letters/numbers for turning ID numbers
    # to strings, eg "abcdefGHIJKLM01234567890"
    
    $ heroku config:set UUID_SEED=
    # starting number for ID values, such as 74389786
    
    $ heroku config:set UUID_INCREMENT=
    # each ID increases a random amount up to this number

    $ heroku config:set APPLICATION_SESSION_KEY=
    # a long string used to protect sessions

    $ heroku config:set REDIS_ENCRYPTION_KEY=
    # a long string used to protect data at rest

    $ heroku config:set REDIS_KEY_HASH=
    # a long string used to protect data at rest
    
    $ heroku addons:add heroku-redis
    $ echo "web: node main.js" > Procfile
    $ git add Procfile
    $ git commit -m "Added Heroku configuration"
    $ git push heroku master

    

NODE_ENV=development \
APPLICATION_SERVER="$USERAPPSTORE_APPLICATION_SERVER" \
PORT=$USERAPPSTORE_APPLICATION_SERVER_PORT \
APPLICATION_SERVER_TOKEN="$USERAPPSTORE_APPLICATION_SERVER_TOKEN" \
DASHBOARD_SERVER="$USERAPPSTORE_DASHBOARD_SERVER" \
STRIPE_PUBLISHABLE_KEY="$USERAPPSTORE_STRIPE_PUBLISHABLE_KEY" \
DOMAIN="$USERAPPSTORE_DOMAIN" \
DEBUG_ERRORS=true \
STORAGE_PATH=~/tmp/data2 \
node main.js

# App store startup parameters
# APPLICATION_SERVER"http://localhost:3000
# string
# the URL of your application server

# APPLICATION_SERVER_TOKEN="a shared secret"
# string
# secret shared with your Dashboard serrver

# DASHBOARD_SERVER=https://example.com
# string
# the URL of your dashboard server

# DOMAIN=example.com
# string
# the domain of your dashboard server

# STRIPE_PUBLISHABLE_KEY=pk_test_xxxxx
# string
# an API key published inside HTML pages for web browsers to use Stripe

# SAMPLE_PROJECT_ORGANIZATION=organization_xxxx
# string organization id
# publish example projects by sharing them with this organization, sign in to your website to create this organization

# IP=0.0.0.0 
# ip default localhost
# start server on a public IP address

# PORT=3000 
# number
# start server on a specific port

# MINIMUM_PROFILE_FIRST_NAME_LENGTH=1 
# number default 1
# minumum length for first name

# MAXIMUM_PROFILE_FIRST_NAME_LENGTH=50 
# number default 50
# maximum length for first name

# MINIMUM_PROFILE_LAST_NAME_LENGTH=1 
# number default 1
# minumum length for last name

# MAXIMUM_PROFILE_LAST_NAME_LENGTH=50 
# number default 50
# maximum length for last name
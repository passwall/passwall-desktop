# PassWall Desktop

<p align="center">
    <img src="https://www.yakuter.com/wp-content/yuklemeler/passwall-cover.png" alt="" width="800" height="450" />
</p>
<p align="center">
    The <strong>PassWall Desktop</strong> is an Electron Vue application that powers the web vault (https://vault.passwall.io/).
</p>

## Build/Run

If you want to use this client with official PassWall Server, please first sign up via [PassWall Signup](https://signup.passwall.io)

### Requirements

- [Node.js](https://nodejs.org) (Version 12.14.0)
- [Electron](https://www.electronjs.org)

### Node Version
Passwall desktop uses Node 12.14.0 version. For an easy Node setup, you can install NVM and change Node version easily.  

``` bash
# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.37.2/install.sh | bash

# install desired node version
nvm install 12.14.0

# change version
nvm use 12.14.0
```

### Run the app
After installing yarn, you can download dependencies and run the app with the commands below.

``` bash
# install dependencies
yarn

# serve with hot reload at localhost:9080
yarn run dev

# build electron application for production
yarn run build
```
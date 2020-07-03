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

- [Node.js](https://nodejs.org)
- [Electron](https://www.electronjs.org)

### Run the app

``` bash
# install dependencies
yarn

# serve with hot reload at localhost:9080
yarn run dev

# build electron application for production
yarn run build
```

You can adjust your API endpoint settings in `src/renderer/api/HTTPClient.js` by changing the `baseURL`. For example:

```js
const client = Axios.create({
  baseURL: 'https://vault.passwall.io',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json, text/plain, */*'
  }
})
```

If you want to point your local passwall server address, you can set:

```js
const client = Axios.create({
  baseURL: 'http://localhost:3625',
  headers: {
    'Content-Type': 'application/json; charset=utf-8',
    Accept: 'application/json, text/plain, */*'
  }
})
```

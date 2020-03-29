import Dropbox from 'dropbox';
import { parseQueryString } from './utils.js';
const CLIENT_ID = 'bgakb5cjinloxpo';

class DropboxWrapper {
  constructor(callback) {
    this.client_id = CLIENT_ID;
    this.access_token = '';
    this.token_type = '';
    this.uid = '';
    this.account_id = '';
    this.authUrl = '';
    this.folders = [];
    this.files = [];
    this.dbx = {};
    this.updateFN = callback;
    this.path = '';
    this.rootFolder = "/moodboard";
    this.init();
  }

  isRoot() {
    return this.path.path_lower === this.rootFolder;
  }

  // Parses the url and gets the access token if it is in the urls hash
  getAccessTokenFromUrl() {
    const parse = parseQueryString(window.location.hash);
    if (parse.access_token) {
      this.access_token = parse.access_token;
      window.localStorage.setItem('dboxToken', this.access_token);
    } else {
      const token = window.localStorage.getItem('dboxToken');
      if (token) {
        this.access_token = token;
        return this.access_token;
      }
    }
    //console.error(parse); //stacktrace
    return parse.access_token;
  }

  unSetToken() {
    window.localStorage.removeItem('dboxToken');
  }

  // If the user was just redirected from authenticating, the urls hash will
  // contain the access token.
  isAuthenticated() {
    return !!this.access_token;
  }

  deleteFile(file) {
    console.log(file);
    this.dbx.filesDeleteV2({ path: file.metadata.path_lower });
  }

  uploadFile(file) {
    console.log('upping', file, this.path_path_lower);
    if (!this.path.path_lower) return;
    this.dbx
      .filesUpload({
        path: this.path.path_lower + '/' + file.name,
        contents: file,
      })
      .then(res => {
        console.log(res);
      });
  }

  uploadUrl(file) {
    console.log('urlupping', file);
    this.dbx
      .filesSaveUrl({
        path: this.path.path_lower + '/' + file.name,
        url: file.url,
      })
      .then(res => {
        file.metadata = { path_lower: this.path.path_lower + '/' + file.name };
        console.log(file);
      });
  }

  async createFolder(folder) {
    this.folders = [];
    this.path = {
      path_lower: this.rootFolder + "/" + folder.toLowerCase()
    }
    return this.dbx.filesCreateFolder({ path: this.rootFolder + (folder !== "" ? "/" + folder.toLowerCase() : '') });
  }

  selectFolder(folder) {
    this.folders = [];
    this.files = [];
    console.log(this.path);
    console.log(folder.path_lower);
    this.path = {
      path_lower: folder.path_lower};
    this.updateFN();
    console.log(this.isRoot())
    this.dbx
      .filesListFolder({ path: this.path.path_lower })
      .then(response => {
        const folders = response.entries.filter(e => e['.tag'] === 'folder');
        const files = response.entries.filter(e => e['.tag'] === 'file');
        if (folders.length > 0) {
          this.folders = folders.sort((x,y) => x.name.toLowerCase() > y.name.toLowerCase() ? 1 : -1);
          console.log(this.folders);
          this.updateFN();
        }
        else if (files.length > 0 && !this.isRoot())
        {
          files.forEach(e => {
            this.dbx.filesGetTemporaryLink({ path: e.path_lower }).then(res => {
              console.log(e.path_lower, this.path.path_lower);
              if (e.path_lower.includes(this.path.path_lower))
              if (!this.files.map(e => e.link === res.link).includes(true)) {
                this.files.push(res);
                this.updateFN();
              }
            });
          });
        }
      })
      .catch(error => {
        console.error(error);
      });
  }

  init() {
    if (!!this.getAccessTokenFromUrl()) {
      // showPageSection('authed-section');
      // // Create an instance of Dropbox with the access token and use it to
      // // fetch and render the files in the users root directory.
      this.dbx = new Dropbox.Dropbox({ accessToken: this.access_token });
        this.dbx.filesListFolder({ path: this.rootFolder })
        .then(response => {
          this.selectFolder({ path_lower: this.rootFolder })
        })
        .catch(error => {
          console.log("lol");
          this.createFolder('').then(res => {
            this.selectFolder({ path_lower: this.rootFolder });
          });

        });

    } else {
      // Set the login anchors href using dbx.getAuthenticationUrl()
      this.dbx = new Dropbox.Dropbox({ clientId: this.client_id });
      this.authUrl = this.dbx.getAuthenticationUrl(
        window.location.origin + '/oauthredirect',
      );




      // document.getElementById('authlink').href = authUrl;
    }
  }
}

export default DropboxWrapper;

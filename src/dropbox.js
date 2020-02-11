import Dropbox from 'dropbox';
import { parseQueryString } from './utils.js';
const CLIENT_ID = process.env.REACT_APP_DROPBOX_KEY;

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
    console.log(this.client_id);
    this.init();
  }

  // Parses the url and gets the access token if it is in the urls hash
  getAccessTokenFromUrl() {
    const parse = parseQueryString(window.location.hash);
    this.access_token = parse.access_token;
    console.error(parse);
    return parse.access_token;
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
    console.log('upping', file);
    this.dbx
      .filesUpload({
        path: this.path.path_lower + '/' + file.name,
        contents: file,
      })
      .then(res => {
        console.log(res);
      });
  }

  selectFolder(folder) {
    this.folders = [];
    this.files = [];
    this.path = folder;
    this.dbx
      .filesListFolder({ path: folder.path_lower })
      .then(response => {
        const files = response.entries.filter(e => e['.tag'] === 'file');
        if (files.length > 0) {
          files.forEach(e => {
            this.dbx.filesGetTemporaryLink({ path: e.path_lower }).then(res => {
              this.files.push(res);
              this.updateFN();
              // console.log(res, this.files);
            });
          });
          // console.log(this.files);
        }
        // console.log(this.files);
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
      this.dbx
        .filesListFolder({ path: '' })
        .then(response => {
          this.folders = response.entries.filter(e => e['.tag'] === 'folder');
          this.updateFN();
          // console.log(this.folders);
        })
        .catch(error => {
          console.error(error);
        });
    } else {
      // Set the login anchors href using dbx.getAuthenticationUrl()
      this.dbx = new Dropbox.Dropbox({ clientId: this.client_id });
      this.authUrl = this.dbx.getAuthenticationUrl(
        'http://localhost:3000/oauthredirect',
      );
      // document.getElementById('authlink').href = authUrl;
    }
  }
}

export default DropboxWrapper;
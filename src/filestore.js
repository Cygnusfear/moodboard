export default class FileStore {
  constructor() {
    this.files = window.localStorage.getItem('files');
    console.log(this.files);
    if (!this.files || this.files) {
      this.files = [];
      this.save();
    }
    console.log(window.localStorage.getItem('files'));
  }

  add(file) {
    this.files.push(file);
    console.log(file);
    this.save();
  }

  remove(file) {}

  save() {
    window.localStorage.setItem('files', this.files);
    console.log(window.localStorage.getItem('files'));
  }
}

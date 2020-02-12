import React, { Component } from 'react';
import './App.css';
import StackGrid from 'react-stack-grid';
import ImageZoom from 'react-medium-image-zoom';
import Dropbox from './dropbox.js';

// const shuffleArray = arr =>
//   arr
//     .map(a => [Math.random(), a])
//     .sort((a, b) => a[0] - b[0])
//     .map(a => a[1]);

function importAll(r) {
  return r.keys().map(r);
}

let queuedEvent = null;

const images = [];

const imported = importAll(
  require.context('./Images/', true, /\.(png|jpe?g|svg)$/),
);

class App extends Component {
  constructor(props) {
    super(props);
    const dropbox = new Dropbox(this.dropboxUpdate);
    this.input = React.createRef();
    this.state = {
      gutter: 30,
      images: images,
      dragging: false,
      selected: null,
      dropbox: dropbox,
      folders: [],
      waitingForName: false,
      appState: 'init',
    };
    this.dropArea = React.createRef();
  }

  dropboxUpdate = update => {
    this.setState({
      folders: this.state.dropbox.folders,
      images: this.state.dropbox.files,
    });
  };

  componentDidMount() {
    if (imported.length > 0) {
      this.setState({ images: imported });
    }
    // console.log(this.dropArea);
    document.addEventListener('dragover', this.fileDrag, false);
    document.addEventListener('dragenter', this.fileDrag, false);
    // document.addEventListener('dragexit', this.fileDrag, false);

    // this.dropArea.current.addEventListener('drop', this.fileDrop, false);
    document.addEventListener('drop', this.fileDrop, false);
    document.addEventListener('dragleave', this.leaveDrag, false);
    window.addEventListener('keydown', this.keyPress);
    if (this.state.dropbox.isAuthenticated()) {
      console.log('Authenticated');
      this.setState({ folders: this.state.dropbox.folders });
    }
  }

  fileDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    // console.log('drag', e, e.originalEvent);
    if (!this.state.dragging) this.setState({ dragging: true });
  };

  leaveDrag = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  fileDrop = async e => {
    e.preventDefault();
    e.stopPropagation();

    this.setState({ dragging: false, folders: [] });
    let files = e.dataTransfer.files.length > 0 ? e.dataTransfer.files : [];
    if (files > 0) {
      console.log('drop', files);
    } else {
      // check if we have a file URL
      let html = e.dataTransfer.getData('text/html'),
        match = html && /\bsrc="?([^"\s]+)"?\s*/.exec(html),
        url = match && match[1];

      if (url) {
        console.log('url', url, html);
        files.push({
          type: 'image/url',
          url: url,
          name:
            (
              Math.random()
                .toString(36)
                .substring(2, 15) +
              Math.random()
                .toString(36)
                .substring(2, 15)
            ).toString() + '.jpg',
        });
      }
    }

    //Check if we are in Dropbox mode and new folder
    const waitForName =
      this.state.dropbox.isAuthenticated() && this.state.dropbox.path === '';

    if (!waitForName) {
      this.saveQueue(files);
    } else {
      //Temp queue while waiting for name
      queuedEvent = files;
      this.input.current.focus();
    }
    this.setState({
      images: [...this.state.images, ...images],
      appState: !!this.state.dropbox.isAuthenticated() ? 'ready' : '',
      waitingForName: waitForName,
    });
  };

  uploadFromURL(file) {
    if (this.state.dropbox.isAuthenticated())
      this.state.dropbox.uploadUrl(file);
  }

  saveQueue(files) {
    if (files.length === 0) return;
    console.log('saving', files);
    let images = [];
    [...files].forEach(img => {
      if (img.type.includes('image')) {
        // console.log(img);
        console.log(img, this.state.images);
        if (img.type !== 'image/url') {
          images.push(URL.createObjectURL(img));
          this.fileSave(img);
        } else {
          images.push(img.url);
          this.uploadFromURL(img);
        }
      }
    });
    this.setState({
      dragging: false,
      images: [...this.state.images, ...images],
      appState: !!this.state.dropbox.isAuthenticated() ? 'ready' : '',
    });
  }

  selectFolder = folder => {
    this.state.dropbox.selectFolder(folder);
  };

  createFolder = e => {
    e.stopPropagation();
    e.preventDefault();
    this.state.dropbox.createFolder(this.input.current.value);
    this.setState({ waitingForName: false });
    console.log(this.input.current.value, this);
    this.saveQueue(queuedEvent);
  };

  fileDelete = file => {
    let images = [...this.state.images];
    images.splice(images.indexOf(file), 1);
    this.setState({ images: images, selected: null });
    if (file.metadata) {
      this.state.dropbox.deleteFile(file);
    }
  };

  fileSave = file => {
    if (this.state.dropbox.isAuthenticated())
      this.state.dropbox.uploadFile(file);
  };

  hoverOn = e => {
    this.setState({ selected: e });
  };

  hoverOff = e => {
    if (this.state.selected === e) this.setState({ selected: null });
  };

  keyPress = e => {
    if (this.state.selected && e.code === 'Backspace') {
      this.fileDelete(this.state.selected);
    }
    if (e.code === 'ArrowRight') {
      this.setState({ gutter: 30 });
    }
    if (e.code === 'ArrowLeft') {
      this.setState({ gutter: 0 });
    }
    if (e.code === 'Escape') {
      window.location.reload();
    }
  };

  render() {
    const { gutter, dragging, images, dropbox, waitingForName } = this.state;
    return (
      <div className={'App ' + (waitingForName ? 'enterName' : '')}>
        <div
          className="Gallery"
          ref={this.dropArea}
          style={{ opacity: dragging ? 0.1 : 1 }}
        >
          {(images.length === 0 || waitingForName) && (
            <div className="header">
              <div className="Title">Moodboard</div>
              <div className="Subtitle">
                Drop images here, make moodboard, wow much!{' '}
                <span role="img" aria-label="heart">
                  ❤️
                </span>
              </div>
              <br />
              {!dropbox.isAuthenticated() && dropbox.client_id && (
                <a className="dbxFolderButton connect" href={dropbox.authUrl}>
                  {/* <i className="devicons devicons-dropbox" /> */}
                  Connect to Dropbox
                </a>
              )}
              {dropbox.folders.map((folder, i) => {
                return (
                  <div
                    key={i}
                    className="dbxFolderButton"
                    onClick={e => this.selectFolder(folder)}
                  >
                    {folder.name}
                  </div>
                );
              })}
              {dropbox.isAuthenticated() && dropbox.client_id && (
                <div className="folderName">
                  <form onSubmit={e => this.createFolder(e)} action="">
                    <input
                      className="folderInput"
                      ref={this.input}
                      placeholder="Enter name for the moodboard"
                    ></input>
                  </form>
                </div>
              )}
            </div>
          )}

          <StackGrid
            gridRef={grid => (this.grid = grid)}
            columnWidth={'30%'}
            gutterWidth={gutter}
            gutterHeight={gutter - 5}
            duration={0}
            appearDelay={30}
            monitorImagesLoaded={true}
            className="stackGrid"
          >
            {images.map((item, i) => {
              const src = item.metadata ? item.link : item;
              return (
                <div
                  key={i}
                  style={{
                    pointerEvents: dragging ? 'none' : 'auto',
                  }}
                  onMouseEnter={() => this.hoverOn(item)}
                  onMouseLeave={() => this.hoverOff(item)}
                >
                  <ImageZoom
                    image={{
                      src: src,
                      className: 'img',
                      title: '',
                    }}
                    zoomImage={{ className: 'zoomed', src: src }}
                  />
                </div>
              );
            })}
          </StackGrid>
        </div>
      </div>
    );
  }
}

export default App;

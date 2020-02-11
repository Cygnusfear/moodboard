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

const gutter = 30;
const images = [];

const imported = importAll(
  require.context('./Images/', true, /\.(png|jpe?g|svg)$/),
);

class App extends Component {
  constructor(props) {
    super(props);
    const dropbox = new Dropbox(this.dropboxUpdate);
    this.state = {
      images: images,
      dragging: false,
      selected: null,
      dropbox: dropbox,
      folders: [],
    };
    this.dropArea = React.createRef();
  }

  dropboxUpdate = update => {
    this.setState({
      folders: this.state.dropbox.folders,
      images: this.state.dropbox.files,
    });
  };

  onDrop = (accepted, rejected, links) => {
    console.log(accepted); // Have fun
  };

  componentDidMount() {
    if (imported.length > 0) {
      this.setState({ images: imported });
    }
    // console.log(this.dropArea);
    this.dropArea.current.addEventListener('dragover', this.fileDrag, false);
    this.dropArea.current.addEventListener('dragenter', this.fileDrag, false);

    this.dropArea.current.addEventListener('drop', this.fileDrop, false);
    this.dropArea.current.addEventListener('dragleave', this.leaveDrag, false);
    window.addEventListener('keydown', this.keyPress);
    if (this.state.dropbox.isAuthenticated()) {
      console.log('authed');
      this.setState({ folders: this.state.dropbox.folders });
    }
  }

  fileAdd = url => {};

  fileDrag = e => {
    e.preventDefault();
    e.stopPropagation();
    // console.log("drag", e);
    if (!this.state.dragging) this.setState({ dragging: true });
  };

  leaveDrag = e => {
    e.preventDefault();
    e.stopPropagation();
  };

  fileDrop = e => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.files.length > 0)
      console.log('drop', e.dataTransfer.files);
    let images = [];
    [...e.dataTransfer.files].forEach(img => {
      if (img.type.includes('image')) {
        // console.log(img);
        console.log(img, this.state.images);
        images.push(URL.createObjectURL(img));
        this.fileSave(img);
      }
    });
    this.setState({
      dragging: false,
      images: [...this.state.images, ...images],
    });
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
    console.log('nope', file);
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
  };

  render() {
    const { dragging, images, dropbox } = this.state;
    return (
      <div className="App">
        <div
          className="Gallery"
          ref={this.dropArea}
          style={{ opacity: dragging ? 0.1 : 1 }}
        >
          {images.length === 0 && (
            <div className="header">
              Drop images here, make moodboard, wow much!{' '}
              <span role="img" aria-label="heart">
                ❤️
              </span>
              <br />
            </div>
          )}
          {!dropbox.isAuthenticated() && dropbox.client_id && (
            <a className="dbxFolderButton" href={dropbox.authUrl}>
              {/* <i className="devicons devicons-dropbox" /> */}
              Connect to Dropbox
            </a>
          )}
          {dropbox.folders.map((folder, i) => {
            return (
              <div
                key={i}
                className="dbxFolderButton"
                onClick={e => dropbox.selectFolder(folder)}
              >
                {folder.name}
              </div>
            );
          })}
          <StackGrid
            gridRef={grid => (this.grid = grid)}
            columnWidth={'30%'}
            gutterWidth={gutter}
            gutterHeight={gutter - 5}
            duration={0}
            appearDelay={30}
            monitorImagesLoaded={true}
          >
            {images.map((item, i) => {
              const name = item.metadata ? item.metadata.name : item;
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
                      title: name,
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

import React, { Component } from 'react';
import './App.css';
import StackGrid from 'react-stack-grid';
import ImageZoom from 'react-medium-image-zoom';

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

console.log(imported);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      images: images,
      dragging: false,
      selected: null,
    };
    this.dropArea = React.createRef();
  }

  onDrop = (accepted, rejected, links) => {
    console.log(accepted); // Have fun
  };

  componentDidMount() {
    if (imported.length > 0) {
      this.setState({ images: imported });
    }
    console.log(this.dropArea);
    this.dropArea.current.addEventListener('dragover', this.fileDrag, false);
    this.dropArea.current.addEventListener('dragenter', this.fileDrag, false);

    this.dropArea.current.addEventListener('drop', this.fileDrop, false);
    this.dropArea.current.addEventListener('dragleave', this.leaveDrag, false);
    window.addEventListener('keydown', this.keyPress);
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
      console.log(img);
      images.push(URL.createObjectURL(img));
    });
    this.setState({
      dragging: false,
      images: [...this.state.images, ...images],
    });
  };

  hoverOn = e => {
    this.setState({ selected: e });
  };

  hoverOff = e => {
    if (this.state.selected === e) this.setState({ selected: null });
  };

  keyPress = e => {
    if (this.state.selected && e.code === 'Backspace') {
      let images = [...this.state.images];
      images.splice(images.indexOf(this.state.selected), 1);
      this.setState({ images: images, selected: null });
    }
  };

  render() {
    const { dragging, images } = this.state;
    return (
      <div className="App">
        <div
          className="Gallery"
          ref={this.dropArea}
          style={{ opacity: dragging ? 0.1 : 1 }}
        >
          {images.length === 0 &&
            'Drop images here, make moodboard, wow much! ❤️'}
          <StackGrid
            gridRef={grid => (this.grid = grid)}
            columnWidth={'30%'}
            gutterWidth={gutter}
            gutterHeight={gutter - 5}
            duration={0}
            appearDelay={30}
            monitorImagesLoaded={true}
          >
            {images.map((item, i) => (
              <div
                key={i}
                style={{
                  pointerEvents: dragging ? 'none' : 'auto',
                }}
                onMouseEnter={() => this.hoverOn(item)}
                onMouseLeave={() => this.hoverOff(item)}
              >
                <ImageZoom
                  image={{ src: item, className: 'img', title: item }}
                  zoomImage={{ className: 'zoomed', src: item }}
                />
              </div>
            ))}
          </StackGrid>
        </div>
      </div>
    );
  }
}

export default App;

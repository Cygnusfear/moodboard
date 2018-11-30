import React, { Component } from "react";
import "./App.css";
import StackGrid from "react-stack-grid";

const shuffleArray = arr =>
  arr
    .map(a => [Math.random(), a])
    .sort((a, b) => a[0] - b[0])
    .map(a => a[1]);

function importAll(r) {
  return r.keys().map(r);
}

const gutter = 30;
const images = shuffleArray(
  importAll(require.context("./Images/", false, /\.(png|jpe?g|svg)$/))
);

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      images: images
    };
  }

  componentDidMount() {
    setInterval(() => {
      console.log("wut");
      let i = shuffleArray(images);
      this.setState({ images: i });
      this.grid.updateLayout();
    }, 20000);
  }

  render() {
    console.log(images);
    return (
      <div className="App">
        <header className="App-header" />
        <div className="Gallery">
          <StackGrid
            gridRef={grid => (this.grid = grid)}
            columnWidth={"30%"}
            gutterWidth={gutter}
            gutterHeight={gutter - 5}
            duration={0}
            appearDelay={30}
            monitorImagesLoaded={true}
          >
            {this.state.images.map((item, i) => (
              <div key={i}>
                <a href={item}>
                  <img src={item} />
                </a>
              </div>
            ))}
          </StackGrid>
        </div>
      </div>
    );
  }
}

export default App;
